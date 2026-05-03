import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface MenuItem {
  label: string;
  icon?: string;
  onClick: () => void;
  title?: string;
  disabled?: boolean;
}

interface Props {
  trigger: ReactNode;
  triggerTitle?: string;
  items: (MenuItem | 'sep')[];
  align?: 'left' | 'right';
}

/**
 * Простой выпадающий popover. Меню рендерится через портал в document.body —
 * иначе toolbar c overflow-x:auto клипает popover, и он становится невидимым.
 */
export function DropdownMenu({ trigger, triggerTitle, items, align = 'left' }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      // align:left → выпадашка от левого края кнопки; right → от правого
      const left = align === 'right' ? r.right - 200 : r.left;
      setPos({ left, top: r.bottom + 4 });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, align]);

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
        padding: 4,
      }}
    >
      {items.map((it, i) =>
        it === 'sep' ? (
          <div key={i} style={{ height: 1, background: 'var(--line-soft)', margin: '4px 0' }} />
        ) : (
          <button
            key={i}
            onClick={() => { if (!it.disabled) { it.onClick(); setOpen(false); } }}
            disabled={it.disabled}
            title={it.title}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '6px 10px',
              background: 'transparent',
              border: 'none',
              borderRadius: 4,
              textAlign: 'left',
              color: it.disabled ? 'var(--ink-mute)' : 'var(--ink)',
              cursor: it.disabled ? 'not-allowed' : 'pointer',
              fontSize: 13,
            }}
            onMouseEnter={(e) => { if (!it.disabled) (e.currentTarget as HTMLElement).style.background = 'var(--bg-soft)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            {it.icon && <span style={{ width: 18, textAlign: 'center' }}>{it.icon}</span>}
            <span>{it.label}</span>
          </button>
        )
      )}
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
        title={triggerTitle}
      >
        {trigger}
      </button>
      {menu}
    </>
  );
}
