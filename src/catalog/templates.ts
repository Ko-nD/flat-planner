// Шаблоны розеток/выключателей/света по типовым зонам.
// Координаты заданы относительно центра помещения (origin = центр по бaundingBox комнаты).

import type { LayerId, PlacedObject } from '../types';
import { findCatalog } from './catalog';

export interface TemplateItem {
  catalogId: string;
  // Смещение от центра комнаты в мм (или от заданной точки)
  dx: number;
  dy: number;
  rotation?: number;
  label?: string;
  mountHeight?: number;
}

export interface TemplateGroup {
  id: string;
  title: string;
  description: string;
  forKind?: 'living' | 'kitchen' | 'bath' | 'wc' | 'hall';
  items: TemplateItem[];
}

// Стандартный «спальный пакет»: розетки и выключатели у двуспальной кровати + потолок
export const TEMPLATE_BEDROOM_BED: TemplateGroup = {
  id: 'bedroom-bed-pack',
  title: 'Кровать: розетки + бра + проходные выключатели',
  description: '4 розетки у двух тумб (+USB), 2 бра, проходные выключатели у двери и кровати',
  forKind: 'living',
  items: [
    // Левая прикроватная — блок 2 розетки + USB
    { catalogId: 'socket-2', dx: -800, dy: -700, label: 'Тумба слева: 2 розетки', mountHeight: 200 },
    // Правая прикроватная
    { catalogId: 'socket-2', dx:  800, dy: -700, label: 'Тумба справа: 2 розетки', mountHeight: 200 },
    // Бра над тумбочками
    { catalogId: 'sconce',   dx: -800, dy: -1100, label: 'Бра слева',  mountHeight: 1500 },
    { catalogId: 'sconce',   dx:  800, dy: -1100, label: 'Бра справа', mountHeight: 1500 },
    // Проходные выключатели — у двери и у кровати
    { catalogId: 'switch-pass-2', dx: -1300, dy: 700, label: 'Проходной у кровати (свет + бра)', mountHeight: 900 },
  ],
};

export const TEMPLATE_BEDROOM_DESK: TemplateGroup = {
  id: 'bedroom-desk-pack',
  title: 'Рабочее место: блок розеток + RJ45',
  description: 'Блок 4 розеток над столом + интернет, лампа',
  forKind: 'living',
  items: [
    { catalogId: 'socket-4', dx: 0, dy: -300, label: 'Блок 4 розеток (стол)', mountHeight: 1100 },
    { catalogId: 'rj45',     dx: 200, dy: -300, label: 'Интернет', mountHeight: 1100 },
  ],
};

export const TEMPLATE_LIVING_TV: TemplateGroup = {
  id: 'living-tv-pack',
  title: 'ТВ-зона: блок за ТВ + интернет',
  description: 'Блок 4 розеток + ТВ + RJ45 за ТВ. Дополнительно 2 розетки внизу для саундбара',
  forKind: 'living',
  items: [
    { catalogId: 'socket-tv-block', dx: 0, dy: 0, label: 'За ТВ: 220В × 2 + ТВ + RJ45', mountHeight: 1100 },
    { catalogId: 'socket-2', dx: -300, dy: 200, label: 'Внизу: саундбар/приставка', mountHeight: 200 },
  ],
};

export const TEMPLATE_KITCHEN_BLOCK: TemplateGroup = {
  id: 'kitchen-counter-block',
  title: 'Кухня: блок розеток над столешницей',
  description: 'Блок 4-5 розеток над фартуком, отдельные для крупной техники',
  forKind: 'kitchen',
  items: [
    { catalogId: 'socket-kitchen-block', dx: 0,    dy: 0, label: 'Над столешницей: 4 розетки' },
    { catalogId: 'socket-kitchen-block', dx: 1000, dy: 0, label: 'Блок 2: рабочая зона' },
    { catalogId: 'socket-fridge', dx: -1300, dy: 200, label: 'Холодильник' },
    { catalogId: 'socket-stove',  dx:   600, dy: 600, label: 'Варочная (32A)' },
    { catalogId: 'socket-1',      dx:   200, dy: 600, label: 'Духовой шкаф', mountHeight: 600 },
    { catalogId: 'socket-1',      dx: -200, dy: 600, label: 'Посудомойка',   mountHeight: 600 },
  ],
};

export const TEMPLATE_BATH_BASIC: TemplateGroup = {
  id: 'bath-basic',
  title: 'Ванная: стиральная + бойлер + подсветка',
  description: 'Розетка для стиральной, бойлера, подсветка зеркала',
  forKind: 'bath',
  items: [
    { catalogId: 'socket-washer',  dx: -300, dy: 200, label: 'Стиральная (IP44)' },
    { catalogId: 'socket-1',       dx:  300, dy: 200, label: 'Бойлер',           mountHeight: 1800 },
    { catalogId: 'mirror-light',   dx:  0,   dy: -400, label: 'Подсветка зеркала' },
    { catalogId: 'spot',           dx: -500, dy: -300, label: 'Спот' },
    { catalogId: 'spot',           dx:  500, dy: -300, label: 'Спот' },
    { catalogId: 'spot',           dx: -500, dy:  300, label: 'Спот' },
    { catalogId: 'spot',           dx:  500, dy:  300, label: 'Спот' },
  ],
};

export const TEMPLATE_HALL_BASIC: TemplateGroup = {
  id: 'hall-basic',
  title: 'Прихожая: розетки + двойной выключатель',
  description: '2 розетки у входа, выключатели на коридор и комнаты',
  forKind: 'hall',
  items: [
    { catalogId: 'socket-2', dx: 0, dy: 0, label: 'Розетки у входа' },
    { catalogId: 'switch-2', dx: 0, dy: 200, label: 'Свет коридор + потолок' },
  ],
};

export const ALL_TEMPLATES: TemplateGroup[] = [
  TEMPLATE_BEDROOM_BED,
  TEMPLATE_BEDROOM_DESK,
  TEMPLATE_LIVING_TV,
  TEMPLATE_KITCHEN_BLOCK,
  TEMPLATE_BATH_BASIC,
  TEMPLATE_HALL_BASIC,
];

// Применить шаблон в указанной точке. Возвращает массив новых объектов.
export function instantiateTemplate(group: TemplateGroup, anchor: { x: number; y: number }): PlacedObject[] {
  const result: PlacedObject[] = [];
  for (const t of group.items) {
    const cat = findCatalog(t.catalogId);
    if (!cat) continue;
    result.push({
      id: Math.random().toString(36).slice(2, 10),
      catalogId: cat.id,
      layer: cat.layer as LayerId,
      x: anchor.x + t.dx,
      y: anchor.y + t.dy,
      rotation: t.rotation ?? 0,
      width: cat.width,
      depth: cat.depth,
      label: t.label ?? cat.name,
      mountHeight: t.mountHeight ?? cat.mountHeight,
    });
  }
  return result;
}
