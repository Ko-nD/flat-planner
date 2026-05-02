import type { Vec2, Wall, Opening } from '../types';

export const length = (a: Vec2, b: Vec2) =>
  Math.hypot(b.x - a.x, b.y - a.y);

export const dirAngle = (a: Vec2, b: Vec2) =>
  Math.atan2(b.y - a.y, b.x - a.x);

export const wallNormal = (a: Vec2, b: Vec2): Vec2 => {
  const len = length(a, b) || 1;
  return { x: -(b.y - a.y) / len, y: (b.x - a.x) / len };
};

// Преобразовать смещение по стене в мировые координаты (центр проёма)
export const offsetOnWall = (wall: Wall, offset: number): Vec2 => {
  const { a, b } = wall;
  const len = length(a, b) || 1;
  const t = offset / len;
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
};

// Возвращает 4 угла прямоугольника стены с учётом толщины
export const wallQuad = (wall: Wall): Vec2[] => {
  const { a, b, thickness } = wall;
  const n = wallNormal(a, b);
  const half = thickness / 2;
  return [
    { x: a.x + n.x * half, y: a.y + n.y * half },
    { x: b.x + n.x * half, y: b.y + n.y * half },
    { x: b.x - n.x * half, y: b.y - n.y * half },
    { x: a.x - n.x * half, y: a.y - n.y * half },
  ];
};

// Полигон, в котором располагается дверной/оконный проём (на оси стены).
// Делает clamp ширины и центра, чтобы проём всегда лежал внутри стены.
export const openingSegment = (wall: Wall, opening: Opening) => {
  const { a, b } = wall;
  const len = length(a, b) || 1;
  // Ширина не больше длины стены (с маленьким зазором на края).
  const width = Math.max(0, Math.min(opening.width, len - 20));
  // Центр проёма в пределах [width/2 .. len-width/2]
  const center = Math.max(width / 2, Math.min(opening.offset, len - width / 2));
  const start = center - width / 2;
  const end = center + width / 2;
  const t1 = start / len;
  const t2 = end / len;
  return {
    p1: { x: a.x + (b.x - a.x) * t1, y: a.y + (b.y - a.y) * t1 },
    p2: { x: a.x + (b.x - a.x) * t2, y: a.y + (b.y - a.y) * t2 },
    width,
    center,
  };
};

// Площадь полигона (Shoelace), в мм²
export const polygonArea = (points: Vec2[]) => {
  let s = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    s += p1.x * p2.y - p2.x * p1.y;
  }
  return Math.abs(s / 2);
};

// Центроид полигона
export const polygonCentroid = (points: Vec2[]): Vec2 => {
  let cx = 0, cy = 0, a = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const cross = p1.x * p2.y - p2.x * p1.y;
    cx += (p1.x + p2.x) * cross;
    cy += (p1.y + p2.y) * cross;
    a += cross;
  }
  a /= 2;
  return { x: cx / (6 * a), y: cy / (6 * a) };
};

// Проверка вхождения точки в полигон (ray casting)
export const pointInPolygon = (pt: Vec2, poly: Vec2[]) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect =
      yi > pt.y !== yj > pt.y &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi || 1) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

export const snap = (v: number, step: number) => Math.round(v / step) * step;

export const roundTo = (v: number, prec = 0) => {
  const f = Math.pow(10, prec);
  return Math.round(v * f) / f;
};

// Ближайшая точка на отрезке [a..b] к точке p. Возвращает точку и параметр t∈[0..1].
export const nearestPointOnSegment = (p: Vec2, a: Vec2, b: Vec2) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return { point: { ...a }, t: 0, dist: length(p, a) };
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const point = { x: a.x + dx * t, y: a.y + dy * t };
  return { point, t, dist: length(p, point) };
};

// Найти ближайшую стену из списка к точке p в радиусе maxDist (мм).
// Возвращает { wall, projected: Vec2, angleDeg }, или null.
export const nearestWall = (
  p: Vec2,
  walls: Wall[],
  maxDist = 1500,
) => {
  let best: { wall: Wall; projected: Vec2; angleDeg: number; dist: number } | null = null;
  for (const w of walls) {
    // Игнорируем «нулевые» стены — они дают NaN/0 в расчётах проекции и offset проёмов
    const wlen = Math.hypot(w.b.x - w.a.x, w.b.y - w.a.y);
    if (wlen < 1) continue;
    const r = nearestPointOnSegment(p, w.a, w.b);
    if (r.dist > maxDist) continue;
    if (!best || r.dist < best.dist) {
      const angleDeg = (Math.atan2(w.b.y - w.a.y, w.b.x - w.a.x) * 180) / Math.PI;
      best = { wall: w, projected: r.point, angleDeg, dist: r.dist };
    }
  }
  return best;
};
