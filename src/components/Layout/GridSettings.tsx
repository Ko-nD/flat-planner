import { useEffect, useRef, useState } from 'react';
import { useProject } from '../../store/projectStore';

const SNAP_OPTIONS: { value: number; label: string }[] = [
  { value: 0,   label: 'Без привязки' },
  { value: 10,  label: '1 см' },
  { value: 50,  label: '5 см' },
  { value: 100, label: '10 см' },
  { value: 200, label: '20 см' },
];

/**
 * Компактная кнопка-настройка для сетки и привязки. Заменяет два контрола в тулбаре
 * («# Сетка» + select со снапом) одной кнопкой, в которой видно текущее значение.
 * Клик по треугольнику открывает popover с чекбоксом сетки и radio-снапом.
 */
export function GridSettings() {
  const showGrid = useProject((s) => s.showGrid);
  const setShowGrid = useProject((s) => s.setShowGrid);
  const snapMm = useProject((s) => s.snapMm);
  const setSnapMm = useProject((s) => s.setSnapMm);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const snapLabel = SNAP_OPTIONS.find((o) => o.value === snapMm)?.label ?? `${snapMm}мм`;

  return (
    <div ref={ref} className="dropdown" style={{ position: 'relative' }}>
      <button
        className="btn btn--small"
        onClick={() => setOpen((v) => !v)}
        aria-pressed={open}
        title={`Сетка (G): ${showGrid ? 'вкл' : 'выкл'}. Привязка: ${snapLabel}.`}
      >
        # {showGrid ? snapLabel : 'выкл'} ▾
      </button>
      {open && (
        <div
          className="dropdown__menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: 'var(--bg-card)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.12)',
            minWidth: 200,
            zIndex: 100,
            padding: 8,
          }}
        >
          <label
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 6px', cursor: 'pointer', fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Показать сетку <span className="kbd">G</span>
          </label>
          <div style={{ height: 1, background: 'var(--line-soft)', margin: '6px 0' }} />
          <div style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.5, padding: '2px 6px' }}>
            Привязка к шагу
          </div>
          {SNAP_OPTIONS.map((o) => (
            <label
              key={o.value}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 6px', cursor: 'pointer', fontSize: 13,
                background: snapMm === o.value ? 'var(--bg-soft)' : 'transparent',
                borderRadius: 3,
              }}
            >
              <input
                type="radio"
                name="snap"
                checked={snapMm === o.value}
                onChange={() => setSnapMm(o.value)}
                style={{ cursor: 'pointer' }}
              />
              {o.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
