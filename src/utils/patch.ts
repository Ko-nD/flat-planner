// Применение AI-патча к проекту. Совместим с любой мультимодальной LLM
// (Claude, GPT-4o/o1, Qwen-VL, Gemini, Llama-Vision и т.п.).
// Поддерживаемые операции (op):
//   - add_object        { object: PlacedObject }
//   - update_object     { id: string, patch: Partial<PlacedObject> }
//   - move_object       { id: string, x: number, y: number }
//   - delete_object     { id: string }
//   - add_room          { room: Room }
//   - update_room       { id: string, patch: Partial<Room> }
//   - replace_room_polygon { id: string, polygon: Vec2[] }
//   - remove_room       { id: string }
//   - add_wall          { wall: Wall }
//   - replace_wall      { id: string, wall: Wall }
//   - remove_wall       { id: string }
//   - add_opening       { opening: Opening }
//   - update_opening    { id: string, patch: Partial<Opening> }
//   - remove_opening    { id: string }
//
// Формат патча:
// { "version": "1.0", "ops": [ {...}, {...} ] }

import type {
  ApartmentGeometry, Opening, PlacedObject, ProjectData, Room, Vec2, Wall,
} from '../types';

export type PatchOp =
  | { op: 'add_object';            object: PlacedObject; reason?: string }
  | { op: 'update_object';         id: string; patch: Partial<PlacedObject>; reason?: string }
  | { op: 'move_object';           id: string; x: number; y: number; reason?: string }
  | { op: 'delete_object';         id: string; reason?: string }
  | { op: 'add_room';              room: Room; reason?: string }
  | { op: 'update_room';           id: string; patch: Partial<Room>; reason?: string }
  | { op: 'replace_room_polygon';  id: string; polygon: Vec2[]; reason?: string }
  | { op: 'remove_room';           id: string; reason?: string }
  | { op: 'add_wall';              wall: Wall; reason?: string }
  | { op: 'replace_wall';          id: string; wall: Wall; reason?: string }
  | { op: 'remove_wall';           id: string; reason?: string }
  | { op: 'add_opening';           opening: Opening; reason?: string }
  | { op: 'update_opening';        id: string; patch: Partial<Opening>; reason?: string }
  | { op: 'remove_opening';        id: string; reason?: string };

export interface AiPatch {
  version?: string;
  ops: PatchOp[];
}

export interface PatchPreviewItem {
  index: number;
  op: PatchOp['op'];
  summary: string;     // короткое описание для UI
  reason?: string;
  ok: boolean;         // можно ли применить
  error?: string;      // если не ok
}

export interface PatchPreview {
  items: PatchPreviewItem[];
  okCount: number;
  errorCount: number;
}

// Жёсткая валидация входного JSON
export function parsePatch(input: string): AiPatch {
  let parsed: any;
  try { parsed = JSON.parse(input); }
  catch (e: any) { throw new Error('Невалидный JSON: ' + e.message); }
  if (!parsed || typeof parsed !== 'object') throw new Error('Патч должен быть объектом');
  // Допускаем оба варианта: { ops: [...] } или прямо массив
  const ops: any[] = Array.isArray(parsed) ? parsed : parsed.ops;
  if (!Array.isArray(ops)) throw new Error('Поле "ops" должно быть массивом');
  for (let i = 0; i < ops.length; i++) {
    const o = ops[i];
    if (!o || typeof o !== 'object' || typeof o.op !== 'string') {
      throw new Error(`ops[${i}]: отсутствует поле "op"`);
    }
  }
  return { version: parsed.version, ops };
}

// Вернуть план применения с подсказками, что сломается, без мутаций.
export function previewPatch(state: ProjectData, patch: AiPatch): PatchPreview {
  const items: PatchPreviewItem[] = [];
  // Делаем рабочую копию для цепочной валидации (например, add потом update того же id)
  const draft = clone(state);

  patch.ops.forEach((op, index) => {
    const result = describeAndValidate(op, draft);
    items.push({
      index,
      op: op.op,
      summary: result.summary,
      reason: (op as any).reason,
      ok: result.ok,
      error: result.error,
    });
    if (result.ok) {
      // обновляем draft чтобы последующие ops видели результат
      try { applyOp(op, draft); } catch { /* swallow */ }
    }
  });

  return {
    items,
    okCount: items.filter((i) => i.ok).length,
    errorCount: items.filter((i) => !i.ok).length,
  };
}

// Применить весь патч. Возвращает новый ProjectData. НЕ мутирует input.
export function applyPatch(state: ProjectData, patch: AiPatch): ProjectData {
  const out = clone(state);
  for (const op of patch.ops) {
    try { applyOp(op, out); } catch { /* пропускаем сломанные ops */ }
  }
  return out;
}

function describeAndValidate(op: PatchOp, s: ProjectData): { summary: string; ok: boolean; error?: string } {
  switch (op.op) {
    case 'add_object': {
      const o = op.object;
      if (!o?.id || !o.catalogId) return { summary: 'add_object', ok: false, error: 'требуются id и catalogId' };
      if (s.objects.some((x) => x.id === o.id)) return { summary: `add_object ${o.id}`, ok: false, error: 'id уже существует' };
      return { summary: `+ объект «${o.label ?? o.catalogId}» (${o.layer})`, ok: true };
    }
    case 'update_object': {
      if (!s.objects.some((x) => x.id === op.id)) return { summary: `update_object ${op.id}`, ok: false, error: 'объект не найден' };
      return { summary: `~ объект ${op.id}: ${formatPatch(op.patch)}`, ok: true };
    }
    case 'move_object': {
      const o = s.objects.find((x) => x.id === op.id);
      if (!o) return { summary: `move_object ${op.id}`, ok: false, error: 'объект не найден' };
      return { summary: `↗ ${o.label ?? o.catalogId}: → (${Math.round(op.x/10)}, ${Math.round(op.y/10)}) см`, ok: true };
    }
    case 'delete_object': {
      const o = s.objects.find((x) => x.id === op.id);
      if (!o) return { summary: `delete_object ${op.id}`, ok: false, error: 'объект не найден' };
      return { summary: `− удалить ${o.label ?? o.catalogId}`, ok: true };
    }
    case 'add_room': {
      const r = op.room;
      if (!r?.id) return { summary: 'add_room', ok: false, error: 'требуется id' };
      if (s.geometry.rooms.some((x) => x.id === r.id)) return { summary: `add_room ${r.id}`, ok: false, error: 'id уже существует' };
      return { summary: `+ комната «${r.name ?? r.id}»`, ok: true };
    }
    case 'update_room': {
      if (!s.geometry.rooms.some((x) => x.id === op.id)) return { summary: `update_room ${op.id}`, ok: false, error: 'комната не найдена' };
      return { summary: `~ комната ${op.id}: ${formatPatch(op.patch)}`, ok: true };
    }
    case 'replace_room_polygon': {
      const r = s.geometry.rooms.find((x) => x.id === op.id);
      if (!r) return { summary: `replace_room_polygon ${op.id}`, ok: false, error: 'комната не найдена' };
      if (!Array.isArray(op.polygon) || op.polygon.length < 3) return { summary: `replace_room_polygon ${op.id}`, ok: false, error: 'нужен polygon из ≥3 точек' };
      return { summary: `⬢ полигон комнаты «${r.name}» → ${op.polygon.length} вершин`, ok: true };
    }
    case 'remove_room': {
      if (!s.geometry.rooms.some((x) => x.id === op.id)) return { summary: `remove_room ${op.id}`, ok: false, error: 'комната не найдена' };
      return { summary: `− удалить комнату ${op.id}`, ok: true };
    }
    case 'add_wall': {
      const w = op.wall;
      if (!w?.id || !w.a || !w.b) return { summary: 'add_wall', ok: false, error: 'требуются id, a, b' };
      if (s.geometry.walls.some((x) => x.id === w.id)) return { summary: `add_wall ${w.id}`, ok: false, error: 'id уже существует' };
      return { summary: `+ стена ${w.id}`, ok: true };
    }
    case 'replace_wall': {
      const w = op.wall;
      if (!s.geometry.walls.some((x) => x.id === op.id)) return { summary: `replace_wall ${op.id}`, ok: false, error: 'стена не найдена' };
      if (!w?.a || !w.b) return { summary: `replace_wall ${op.id}`, ok: false, error: 'wall.a и wall.b обязательны' };
      return { summary: `~ стена ${op.id}`, ok: true };
    }
    case 'remove_wall': {
      if (!s.geometry.walls.some((x) => x.id === op.id)) return { summary: `remove_wall ${op.id}`, ok: false, error: 'стена не найдена' };
      const usedBy = s.geometry.openings.filter((x) => x.wallId === op.id);
      const note = usedBy.length ? `, проёмов на ней: ${usedBy.length}` : '';
      return { summary: `− удалить стену ${op.id}${note}`, ok: true };
    }
    case 'add_opening': {
      const o = op.opening;
      if (!o?.id || !o.wallId) return { summary: 'add_opening', ok: false, error: 'требуются id и wallId' };
      if (s.geometry.openings.some((x) => x.id === o.id)) return { summary: `add_opening ${o.id}`, ok: false, error: 'id уже существует' };
      if (!s.geometry.walls.some((x) => x.id === o.wallId)) return { summary: `add_opening ${o.id}`, ok: false, error: `стена ${o.wallId} не найдена` };
      return { summary: `+ ${o.kind === 'door' ? 'дверь' : 'окно'} ${o.id} на ${o.wallId}`, ok: true };
    }
    case 'update_opening': {
      if (!s.geometry.openings.some((x) => x.id === op.id)) return { summary: `update_opening ${op.id}`, ok: false, error: 'проём не найден' };
      return { summary: `~ проём ${op.id}: ${formatPatch(op.patch)}`, ok: true };
    }
    case 'remove_opening': {
      if (!s.geometry.openings.some((x) => x.id === op.id)) return { summary: `remove_opening ${op.id}`, ok: false, error: 'проём не найден' };
      return { summary: `− удалить проём ${op.id}`, ok: true };
    }
    default:
      return { summary: `unknown op: ${(op as any).op}`, ok: false, error: 'неизвестная операция' };
  }
}

function applyOp(op: PatchOp, s: ProjectData): void {
  const g = s.geometry as ApartmentGeometry;
  switch (op.op) {
    case 'add_object':
      s.objects = [...s.objects, op.object];
      break;
    case 'update_object':
      s.objects = s.objects.map((o) => o.id === op.id ? { ...o, ...op.patch } : o);
      break;
    case 'move_object':
      s.objects = s.objects.map((o) => o.id === op.id ? { ...o, x: op.x, y: op.y } : o);
      break;
    case 'delete_object':
      s.objects = s.objects.filter((o) => o.id !== op.id);
      break;
    case 'add_room':
      s.geometry = { ...g, rooms: [...g.rooms, op.room] };
      break;
    case 'update_room':
      s.geometry = { ...g, rooms: g.rooms.map((r) => r.id === op.id ? { ...r, ...op.patch } : r) };
      break;
    case 'replace_room_polygon':
      s.geometry = { ...g, rooms: g.rooms.map((r) => r.id === op.id ? { ...r, polygon: op.polygon } : r) };
      break;
    case 'remove_room':
      s.geometry = { ...g, rooms: g.rooms.filter((r) => r.id !== op.id) };
      break;
    case 'add_wall':
      s.geometry = { ...g, walls: [...g.walls, op.wall] };
      break;
    case 'replace_wall':
      s.geometry = { ...g, walls: g.walls.map((w) => w.id === op.id ? { ...op.wall, id: op.id } : w) };
      break;
    case 'remove_wall':
      s.geometry = {
        ...g,
        walls: g.walls.filter((w) => w.id !== op.id),
        // Удалим проёмы которые висели на этой стене — иначе будут призраки
        openings: g.openings.filter((o) => o.wallId !== op.id),
      };
      break;
    case 'add_opening':
      s.geometry = { ...g, openings: [...g.openings, op.opening] };
      break;
    case 'update_opening':
      s.geometry = { ...g, openings: g.openings.map((o) => o.id === op.id ? { ...o, ...op.patch } : o) };
      break;
    case 'remove_opening':
      s.geometry = { ...g, openings: g.openings.filter((o) => o.id !== op.id) };
      break;
  }
}

function formatPatch(patch: Record<string, any>): string {
  const keys = Object.keys(patch ?? {});
  if (!keys.length) return '(пусто)';
  return keys.slice(0, 4).map((k) => `${k}=${JSON.stringify(patch[k])}`).join(', ') + (keys.length > 4 ? '…' : '');
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}
