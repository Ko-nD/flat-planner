import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useProject } from '../../store/projectStore';

const SNAP_OPTIONS: { value: number; label: string }[] = [
  { value: 0,   label: 'Без' },
  { value: 10,  label: '1 см' },
  { value: 50,  label: '5 см' },
  { value: 100, label: '10 см' },
  { value: 200, label: '20 см' },
];

interface Props {
  hasObjects: boolean;
  onResetProject: () => void;
  onReloadTemplate: () => void;
}

/**
 * Объединённое меню «⚙ Настройки» — секция «Вид» (сетка + привязка) и секция
 * «Проект» (сброс, перечитать шаблон, показать обучение). Заменяет два
 * отдельных дропдауна (старые «# 5 см» и «⚙» в тулбаре).
 */
export function SettingsPopover({ hasObjects, onResetProject, onReloadTemplate }: Props) {
  const showGrid = useProject((s) => s.showGrid);
  const setShowGrid = useProject((s) => s.setShowGrid);
  const snapMm = useProject((s) => s.snapMm);
  const setSnapMm = useProject((s) => s.setSnapMm);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      // Открываем popover слева от кнопки (она в правой части тулбара)
      setPos({ left: r.right - 240, top: r.bottom + 4 });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

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

  const reset = () => {
    if (hasObjects && !confirm('Очистить все размещённые объекты? Это действие нельзя отменить.')) return;
    onResetProject();
    setOpen(false);
  };

  const reload = async () => {
    if (hasObjects && !confirm('Перечитать project.json с диска? Локальная расстановка будет очищена.')) return;
    onReloadTemplate();
    setOpen(false);
  };

  const showTutorial = () => {
    try { localStorage.removeItem('flat-tutorial-seen-v1'); } catch {}
    location.reload();
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase',
    letterSpacing: 0.5, padding: '6px 6px 4px', fontWeight: 700,
  };
  const itemRow: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '5px 6px', cursor: 'pointer', fontSize: 13,
    borderRadius: 4,
  };
  const actionBtn: React.CSSProperties = {
    ...itemRow,
    width: '100%',
    background: 'transparent',
    border: 'none',
    textAlign: 'left',
    color: 'var(--ink)',
  };

  const menu = (open && pos) ? createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: Math.max(8, pos.left),
        top: pos.top,
        background: 'var(--bg-card)',
        border: '1px solid var(--line)',
        borderRadius: 6,
        boxShadow: '0 6px 18px rgba(0, 0, 0, 0.12)',
        minWidth: 240,
        zIndex: 1000,
        padding: 4,
      }}
    >
      <div style={sectionTitle}>Вид</div>
      <label style={itemRow} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-soft)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
        <input
          type="checkbox"
          checked={showGrid}
          onChange={(e) => setShowGrid(e.target.checked)}
          style={{ cursor: 'pointer' }}
        />
        <span style={{ flex: 1 }}>Показать сетку</span>
        <span className="kbd">G</span>
      </label>
      <div style={{ ...sectionTitle, fontSize: 10, padding: '4px 6px 2px', textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: 'var(--ink-mute)' }}>
        Привязка к шагу
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, padding: '2px 6px 6px' }}>
        {SNAP_OPTIONS.map((o) => (
          <label
            key={o.value}
            style={{
              flex: '1 1 30%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '4px 6px', fontSize: 12, cursor: 'pointer',
              borderRadius: 4,
              border: '1px solid var(--line)',
              background: snapMm === o.value ? 'var(--accent)' : 'var(--bg-card)',
              color: snapMm === o.value ? '#fff' : 'var(--ink)',
              transition: 'background 0.1s',
            }}
          >
            <input
              type="radio"
              name="snap"
              checked={snapMm === o.value}
              onChange={() => setSnapMm(o.value)}
              style={{ display: 'none' }}
            />
            {o.label}
          </label>
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--line-soft)', margin: '4px 4px' }} />

      <div style={sectionTitle}>Проект</div>
      <button
        type="button"
        style={actionBtn}
        onClick={reset}
        title="Очистить расстановку и вернуть последний загруженный шаблон"
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-soft)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ width: 18, textAlign: 'center' }}>↺</span>
        <span>Сброс расстановки</span>
      </button>
      <button
        type="button"
        style={actionBtn}
        onClick={reload}
        title="Очистить localStorage и заново загрузить public/project.json (no-cache)"
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-soft)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ width: 18, textAlign: 'center' }}>↻</span>
        <span>Перечитать project.json</span>
      </button>
      <button
        type="button"
        style={actionBtn}
        onClick={showTutorial}
        title="Сбросить флаг и заново показать обучение при перезагрузке"
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-soft)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ width: 18, textAlign: 'center' }}>📖</span>
        <span>Показать обучение снова</span>
      </button>
    </div>,
    document.body,
  ) : null;

  // Текущий шаг привязки на самой кнопке — чтобы не лезть в popover каждый раз
  const snapShort = SNAP_OPTIONS.find((o) => o.value === snapMm)?.label;
  const titleText = `Настройки: сетка ${showGrid ? 'вкл' : 'выкл'}, привязка ${snapShort}. Сброс / перечитать / обучение.`;

  return (
    <>
      <button
        ref={btnRef}
        className="btn btn--small"
        onClick={() => setOpen((v) => !v)}
        aria-pressed={open}
        title={titleText}
      >
        ⚙ {showGrid ? snapShort : '·'} ▾
      </button>
      {menu}
    </>
  );
}
