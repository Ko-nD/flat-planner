import type { CatalogItem, LayerId } from '../types';

export interface CatalogGroup {
  layer: LayerId;
  title: string;
  items: CatalogItem[];
}

// Цвета слоёв — должны совпадать с теми, что используются в Layers panel
export const LAYER_COLOR: Record<LayerId, string> = {
  walls:      '#3a3f4a',
  doors:      '#8b6f4d',
  windows:    '#4a8db5',
  labels:     '#7a6e54',
  furniture:  '#6b7280',
  appliances: '#475569',
  sockets:    '#0ea5e9',
  switches:   '#22c55e',
  lights:     '#f59e0b',
  data:       '#a855f7',
  plumbing:   '#06b6d4',
  notes:      '#ef4444',
};

export const LAYER_NAME: Record<LayerId, string> = {
  walls: 'Стены',
  doors: 'Двери',
  windows: 'Окна',
  labels: 'Подписи',
  furniture: 'Мебель',
  appliances: 'Техника',
  sockets: 'Розетки',
  switches: 'Выключатели',
  lights: 'Свет',
  data: 'Слаботочка',
  plumbing: 'Сантехника',
  notes: 'Заметки',
};

const FURNITURE: CatalogItem[] = [
  // === Спальня ===
  { id: 'bed-90',      layer: 'furniture', category: 'Спальня',  name: 'Кровать 90×200',     width: 900,  depth: 2000, symbol: 'bed-icon', hint: 'Односпальная' },
  { id: 'bed-120',     layer: 'furniture', category: 'Спальня',  name: 'Кровать 120×200',    width: 1200, depth: 2000, symbol: 'bed-icon', hint: 'Полуторная' },
  { id: 'bed-140',     layer: 'furniture', category: 'Спальня',  name: 'Кровать 140×200',    width: 1400, depth: 2000, symbol: 'bed-icon' },
  { id: 'bed-160',     layer: 'furniture', category: 'Спальня',  name: 'Кровать 160×200',    width: 1600, depth: 2000, symbol: 'bed-icon', hint: 'Двуспальная стандарт' },
  { id: 'bed-180',     layer: 'furniture', category: 'Спальня',  name: 'Кровать 180×200',    width: 1800, depth: 2000, symbol: 'bed-icon', hint: 'Queen' },
  { id: 'bed-200',     layer: 'furniture', category: 'Спальня',  name: 'Кровать 200×200',    width: 2000, depth: 2000, symbol: 'bed-icon', hint: 'King' },
  { id: 'bed-bunk',    layer: 'furniture', category: 'Спальня',  name: 'Двухъярусная',       width: 1000, depth: 2000, symbol: 'bed-icon', hint: 'Детская двухъярусная 90×200' },
  { id: 'sofa-bed',    layer: 'furniture', category: 'Спальня',  name: 'Диван-кровать',      width: 2000, depth: 950,  symbol: 'sofa-icon', hint: 'Раскладной диван (в собранном виде)' },
  { id: 'daybed',      layer: 'furniture', category: 'Спальня',  name: 'Кушетка',            width: 1900, depth: 800,  symbol: 'sofa-icon' },

  // === Трансформеры. По умолчанию кладём в каталог в разложенном виде (open) —
  // основной габарит, который видно с одного взгляда. В Свойствах есть кнопка
  // «Сложить» — корпус остаётся на стене, а спальное место уезжает к фасаду. ===
  { id: 'bed-transformer-v',       layer: 'furniture', category: 'Спальня', name: 'Кровать-трансформер вертикальная', width: 1700, depth: 2200, symbol: 'transformer-bed-v',
    hint: 'Murphy bed: корпус 1700×450 у короткой стены, спальное 1600×2000 раскладывается перпендикулярно. Кнопка «Сложить/Разложить» — в Свойствах.', wallMounted: true },
  { id: 'bed-transformer-h',       layer: 'furniture', category: 'Спальня', name: 'Кровать-трансформер горизонтальная', width: 2200, depth: 1700, symbol: 'transformer-bed-h',
    hint: 'Корпус 2200×450 у длинной стены, спальное 1600×2000 раскладывается боком. Удобно когда стена длинная, а места мало в глубину.', wallMounted: true },
  { id: 'bed-transformer-cabinet', layer: 'furniture', category: 'Спальня', name: 'Кровать-шкаф (180×200)',           width: 1800, depth: 2200, symbol: 'transformer-bed-cabinet',
    hint: 'Корпус 1800×600 со встроенной штангой и полками; спальное 1600×2000 откидывается. Глубже обычной Murphy bed за счёт хранения.', wallMounted: true },
  { id: 'sofa-bed-transformer',    layer: 'furniture', category: 'Спальня', name: 'Диван-кровать (раскладной)',       width: 2000, depth: 2000, symbol: 'transformer-sofa-bed',
    hint: 'Еврокнижка: 2000×950 диван, в разложенном виде 2000×2000. Сидушка остаётся на стене, спинка опускается, выкатывается матрас.' },

  { id: 'nightstand',     layer: 'furniture', category: 'Спальня',  name: 'Тумба прикроватная',   width: 450, depth: 400, symbol: 'rect' },
  { id: 'nightstand-wide',layer: 'furniture', category: 'Спальня',  name: 'Тумба прикр. 600',     width: 600, depth: 400, symbol: 'rect' },
  { id: 'commode',        layer: 'furniture', category: 'Спальня',  name: 'Комод 100',            width: 1000, depth: 450, symbol: 'rect' },
  { id: 'commode-150',    layer: 'furniture', category: 'Спальня',  name: 'Комод 150',            width: 1500, depth: 450, symbol: 'rect' },
  { id: 'dressing-table', layer: 'furniture', category: 'Спальня',  name: 'Туалетный столик',     width: 1000, depth: 450, symbol: 'table-icon' },
  { id: 'pouffe',         layer: 'furniture', category: 'Спальня',  name: 'Пуф',                  width: 450,  depth: 450, symbol: 'circle' },
  { id: 'pouffe-rect',    layer: 'furniture', category: 'Спальня',  name: 'Банкетка',             width: 1000, depth: 400, symbol: 'rect' },
  { id: 'mirror-floor',   layer: 'furniture', category: 'Спальня',  name: 'Напольное зеркало',    width: 600,  depth: 80,  symbol: 'rect' },

  // Шкафы / гардероб
  { id: 'wardrobe-1',     layer: 'furniture', category: 'Шкафы',    name: 'Шкаф 1м',             width: 1000, depth: 600, symbol: 'rect' },
  { id: 'wardrobe-15',    layer: 'furniture', category: 'Шкафы',    name: 'Шкаф 1.5м',           width: 1500, depth: 600, symbol: 'rect' },
  { id: 'wardrobe-2',     layer: 'furniture', category: 'Шкафы',    name: 'Шкаф 2м',             width: 2000, depth: 600, symbol: 'rect' },
  { id: 'wardrobe-25',    layer: 'furniture', category: 'Шкафы',    name: 'Шкаф 2.5м',           width: 2500, depth: 600, symbol: 'rect' },
  { id: 'wardrobe-3',     layer: 'furniture', category: 'Шкафы',    name: 'Шкаф 3м',             width: 3000, depth: 600, symbol: 'rect' },
  { id: 'wardrobe-slide-2',layer: 'furniture',category: 'Шкафы',    name: 'Шкаф-купе 2м',        width: 2000, depth: 650, symbol: 'rect', hint: 'Раздвижные двери — глубже на 50мм' },
  { id: 'wardrobe-slide-3',layer: 'furniture',category: 'Шкафы',    name: 'Шкаф-купе 3м',        width: 3000, depth: 650, symbol: 'rect' },
  { id: 'wardrobe-corner',layer: 'furniture', category: 'Шкафы',    name: 'Угловой шкаф',        width: 1200, depth: 1200,symbol: 'l-shape', shapeData: { legA: 600, legB: 600, corner: 'tl' } },
  { id: 'pax-100',        layer: 'furniture', category: 'Шкафы',    name: 'IKEA PAX 100×60',     width: 1000, depth: 600, symbol: 'rect' },
  { id: 'pax-150',        layer: 'furniture', category: 'Шкафы',    name: 'IKEA PAX 150×60',     width: 1500, depth: 600, symbol: 'rect' },
  { id: 'pax-200',        layer: 'furniture', category: 'Шкафы',    name: 'IKEA PAX 200×60',     width: 2000, depth: 600, symbol: 'rect' },

  // === Гостиная ===
  { id: 'sofa-2',      layer: 'furniture', category: 'Гостиная', name: 'Диван 2-местный',     width: 1800, depth: 900,  symbol: 'sofa-icon' },
  { id: 'sofa-3',      layer: 'furniture', category: 'Гостиная', name: 'Диван 3-местный',     width: 2200, depth: 950,  symbol: 'sofa-icon' },
  { id: 'sofa-large',  layer: 'furniture', category: 'Гостиная', name: 'Диван крупный 4м',    width: 4000, depth: 1100, symbol: 'sofa-icon' },
  { id: 'sofa-corner', layer: 'furniture', category: 'Гостиная', name: 'Угловой диван',       width: 2600, depth: 1700, symbol: 'l-sofa', hint: 'Поверни через свойство «Угол»' },
  { id: 'sofa-corner-l', layer:'furniture', category: 'Гостиная', name: 'Угловой диван XL',    width: 3200, depth: 2200, symbol: 'l-sofa' },
  { id: 'sofa-modular', layer:'furniture', category: 'Гостиная', name: 'Модульный диван',     width: 3500, depth: 1000, symbol: 'sofa-icon' },
  { id: 'armchair',    layer: 'furniture', category: 'Гостиная', name: 'Кресло',              width: 850,  depth: 850,  symbol: 'chair-icon' },
  { id: 'armchair-rocker', layer: 'furniture', category: 'Гостиная', name: 'Кресло-качалка',  width: 800,  depth: 950,  symbol: 'chair-icon' },
  { id: 'recliner',    layer: 'furniture', category: 'Гостиная', name: 'Кресло-реклайнер',   width: 900,  depth: 1000, symbol: 'chair-icon' },
  { id: 'tv-stand',    layer: 'furniture', category: 'Гостиная', name: 'ТВ-тумба',            width: 1600, depth: 400,  symbol: 'rect' },
  { id: 'tv-stand-2',  layer: 'furniture', category: 'Гостиная', name: 'ТВ-тумба 2м',         width: 2000, depth: 400,  symbol: 'rect' },
  { id: 'coffee-table',layer: 'furniture', category: 'Гостиная', name: 'Журнальный стол',     width: 1100, depth: 600,  symbol: 'table-icon' },
  { id: 'coffee-round',layer: 'furniture', category: 'Гостиная', name: 'Журнальный круглый',  width: 800,  depth: 800,  symbol: 'circle' },
  { id: 'side-table',  layer: 'furniture', category: 'Гостиная', name: 'Приставной столик',   width: 500,  depth: 500,  symbol: 'rect' },
  { id: 'round-table', layer: 'furniture', category: 'Гостиная', name: 'Круглый стол',        width: 1100, depth: 1100, symbol: 'circle' },
  { id: 'bookshelf',   layer: 'furniture', category: 'Гостиная', name: 'Стеллаж 800',         width: 800,  depth: 350,  symbol: 'rect' },
  { id: 'bookshelf-wide', layer: 'furniture', category: 'Гостиная', name: 'Стеллаж 1.2м',     width: 1200, depth: 350,  symbol: 'rect' },
  { id: 'sideboard',   layer: 'furniture', category: 'Гостиная', name: 'Сервант / тумба-витрина', width: 1600, depth: 450, symbol: 'rect' },

  // === Кабинет ===
  { id: 'desk-120',    layer: 'furniture', category: 'Кабинет',  name: 'Письменный стол 1.2м',  width: 1200, depth: 600, symbol: 'table-icon' },
  { id: 'desk-140',    layer: 'furniture', category: 'Кабинет',  name: 'Письменный стол 1.4м',  width: 1400, depth: 600, symbol: 'table-icon' },
  { id: 'desk-160',    layer: 'furniture', category: 'Кабинет',  name: 'Письменный стол 1.6м',  width: 1600, depth: 700, symbol: 'table-icon' },
  { id: 'desk-180',    layer: 'furniture', category: 'Кабинет',  name: 'Письменный стол 1.8м',  width: 1800, depth: 800, symbol: 'table-icon' },
  { id: 'desk-l',      layer: 'furniture', category: 'Кабинет',  name: 'Угловой стол',          width: 1600, depth: 1600,symbol: 'l-shape', shapeData: { legA: 700, legB: 700, corner: 'bl' } },
  { id: 'desk-standing',layer:'furniture', category: 'Кабинет',  name: 'Стол-трансформер',     width: 1400, depth: 700, symbol: 'table-icon', hint: 'Регулируется по высоте' },
  { id: 'office-chair',layer: 'furniture', category: 'Кабинет',  name: 'Офисное кресло',        width: 600,  depth: 600, symbol: 'circle' },
  { id: 'office-chair-exec', layer:'furniture', category:'Кабинет', name:'Кресло руководителя', width: 700, depth: 700, symbol: 'circle' },
  { id: 'filing-cab',  layer: 'furniture', category: 'Кабинет',  name: 'Архивный шкаф',         width: 800,  depth: 400, symbol: 'rect' },
  { id: 'whiteboard',  layer: 'furniture', category: 'Кабинет',  name: 'Маркерная доска',       width: 1500, depth: 50,  symbol: 'rect' },

  // === Кухня ===
  { id: 'dining-table-2', layer: 'furniture', category: 'Кухня',    name: 'Стол на 2',         width: 800,  depth: 800,  symbol: 'table-icon' },
  { id: 'dining-table-4', layer: 'furniture', category: 'Кухня',    name: 'Стол на 4',         width: 1200, depth: 800,  symbol: 'table-icon' },
  { id: 'dining-table-6', layer: 'furniture', category: 'Кухня',    name: 'Стол на 6',         width: 1600, depth: 900,  symbol: 'table-icon' },
  { id: 'dining-table-8', layer: 'furniture', category: 'Кухня',    name: 'Стол на 8',         width: 2200, depth: 1000, symbol: 'table-icon' },
  { id: 'dining-round-4', layer: 'furniture', category: 'Кухня',    name: 'Круглый стол на 4',  width: 1100, depth: 1100, symbol: 'circle' },
  { id: 'dining-round-6', layer: 'furniture', category: 'Кухня',    name: 'Круглый стол на 6',  width: 1400, depth: 1400, symbol: 'circle' },
  { id: 'bar-table',      layer: 'furniture', category: 'Кухня',    name: 'Барная стойка',     width: 1800, depth: 400,  symbol: 'rect', hint: 'Высокая барная стойка' },
  { id: 'bar-island',     layer: 'furniture', category: 'Кухня',    name: 'Кухонный остров',   width: 2000, depth: 1000, symbol: 'rect' },
  { id: 'chair',          layer: 'furniture', category: 'Кухня',    name: 'Стул',              width: 450,  depth: 450,  symbol: 'chair-icon' },
  { id: 'chair-bar',      layer: 'furniture', category: 'Кухня',    name: 'Барный стул',       width: 400,  depth: 400,  symbol: 'circle' },
  { id: 'chair-folding',  layer: 'furniture', category: 'Кухня',    name: 'Складной стул',     width: 400,  depth: 400,  symbol: 'chair-icon' },

  { id: 'kitchen-cab-40', layer: 'furniture', category: 'Кух. модули', name: 'Кух. шкаф 400',  width: 400,  depth: 600,  symbol: 'rect' },
  { id: 'kitchen-cab-50', layer: 'furniture', category: 'Кух. модули', name: 'Кух. шкаф 500',  width: 500,  depth: 600,  symbol: 'rect' },
  { id: 'kitchen-cab-60', layer: 'furniture', category: 'Кух. модули', name: 'Кух. шкаф 600',  width: 600,  depth: 600,  symbol: 'rect' },
  { id: 'kitchen-cab-80', layer: 'furniture', category: 'Кух. модули', name: 'Кух. шкаф 800',  width: 800,  depth: 600,  symbol: 'rect' },
  { id: 'kitchen-cab-90', layer: 'furniture', category: 'Кух. модули', name: 'Кух. шкаф 900',  width: 900,  depth: 600,  symbol: 'rect' },
  { id: 'kitchen-cab-100',layer: 'furniture', category: 'Кух. модули', name: 'Кух. шкаф 1000', width: 1000, depth: 600,  symbol: 'rect' },
  { id: 'kitchen-corner', layer: 'furniture', category: 'Кух. модули', name: 'Кух. угловой',   width: 900,  depth: 900,  symbol: 'l-shape', shapeData: { legA: 600, legB: 600, corner: 'tl' } },
  { id: 'kitchen-pantry', layer: 'furniture', category: 'Кух. модули', name: 'Шкаф-пенал',     width: 600,  depth: 600,  symbol: 'rect' },

  // === Прихожая ===
  { id: 'shoe-rack',   layer: 'furniture', category: 'Прихожая', name: 'Обувница',             width: 800,  depth: 350, symbol: 'rect' },
  { id: 'shoe-rack-l', layer: 'furniture', category: 'Прихожая', name: 'Обувница 1.2м',        width: 1200, depth: 350, symbol: 'rect' },
  { id: 'coat-rack',   layer: 'furniture', category: 'Прихожая', name: 'Вешалка напольная',    width: 500,  depth: 500, symbol: 'circle' },
  { id: 'wall-hooks',  layer: 'furniture', category: 'Прихожая', name: 'Настенная вешалка',    width: 800,  depth: 80,  symbol: 'rect' },
  { id: 'entry-mirror',layer: 'furniture', category: 'Прихожая', name: 'Зеркало в прихожей',   width: 600,  depth: 50,  symbol: 'rect' },
  { id: 'entry-bench', layer: 'furniture', category: 'Прихожая', name: 'Банкетка прихожая',    width: 800,  depth: 400, symbol: 'rect' },
  { id: 'entry-set',   layer: 'furniture', category: 'Прихожая', name: 'Набор «прихожая»',     width: 1500, depth: 400, symbol: 'rect', hint: 'Шкаф + вешалка + обувница' },

  // === Детская ===
  { id: 'crib',           layer: 'furniture', category: 'Детская',  name: 'Детская кроватка',    width: 1200, depth: 600,  symbol: 'bed-icon' },
  { id: 'kid-bed',        layer: 'furniture', category: 'Детская',  name: 'Детская кровать 80×160', width: 800, depth: 1600, symbol: 'bed-icon' },
  { id: 'kid-desk',       layer: 'furniture', category: 'Детская',  name: 'Детский стол',         width: 1000, depth: 600,  symbol: 'table-icon' },
  { id: 'kid-chair',      layer: 'furniture', category: 'Детская',  name: 'Детский стул',         width: 400,  depth: 400,  symbol: 'chair-icon' },
  { id: 'changing-table', layer: 'furniture', category: 'Детская',  name: 'Пеленальный столик',   width: 800,  depth: 500,  symbol: 'rect' },
  { id: 'play-rug',       layer: 'furniture', category: 'Детская',  name: 'Игровой коврик',       width: 1500, depth: 1500, symbol: 'rect' },
];

const APPLIANCES: CatalogItem[] = [
  // === Холодильники ===
  { id: 'fridge-180',     layer: 'appliances', category: 'Холодильники', name: 'Холодильник 180см',  width: 600, depth: 650, symbol: 'rect', mountHeight: 100, hint: 'Розетка за/сбоку, вне мокрой зоны' },
  { id: 'fridge-200',     layer: 'appliances', category: 'Холодильники', name: 'Холодильник 200см',  width: 600, depth: 650, symbol: 'rect' },
  { id: 'fridge-narrow',  layer: 'appliances', category: 'Холодильники', name: 'Холодильник узкий 55', width: 550, depth: 600, symbol: 'rect' },
  { id: 'fridge-side',    layer: 'appliances', category: 'Холодильники', name: 'Side-by-Side',       width: 900, depth: 700, symbol: 'rect' },
  { id: 'fridge-french',  layer: 'appliances', category: 'Холодильники', name: 'French Door',        width: 900, depth: 700, symbol: 'rect' },
  { id: 'fridge-builtin', layer: 'appliances', category: 'Холодильники', name: 'Встраиваемый 540',   width: 540, depth: 545, symbol: 'rect' },
  { id: 'fridge-mini',    layer: 'appliances', category: 'Холодильники', name: 'Мини-холодильник',  width: 470, depth: 450, symbol: 'rect' },
  { id: 'wine-cooler',    layer: 'appliances', category: 'Холодильники', name: 'Винный шкаф',       width: 600, depth: 600, symbol: 'rect' },
  { id: 'freezer',        layer: 'appliances', category: 'Холодильники', name: 'Морозильник',       width: 600, depth: 650, symbol: 'rect' },

  // === Готовка ===
  { id: 'stove-gas-60',   layer: 'appliances', category: 'Готовка',  name: 'Плита газовая 60',   width: 600, depth: 600, symbol: 'rect' },
  { id: 'stove-gas-50',   layer: 'appliances', category: 'Готовка',  name: 'Плита газовая 50',   width: 500, depth: 600, symbol: 'rect' },
  { id: 'stove-electric', layer: 'appliances', category: 'Готовка',  name: 'Плита электрическая',width: 600, depth: 600, symbol: 'rect' },
  { id: 'cooktop-60',     layer: 'appliances', category: 'Готовка',  name: 'Варочная 60',        width: 600, depth: 520, symbol: 'rect', hint: 'Силовая 32A' },
  { id: 'cooktop-induc',  layer: 'appliances', category: 'Готовка',  name: 'Индукционная 60',    width: 600, depth: 520, symbol: 'rect', hint: 'Силовая 32A' },
  { id: 'cooktop-domino', layer: 'appliances', category: 'Готовка',  name: 'Domino 30',          width: 300, depth: 520, symbol: 'rect' },
  { id: 'cooktop-90',     layer: 'appliances', category: 'Готовка',  name: 'Варочная 90',        width: 900, depth: 520, symbol: 'rect' },
  { id: 'oven',           layer: 'appliances', category: 'Готовка',  name: 'Духовой шкаф 60',    width: 600, depth: 580, symbol: 'rect' },
  { id: 'oven-compact',   layer: 'appliances', category: 'Готовка',  name: 'Компактная духовка', width: 600, depth: 480, symbol: 'rect' },
  { id: 'microwave',      layer: 'appliances', category: 'Готовка',  name: 'Микроволновка',      width: 500, depth: 400, symbol: 'rect' },
  { id: 'microwave-60',   layer: 'appliances', category: 'Готовка',  name: 'Встр. СВЧ 60',       width: 600, depth: 350, symbol: 'rect' },
  { id: 'steam-oven',     layer: 'appliances', category: 'Готовка',  name: 'Пароварка',          width: 600, depth: 480, symbol: 'rect' },
  { id: 'hood',           layer: 'appliances', category: 'Готовка',  name: 'Вытяжка 60',         width: 600, depth: 500, symbol: 'rect', mountHeight: 1700 },
  { id: 'hood-90',        layer: 'appliances', category: 'Готовка',  name: 'Вытяжка 90',         width: 900, depth: 500, symbol: 'rect', mountHeight: 1700 },
  { id: 'hood-island',    layer: 'appliances', category: 'Готовка',  name: 'Островная вытяжка',  width: 900, depth: 600, symbol: 'rect', mountHeight: 1700 },

  // === Посудомойки + мойки ===
  { id: 'dishwasher-60',  layer: 'appliances', category: 'Посуда',  name: 'Посудомойка 60',     width: 600, depth: 600, symbol: 'rect' },
  { id: 'dishwasher-45',  layer: 'appliances', category: 'Посуда',  name: 'Посудомойка 45',     width: 450, depth: 600, symbol: 'rect' },
  { id: 'dishwasher-mini',layer: 'appliances', category: 'Посуда',  name: 'Настольная мойка',    width: 550, depth: 500, symbol: 'rect' },
  { id: 'kitchen-sink',   layer: 'appliances', category: 'Посуда',  name: 'Мойка одиночная',    width: 600, depth: 500, symbol: 'rect' },
  { id: 'kitchen-sink-2', layer: 'appliances', category: 'Посуда',  name: 'Мойка двойная',      width: 800, depth: 500, symbol: 'rect' },

  // === Стирка / сушка ===
  { id: 'washer',         layer: 'appliances', category: 'Стирка',  name: 'Стиральная 60×60',   width: 600, depth: 600, symbol: 'rect', hint: 'Розетка вне мокрой зоны, IP44+' },
  { id: 'washer-narrow',  layer: 'appliances', category: 'Стирка',  name: 'Стиральная узкая 45', width: 600, depth: 450, symbol: 'rect' },
  { id: 'washer-slim',    layer: 'appliances', category: 'Стирка',  name: 'Стиральная супер-узкая 35', width: 600, depth: 350, symbol: 'rect' },
  { id: 'washer-top',     layer: 'appliances', category: 'Стирка',  name: 'Стиральная вертикальная',  width: 400, depth: 600, symbol: 'rect', hint: 'Загрузка сверху' },
  { id: 'washer-dryer',   layer: 'appliances', category: 'Стирка',  name: 'Стиральная с сушкой',width: 600, depth: 600, symbol: 'rect' },
  { id: 'washer-bosch-6', layer: 'appliances', category: 'Стирка',  name: 'Bosch Serie 6 60×55',width: 600, depth: 550, symbol: 'rect' },
  { id: 'dryer',          layer: 'appliances', category: 'Стирка',  name: 'Сушильная машина',   width: 600, depth: 600, symbol: 'rect' },
  { id: 'iron-board',     layer: 'appliances', category: 'Стирка',  name: 'Гладильная доска',   width: 1300, depth: 400, symbol: 'rect' },

  // === Ванная (включая бойлер, фен, остальное) ===
  { id: 'water-heater-50',layer: 'appliances', category: 'Ванная',  name: 'Бойлер 50л',         width: 450, depth: 450, symbol: 'circle', mountHeight: 1800, wallMounted: true },
  { id: 'water-heater',   layer: 'appliances', category: 'Ванная',  name: 'Бойлер 80л',         width: 450, depth: 450, symbol: 'circle', mountHeight: 1800, wallMounted: true },
  { id: 'water-heater-100',layer:'appliances', category: 'Ванная',  name: 'Бойлер 100л',        width: 500, depth: 500, symbol: 'circle', mountHeight: 1800, wallMounted: true },
  { id: 'water-heater-flow',layer:'appliances',category: 'Ванная',  name: 'Проточный нагреватель', width: 250, depth: 100, symbol: 'rect', mountHeight: 1800, wallMounted: true },
  { id: 'hair-dryer',     layer: 'appliances', category: 'Ванная',  name: 'Фен',                width: 200, depth: 80,  symbol: 'rect' },

  // === ТВ + AV ===
  { id: 'tv-43',          layer: 'appliances', category: 'TV / AV', name: 'Телевизор 43"',      width: 970,  depth: 80, symbol: 'tv-icon', mountHeight: 1100, wallMounted: true },
  { id: 'tv-50',          layer: 'appliances', category: 'TV / AV', name: 'Телевизор 50"',      width: 1120, depth: 80, symbol: 'tv-icon', mountHeight: 1100, wallMounted: true },
  { id: 'tv-55',          layer: 'appliances', category: 'TV / AV', name: 'Телевизор 55"',      width: 1230, depth: 80, symbol: 'tv-icon', mountHeight: 1100, wallMounted: true },
  { id: 'tv-65',          layer: 'appliances', category: 'TV / AV', name: 'Телевизор 65"',      width: 1450, depth: 80, symbol: 'tv-icon', mountHeight: 1100, wallMounted: true },
  { id: 'tv-75',          layer: 'appliances', category: 'TV / AV', name: 'Телевизор 75"',      width: 1670, depth: 80, symbol: 'tv-icon', mountHeight: 1100, wallMounted: true },
  { id: 'projector',      layer: 'appliances', category: 'TV / AV', name: 'Проектор',           width: 350, depth: 250, symbol: 'rect', mountHeight: 2500 },
  { id: 'soundbar',       layer: 'appliances', category: 'TV / AV', name: 'Саундбар',           width: 1100, depth: 100, symbol: 'rect' },
  { id: 'speaker-stand',  layer: 'appliances', category: 'TV / AV', name: 'Колонка напольная', width: 250, depth: 300, symbol: 'rect' },
  { id: 'subwoofer',      layer: 'appliances', category: 'TV / AV', name: 'Сабвуфер',           width: 350, depth: 350, symbol: 'rect' },

  // === Климат ===
  { id: 'ac-indoor',      layer: 'appliances', category: 'Климат',  name: 'Кондиционер (внутр.)', width: 950, depth: 250, symbol: 'rect', mountHeight: 2400, hint: 'Розетка рядом, IP44', wallMounted: true },
  { id: 'ac-outdoor',     layer: 'appliances', category: 'Климат',  name: 'Кондиционер (внешн.)', width: 800, depth: 350, symbol: 'rect', hint: 'На балкон/фасад' },
  { id: 'breezer',        layer: 'appliances', category: 'Климат',  name: 'Бризер',             width: 600, depth: 200, symbol: 'breezer-icon', mountHeight: 2200, hint: 'Приточная вентиляция', wallMounted: true },
  { id: 'breezer-tion',   layer: 'appliances', category: 'Климат',  name: 'Бризер Tion 4S',     width: 567, depth: 252, symbol: 'breezer-icon', mountHeight: 2200, wallMounted: true },
  { id: 'air-purifier',   layer: 'appliances', category: 'Климат',  name: 'Очиститель воздуха', width: 400, depth: 400, symbol: 'circle' },
  { id: 'humidifier',     layer: 'appliances', category: 'Климат',  name: 'Увлажнитель',        width: 280, depth: 280, symbol: 'circle' },
  { id: 'fan-floor',      layer: 'appliances', category: 'Климат',  name: 'Вентилятор напольный', width: 450, depth: 450, symbol: 'circle' },
  { id: 'heater-oil',     layer: 'appliances', category: 'Климат',  name: 'Масляный обогреватель', width: 250, depth: 600, symbol: 'rect' },

  // === Малая техника ===
  { id: 'kettle',         layer: 'appliances', category: 'Малая техника', name: 'Чайник',         width: 220, depth: 200, symbol: 'circle' },
  { id: 'coffee-machine', layer: 'appliances', category: 'Малая техника', name: 'Кофемашина',     width: 300, depth: 450, symbol: 'rect' },
  { id: 'coffee-builtin', layer: 'appliances', category: 'Малая техника', name: 'Кофемашина встр.', width: 600, depth: 380, symbol: 'rect' },
  { id: 'toaster',        layer: 'appliances', category: 'Малая техника', name: 'Тостер',         width: 280, depth: 200, symbol: 'rect' },
  { id: 'blender',        layer: 'appliances', category: 'Малая техника', name: 'Блендер',        width: 200, depth: 200, symbol: 'circle' },
  { id: 'multicooker',    layer: 'appliances', category: 'Малая техника', name: 'Мультиварка',    width: 300, depth: 300, symbol: 'circle' },
  { id: 'aerogrill',      layer: 'appliances', category: 'Малая техника', name: 'Аэрогриль',      width: 350, depth: 350, symbol: 'circle' },

  // === Уборка ===
  { id: 'vacuum-robot',   layer: 'appliances', category: 'Уборка',  name: 'Робот-пылесос',     width: 350, depth: 350, symbol: 'circle' },
  { id: 'vacuum-stand',   layer: 'appliances', category: 'Уборка',  name: 'Беспроводной пылесос', width: 250, depth: 250, symbol: 'circle' },
  { id: 'vacuum-canister',layer: 'appliances', category: 'Уборка',  name: 'Пылесос с мешком',   width: 350, depth: 450, symbol: 'rect' },

  // === IT / Слаботочка ===
  { id: 'router',         layer: 'appliances', category: 'IT',      name: 'Wi-Fi роутер',       width: 250, depth: 200, symbol: 'rect' },
  { id: 'mesh-node',      layer: 'appliances', category: 'IT',      name: 'Mesh-узел',          width: 150, depth: 150, symbol: 'circle' },
  { id: 'nas',            layer: 'appliances', category: 'IT',      name: 'NAS / сервер',       width: 250, depth: 250, symbol: 'rect' },
  { id: 'shield',         layer: 'appliances', category: 'IT',      name: 'ТВ-приставка',       width: 200, depth: 100, symbol: 'rect' },
];

const PLUMBING: CatalogItem[] = [
  // === Ванны ===
  { id: 'bathtub-150',  layer: 'plumbing', category: 'Ванны',   name: 'Ванна 150×70',     width: 1500, depth: 700, symbol: 'rect' },
  { id: 'bathtub-160',  layer: 'plumbing', category: 'Ванны',   name: 'Ванна 160×70',     width: 1600, depth: 700, symbol: 'rect' },
  { id: 'bathtub-170',  layer: 'plumbing', category: 'Ванны',   name: 'Ванна 170×70',     width: 1700, depth: 700, symbol: 'rect' },
  { id: 'bathtub-180',  layer: 'plumbing', category: 'Ванны',   name: 'Ванна 180×80',     width: 1800, depth: 800, symbol: 'rect' },
  { id: 'bathtub-corner',layer:'plumbing', category: 'Ванны',   name: 'Угловая ванна',     width: 1500, depth: 1500, symbol: 'l-shape', shapeData: { legA: 700, legB: 700, corner: 'tl' } },
  { id: 'bathtub-asym', layer: 'plumbing', category: 'Ванны',   name: 'Асимметричная ванна', width: 1700, depth: 1100, symbol: 'rect' },
  { id: 'bathtub-free', layer: 'plumbing', category: 'Ванны',   name: 'Отдельностоящая ванна', width: 1700, depth: 800, symbol: 'rect' },

  // === Душевые ===
  { id: 'shower-80',    layer: 'plumbing', category: 'Душ',     name: 'Душ 80×80',        width: 800,  depth: 800, symbol: 'rect' },
  { id: 'shower-90',    layer: 'plumbing', category: 'Душ',     name: 'Душ 90×90',        width: 900,  depth: 900, symbol: 'rect' },
  { id: 'shower-100',   layer: 'plumbing', category: 'Душ',     name: 'Душ 100×100',      width: 1000, depth: 1000, symbol: 'rect' },
  { id: 'shower-120',   layer: 'plumbing', category: 'Душ',     name: 'Душ 120×80',       width: 1200, depth: 800, symbol: 'rect' },
  { id: 'shower-walk',  layer: 'plumbing', category: 'Душ',     name: 'Walk-In душ',      width: 1400, depth: 900, symbol: 'rect', hint: 'Без поддона, перегородка' },
  { id: 'shower-tray',  layer: 'plumbing', category: 'Душ',     name: 'Душевой поддон 90', width: 900,  depth: 900, symbol: 'rect' },

  // === Раковины ===
  { id: 'sink-bath',    layer: 'plumbing', category: 'Раковины', name: 'Раковина 600',    width: 600,  depth: 450, symbol: 'rect' },
  { id: 'sink-bath-50', layer: 'plumbing', category: 'Раковины', name: 'Раковина компакт 500', width: 500, depth: 400, symbol: 'rect' },
  { id: 'sink-bath-70', layer: 'plumbing', category: 'Раковины', name: 'Раковина широкая 700', width: 700, depth: 500, symbol: 'rect' },
  { id: 'sink-double',  layer: 'plumbing', category: 'Раковины', name: 'Двойная раковина 1.2м', width: 1200, depth: 500, symbol: 'rect' },
  { id: 'sink-overcounter', layer:'plumbing', category:'Раковины', name:'Накладная раковина',  width: 500, depth: 380, symbol: 'circle', hint: 'Чаша на тумбу' },
  { id: 'sink-corner',  layer: 'plumbing', category: 'Раковины', name: 'Угловая раковина',  width: 500, depth: 500, symbol: 'l-shape', shapeData: { legA: 200, legB: 200, corner: 'br' } },
  { id: 'sink-pedestal',layer: 'plumbing', category: 'Раковины', name: 'Раковина-тюльпан', width: 550, depth: 450, symbol: 'rect' },
  { id: 'sink-tank',    layer: 'plumbing', category: 'Раковины', name: 'Раковина-чаша',    width: 400, depth: 400, symbol: 'circle' },
  // === Раковина-стиралка (комбо: снизу стиралка, сверху плоская раковина) ===
  // Реальные размеры по производителям (Эстет, Domino, Кувшинка): шириной от 500
  // до 600 мм, глубина 200 — 600 мм. Раковина плоская (60–80 мм глубиной чаши)
  // и крепится прямо над стиральной машиной — экономит ~0.5 м² пола в маленьких
  // санузлах, частая практика в хрущёвках и студиях.
  { id: 'washer-sink-50',  layer: 'plumbing', category: 'Раковины', name: 'Раковина-стиралка 500×500', width: 500, depth: 500, symbol: 'washer-sink', hint: 'Снизу стиралка слим (35–45 см глубиной), сверху плоская раковина. Экономит место в малом санузле.' },
  { id: 'washer-sink-60',  layer: 'plumbing', category: 'Раковины', name: 'Раковина-стиралка 600×600', width: 600, depth: 600, symbol: 'washer-sink', hint: 'Стандарт под полноразмерную стиральную машину 60×60.' },
  { id: 'sink-cabinet-60', layer: 'plumbing', category: 'Раковины', name: 'Раковина с тумбой 600', width: 600, depth: 450, symbol: 'rect' },
  { id: 'sink-cabinet-80', layer: 'plumbing', category: 'Раковины', name: 'Раковина с тумбой 800', width: 800, depth: 480, symbol: 'rect' },

  // === Туалет / биде ===
  { id: 'toilet',           layer: 'plumbing', category: 'Туалет', name: 'Унитаз напольный', width: 400, depth: 700, symbol: 'rect' },
  { id: 'toilet-compact',   layer: 'plumbing', category: 'Туалет', name: 'Компакт-унитаз',   width: 360, depth: 650, symbol: 'rect' },
  { id: 'toilet-wall',      layer: 'plumbing', category: 'Туалет', name: 'Подвесной унитаз', width: 360, depth: 540, symbol: 'rect', wallMounted: true },
  { id: 'toilet-installed', layer: 'plumbing', category: 'Туалет', name: 'Инсталляция',     width: 500, depth: 200, symbol: 'rect', hint: 'Скрытая в стене конструкция' },
  { id: 'bidet',            layer: 'plumbing', category: 'Туалет', name: 'Биде',            width: 400, depth: 600, symbol: 'rect' },
  { id: 'urinal',           layer: 'plumbing', category: 'Туалет', name: 'Писсуар',         width: 350, depth: 300, symbol: 'rect', wallMounted: true },

  // === Полотенцесушители + аксессуары ===
  { id: 'towel-rail-50',  layer: 'plumbing', category: 'Аксессуары', name: 'Полотенцесушитель 500', width: 500, depth: 80,  symbol: 'rect', mountHeight: 1100, wallMounted: true },
  { id: 'towel-rail-60',  layer: 'plumbing', category: 'Аксессуары', name: 'Полотенцесушитель 600', width: 600, depth: 80,  symbol: 'rect', mountHeight: 1100, wallMounted: true },
  { id: 'towel-rail-el',  layer: 'plumbing', category: 'Аксессуары', name: 'Электрический полотенце.', width: 500, depth: 100, symbol: 'rect', mountHeight: 1100, wallMounted: true, hint: 'Розетка IP44 рядом' },
  { id: 'mirror-bath',    layer: 'plumbing', category: 'Аксессуары', name: 'Зеркало в ванной',   width: 700, depth: 30,  symbol: 'rect', mountHeight: 1300, wallMounted: true },
  { id: 'mirror-cabinet', layer: 'plumbing', category: 'Аксессуары', name: 'Зеркало-шкаф',       width: 800, depth: 150, symbol: 'rect', mountHeight: 1300, wallMounted: true },
  { id: 'tank-water',     layer: 'plumbing', category: 'Аксессуары', name: 'Бак для воды',       width: 400, depth: 400, symbol: 'circle' },
  { id: 'shower-glass',   layer: 'plumbing', category: 'Аксессуары', name: 'Стек. перегородка душа', width: 800, depth: 8, symbol: 'rect', hint: 'Стекло 8 мм' },

  // === Стояк ===
  { id: 'water-meter',    layer: 'plumbing', category: 'Стояк',   name: 'Водосчётчик',     width: 200, depth: 100, symbol: 'rect' },
  { id: 'riser',          layer: 'plumbing', category: 'Стояк',   name: 'Стояк ХВС/ГВС',   width: 150, depth: 150, symbol: 'circle' },
  { id: 'riser-sewer',    layer: 'plumbing', category: 'Стояк',   name: 'Канализационный стояк', width: 110, depth: 110, symbol: 'circle' },
  { id: 'collector',      layer: 'plumbing', category: 'Стояк',   name: 'Коллектор воды',   width: 350, depth: 200, symbol: 'rect' },
  { id: 'filter-water',   layer: 'plumbing', category: 'Стояк',   name: 'Магистральный фильтр', width: 250, depth: 200, symbol: 'rect' },
];

const SOCKETS: CatalogItem[] = [
  { id: 'socket-1',    layer: 'sockets', category: '220V',     name: 'Розетка одинарная',   width: 80,  depth: 80, symbol: 'socket', mountHeight: 300, hint: 'Стандарт 30 см от пола' },
  { id: 'socket-2',    layer: 'sockets', category: '220V',     name: 'Розетка двойная',     width: 160, depth: 80, symbol: 'socket', mountHeight: 300 },
  { id: 'socket-3',    layer: 'sockets', category: '220V',     name: 'Розетка тройная',     width: 240, depth: 80, symbol: 'socket', mountHeight: 300 },
  { id: 'socket-4',    layer: 'sockets', category: '220V',     name: 'Блок 4 розетки',      width: 320, depth: 80, symbol: 'socket', mountHeight: 300 },
  { id: 'socket-kitchen-block', layer: 'sockets', category: 'Кухня', name: 'Блок над столешницей (4)', width: 320, depth: 80, symbol: 'socket', mountHeight: 1100, hint: 'Над столешницей: 1.1м' },
  { id: 'socket-fridge', layer: 'sockets', category: 'Кухня',  name: 'Розетка холодильник', width: 80,  depth: 80, symbol: 'socket', mountHeight: 600 },
  { id: 'socket-stove',  layer: 'sockets', category: 'Кухня',  name: 'Силовая розетка 32A (плита)', width: 100, depth: 100, symbol: 'socket', mountHeight: 200, hint: 'Не ниже 20 см, отдельная линия' },
  { id: 'socket-washer', layer: 'sockets', category: 'Ванная', name: 'Розетка для стиральной (IP44)', width: 80, depth: 80, symbol: 'socket', mountHeight: 1000, hint: 'Только вне мокрой зоны' },
  { id: 'socket-floor',  layer: 'sockets', category: '220V',   name: 'Розетка в полу',      width: 100, depth: 100, symbol: 'socket', mountHeight: 0 },
  { id: 'socket-ac',     layer: 'sockets', category: 'Климат', name: 'Розетка для кондиц.', width: 80,  depth: 80, symbol: 'socket', mountHeight: 2400 },
  { id: 'socket-tv-block', layer: 'sockets', category: 'Гостиная', name: 'ТВ-блок (220+ТВ+RJ45)', width: 240, depth: 80, symbol: 'socket', mountHeight: 1100 },
];

const SWITCHES: CatalogItem[] = [
  { id: 'switch-1',     layer: 'switches', category: 'Свет', name: 'Выключатель 1кл',    width: 80,  depth: 80, symbol: 'switch', mountHeight: 900 },
  { id: 'switch-2',     layer: 'switches', category: 'Свет', name: 'Выключатель 2кл',    width: 80,  depth: 80, symbol: 'switch', mountHeight: 900 },
  { id: 'switch-3',     layer: 'switches', category: 'Свет', name: 'Выключатель 3кл',    width: 80,  depth: 80, symbol: 'switch', mountHeight: 900 },
  { id: 'switch-pass',  layer: 'switches', category: 'Свет', name: 'Проходной 1кл',      width: 80,  depth: 80, symbol: 'switch', mountHeight: 900, hint: 'Парой управляет одной группой из двух мест' },
  { id: 'switch-pass-2',layer: 'switches', category: 'Свет', name: 'Проходной 2кл',      width: 80,  depth: 80, symbol: 'switch', mountHeight: 900 },
  { id: 'dimmer',       layer: 'switches', category: 'Свет', name: 'Диммер',             width: 80,  depth: 80, symbol: 'dimmer', mountHeight: 900 },
  { id: 'motion-sensor',layer: 'switches', category: 'Свет', name: 'Датчик движения',    width: 70,  depth: 70, symbol: 'circle', mountHeight: 2200 },
  { id: 'thermostat',   layer: 'switches', category: 'Климат', name: 'Термостат тёплого пола', width: 80, depth: 80, symbol: 'thermostat', mountHeight: 900 },
];

const LIGHTS: CatalogItem[] = [
  // === Потолочные ===
  { id: 'ceiling-main',  layer: 'lights', category: 'Потолок',  name: 'Потолочная (люстра)',  width: 500,  depth: 500,  symbol: 'light',     mountHeight: 2700 },
  { id: 'ceiling-large', layer: 'lights', category: 'Потолок',  name: 'Большая люстра',       width: 800,  depth: 800,  symbol: 'light',     mountHeight: 2700 },
  { id: 'pendant',       layer: 'lights', category: 'Потолок',  name: 'Подвес',               width: 300,  depth: 300,  symbol: 'light',     mountHeight: 1900 },
  { id: 'pendant-cluster',layer: 'lights', category: 'Потолок', name: 'Подвесной кластер',    width: 800,  depth: 200,  symbol: 'light',     mountHeight: 1900 },
  { id: 'chandelier',    layer: 'lights', category: 'Потолок',  name: 'Люстра винтаж',        width: 700,  depth: 700,  symbol: 'light',     mountHeight: 2700 },
  { id: 'panel-led',     layer: 'lights', category: 'Потолок',  name: 'LED-панель 60×60',    width: 595,  depth: 595,  symbol: 'rect',      mountHeight: 2700 },
  { id: 'panel-led-1m',  layer: 'lights', category: 'Потолок',  name: 'LED-панель 1.2×0.3',  width: 1195, depth: 295,  symbol: 'rect',      mountHeight: 2700 },
  { id: 'spot',          layer: 'lights', category: 'Точечные', name: 'Спот круглый',         width: 90,   depth: 90,   symbol: 'spotlight', mountHeight: 2700 },
  { id: 'spot-square',   layer: 'lights', category: 'Точечные', name: 'Спот квадратный',      width: 90,   depth: 90,   symbol: 'spotlight', mountHeight: 2700 },
  { id: 'spot-cob',      layer: 'lights', category: 'Точечные', name: 'COB-светильник',       width: 80,   depth: 80,   symbol: 'spotlight', mountHeight: 2700 },
  { id: 'spot-rotating', layer: 'lights', category: 'Точечные', name: 'Поворотный спот',      width: 100,  depth: 100,  symbol: 'spotlight', mountHeight: 2700 },

  // === Трековые ===
  { id: 'track-1m',      layer: 'lights', category: 'Трековые', name: 'Трек 1м',              width: 1000, depth: 30,   symbol: 'rect',      mountHeight: 2700 },
  { id: 'track-2m',      layer: 'lights', category: 'Трековые', name: 'Трек 2м',              width: 2000, depth: 30,   symbol: 'rect',      mountHeight: 2700 },
  { id: 'track-3m',      layer: 'lights', category: 'Трековые', name: 'Трек 3м',              width: 3000, depth: 30,   symbol: 'rect',      mountHeight: 2700 },
  { id: 'track-spot',    layer: 'lights', category: 'Трековые', name: 'Трековый спот',        width: 60,   depth: 100,  symbol: 'spotlight', mountHeight: 2700 },

  // === LED ===
  { id: 'led-strip',         layer: 'lights', category: 'LED',     name: 'LED-лента 1м',         width: 1000, depth: 15,  symbol: 'rect',  mountHeight: 2700 },
  { id: 'led-strip-2',       layer: 'lights', category: 'LED',     name: 'LED-лента 2м',         width: 2000, depth: 15,  symbol: 'rect',  mountHeight: 2700 },
  { id: 'led-strip-rgb',     layer: 'lights', category: 'LED',     name: 'LED-лента RGB',        width: 1500, depth: 15,  symbol: 'rect',  mountHeight: 2700 },
  { id: 'led-cove',          layer: 'lights', category: 'LED',     name: 'Скрытая подсветка карниза', width: 2000, depth: 30, symbol: 'rect', mountHeight: 2700 },
  { id: 'kitchen-under',     layer: 'lights', category: 'Кухня',   name: 'Подсветка фартука',     width: 1000, depth: 30,  symbol: 'rect',  mountHeight: 1500 },
  { id: 'kitchen-under-2',   layer: 'lights', category: 'Кухня',   name: 'Подсветка фартука 2м',  width: 2000, depth: 30,  symbol: 'rect',  mountHeight: 1500 },

  // === Настенные ===
  { id: 'sconce',            layer: 'lights', category: 'Бра',     name: 'Бра',                  width: 250,  depth: 150, symbol: 'sconce', mountHeight: 1600, wallMounted: true },
  { id: 'sconce-cone',       layer: 'lights', category: 'Бра',     name: 'Бра-конус',            width: 200,  depth: 250, symbol: 'sconce', mountHeight: 1600, wallMounted: true },
  { id: 'sconce-double',     layer: 'lights', category: 'Бра',     name: 'Бра двойное',          width: 350,  depth: 200, symbol: 'sconce', mountHeight: 1600, wallMounted: true },
  { id: 'wall-reading',      layer: 'lights', category: 'Бра',     name: 'Настенный для чтения', width: 200,  depth: 350, symbol: 'sconce', mountHeight: 1500, wallMounted: true, hint: 'У изголовья кровати, на гибкой ножке' },
  { id: 'wall-gooseneck',    layer: 'lights', category: 'Бра',     name: 'Бра на гибкой ножке',  width: 150,  depth: 400, symbol: 'sconce', mountHeight: 1500, wallMounted: true, hint: 'Поворотная ножка, удобно у кровати или в кабинете' },
  { id: 'wall-mirror-light', layer: 'lights', category: 'Бра',     name: 'Подсветка зеркала',    width: 600,  depth: 80,  symbol: 'sconce', mountHeight: 1900, wallMounted: true, hint: 'Линейный над зеркалом в ванной (IP44+) или туалетным столиком' },
  { id: 'wall-picture',      layer: 'lights', category: 'Бра',     name: 'Подсветка картины',    width: 400,  depth: 100, symbol: 'sconce', mountHeight: 2000, wallMounted: true, hint: 'Узкий, направлен вниз — для подсветки картин/полок' },
  { id: 'wall-led-panel',    layer: 'lights', category: 'Бра',     name: 'Настенная LED-панель', width: 300,  depth: 300, symbol: 'sconce', mountHeight: 1700, wallMounted: true, hint: 'Накладная плоская панель — современный декоративный свет' },
  { id: 'wall-nightlight',   layer: 'lights', category: 'Бра',     name: 'Настенный ночник',     width: 80,   depth: 60,  symbol: 'sconce', mountHeight: 600,  wallMounted: true, hint: 'Низко у пола, тёплый рассеянный свет в коридоре/детской' },
  { id: 'wall-outdoor',      layer: 'lights', category: 'Бра',     name: 'Уличный фасадный',     width: 200,  depth: 150, symbol: 'sconce', mountHeight: 2400, wallMounted: true, hint: 'Балкон/прихожая снаружи (IP54+)' },

  // === Напольные / настольные ===
  { id: 'floor-lamp',        layer: 'lights', category: 'Напольные', name: 'Торшер',             width: 400,  depth: 400, symbol: 'circle', hint: 'Стандартный торшер с круглым основанием' },
  { id: 'floor-arc',         layer: 'lights', category: 'Напольные', name: 'Дуговой торшер',     width: 1500, depth: 400, symbol: 'rect', hint: 'Длинная дуга — лампа выносится в сторону от основания' },
  { id: 'floor-tripod',      layer: 'lights', category: 'Напольные', name: 'Торшер на треноге',  width: 600,  depth: 600, symbol: 'circle', hint: 'Тренога — устойчивый широкий торшер' },
  { id: 'floor-lamp-table',  layer: 'lights', category: 'Напольные', name: 'Торшер-тумба',       width: 500,  depth: 500, symbol: 'rect',   hint: 'Торшер с встроенной столешницей-тумбочкой (IKEA Lauters и подобные)' },
  { id: 'desk-lamp',         layer: 'lights', category: 'Настольные', name: 'Настольная лампа',  width: 200,  depth: 200, symbol: 'circle' },
  { id: 'desk-lamp-arch',    layer: 'lights', category: 'Настольные', name: 'Архитектурная лампа', width: 300, depth: 300, symbol: 'circle' },
  { id: 'reading-light',     layer: 'lights', category: 'Настольные', name: 'Лампа для чтения',  width: 150,  depth: 150, symbol: 'circle' },
  { id: 'led-night',         layer: 'lights', category: 'Настольные', name: 'Ночник',            width: 100,  depth: 100, symbol: 'circle' },

  // === Ванная (IP44+) ===
  { id: 'mirror-light',      layer: 'lights', category: 'Ванная',  name: 'Подсветка зеркала',    width: 600,  depth: 60,  symbol: 'rect', mountHeight: 1900, wallMounted: true, hint: 'IP44' },
  { id: 'bath-spot-ip44',    layer: 'lights', category: 'Ванная',  name: 'Спот IP44',            width: 90,   depth: 90,  symbol: 'spotlight', mountHeight: 2400, hint: 'Влагозащита для ванной' },
  { id: 'bath-ceiling-ip44', layer: 'lights', category: 'Ванная',  name: 'Потолочный IP44',      width: 350,  depth: 350, symbol: 'light', mountHeight: 2700 },

  // === Уличные / балкон ===
  { id: 'balcony-light',     layer: 'lights', category: 'Балкон',  name: 'Балконный светильник', width: 200, depth: 200, symbol: 'sconce', mountHeight: 2200, wallMounted: true, hint: 'IP44+' },

  // === Декор ===
  { id: 'neon-sign',         layer: 'lights', category: 'Декор',   name: 'Неоновая надпись',     width: 600,  depth: 30,  symbol: 'rect', wallMounted: true },
  { id: 'star-projector',    layer: 'lights', category: 'Декор',   name: 'Звёздный проектор',    width: 150,  depth: 150, symbol: 'circle' },
  { id: 'fan-light',         layer: 'lights', category: 'Потолок', name: 'Люстра-вентилятор',    width: 1200, depth: 1200, symbol: 'circle', mountHeight: 2700 },
];

const DATA: CatalogItem[] = [
  { id: 'rj45',     layer: 'data', category: 'Сеть',  name: 'RJ45 (интернет)', width: 80, depth: 80, symbol: 'rj45',     mountHeight: 300 },
  { id: 'tv-coax',  layer: 'data', category: 'TV',    name: 'ТВ-розетка',      width: 80, depth: 80, symbol: 'tv-socket',mountHeight: 1100 },
  { id: 'antenna',  layer: 'data', category: 'TV',    name: 'Антенный вход',    width: 80, depth: 80, symbol: 'antenna',  mountHeight: 1100 },
  { id: 'hdmi',     layer: 'data', category: 'AV',    name: 'HDMI-розетка',    width: 80, depth: 80, symbol: 'rj45',     mountHeight: 1100 },
];

const NOTES: CatalogItem[] = [
  { id: 'note',     layer: 'notes', category: 'Прочее', name: 'Заметка', width: 300, depth: 200, symbol: 'note' },
];

export const BUILTIN_CATALOG: CatalogGroup[] = [
  { layer: 'furniture',  title: 'Мебель',      items: FURNITURE },
  { layer: 'appliances', title: 'Техника',     items: APPLIANCES },
  { layer: 'plumbing',   title: 'Сантехника',  items: PLUMBING },
  { layer: 'sockets',    title: 'Розетки',     items: SOCKETS },
  { layer: 'switches',   title: 'Выключатели', items: SWITCHES },
  { layer: 'lights',     title: 'Свет',        items: LIGHTS },
  { layer: 'data',       title: 'Слаботочка',  items: DATA },
  { layer: 'notes',      title: 'Заметки',     items: NOTES },
];

// Пользовательские предметы (хранятся в localStorage)
const CUSTOM_LS_KEY = 'flat-custom-items-v1';

export function loadCustomItems(): CatalogItem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_LS_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw) as CatalogItem[];
    return Array.isArray(items) ? items.map((i) => ({ ...i, userTemplate: true })) : [];
  } catch { return []; }
}

export function saveCustomItems(items: CatalogItem[]) {
  localStorage.setItem(CUSTOM_LS_KEY, JSON.stringify(items));
}

export function addCustomItem(item: CatalogItem) {
  const items = loadCustomItems();
  saveCustomItems([...items.filter((i) => i.id !== item.id), { ...item, userTemplate: true }]);
}

export function removeCustomItem(id: string) {
  saveCustomItems(loadCustomItems().filter((i) => i.id !== id));
}

// Полный каталог = встроенный + пользовательские (отдельной группой)
export function getCatalog(): CatalogGroup[] {
  const custom = loadCustomItems();
  if (!custom.length) return BUILTIN_CATALOG;
  return [
    { layer: 'furniture' as LayerId, title: 'Мои предметы', items: custom },
    ...BUILTIN_CATALOG,
  ];
}

// Совместимость со старым импортом
export const CATALOG: CatalogGroup[] = BUILTIN_CATALOG;

export const findCatalog = (id: string): CatalogItem | undefined => {
  const all = [...BUILTIN_CATALOG.flatMap((g) => g.items), ...loadCustomItems()];
  return all.find((i) => i.id === id);
};

// Электрика — слои с маркерами (точки), мебель — с прямоугольниками
export const isMarker = (layer: LayerId) =>
  layer === 'sockets' || layer === 'switches' || layer === 'lights' ||
  layer === 'data' || layer === 'notes';
