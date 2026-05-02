import { useEffect, useRef, useState } from 'react';
import { LayersPanel } from './LayersPanel';
import { Properties } from './Properties';

const LS_KEY = 'flat-side-panels-v1';

type PanelId = 'layers' | 'properties';

interface SideLayout {
  /** Какая панель сверху. */
  top: PanelId;
  /** Доля верхней панели (0..1). Нижняя получает остаток. */
  split: number;
}

const DEFAULT_LAYOUT: SideLayout = { top: 'layers', split: 0.55 };

function loadLayout(): SideLayout {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const parsed = JSON.parse(raw) as Partial<SideLayout>;
    return {
      top: parsed.top === 'properties' ? 'properties' : 'layers',
      split: typeof parsed.split === 'number' ? Math.max(0.1, Math.min(0.9, parsed.split)) : DEFAULT_LAYOUT.split,
    };
  } catch { return DEFAULT_LAYOUT; }
}

function renderPanel(id: PanelId) {
  return id === 'layers' ? <LayersPanel /> : <Properties />;
}

export function SidePanels() {
  const [layout, setLayout] = useState<SideLayout>(() => loadLayout());
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Сохраняем при каждом изменении (split / top)
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(layout)); } catch {}
  }, [layout]);

  // Mouse-перетаскивание разделителя
  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Точка курсора по Y относительно контейнера → доля верхней панели
      const fraction = (e.clientY - rect.top) / rect.height;
      setLayout((s) => ({ ...s, split: Math.max(0.1, Math.min(0.9, fraction)) }));
    };
    const up = () => setDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragging]);

  const swap = () => setLayout((s) => ({ ...s, top: s.top === 'layers' ? 'properties' : 'layers' }));
  const reset = () => setLayout((s) => ({ ...s, split: 0.5 }));
  const maxTop = () => setLayout((s) => ({ ...s, split: 0.85 }));
  const maxBottom = () => setLayout((s) => ({ ...s, split: 0.15 }));

  const topId: PanelId = layout.top;
  const bottomId: PanelId = layout.top === 'layers' ? 'properties' : 'layers';

  return (
    <div ref={containerRef} className="side-panels">
      <div className="side-slot" style={{ flex: `${layout.split} 1 0`, minHeight: 90 }}>
        {renderPanel(topId)}
      </div>
      <div
        className="side-splitter"
        onMouseDown={(e) => { e.preventDefault(); setDragging(true); }}
        onDoubleClick={reset}
        aria-pressed={dragging}
        title="Перетащи, чтобы изменить высоты панелей. Двойной клик — поделить пополам."
      >
        <span className="side-splitter__grip">⋯</span>
        <div className="side-splitter__actions">
          <button
            type="button"
            className="btn--ghost btn--small side-splitter__btn"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={maxTop}
            title="Развернуть верхнюю панель"
          >▲</button>
          <button
            type="button"
            className="btn--ghost btn--small side-splitter__btn"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={swap}
            title="Поменять панели местами"
          >⇅</button>
          <button
            type="button"
            className="btn--ghost btn--small side-splitter__btn"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={maxBottom}
            title="Развернуть нижнюю панель"
          >▼</button>
        </div>
      </div>
      <div className="side-slot" style={{ flex: `${1 - layout.split} 1 0`, minHeight: 90 }}>
        {renderPanel(bottomId)}
      </div>
    </div>
  );
}
