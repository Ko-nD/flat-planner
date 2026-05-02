import { create } from 'zustand';
import { APARTMENT, META } from '../data/apartment';
import type {
  ApartmentGeometry, LayerId, PlacedObject, ProjectMeta, ProjectData,
} from '../types';
import { findCatalog } from '../catalog/catalog';

const LS_KEY = 'flat-planner-project-v2';
const TEMPLATE_URL = `${import.meta.env.BASE_URL}project.json`;

const allLayers: LayerId[] = [
  'walls','doors','windows','labels','furniture','appliances',
  'sockets','switches','lights','data','plumbing','notes',
];

const DEFAULT_VISIBILITY: Record<LayerId, boolean> = Object.fromEntries(
  allLayers.map((l) => [l, true]),
) as Record<LayerId, boolean>;

export type Tool = 'select' | 'place' | 'measure' | 'pan';

interface ViewState {
  scale: number;
  offset: { x: number; y: number };
  rotation: number;
}

interface MeasureLine {
  a: { x: number; y: number };
  b: { x: number; y: number };
}

// Встроенный fallback-шаблон — на случай если public/project.json недоступен
const FALLBACK_TEMPLATE: ProjectData = {
  version: '1.0',
  meta: META,
  geometry: APARTMENT,
  objects: [],
  layerVisibility: DEFAULT_VISIBILITY,
};

interface ProjectStore {
  // Загружаемый шаблон (геометрия + дефолтные настройки) — точка отсчёта для Reset.
  template: ProjectData;
  templateLoaded: boolean;
  templateError: string | null;

  meta: ProjectMeta;
  geometry: ApartmentGeometry;
  objects: PlacedObject[];
  layerVisibility: Record<LayerId, boolean>;

  selectedIds: string[];
  hoverId: string | null;

  tool: Tool;
  placeCatalogId: string | null;
  measure: MeasureLine | null;

  view: ViewState;
  showGrid: boolean;
  snapMm: number;

  setTool: (t: Tool) => void;
  startPlacement: (catalogId: string) => void;
  cancelPlacement: () => void;

  addObject: (obj: PlacedObject) => void;
  addManyObjects: (objs: PlacedObject[]) => void;
  updateObject: (id: string, patch: Partial<PlacedObject>) => void;
  removeObjects: (ids: string[]) => void;
  duplicateObjects: (ids: string[]) => string[];

  select: (ids: string[]) => void;
  toggleSelect: (id: string, additive: boolean) => void;
  clearSelect: () => void;

  setHover: (id: string | null) => void;

  setLayerVisible: (l: LayerId, v: boolean) => void;
  toggleLayer: (l: LayerId) => void;

  setView: (view: Partial<ViewState>) => void;
  setShowGrid: (v: boolean) => void;
  setSnapMm: (v: number) => void;
  setMeasure: (m: MeasureLine | null) => void;

  setMeta: (m: Partial<ProjectMeta>) => void;

  saveLocal: () => void;
  loadLocal: () => boolean;
  resetProject: () => void;     // сбросить к шаблону (project.json)
  loadJson: (data: ProjectData) => void;  // полностью заменить состояние из JSON
  loadTemplate: (data: ProjectData) => void; // загрузить шаблон + сделать его текущим
  exportJson: () => ProjectData;

  // Принудительная перезагрузка шаблона из public/project.json — стирает локальный snapshot
  forceReloadTemplate: () => Promise<void>;

  // Прямой доступ к set для применения AI-патчей
  setGeometry: (g: ApartmentGeometry) => void;
  replaceObjects: (o: PlacedObject[]) => void;
}

const newId = () => Math.random().toString(36).slice(2, 10);

const persistedSnapshot = (): { meta: ProjectMeta; geometry: ApartmentGeometry; objects: PlacedObject[]; layerVisibility: Record<LayerId, boolean> } | null => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ProjectData;
    if (!data.geometry || !data.meta) return null;
    return {
      meta: data.meta,
      geometry: data.geometry,
      objects: data.objects ?? [],
      layerVisibility: { ...DEFAULT_VISIBILITY, ...(data.layerVisibility ?? {}) },
    };
  } catch {
    return null;
  }
};

export const useProject = create<ProjectStore>((set, get) => {
  const initial = persistedSnapshot();
  return {
    template: FALLBACK_TEMPLATE,
    templateLoaded: false,
    templateError: null,

    meta: initial?.meta ?? FALLBACK_TEMPLATE.meta,
    geometry: initial?.geometry ?? FALLBACK_TEMPLATE.geometry,
    objects: initial?.objects ?? [],
    layerVisibility: initial?.layerVisibility ?? DEFAULT_VISIBILITY,

    selectedIds: [],
    hoverId: null,
    tool: 'select',
    placeCatalogId: null,
    measure: null,

    view: { scale: 0.06, offset: { x: 60, y: 60 }, rotation: 0 },
    showGrid: true,
    snapMm: 50,

    setTool: (tool) => set({ tool, placeCatalogId: null }),

    startPlacement: (catalogId) => {
      const item = findCatalog(catalogId);
      if (!item) return;
      set({ tool: 'place', placeCatalogId: catalogId, selectedIds: [] });
    },
    cancelPlacement: () => set({ tool: 'select', placeCatalogId: null }),

    addObject: (obj) => set((s) => ({
      objects: [...s.objects, obj],
      selectedIds: [obj.id],
    })),
    addManyObjects: (objs) => set((s) => ({ objects: [...s.objects, ...objs] })),

    updateObject: (id, patch) => set((s) => ({
      objects: s.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    })),

    removeObjects: (ids) => set((s) => ({
      objects: s.objects.filter((o) => !ids.includes(o.id)),
      selectedIds: s.selectedIds.filter((id) => !ids.includes(id)),
    })),

    duplicateObjects: (ids) => {
      const newIds: string[] = [];
      set((s) => {
        const copies: PlacedObject[] = [];
        for (const o of s.objects) {
          if (!ids.includes(o.id)) continue;
          const id = newId();
          newIds.push(id);
          copies.push({ ...o, id, x: o.x + 200, y: o.y + 200 });
        }
        return { objects: [...s.objects, ...copies], selectedIds: newIds };
      });
      return newIds;
    },

    select: (ids) => set({ selectedIds: ids }),
    toggleSelect: (id, additive) => set((s) => {
      if (!additive) return { selectedIds: [id] };
      return {
        selectedIds: s.selectedIds.includes(id)
          ? s.selectedIds.filter((x) => x !== id)
          : [...s.selectedIds, id],
      };
    }),
    clearSelect: () => set({ selectedIds: [] }),

    setHover: (id) => set({ hoverId: id }),

    setLayerVisible: (l, v) => set((s) => ({ layerVisibility: { ...s.layerVisibility, [l]: v } })),
    toggleLayer: (l) => set((s) => ({ layerVisibility: { ...s.layerVisibility, [l]: !s.layerVisibility[l] } })),

    setView: (v) => set((s) => ({ view: { ...s.view, ...v } })),
    setShowGrid: (v) => set({ showGrid: v }),
    setSnapMm: (v) => set({ snapMm: v }),
    setMeasure: (m) => set({ measure: m }),

    setMeta: (patch) => set((s) => ({ meta: { ...s.meta, ...patch, updatedAt: Date.now() } })),

    saveLocal: () => {
      const data = get().exportJson();
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    },

    loadLocal: () => {
      const snap = persistedSnapshot();
      if (!snap) return false;
      set(snap);
      return true;
    },

    // Сброс к шаблону project.json — стирает расстановку, ставит чистый план
    resetProject: () => {
      const t = get().template;
      set({
        meta: { ...t.meta, updatedAt: Date.now() },
        geometry: t.geometry,
        objects: [],
        layerVisibility: { ...DEFAULT_VISIBILITY, ...(t.layerVisibility ?? {}) },
        selectedIds: [],
        tool: 'select',
        placeCatalogId: null,
        measure: null,
      });
      try { localStorage.removeItem(LS_KEY); } catch {}
    },

    // Загрузить готовый ProjectData (например, через «↑ Загрузить») — берём ВСЁ.
    loadJson: (data) => set({
      meta: data.meta,
      geometry: data.geometry,
      objects: data.objects ?? [],
      layerVisibility: { ...DEFAULT_VISIBILITY, ...(data.layerVisibility ?? {}) },
      selectedIds: [],
      tool: 'select',
      placeCatalogId: null,
    }),

    // Установить шаблон (project.json). Если есть локальный snapshot, сохраняем его.
    loadTemplate: (data) => {
      const localSnap = persistedSnapshot();
      set({ template: data, templateLoaded: true, templateError: null });
      // Если localStorage пуст — заодно применяем шаблон в текущее состояние
      if (!localSnap) {
        set({
          meta: data.meta,
          geometry: data.geometry,
          objects: data.objects ?? [],
          layerVisibility: { ...DEFAULT_VISIBILITY, ...(data.layerVisibility ?? {}) },
        });
      }
    },

    exportJson: (): ProjectData => ({
      version: '1.0',
      meta: { ...get().meta, updatedAt: Date.now() },
      geometry: get().geometry,
      objects: get().objects,
      layerVisibility: get().layerVisibility,
    }),

    forceReloadTemplate: async () => {
      try { localStorage.removeItem(LS_KEY); } catch {}
      try {
        const res = await fetch(TEMPLATE_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ProjectData;
        if (!data.geometry || !data.meta) throw new Error('Неверный формат project.json');
        set({
          template: data,
          templateLoaded: true,
          templateError: null,
          meta: { ...data.meta, updatedAt: Date.now() },
          geometry: data.geometry,
          objects: [],
          layerVisibility: { ...DEFAULT_VISIBILITY, ...(data.layerVisibility ?? {}) },
          selectedIds: [],
          tool: 'select',
          placeCatalogId: null,
          measure: null,
        });
      } catch (e: any) {
        set({ templateError: e?.message ?? 'Не удалось перечитать project.json' });
      }
    },

    setGeometry: (g) => set({ geometry: g }),
    replaceObjects: (o) => set({ objects: o }),
  };
});

// Автосохранение каждые 1.5 секунды после изменений
let autosaveTimer: number | null = null;
useProject.subscribe((s, prev) => {
  if (
    s.objects !== prev.objects ||
    s.layerVisibility !== prev.layerVisibility ||
    s.meta !== prev.meta ||
    s.geometry !== prev.geometry
  ) {
    if (autosaveTimer) window.clearTimeout(autosaveTimer);
    autosaveTimer = window.setTimeout(() => useProject.getState().saveLocal(), 1500);
  }
});

// Загрузка шаблона из public/project.json при старте.
// Если localStorage уже содержит проект — шаблон используется только как «исходник для Reset».
export async function bootstrapTemplate() {
  try {
    const res = await fetch(TEMPLATE_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as ProjectData;
    if (!data.geometry || !data.meta) throw new Error('Неверный формат project.json');
    useProject.getState().loadTemplate(data);
  } catch (e: any) {
    useProject.setState({ templateError: e?.message ?? 'Не удалось загрузить project.json' });
    // используем встроенный fallback (FALLBACK_TEMPLATE)
    useProject.getState().loadTemplate(FALLBACK_TEMPLATE);
  }
}

export const newObjectId = newId;
