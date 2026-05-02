// Готовые шаблоны квартир: загружаются через диалог «Новый проект».
// Каждый шаблон — самодостаточный ProjectData (геометрия + пустая расстановка).

import type { ProjectData } from '../types';

const layerVisibility = {
  walls: true, doors: true, windows: true, labels: true,
  furniture: true, appliances: true, sockets: true,
  switches: true, lights: true, data: true, plumbing: true, notes: true,
};

// === Студия 30 м² (со скошенной стеной санузла) ===
const STUDIO_30: ProjectData = {
  version: '1.0',
  meta: {
    name: 'Студия 30 м²',
    totalArea: 29.7, livingArea: 23.9, auxArea: 5.8,
    notes: 'Студия со скошенной стеной санузла — демонстрирует двери на диагональных стенах.',
    updatedAt: Date.now(),
  },
  geometry: {
    bounds: { width: 5400, height: 5500 },
    rooms: [
      { id: 'main',  name: 'Жилая зона', kind: 'living', area: 23.9, polygon: [
        { x: 1200, y: 0 }, { x: 3500, y: 0 }, { x: 3500, y: 1700 },
        { x: 4200, y: 2200 }, { x: 5400, y: 2200 },
        { x: 5400, y: 5500 }, { x: 0, y: 5500 },
        { x: 0, y: 1500 }, { x: 1200, y: 1500 },
      ] },
      { id: 'entry', name: 'Прихожая', kind: 'hall', area: 1.8, polygon: [
        { x: 0, y: 0 }, { x: 1200, y: 0 }, { x: 1200, y: 1500 }, { x: 0, y: 1500 },
      ] },
      { id: 'bath',  name: 'Санузел',  kind: 'bath', area: 4.0, polygon: [
        { x: 3500, y: 0 }, { x: 5400, y: 0 }, { x: 5400, y: 2200 },
        { x: 4200, y: 2200 }, { x: 3500, y: 1700 },
      ] },
    ],
    walls: [
      { id: 'ext-n', a: {x:0,y:0},       b: {x:5400,y:0},    thickness: 250, external: true },
      { id: 'ext-e', a: {x:5400,y:0},    b: {x:5400,y:5500}, thickness: 250, external: true },
      { id: 'ext-s', a: {x:5400,y:5500}, b: {x:0,y:5500},    thickness: 250, external: true },
      { id: 'ext-w', a: {x:0,y:5500},    b: {x:0,y:0},       thickness: 250, external: true },
      { id: 'w-entry-right',  a: {x:1200,y:0},    b: {x:1200,y:1500}, thickness: 100 },
      { id: 'w-entry-bottom', a: {x:0,y:1500},    b: {x:1200,y:1500}, thickness: 100 },
      { id: 'w-bath-left',    a: {x:3500,y:0},    b: {x:3500,y:1700}, thickness: 100 },
      { id: 'w-bath-skew',    a: {x:3500,y:1700}, b: {x:4200,y:2200}, thickness: 100 },
      { id: 'w-bath-bottom',  a: {x:4200,y:2200}, b: {x:5400,y:2200}, thickness: 100 },
    ],
    openings: [
      { id: 'win-main', kind: 'window', wallId: 'ext-s', offset: 1500, width: 2400, sillHeight: 850, height: 1500, label: 'Окно' },
      { id: 'door-entry',      kind: 'door', wallId: 'ext-w',          offset: 4500, width: 900, swing: 'right', hingeSide: 'in',  label: 'Входная' },
      { id: 'door-entry-main', kind: 'door', wallId: 'w-entry-right',  offset: 700,  width: 800, swing: 'left',  hingeSide: 'out', label: 'В жилую' },
      { id: 'door-bath',       kind: 'door', wallId: 'w-bath-skew',    offset: 430,  width: 700, swing: 'left',  hingeSide: 'out', label: 'В санузел' },
    ],
  },
  objects: [],
  layerVisibility,
};

// === 1-комн 36 м² ===
const ONE_ROOM: ProjectData = {
  version: '1.0',
  meta: { name: '1-комн 36 м²', totalArea: 36.0, livingArea: 18.0, auxArea: 14.5, notes: '1-комнатная: спальня + кухня-гостиная + санузел + прихожая.', updatedAt: Date.now() },
  geometry: {
    bounds: { width: 6000, height: 6500 },
    rooms: [
      { id: 'r1',      name: 'Жилая комната', kind: 'living',  area: 18.0,
        polygon: [ { x: 0, y: 2500 }, { x: 4000, y: 2500 }, { x: 4000, y: 6500 }, { x: 0, y: 6500 } ] },
      { id: 'kitchen', name: 'Кухня-гостиная', kind: 'kitchen', area: 10.0,
        polygon: [ { x: 4000, y: 2500 }, { x: 6000, y: 2500 }, { x: 6000, y: 6500 }, { x: 4000, y: 6500 } ] },
      { id: 'bath',    name: 'Санузел', kind: 'bath', area: 4.0,
        polygon: [ { x: 1800, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 1700 }, { x: 1800, y: 1700 } ] },
      { id: 'entry',   name: 'Прихожая', kind: 'hall', area: 4.5,
        polygon: [ { x: 0, y: 0 }, { x: 1800, y: 0 }, { x: 1800, y: 2500 }, { x: 4000, y: 2500 }, { x: 0, y: 2500 } ] },
    ],
    walls: [
      { id: 'ext-n', a: {x:0,y:0},       b: {x:6000,y:0},    thickness: 250, external: true },
      { id: 'ext-e', a: {x:6000,y:0},    b: {x:6000,y:6500}, thickness: 250, external: true },
      { id: 'ext-s', a: {x:6000,y:6500}, b: {x:0,y:6500},    thickness: 250, external: true },
      { id: 'ext-w', a: {x:0,y:6500},    b: {x:0,y:0},       thickness: 250, external: true },
      { id: 'w-bath-bottom', a: {x:1800,y:1700}, b: {x:4000,y:1700}, thickness: 100 },
      { id: 'w-bath-left',   a: {x:1800,y:0},    b: {x:1800,y:1700}, thickness: 100 },
      { id: 'w-mid',         a: {x:0,   y:2500}, b: {x:6000,y:2500}, thickness: 100 },
      { id: 'w-kitchen-left',a: {x:4000,y:0},    b: {x:4000,y:6500}, thickness: 100 },
    ],
    openings: [
      { id: 'win-r1',      kind: 'window', wallId: 'ext-s', offset: 4000, width: 1500, sillHeight: 850, height: 1500, label: 'Окно (комната)' },
      { id: 'win-kitchen', kind: 'window', wallId: 'ext-s', offset: 1000, width: 1200, sillHeight: 850, height: 1500, label: 'Окно (кухня)' },
      { id: 'door-entry',   kind: 'door', wallId: 'ext-w', offset: 5500, width: 900, swing: 'right', hingeSide: 'in',  label: 'Входная' },
      { id: 'door-bath',    kind: 'door', wallId: 'w-bath-bottom', offset: 800, width: 700, swing: 'left',  hingeSide: 'out', label: 'В санузел' },
      { id: 'door-r1',      kind: 'door', wallId: 'w-mid',          offset: 1000, width: 800, swing: 'left',  hingeSide: 'out', label: 'В комнату' },
      { id: 'door-kitchen', kind: 'door', wallId: 'w-kitchen-left', offset: 3500, width: 800, swing: 'right', hingeSide: 'out', label: 'В кухню' },
    ],
  },
  objects: [],
  layerVisibility,
};

// === 2-комн 50 м² ===
const TWO_ROOM: ProjectData = {
  version: '1.0',
  meta: { name: '2-комн 50 м²', totalArea: 50.0, livingArea: 28.0, auxArea: 16.0, notes: '2-комнатная распашонка: спальня + гостиная + кухня + санузел + коридор.', updatedAt: Date.now() },
  geometry: {
    bounds: { width: 7500, height: 7000 },
    rooms: [
      { id: 'r1',      name: 'Спальня',  kind: 'living', area: 12.0,
        polygon: [ { x: 0, y: 0 }, { x: 3000, y: 0 }, { x: 3000, y: 4000 }, { x: 0, y: 4000 } ] },
      { id: 'r2',      name: 'Гостиная', kind: 'living', area: 16.0,
        polygon: [ { x: 3000, y: 0 }, { x: 7500, y: 0 }, { x: 7500, y: 3500 }, { x: 3000, y: 3500 } ] },
      { id: 'kitchen', name: 'Кухня',    kind: 'kitchen', area: 8.0,
        polygon: [ { x: 3000, y: 3500 }, { x: 5500, y: 3500 }, { x: 5500, y: 7000 }, { x: 3000, y: 7000 } ] },
      { id: 'bath',    name: 'Санузел',  kind: 'bath', area: 4.0,
        polygon: [ { x: 1500, y: 5300 }, { x: 3000, y: 5300 }, { x: 3000, y: 7000 }, { x: 1500, y: 7000 } ] },
      { id: 'hall',    name: 'Коридор',  kind: 'hall', area: 6.0,
        polygon: [ { x: 0, y: 4000 }, { x: 5500, y: 4000 },
                   { x: 5500, y: 7000 }, { x: 3000, y: 7000 }, { x: 3000, y: 5300 },
                   { x: 1500, y: 5300 }, { x: 1500, y: 7000 }, { x: 0, y: 7000 } ] },
    ],
    walls: [
      { id: 'ext-n', a: {x:0,y:0},       b: {x:7500,y:0},    thickness: 250, external: true },
      { id: 'ext-e', a: {x:7500,y:0},    b: {x:7500,y:7000}, thickness: 250, external: true },
      { id: 'ext-s', a: {x:7500,y:7000}, b: {x:0,y:7000},    thickness: 250, external: true },
      { id: 'ext-w', a: {x:0,y:7000},    b: {x:0,y:0},       thickness: 250, external: true },
      { id: 'w-r1-r2',     a: {x:3000,y:0},    b: {x:3000,y:4000}, thickness: 100 },
      { id: 'w-top-mid',   a: {x:0,   y:4000}, b: {x:5500,y:4000}, thickness: 100 },
      { id: 'w-r2-kit',    a: {x:3000,y:3500}, b: {x:7500,y:3500}, thickness: 100 },
      { id: 'w-kit-right', a: {x:5500,y:3500}, b: {x:5500,y:7000}, thickness: 100 },
      { id: 'w-bath-left', a: {x:1500,y:5300}, b: {x:1500,y:7000}, thickness: 100 },
      { id: 'w-bath-top',  a: {x:1500,y:5300}, b: {x:3000,y:5300}, thickness: 100 },
      { id: 'w-bath-right',a: {x:3000,y:5300}, b: {x:3000,y:7000}, thickness: 100 },
    ],
    openings: [
      { id: 'win-r1',      kind: 'window', wallId: 'ext-n', offset: 1500, width: 1500, sillHeight: 850, height: 1500, label: 'Окно (Спальня)' },
      { id: 'win-r2',      kind: 'window', wallId: 'ext-n', offset: 5500, width: 1500, sillHeight: 850, height: 1500, label: 'Окно (Гостиная)' },
      { id: 'win-kitchen', kind: 'window', wallId: 'ext-s', offset: 3000, width: 1200, sillHeight: 850, height: 1500, label: 'Окно (Кухня)' },
      { id: 'door-entry',   kind: 'door', wallId: 'ext-w',     offset: 1500, width: 900, swing: 'right', hingeSide: 'in',  label: 'Входная' },
      { id: 'door-r1',      kind: 'door', wallId: 'w-top-mid', offset: 1500, width: 800, swing: 'left',  hingeSide: 'out', label: 'В Спальню' },
      { id: 'door-r2',      kind: 'door', wallId: 'w-r2-kit',  offset: 1500, width: 800, swing: 'right', hingeSide: 'out', label: 'В Гостиную' },
      { id: 'door-kitchen', kind: 'door', wallId: 'w-top-mid', offset: 4500, width: 800, swing: 'left',  hingeSide: 'out', label: 'В Кухню' },
      { id: 'door-bath',    kind: 'door', wallId: 'w-bath-top', offset: 700, width: 700, swing: 'left',  hingeSide: 'out', label: 'В санузел' },
    ],
  },
  objects: [],
  layerVisibility,
};

// === 3-комн 60 м² ===
const THREE_ROOM: ProjectData = {
  version: '1.0',
  meta: { name: '3-комн 60 м²', totalArea: 60.0, livingArea: 40.0, auxArea: 18.0, notes: '3-комнатная: 3 жилые + кухня + санузел + коридор.', updatedAt: Date.now() },
  geometry: {
    bounds: { width: 8000, height: 8000 },
    rooms: [
      { id: 'r1',      name: 'Спальня 1', kind: 'living', area: 14.0,
        polygon: [ { x: 0, y: 0 }, { x: 3500, y: 0 }, { x: 3500, y: 4000 }, { x: 0, y: 4000 } ] },
      { id: 'r2',      name: 'Спальня 2', kind: 'living', area: 11.0,
        polygon: [ { x: 5000, y: 0 }, { x: 8000, y: 0 }, { x: 8000, y: 3700 }, { x: 5000, y: 3700 } ] },
      { id: 'r3',      name: 'Гостиная',  kind: 'living', area: 15.0,
        polygon: [ { x: 4000, y: 4000 }, { x: 8000, y: 4000 }, { x: 8000, y: 8000 }, { x: 4000, y: 8000 } ] },
      { id: 'kitchen', name: 'Кухня',     kind: 'kitchen', area: 9.0,
        polygon: [ { x: 0, y: 4500 }, { x: 4000, y: 4500 }, { x: 4000, y: 8000 }, { x: 0, y: 8000 } ] },
      { id: 'bath',    name: 'Санузел',   kind: 'bath',    area: 4.5,
        polygon: [ { x: 3500, y: 0 }, { x: 5000, y: 0 }, { x: 5000, y: 3000 }, { x: 3500, y: 3000 } ] },
      { id: 'hall',    name: 'Коридор',   kind: 'hall',    area: 6.5,
        polygon: [ { x: 0, y: 4000 }, { x: 4000, y: 4000 }, { x: 4000, y: 4500 }, { x: 0, y: 4500 },
                   { x: 3500, y: 3000 }, { x: 5000, y: 3000 }, { x: 5000, y: 3700 }, { x: 8000, y: 3700 }, { x: 8000, y: 4000 }, { x: 3500, y: 4000 } ] },
    ],
    walls: [
      { id: 'ext-n', a: {x:0,y:0},       b: {x:8000,y:0},    thickness: 250, external: true },
      { id: 'ext-e', a: {x:8000,y:0},    b: {x:8000,y:8000}, thickness: 250, external: true },
      { id: 'ext-s', a: {x:8000,y:8000}, b: {x:0,y:8000},    thickness: 250, external: true },
      { id: 'ext-w', a: {x:0,y:8000},    b: {x:0,y:0},       thickness: 250, external: true },
      { id: 'w-r1-bath',  a: {x:3500,y:0},    b: {x:3500,y:4000}, thickness: 100 },
      { id: 'w-bath-r2',  a: {x:5000,y:0},    b: {x:5000,y:3700}, thickness: 100 },
      { id: 'w-bath-bot', a: {x:3500,y:3000}, b: {x:5000,y:3000}, thickness: 100 },
      { id: 'w-r2-bot',   a: {x:5000,y:3700}, b: {x:8000,y:3700}, thickness: 100 },
      { id: 'w-r3-left',  a: {x:4000,y:4000}, b: {x:4000,y:8000}, thickness: 100 },
      { id: 'w-kit-top',  a: {x:0,   y:4500}, b: {x:4000,y:4500}, thickness: 100 },
      { id: 'w-hall-bot', a: {x:0,   y:4000}, b: {x:4000,y:4000}, thickness: 100 },
      { id: 'w-r3-top',   a: {x:4000,y:4000}, b: {x:8000,y:4000}, thickness: 100 },
    ],
    openings: [
      { id: 'win-r1', kind: 'window', wallId: 'ext-n', offset: 1700, width: 1500, sillHeight: 850, height: 1500, label: 'Окно (Сп.1)' },
      { id: 'win-r2', kind: 'window', wallId: 'ext-n', offset: 6500, width: 1500, sillHeight: 850, height: 1500, label: 'Окно (Сп.2)' },
      { id: 'win-r3', kind: 'window', wallId: 'ext-s', offset: 1500, width: 1500, sillHeight: 850, height: 1500, label: 'Окно (Гостиная)' },
      { id: 'win-kitchen', kind: 'window', wallId: 'ext-s', offset: 5500, width: 1500, sillHeight: 850, height: 1500, label: 'Окно (Кухня)' },
      { id: 'door-entry',   kind: 'door', wallId: 'ext-w',     offset: 3500, width: 900, swing: 'right', hingeSide: 'in',  label: 'Входная' },
      { id: 'door-r1',      kind: 'door', wallId: 'w-hall-bot', offset: 2500, width: 800, swing: 'left',  hingeSide: 'out', label: 'В Сп.1' },
      { id: 'door-r2',      kind: 'door', wallId: 'w-r2-bot',   offset: 1000, width: 800, swing: 'right', hingeSide: 'out', label: 'В Сп.2' },
      { id: 'door-r3',      kind: 'door', wallId: 'w-r3-top',   offset: 600,  width: 800, swing: 'left',  hingeSide: 'out', label: 'В Гостиную' },
      { id: 'door-kitchen', kind: 'door', wallId: 'w-kit-top',  offset: 1500, width: 800, swing: 'left',  hingeSide: 'out', label: 'В Кухню' },
      { id: 'door-bath',    kind: 'door', wallId: 'w-bath-bot', offset: 700,  width: 700, swing: 'left',  hingeSide: 'out', label: 'В санузел' },
    ],
  },
  objects: [],
  layerVisibility,
};

// === Пустая коробка 6×8 м (без внутренних стен) ===
const BLANK: ProjectData = {
  version: '1.0',
  meta: { name: 'Чистый план 6×8 м', totalArea: 48.0, livingArea: 0, auxArea: 0, notes: 'Пустая коробка. Добавляй стены и помещения через AI-патч или редактируя project.json.', updatedAt: Date.now() },
  geometry: {
    bounds: { width: 6000, height: 8000 },
    rooms: [
      { id: 'main', name: 'Без названия', kind: 'living', area: 48.0,
        polygon: [ { x: 0, y: 0 }, { x: 6000, y: 0 }, { x: 6000, y: 8000 }, { x: 0, y: 8000 } ] },
    ],
    walls: [
      { id: 'ext-n', a: {x:0,y:0},       b: {x:6000,y:0},    thickness: 250, external: true },
      { id: 'ext-e', a: {x:6000,y:0},    b: {x:6000,y:8000}, thickness: 250, external: true },
      { id: 'ext-s', a: {x:6000,y:8000}, b: {x:0,y:8000},    thickness: 250, external: true },
      { id: 'ext-w', a: {x:0,y:8000},    b: {x:0,y:0},       thickness: 250, external: true },
    ],
    openings: [
      { id: 'door-entry', kind: 'door', wallId: 'ext-w', offset: 4000, width: 900, swing: 'right', hingeSide: 'in', label: 'Входная' },
    ],
  },
  objects: [],
  layerVisibility,
};

export interface FlatTemplateMeta {
  id: string;
  title: string;
  subtitle: string;
  data: ProjectData;
}

export const FLAT_TEMPLATES: FlatTemplateMeta[] = [
  { id: 'studio-30',  title: 'Студия 30 м²',     subtitle: '5.4×5.5 · санузел со скосом',     data: STUDIO_30 },
  { id: '1-room-36',  title: '1-комн 36 м²',     subtitle: '6×6.5 · спальня + кухня + СУ',    data: ONE_ROOM },
  { id: '2-room-50',  title: '2-комн 50 м²',     subtitle: '7.5×7 · спальня + гост. + кух.',  data: TWO_ROOM },
  { id: '3-room-60',  title: '3-комн 60 м²',     subtitle: '8×8 · 3 жилые + кухня',           data: THREE_ROOM },
  { id: 'blank-6x8',  title: 'Чистый план 6×8',  subtitle: 'Без внутренних стен',             data: BLANK },
];
