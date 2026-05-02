// Внутренний формат — миллиметры. Отображение пользователю — см/м.

const MM_PER_CM = 10;
const MM_PER_M = 1000;

// Размер мебели/расстояние: показываем в см без десятичных, либо в м с запятой если ≥ 1м
export const fmtSize = (mm: number, opts: { unit?: 'auto' | 'cm' | 'm' } = {}) => {
  const u = opts.unit ?? 'auto';
  if (u === 'cm' || (u === 'auto' && Math.abs(mm) < 1000)) {
    return `${Math.round(mm / MM_PER_CM)} см`;
  }
  return `${(mm / MM_PER_M).toFixed(2).replace('.', ',')} м`;
};

// Размер пары: «150×60 см» или «1,80×0,90 м»
export const fmtDims = (wMm: number, dMm: number) => {
  const useM = wMm >= 1000 || dMm >= 1000;
  if (useM) {
    return `${(wMm / 1000).toFixed(2).replace('.', ',')}×${(dMm / 1000).toFixed(2).replace('.', ',')} м`;
  }
  return `${Math.round(wMm / 10)}×${Math.round(dMm / 10)} см`;
};

// Площадь: 14,9 м²
export const fmtArea = (m2: number) => `${m2.toFixed(1).replace('.', ',')} м²`;

// Высота установки розетки/выключателя: «30 см» или «1,10 м»
export const fmtHeight = (mm: number | undefined) => {
  if (mm == null) return '';
  if (mm < 1000) return `${Math.round(mm / 10)} см`;
  return `${(mm / 1000).toFixed(2).replace('.', ',')} м`;
};

// Парсинг ввода пользователя: «150» (см) или «1.5м» / «1500мм»
export const parseSize = (input: string): number | null => {
  const s = input.trim().replace(',', '.').toLowerCase();
  if (!s) return null;
  let m = s.match(/^(-?\d+(?:\.\d+)?)\s*(мм|mm|см|cm|м|m)?$/);
  if (!m) return null;
  const val = parseFloat(m[1]);
  const unit = (m[2] ?? '').replace(/m{2}|cm|m/i, (u) => u.toLowerCase());
  if (unit === 'мм' || unit === 'mm') return val;
  if (unit === 'м' || unit === 'm') return val * 1000;
  // По умолчанию см
  return val * 10;
};
