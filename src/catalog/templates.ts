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

// === Кухонные гарнитуры (мебель + техника) ===
// Все шаблоны кладут модули в одну линию по оси X с центром у anchor.x. Глубина
// корпусов 600 мм, центр по Y совпадает с anchor.y — пользователь потом тащит весь
// набор к стене (или применяет шаблон у нужной стены). Под газовую плиту 60×60
// предусмотрен «слот» — модуль stove-gas-60 встаёт на месте, между шкафами.

// Линейная мини 1.6 м — типовой формат хрущёвки/студии.
// Раскладка: [600 шкаф под мойку] [600 газ.плита] [400 шкаф] = 1600 мм.
export const TEMPLATE_KITCHEN_LINEAR_16: TemplateGroup = {
  id: 'kitchen-linear-16',
  title: '🍳 Линейная кухня 1.6 м (с местом под газ. плиту)',
  description: '3 модуля + мойка + газовая плита 60×60. Длина по стене 1.6 м — для хрущёвок/студий',
  forKind: 'kitchen',
  items: [
    { catalogId: 'kitchen-cab-60', dx: -500, dy: 0, label: 'Тумба под мойку 600' },
    { catalogId: 'kitchen-sink',   dx: -500, dy: 0, label: 'Мойка одиночная' },
    { catalogId: 'stove-gas-60',   dx:  100, dy: 0, label: 'Газовая плита 60' },
    { catalogId: 'kitchen-cab-40', dx:  600, dy: 0, label: 'Кух. шкаф 400' },
  ],
};

// Линейная 2.0 м — компактная стандартная.
// Раскладка: [600 мойка] [600 плита] [400 шкаф] [400 шкаф] = 2000 мм.
export const TEMPLATE_KITCHEN_LINEAR_20: TemplateGroup = {
  id: 'kitchen-linear-20',
  title: '🍳 Линейная кухня 2.0 м',
  description: 'Тумба-мойка + газ. плита 60 + 2 верхних шкафа 400. Длина 2.0 м',
  forKind: 'kitchen',
  items: [
    { catalogId: 'kitchen-cab-60', dx: -700, dy: 0, label: 'Тумба под мойку 600' },
    { catalogId: 'kitchen-sink',   dx: -700, dy: 0, label: 'Мойка одиночная' },
    { catalogId: 'stove-gas-60',   dx: -100, dy: 0, label: 'Газовая плита 60' },
    { catalogId: 'kitchen-cab-40', dx:  400, dy: 0, label: 'Кух. шкаф 400' },
    { catalogId: 'kitchen-cab-40', dx:  800, dy: 0, label: 'Кух. шкаф 400' },
  ],
};

// Линейная 2.4 м — стандартная серийная.
// [600 мойка] [600 плита] [600 шкаф] [600 шкаф] = 2400 мм.
export const TEMPLATE_KITCHEN_LINEAR_24: TemplateGroup = {
  id: 'kitchen-linear-24',
  title: '🍳 Линейная кухня 2.4 м (стандарт)',
  description: 'Тумба-мойка + газ. плита 60 + 2 шкафа 600. Длина 2.4 м — типовой набор IKEA Method/Hoff',
  forKind: 'kitchen',
  items: [
    { catalogId: 'kitchen-cab-60', dx: -900, dy: 0, label: 'Тумба под мойку 600' },
    { catalogId: 'kitchen-sink',   dx: -900, dy: 0, label: 'Мойка одиночная' },
    { catalogId: 'stove-gas-60',   dx: -300, dy: 0, label: 'Газовая плита 60' },
    { catalogId: 'kitchen-cab-60', dx:  300, dy: 0, label: 'Кух. шкаф 600' },
    { catalogId: 'kitchen-cab-60', dx:  900, dy: 0, label: 'Кух. шкаф 600' },
  ],
};

// Линейная 3.0 м с холодильником — для просторной кухни.
// [600 холодильник] [600 мойка двойная] [600 плита] [600 шкаф] [600 шкаф] = 3000 мм.
export const TEMPLATE_KITCHEN_LINEAR_30: TemplateGroup = {
  id: 'kitchen-linear-30',
  title: '🍳 Линейная кухня 3.0 м (с холодильником)',
  description: 'Холодильник + двойная мойка + газ. плита + 2 шкафа 600. Длина 3.0 м',
  forKind: 'kitchen',
  items: [
    { catalogId: 'fridge-200',     dx: -1200, dy: -25, label: 'Холодильник 200 см' },
    { catalogId: 'kitchen-cab-60', dx:  -600, dy: 0,   label: 'Тумба под мойку 600' },
    { catalogId: 'kitchen-sink-2', dx:  -600, dy: 0,   label: 'Двойная мойка' },
    { catalogId: 'stove-gas-60',   dx:     0, dy: 0,   label: 'Газовая плита 60' },
    { catalogId: 'kitchen-cab-60', dx:   600, dy: 0,   label: 'Кух. шкаф 600' },
    { catalogId: 'kitchen-cab-60', dx:  1200, dy: 0,   label: 'Кух. шкаф 600' },
  ],
};

// Угловая Г-образная 1.6 × 2.0 м — для типовой кухни 6-8 м².
// Длинная стенка по X (1600): [600 мойка] [600 плита] [400 шкаф].
// Угловая 900×900 в углу.
// Короткая стенка по Y (1100): [600 шкаф] [500 шкаф], повёрнуты на 90°.
export const TEMPLATE_KITCHEN_CORNER_L: TemplateGroup = {
  id: 'kitchen-corner-l',
  title: '🍳 Угловая кухня Г-образная 1.6×2.0 м',
  description: 'Длинная стена с мойкой и газ. плитой + угловой шкаф + короткая стена со шкафами. Для кухонь 6-8 м²',
  forKind: 'kitchen',
  items: [
    // Длинная стена (X-axis)
    { catalogId: 'kitchen-cab-60', dx: -800, dy: 0, label: 'Тумба под мойку 600' },
    { catalogId: 'kitchen-sink',   dx: -800, dy: 0, label: 'Мойка одиночная' },
    { catalogId: 'stove-gas-60',   dx: -200, dy: 0, label: 'Газовая плита 60' },
    { catalogId: 'kitchen-cab-40', dx:  300, dy: 0, label: 'Кух. шкаф 400' },
    // Угол (l-shape 900×900)
    { catalogId: 'kitchen-corner', dx:  950, dy: 450, label: 'Угловой шкаф 900' },
    // Короткая стена (Y-axis), повёрнуто на 90°
    { catalogId: 'kitchen-cab-60', dx: 1100, dy: 1200, rotation: 90, label: 'Кух. шкаф 600 (поворот)' },
    { catalogId: 'kitchen-cab-50', dx: 1100, dy: 1750, rotation: 90, label: 'Кух. шкаф 500 (поворот)' },
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
  TEMPLATE_KITCHEN_LINEAR_16,
  TEMPLATE_KITCHEN_LINEAR_20,
  TEMPLATE_KITCHEN_LINEAR_24,
  TEMPLATE_KITCHEN_LINEAR_30,
  TEMPLATE_KITCHEN_CORNER_L,
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
