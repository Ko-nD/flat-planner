import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
 * Popover рендерится через портал в document.body — иначе toolbar c overflow-x:auto
 * клипает выпадашку и она не видна.
 */
export function GridSettings() {
  const showGrid = useProject((s) => s.showGrid);
  const setShowGrid = useProject((s) => s.setShowGrid);
  const snapMm = useProject((s) => s.snapMm);
  const setSnapMm = useProject((s) => s.setSnapMm);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Позиция popover-а — пересчитываем при открытии и при ресайзе/скролле окна
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      setPos({ left: r.left, top: r.bottom + 4 });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  // Закрытие по клику снаружи и по Esc
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
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

  const menu = (open && pos) ? createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        background: 'var(--bg-card)',
        border: '1px solid var(--line)',
        borderRadius: 6,
        boxShadow: '0 6px 18px rgba(0, 0, 0, 0.12)',
        minWidth: 200,
        zIndex: 1000,
        padding: 8,
      }}
    >
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', cursor: 'pointer', fontSize: 13 }}>
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
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        className="btn btn--small"
        onClick={() => setOpen((v) => !v)}
        aria-pressed={open}
        title={`Сетка (G): ${showGrid ? 'вкл' : 'выкл'}. Привязка: ${snapLabel}.`}
      >
        # {showGrid ? snapLabel : 'выкл'} ▾
      </button>
      {menu}
    </>
  );
}
