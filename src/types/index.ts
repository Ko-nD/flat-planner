// Все размеры в миллиметрах. Координаты — от верхнего-левого угла квартиры.

export type LayerId =
  | 'walls'
  | 'doors'
  | 'windows'
  | 'labels'
  | 'furniture'
  | 'appliances'
  | 'sockets'
  | 'switches'
  | 'lights'
  | 'data'
  | 'plumbing'
  | 'notes';

export type ObjectKind = LayerId;

export interface Vec2 {
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  // Ось стены — линия от a до b. Толщина откладывается симметрично.
  a: Vec2;
  b: Vec2;
  thickness: number; // мм
  external?: boolean;
}

export interface Opening {
  id: string;
  kind: 'door' | 'window';
  wallId: string;
  // Расстояние от точки a по стене до центра проёма
  offset: number; // мм
  width: number; // мм
  // Для дверей: куда открывается
  swing?: 'left' | 'right' | 'sliding' | 'none';
  // 'in' — петли с внутренней стороны (по нормали стены), 'out' — с внешней
  hingeSide?: 'in' | 'out';
  sillHeight?: number; // высота от пола до низа окна, мм
  height?: number; // высота проёма, мм
  label?: string;
}

export interface Room {
  id: string;
  name: string;
  // Полигон — ряд точек по часовой стрелке (по внутренней границе)
  polygon: Vec2[];
  area: number; // м² (по экспликации)
  kind: 'living' | 'kitchen' | 'bath' | 'wc' | 'hall' | 'balcony';
  notes?: string;
}

export type CatalogSymbol =
  | 'rect' | 'circle' | 'polygon' | 'l-shape'
  | 'l-sofa'
  | 'bed-icon' | 'sofa-icon' | 'table-icon' | 'chair-icon' | 'tv-icon' | 'breezer-icon'
  | 'transformer-bed-v' | 'transformer-bed-h' | 'transformer-bed-cabinet' | 'transformer-sofa-bed'
  | 'washer-sink'
  | 'socket' | 'switch' | 'light' | 'spotlight' | 'sconce'
  | 'tv-socket' | 'rj45' | 'antenna' | 'dimmer' | 'thermostat'
  | 'ac' | 'extract' | 'water' | 'drain' | 'note';

// Угол L-формы (для углового дивана и других L-объектов)
export type LCorner = 'tl' | 'tr' | 'bl' | 'br';

// Дополнительные данные формы для polygon/l-shape пользовательских предметов
export interface ShapeData {
  // Для polygon: точки относительно центра объекта (мм)
  points?: Vec2[];
  // Для l-shape: толщина первой и второй «ноги» (мм)
  legA?: number;
  legB?: number;
  // Для l-shape: ориентация внутреннего угла
  corner?: LCorner;
}

export interface CatalogItem {
  id: string;
  layer: LayerId;
  category: string;
  name: string;
  // Габариты по умолчанию (мм)
  width: number;
  depth: number;
  // Иконка/символ
  symbol: CatalogSymbol;
  fill?: string;
  stroke?: string;
  // Высота установки (для электрики) от пола, мм
  mountHeight?: number;
  // Какие подсказки давать (например, "блок розеток")
  tags?: string[];
  // Описание
  hint?: string;
  // true для пользовательских предметов (хранятся отдельно, в localStorage)
  userTemplate?: boolean;
  // Данные для polygon/l-shape (только для соответствующих symbol)
  shapeData?: ShapeData;
  // Если true — при размещении объект «прилипает» к ближайшей стене и разворачивается вдоль неё
  wallMounted?: boolean;
}

export interface PlacedObject {
  id: string;
  catalogId: string;
  layer: LayerId;
  // Для l-sofa/l-shape: какой угол является «внутренним»
  corner?: LCorner;
  // Для произвольных форм — копия данных формы (чтобы не зависеть от каталога)
  shapeData?: ShapeData;
  // Позиция: для мебели — центр, для электрики — точка крепления
  x: number;
  y: number;
  rotation: number; // градусы
  width: number;
  depth: number;
  label?: string;
  notes?: string;
  mountHeight?: number;
  // Помещение, к которому объект приписан (для отчётов)
  roomId?: string;
  // Для трансформеров (кровать-шкаф и проч.): 'closed' — сложен, 'open' — разложен.
  // При смене состояния меняется внешний вид и фактический габарит (width/depth).
  state?: 'closed' | 'open';
}

// Текстовая «подпись двери» без дуги — для проёмов на диагональных стенах,
// где обычный DoorRenderer не справляется. Отрисовывается как маленькая метка.
export interface DoorMarker {
  id: string;
  x: number;
  y: number;
  rotation: number;       // град.
  label: string;
}

export interface ApartmentGeometry {
  // Габариты «холста» — полная коробка квартиры
  bounds: { width: number; height: number };
  walls: Wall[];
  openings: Opening[];
  rooms: Room[];
  // Балкон/лоджия отдельным полигоном
  balcony?: { polygon: Vec2[]; area: number; name: string };
  // Текстовые подписи дверей (для скошенных стен и т.п.)
  doorMarkers?: DoorMarker[];
}

export interface ProjectMeta {
  name: string;
  address?: string;
  totalArea: number;
  livingArea: number;
  auxArea: number;
  notes?: string;
  updatedAt: number;
}

export interface ProjectData {
  version: '1.0';
  meta: ProjectMeta;
  geometry: ApartmentGeometry;
  objects: PlacedObject[];
  layerVisibility: Record<LayerId, boolean>;
}

export interface Selection {
  objectIds: string[];
}
