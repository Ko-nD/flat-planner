import { create } from 'zustand';
import { APARTMENT, META } from '../data/apartment';
import type {
  ApartmentGeometry, LayerId, PlacedObject, ProjectMeta, ProjectData,
} from '../types';
import { findCatalog } from '../catalog/catalog';
import { tryLoadFromHash, clearShareHash } from '../utils/share';

const LS_KEY = 'flat-planner-project-v2';
const TEMPLATE_URL = `${import.meta.env.BASE_URL}project.json`;

const allLayers: LayerId[] = [
  'walls','doors','windows','labels','furniture','appliances',
  'sockets','switches','lights','data','plumbing','notes',
];

const DEFAULT_VISIBILITY: Record<LayerId, boolean> = Object.fromEntries(
  allLayers.map((l) => [l, true]),
) as Record<LayerId, boolean>;

export type Tool = 'select' | 'place' | 'measure' | 'pan' | 'wall-draw' | 'room-draw' | 'door-place' | 'window-place';

interface ViewState {
  scale: number;
  offset: { x: number; y: number };
  rotation: number;
}

interface MeasureLine {
  a: { x: number; y: number };
  b: { x: number; y: number };
  // true после второго клика — линия зафиксирована, mousemove её не двигает.
  locked?: boolean;
}

interface HistorySnapshot {
  objects: PlacedObject[];
  geometry: ApartmentGeometry;
}

const HISTORY_LIMIT = 50;

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

  // История для Undo/Redo. Снапшоты содержат objects + geometry — это всё, что меняется
  // пользовательскими действиями (перенос мебели, рисование стен, удаление и т.п.).
  past: HistorySnapshot[];
  future: HistorySnapshot[];

  // Метаданные сохранения — UI показывает «✓ Сохранено» с временем последнего записи в LS.
  lastSavedAt: number | null;

  selectedIds: string[];
  selectedWallIds: string[];
  selectedRoomIds: string[];
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

  toggleSelectWall: (id: string, additive: boolean) => void;
  clearSelectWalls: () => void;
  removeSelectedWalls: () => void;

  toggleSelectRoom: (id: string, additive: boolean) => void;
  clearSelectRooms: () => void;
  removeSelectedRooms: () => void;

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

  // Undo / Redo
  undo: () => void;
  redo: () => void;

  // Мини-редактор геометрии (рисование стен и комнат прямо в браузере)
  addWall: (a: { x: number; y: number }, b: { x: number; y: number }, thickness?: number) => string;
  removeWall: (id: string) => void;
  addRoom: (polygon: { x: number; y: number }[], name?: string) => string;
  removeRoom: (id: string) => void;
  setBounds: (widthMm: number, heightMm: number) => void;

  addOpening: (op: { kind: 'door' | 'window'; wallId: string; offset: number; width?: number }) => string;
  removeOpening: (id: string) => void;

  // Live-drag геометрии: вызывается при mousedown — пушит снапшот в past один раз;
  // дальше Live-функции обновляют состояние без новых записей в историю.
  beginGeometryEdit: () => void;
  updateWallEndpointLive: (wallId: string, end: 'a' | 'b', point: { x: number; y: number }) => void;
  updateRoomVertexLive: (roomId: string, vertexIdx: number, point: { x: number; y: number }) => void;
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

// Снимок текущего «изменяемого» состояния — кладём в past при каждой пользовательской мутации.
function snapshot(s: { objects: PlacedObject[]; geometry: ApartmentGeometry }): HistorySnapshot {
  return { objects: s.objects, geometry: s.geometry };
}
function pushHistory(s: ProjectStore): Partial<ProjectStore> {
  const past = [...s.past, snapshot(s)];
  // Обрезаем самые старые, чтобы не разрастаться
  const trimmed = past.length > HISTORY_LIMIT ? past.slice(past.length - HISTORY_LIMIT) : past;
  return { past: trimmed, future: [] };
}

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

    past: [],
    future: [],
    lastSavedAt: null,

    selectedIds: [],
    selectedWallIds: [],
    selectedRoomIds: [],
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
      ...pushHistory(s),
      objects: [...s.objects, obj],
      selectedIds: [obj.id],
    })),
    addManyObjects: (objs) => set((s) => ({
      ...pushHistory(s),
      objects: [...s.objects, ...objs],
    })),

    updateObject: (id, patch) => set((s) => ({
      ...pushHistory(s),
      objects: s.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    })),

    removeObjects: (ids) => set((s) => ({
      ...pushHistory(s),
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
        return { ...pushHistory(s), objects: [...s.objects, ...copies], selectedIds: newIds };
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
    clearSelect: () => set({ selectedIds: [], selectedWallIds: [], selectedRoomIds: [] }),

    toggleSelectWall: (id, additive) => set((s) => {
      if (!additive) return { selectedWallIds: [id], selectedIds: [], selectedRoomIds: [] };
      return {
        selectedWallIds: s.selectedWallIds.includes(id)
          ? s.selectedWallIds.filter((x) => x !== id)
          : [...s.selectedWallIds, id],
      };
    }),
    clearSelectWalls: () => set({ selectedWallIds: [] }),
    removeSelectedWalls: () => set((s) => {
      if (!s.selectedWallIds.length) return s;
      const ids = new Set(s.selectedWallIds);
      return {
        ...pushHistory(s),
        geometry: {
          ...s.geometry,
          walls: s.geometry.walls.filter((w) => !ids.has(w.id)),
          openings: s.geometry.openings.filter((o) => !ids.has(o.wallId)),
        },
        selectedWallIds: [],
      };
    }),

    toggleSelectRoom: (id, additive) => set((s) => {
      if (!additive) return { selectedRoomIds: [id], selectedIds: [], selectedWallIds: [] };
      return {
        selectedRoomIds: s.selectedRoomIds.includes(id)
          ? s.selectedRoomIds.filter((x) => x !== id)
          : [...s.selectedRoomIds, id],
      };
    }),
    clearSelectRooms: () => set({ selectedRoomIds: [] }),
    removeSelectedRooms: () => set((s) => {
      if (!s.selectedRoomIds.length) return s;
      const ids = new Set(s.selectedRoomIds);
      return {
        ...pushHistory(s),
        geometry: {
          ...s.geometry,
          rooms: s.geometry.rooms.filter((r) => !ids.has(r.id)),
        },
        selectedRoomIds: [],
      };
    }),

    setHover: (id) => set({ hoverId: id }),

    setLayerVisible: (l, v) => set((s) => ({ layerVisibility: { ...s.layerVisibility, [l]: v } })),
    toggleLayer: (l) => set((s) => ({ layerVisibility: { ...s.layerVisibility, [l]: !s.layerVisibility[l] } })),

    setView: (v) => set((s) => ({ view: { ...s.view, ...v } })),
    setShowGrid: (v) => set({ showGrid: v }),
    setSnapMm: (v) => set({ snapMm: v }),
    setMeasure: (m) => set({ measure: m }),

    setMeta: (patch) => set((s) => ({ meta: { ...s.meta, ...patch, updatedAt: Date.now() } })),

    saveLocal: () => {
      // localStorage может бросить в Safari Private Mode и при quota-exceeded.
      // Не валим bootstrap и автосохранение — просто проглатываем.
      try {
        const data = get().exportJson();
        localStorage.setItem(LS_KEY, JSON.stringify(data));
        set({ lastSavedAt: Date.now() });
      } catch (e) {
        console.warn('[saveLocal] localStorage unavailable:', e);
      }
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
    loadJson: (data) => set((s) => ({
      ...pushHistory(s),
      meta: data.meta,
      geometry: data.geometry,
      objects: data.objects ?? [],
      layerVisibility: { ...DEFAULT_VISIBILITY, ...(data.layerVisibility ?? {}) },
      selectedIds: [],
      selectedWallIds: [],
      selectedRoomIds: [],
      tool: 'select',
      placeCatalogId: null,
    })),

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

    setGeometry: (g) => set((s) => ({ ...pushHistory(s), geometry: g })),
    replaceObjects: (o) => set((s) => ({ ...pushHistory(s), objects: o })),

    addWall: (a, b, thickness = 100) => {
      const id = 'w-' + newId();
      set((s) => ({
        ...pushHistory(s),
        geometry: { ...s.geometry, walls: [...s.geometry.walls, { id, a, b, thickness }] },
      }));
      return id;
    },
    removeWall: (id) => set((s) => ({
      ...pushHistory(s),
      geometry: {
        ...s.geometry,
        walls: s.geometry.walls.filter((w) => w.id !== id),
        // также убираем openings, висящие на удалённой стене
        openings: s.geometry.openings.filter((o) => o.wallId !== id),
      },
    })),
    addRoom: (polygon, name = 'Новое помещение') => {
      const id = 'r-' + newId();
      // Площадь по формуле shoelace, перевод мм² → м²
      let s2 = 0;
      for (let i = 0; i < polygon.length; i++) {
        const p = polygon[i];
        const q = polygon[(i + 1) % polygon.length];
        s2 += p.x * q.y - q.x * p.y;
      }
      const area = +(Math.abs(s2) / 2 / 1_000_000).toFixed(2);
      set((s) => ({
        ...pushHistory(s),
        geometry: {
          ...s.geometry,
          rooms: [...s.geometry.rooms, { id, name, kind: 'living', area, polygon }],
        },
      }));
      return id;
    },
    removeRoom: (id) => set((s) => ({
      ...pushHistory(s),
      geometry: { ...s.geometry, rooms: s.geometry.rooms.filter((r) => r.id !== id) },
    })),
    setBounds: (widthMm, heightMm) => set((s) => ({
      ...pushHistory(s),
      geometry: { ...s.geometry, bounds: { width: widthMm, height: heightMm } },
    })),

    addOpening: ({ kind, wallId, offset, width }) => {
      const id = (kind === 'door' ? 'door-' : 'win-') + newId();
      set((s) => {
        const w = kind === 'window'
          ? { id, kind, wallId, offset, width: width ?? 1500, sillHeight: 850, height: 1500 }
          : { id, kind, wallId, offset, width: width ?? 800, swing: 'right' as const, hingeSide: 'in' as const };
        return {
          ...pushHistory(s),
          geometry: { ...s.geometry, openings: [...s.geometry.openings, w] },
        };
      });
      return id;
    },
    removeOpening: (id) => set((s) => ({
      ...pushHistory(s),
      geometry: { ...s.geometry, openings: s.geometry.openings.filter((o) => o.id !== id) },
    })),

    beginGeometryEdit: () => set((s) => ({ ...pushHistory(s) })),
    updateWallEndpointLive: (wallId, end, point) => set((s) => ({
      geometry: {
        ...s.geometry,
        walls: s.geometry.walls.map((w) => w.id === wallId ? { ...w, [end]: point } : w),
      },
    })),
    updateRoomVertexLive: (roomId, vertexIdx, point) => set((s) => ({
      geometry: {
        ...s.geometry,
        rooms: s.geometry.rooms.map((r) => {
          if (r.id !== roomId) return r;
          const polygon = r.polygon.map((v, i) => i === vertexIdx ? point : v);
          // Пересчитаем площадь сразу — UI и шапка комнаты обновятся в реальном времени
          let s2 = 0;
          for (let i = 0; i < polygon.length; i++) {
            const p = polygon[i];
            const q = polygon[(i + 1) % polygon.length];
            s2 += p.x * q.y - q.x * p.y;
          }
          const area = +(Math.abs(s2) / 2 / 1_000_000).toFixed(2);
          return { ...r, polygon, area };
        }),
      },
    })),

    undo: () => set((s) => {
      if (!s.past.length) return s;
      const prev = s.past[s.past.length - 1];
      const newPast = s.past.slice(0, -1);
      const current = snapshot(s);
      return {
        past: newPast,
        future: [current, ...s.future].slice(0, HISTORY_LIMIT),
        objects: prev.objects,
        geometry: prev.geometry,
        selectedIds: [],
        selectedWallIds: [],
        selectedRoomIds: [],
      };
    }),
    redo: () => set((s) => {
      if (!s.future.length) return s;
      const next = s.future[0];
      const newFuture = s.future.slice(1);
      const current = snapshot(s);
      return {
        past: [...s.past, current].slice(-HISTORY_LIMIT),
        future: newFuture,
        objects: next.objects,
        geometry: next.geometry,
        selectedIds: [],
        selectedWallIds: [],
        selectedRoomIds: [],
      };
    }),
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
// Приоритет: hash в URL (?p=...) → localStorage → public/project.json → встроенный fallback.
export async function bootstrapTemplate() {
  // 1) Шар-ссылка в hash имеет наивысший приоритет
  let loadedFromHash = false;
  try {
    const fromHash = await tryLoadFromHash();
    if (fromHash) {
      useProject.getState().loadJson(fromHash);
      // Принудительно сохраняем сейчас же — иначе loadTemplate ниже сочтёт LS пустым
      // и перезапишет состояние шаблоном.
      useProject.getState().saveLocal();
      loadedFromHash = true;
      // Очищаем hash, чтобы автосохранение и реклоад работали корректно
      clearShareHash();
    }
  } catch {}

  // 2) Грузим эталонный шаблон (только как «эталон для Reset» — не перезаписывает
  //    состояние, если оно уже выставлено из hash или localStorage).
  try {
    const res = await fetch(TEMPLATE_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as ProjectData;
    if (!data.geometry || !data.meta) throw new Error('Неверный формат project.json');
    if (loadedFromHash) {
      useProject.setState({ template: data, templateLoaded: true, templateError: null });
    } else {
      useProject.getState().loadTemplate(data);
    }
  } catch (e: any) {
    useProject.setState({ templateError: e?.message ?? 'Не удалось загрузить project.json' });
    if (!loadedFromHash) useProject.getState().loadTemplate(FALLBACK_TEMPLATE);
  }
  return loadedFromHash;
}

export const newObjectId = newId;
