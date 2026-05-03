// Размеры кроватей-трансформеров для двух состояний — «сложен» и «разложен».
// Цифры взяты по реальным каталогам российского рынка: Hoff, IKEA, Hettich,
// фабрика «Шкаф-кровать.рф» — это типовые размеры серийных моделей.

import type { CatalogSymbol } from '../types';

export interface TransformerDims {
  /** Габариты в собранном состоянии (только корпус-фасад). */
  closed: { width: number; depth: number };
  /** Габариты в разложенном состоянии (с выехавшей кроватью). */
  open: { width: number; depth: number };
  /** Толщина «корпуса» — той части, что остаётся у стены при открытии. */
  cabinetThickness: number;
}

/**
 * Размеры по типу трансформера. depth = расстояние от стены до края конструкции;
 * у вертикальной кровати-шкафа depth почти не меняется по ширине, у горизонтальной — наоборот.
 */
export const TRANSFORMER_DIMS: Partial<Record<CatalogSymbol, TransformerDims>> = {
  // Вертикальная Murphy bed: спальное 1600×2000, корпус 1700×450 (рама 50 мм с каждой стороны)
  'transformer-bed-v': {
    closed: { width: 1700, depth: 450 },
    open:   { width: 1700, depth: 2200 }, // 2000 мм мата + 200 мм фурнитура у изголовья
    cabinetThickness: 450,
  },
  // Горизонтальная Murphy: тот же мат 1600×2000, но кровать выезжает боком.
  // Корпус 2200 (длина мата + рама) × 450, разложенный — 2200 × 1700.
  'transformer-bed-h': {
    closed: { width: 2200, depth: 450 },
    open:   { width: 2200, depth: 1700 },
    cabinetThickness: 450,
  },
  // Кровать-шкаф (с пенального типа): корпус глубже 600 мм (полки/штанга),
  // спальное 1600×2000.
  'transformer-bed-cabinet': {
    closed: { width: 1800, depth: 600 },
    open:   { width: 1800, depth: 2200 },
    cabinetThickness: 600,
  },
  // Диван-кровать (еврокнижка): сложен 2000×950 (диван), разложен 2000×2000.
  'transformer-sofa-bed': {
    closed: { width: 2000, depth: 950 },
    open:   { width: 2000, depth: 2000 },
    cabinetThickness: 950,
  },
};

export function isTransformerSymbol(s: CatalogSymbol | undefined): boolean {
  return !!s && s in TRANSFORMER_DIMS;
}
