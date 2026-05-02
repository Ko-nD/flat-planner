import { useEffect, useRef, useState, type ReactNode } from 'react';

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
 * Простой выпадающий popover-меню. Не зависит от внешних библиотек, закрывается
 * по клику снаружи или Esc. Используется в тулбаре, чтобы свернуть длинные группы
 * (Экспорт, Сервис) в одну кнопку.
 */
export function DropdownMenu({ trigger, triggerTitle, items, align = 'left' }: Props) {
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

  return (
    <div ref={ref} className="dropdown" style={{ position: 'relative' }}>
      <button
        className="btn btn--small"
        onClick={() => setOpen((v) => !v)}
        aria-pressed={open}
        title={triggerTitle}
      >
        {trigger}
      </button>
      {open && (
        <div
          className="dropdown__menu"
          style={{
            position: 'absolute',
            top: '100%',
            [align]: 0,
            marginTop: 4,
            background: 'var(--bg-card)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.12)',
            minWidth: 200,
            zIndex: 100,
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
        </div>
      )}
    </div>
  );
}
