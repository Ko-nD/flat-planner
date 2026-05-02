import { useProject } from '../../store/projectStore';
import { fmtSize } from '../../utils/format';

export function Statusbar() {
  const tool = useProject((s) => s.tool);
  const placeCatalogId = useProject((s) => s.placeCatalogId);
  const objects = useProject((s) => s.objects);
  const selectedIds = useProject((s) => s.selectedIds);
  const view = useProject((s) => s.view);
  const measure = useProject((s) => s.measure);
  const templateLoaded = useProject((s) => s.templateLoaded);
  const templateError = useProject((s) => s.templateError);
  const meta = useProject((s) => s.meta);

  const measureDist = measure
    ? Math.hypot(measure.b.x - measure.a.x, measure.b.y - measure.a.y)
    : null;

  const updatedAtStr = meta.updatedAt
    ? new Date(meta.updatedAt).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
    : '—';

  return (
    <div className="statusbar">
      <span title="Источник: public/project.json">
        Шаблон: {templateError
          ? <strong style={{ color: 'var(--warn)' }}>ошибка</strong>
          : templateLoaded
            ? <strong style={{ color: 'var(--good)' }}>загружен</strong>
            : <strong style={{ color: 'var(--ink-mute)' }}>fallback</strong>}
      </span>
      {templateError && (<>
        <span className="sep">·</span>
        <span style={{ color: 'var(--warn)' }} title={templateError}>⚠ {templateError.slice(0, 60)}</span>
      </>)}
      <span className="sep">·</span>
      <span>Инструмент: <strong>
        {tool === 'select' && 'Выбор'}
        {tool === 'pan' && 'Пан'}
        {tool === 'measure' && 'Линейка'}
        {tool === 'place' && `Размещение${placeCatalogId ? ` — ${placeCatalogId}` : ''}`}
      </strong></span>
      <span className="sep">·</span>
      <span>Объектов: <strong>{objects.length}</strong></span>
      {selectedIds.length > 0 && (<>
        <span className="sep">·</span>
        <span>Выбрано: <strong>{selectedIds.length}</strong></span>
      </>)}
      {measureDist != null && (<>
        <span className="sep">·</span>
        <span>Линейка: <strong>{fmtSize(measureDist)}</strong></span>
      </>)}
      <span className="sep">·</span>
      <span>Масштаб: <strong>{(view.scale * 1000).toFixed(2)} px/см</strong></span>
      <span className="sep">·</span>
      <span title="Время последнего обновления проекта">Обновлено: <strong>{updatedAtStr}</strong></span>
      <span style={{ marginLeft: 'auto' }} className="muted">
        Подсказка: <span className="kbd">?</span> — все горячие клавиши
      </span>
    </div>
  );
}
