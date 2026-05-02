// Параметризованный «пустой» план: только внешняя коробка W×H мм.
// Точка отсчёта для конструктора — потом пользователь руками расставляет
// внутренние стены и проёмы или применяет AI-патч.

import type { ProjectData } from '../types';

const layerVisibility = {
  walls: true, doors: true, windows: true, labels: true,
  furniture: true, appliances: true, sockets: true,
  switches: true, lights: true, data: true, plumbing: true, notes: true,
};

export interface BlankPlanOptions {
  /** Название плана (отображается в meta.name). */
  name: string;
  /** Ширина коробки в мм. */
  widthMm: number;
  /** Высота коробки в мм. */
  heightMm: number;
  /** Толщина внешних стен в мм. По умолчанию 250 (типовая железобетонная панель). */
  externalThicknessMm?: number;
  /** Куда поставить входную дверь: на какой стене и offset в мм от точки a. */
  entryDoor?: { wall: 'n' | 'e' | 's' | 'w'; offsetMm: number; widthMm?: number };
}

export function buildBlankPlan(opts: BlankPlanOptions): ProjectData {
  const { name, widthMm: w, heightMm: h } = opts;
  const t = opts.externalThicknessMm ?? 250;
  const door = opts.entryDoor ?? { wall: 'w', offsetMm: Math.round(h * 0.6), widthMm: 900 };
  const totalArea = +((w * h) / 1_000_000).toFixed(1);
  return {
    version: '1.0',
    meta: {
      name,
      totalArea,
      livingArea: 0,
      auxArea: 0,
      notes: 'Чистый план. Используй инструменты «🧱 Стена» / «🏠 Комната», чтобы расставить геометрию, или попроси AI-помощника о патче.',
      updatedAt: Date.now(),
    },
    geometry: {
      bounds: { width: w, height: h },
      rooms: [
        { id: 'main', name: 'Без названия', kind: 'living', area: totalArea,
          polygon: [ { x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h } ] },
      ],
      walls: [
        { id: 'ext-n', a: { x: 0, y: 0 }, b: { x: w, y: 0 }, thickness: t, external: true },
        { id: 'ext-e', a: { x: w, y: 0 }, b: { x: w, y: h }, thickness: t, external: true },
        { id: 'ext-s', a: { x: w, y: h }, b: { x: 0, y: h }, thickness: t, external: true },
        { id: 'ext-w', a: { x: 0, y: h }, b: { x: 0, y: 0 }, thickness: t, external: true },
      ],
      openings: [
        {
          id: 'door-entry',
          kind: 'door',
          wallId: `ext-${door.wall}`,
          offset: door.offsetMm,
          width: door.widthMm ?? 900,
          swing: 'right',
          hingeSide: 'in',
          label: 'Входная',
        },
      ],
    },
    objects: [],
    layerVisibility,
  };
}
