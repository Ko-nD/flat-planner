import { useRef, useState } from 'react';
import { useProject, newObjectId } from '../../store/projectStore';
import { ALL_TEMPLATES, instantiateTemplate, type TemplateGroup } from '../../catalog/templates';
import { FLAT_TEMPLATES } from '../../templates/flatTemplates';
import { exportJsonFile, exportMarkdown } from '../../utils/export';
import { polygonCentroid } from '../../utils/geometry';
import type { ProjectData } from '../../types';
import { PatchDialog } from './PatchDialog';

interface Props {
  onExportPng: () => void;
  onExportPdf: () => void;
  onExportForGpt: () => void;
}

export function Toolbar({ onExportPng, onExportPdf, onExportForGpt }: Props) {
  const tool = useProject((s) => s.tool);
  const setTool = useProject((s) => s.setTool);
  const showGrid = useProject((s) => s.showGrid);
  const setShowGrid = useProject((s) => s.setShowGrid);
  const snapMm = useProject((s) => s.snapMm);
  const setSnapMm = useProject((s) => s.setSnapMm);
  const view = useProject((s) => s.view);
  const setView = useProject((s) => s.setView);
  const exportJson = useProject((s) => s.exportJson);
  const loadJson = useProject((s) => s.loadJson);
  const resetProject = useProject((s) => s.resetProject);
  const forceReloadTemplate = useProject((s) => s.forceReloadTemplate);
  const objects = useProject((s) => s.objects);
  const meta = useProject((s) => s.meta);
  const geometry = useProject((s) => s.geometry);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPatch, setShowPatch] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Fit с учётом поворота вида (rotation в градусах, кратно 90°)
  const fitView = (rotation: number) => {
    const stage = (window as any).__konvaStage;
    if (!stage) return;
    const sw = stage.width();
    const sh = stage.height();
    const padding = 80;
    // При повороте на 90° или 270° «логические» ширина и высота меняются местами
    const horizontal = rotation % 180 === 0;
    const planW = (horizontal ? geometry.bounds.width : geometry.bounds.height) + 500;
    const planH = (horizontal ? geometry.bounds.height : geometry.bounds.width) + 500;
    const sx = (sw - padding * 2) / planW;
    const sy = (sh - padding * 2) / planH;
    const scale = Math.min(sx, sy);
    // Центр экрана
    const cx = sw / 2;
    const cy = sh / 2;
    // Координаты центра квартиры в мировых единицах
    const wcx = geometry.bounds.width / 2;
    const wcy = geometry.bounds.height / 2;
    // С учётом rotation вычислим offset так, чтобы центр квартиры оказался в центре экрана
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    // Точка (wcx*scale, wcy*scale) после rotation (вокруг 0,0):
    const rx = wcx * scale * cos - wcy * scale * sin;
    const ry = wcx * scale * sin + wcy * scale * cos;
    setView({
      scale,
      rotation,
      offset: { x: cx - rx, y: cy - ry },
    });
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as ProjectData;
        if (!data.version || !data.geometry) throw new Error('Неверный формат');
        loadJson(data);
      } catch (e: any) {
        alert(`Не удалось загрузить: ${e.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="toolbar">
      <div className="tb-title">🏠 Планировщик квартиры</div>

      <div className="tb-group">
        <button className="btn btn--small" aria-pressed={tool === 'select'} onClick={() => setTool('select')} title="Выбор (V)">
          ▢ Выбор
        </button>
        <button className="btn btn--small" aria-pressed={tool === 'pan'} onClick={() => setTool('pan')} title="Панорамирование (H, или Space+drag)">
          ✋ Пан
        </button>
        <button className="btn btn--small" aria-pressed={tool === 'measure'} onClick={() => setTool(tool === 'measure' ? 'select' : 'measure')} title="Линейка (M)">
          📏 Линейка
        </button>
      </div>

      <div className="tb-group">
        <button className="btn btn--small" aria-pressed={showGrid} onClick={() => setShowGrid(!showGrid)} title="Сетка (G)">
          # Сетка
        </button>
        <select className="btn btn--small" value={snapMm} onChange={(e) => setSnapMm(parseInt(e.target.value, 10))} title="Привязка к шагу">
          <option value={0}>Без привязки</option>
          <option value={10}>1 см</option>
          <option value={50}>5 см</option>
          <option value={100}>10 см</option>
          <option value={200}>20 см</option>
        </select>
      </div>

      <div className="tb-group">
        <button className="btn btn--small" onClick={() => setView({ scale: Math.min(0.6, view.scale * 1.2) })} title="Приблизить">＋</button>
        <button className="btn btn--small" onClick={() => setView({ scale: Math.max(0.005, view.scale / 1.2) })} title="Отдалить">－</button>
        <span style={{ minWidth: 50, textAlign: 'center', fontVariantNumeric: 'tabular-nums', color: 'var(--ink-soft)' }}>
          {Math.round(view.scale * 100 * 10)}%
        </span>
        <button className="btn btn--small" onClick={() => fitView(view.rotation)} title="Подогнать вид (Fit)">⤢ Fit</button>
        <button className="btn btn--small" onClick={() => {
          const next = ((view.rotation + 90) % 360 + 360) % 360;
          fitView(next);
        }} title="Повернуть весь план на 90°">↻ 90°</button>
      </div>

      <div className="tb-group">
        <button className="btn btn--small" onClick={() => setShowTemplates(true)} title="Готовые шаблоны электрики">
          ⚡ Шаблоны
        </button>
        <button className="btn btn--small" onClick={() => setShowPatch(true)} title="Применить JSON-патч от GPT (add/move/delete object, replace polygon, replace/remove wall, remove opening...)">
          ⇩ GPT-патч
        </button>
      </div>

      <div className="tb-spacer" />

      <div className="tb-group">
        <button className="btn btn--small btn--accent" onClick={onExportForGpt} title="Скачать пакет: PNG плана + JSON + Markdown — для отправки в GPT">
          📤 Для GPT
        </button>
        <button className="btn btn--small" onClick={onExportPng} title="Скачать PNG плана">PNG</button>
        <button className="btn btn--small" onClick={() => exportJsonFile(exportJson(), `${slug(meta.name)}.json`)} title="Скачать JSON-проект">JSON</button>
        <button className="btn btn--small" onClick={() => exportMarkdown(exportJson(), `${slug(meta.name)}.md`)} title="Скачать Markdown-описание">MD</button>
        <button className="btn btn--small" onClick={onExportPdf} title="Скачать PDF (A3, ландшафт)">PDF</button>
        <button className="btn btn--small" onClick={() => fileInputRef.current?.click()} title="Загрузить ранее сохранённый JSON-проект">↑ Загрузить</button>
        <input ref={fileInputRef} type="file" accept="application/json,.json" style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImport(f);
            e.target.value = '';
          }}
        />
      </div>

      <div className="tb-group">
        <button className="btn btn--small btn--accent" onClick={() => setShowNew(true)} title="Создать новый проект из готового шаблона (студия / 1-2-3 комн / blank)">
          ✨ Новый проект
        </button>
        <button className="btn btn--small" onClick={() => setShowHelp(true)} title="Горячие клавиши">?</button>
        <button className="btn btn--small" onClick={() => {
          if (objects.length && !confirm('Очистить все размещённые объекты? Это действие нельзя отменить.')) return;
          resetProject();
        }} title="Очистить расстановку и вернуть последний загруженный шаблон">Сброс</button>
        <button className="btn btn--small" onClick={async () => {
          if (objects.length && !confirm('Перечитать project.json с диска? Локальная расстановка будет очищена.')) return;
          await forceReloadTemplate();
        }} title="Очистить localStorage и заново загрузить public/project.json (no-cache)">↻ Шаблон</button>
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showTemplates && <TemplatesModal onClose={() => setShowTemplates(false)} />}
      {showPatch && <PatchDialog onClose={() => setShowPatch(false)} />}
      {showNew && (
        <NewProjectModal
          hasObjects={objects.length > 0}
          onClose={() => setShowNew(false)}
          onApply={(data) => { loadJson(data); setShowNew(false); }}
          onExportFirst={() => exportJsonFile(exportJson(), `${slug(meta.name)}-backup.json`)}
        />
      )}
    </div>
  );
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^а-яa-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'plan';
}

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">Горячие клавиши</div>
        <div className="modal-b">
          <div className="help-grid">
            <div><span>Колесо мыши</span><span className="kbd">Зум</span></div>
            <div><span>Space + drag</span><span className="kbd">Пан</span></div>
            <div><span>Средняя кнопка</span><span className="kbd">Пан</span></div>
            <div><span>Выделение</span><span className="kbd">V</span></div>
            <div><span>Линейка</span><span className="kbd">M</span></div>
            <div><span>Сетка вкл/выкл</span><span className="kbd">G</span></div>
            <div><span>Удалить выделенное</span><span className="kbd">Del</span></div>
            <div><span>Дублировать</span><span className="kbd">Ctrl+D</span></div>
            <div><span>Поворот +15°</span><span className="kbd">R</span></div>
            <div><span>Поворот −15°</span><span className="kbd">Shift+R</span></div>
            <div><span>Снять выделение</span><span className="kbd">Esc</span></div>
            <div><span>Shift при размещении</span><span>Не выходить из режима</span></div>
          </div>
          <div className="muted" style={{ marginTop: 12 }}>
            Все размеры внутри хранятся в миллиметрах для точности; в интерфейсе показываются в см / м.
          </div>
        </div>
        <div className="modal-f">
          <button className="btn" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}

function TemplatesModal({ onClose }: { onClose: () => void }) {
  const geometry = useProject((s) => s.geometry);
  const addManyObjects = useProject((s) => s.addManyObjects);
  const [chosenRoomId, setChosenRoomId] = useState<string>(geometry.rooms[0]?.id ?? '');

  const room = geometry.rooms.find((r) => r.id === chosenRoomId);

  const apply = (group: TemplateGroup) => {
    if (!room) return;
    const c = polygonCentroid(room.polygon);
    const objects = instantiateTemplate(group, c);
    // Назначим уникальные id заново
    const withIds = objects.map((o) => ({ ...o, id: newObjectId(), roomId: room.id }));
    addManyObjects(withIds);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ minWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">Готовые шаблоны электрики</div>
        <div className="modal-b">
          <div className="props-row" style={{ gridTemplateColumns: '120px 1fr' }}>
            <label>Помещение</label>
            <select value={chosenRoomId} onChange={(e) => setChosenRoomId(e.target.value)}>
              {geometry.rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <p className="muted" style={{ marginTop: 6 }}>
            Шаблон поставит группу объектов в центре выбранного помещения. Их потом можно перетащить и подкорректировать.
          </p>
          <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
            {ALL_TEMPLATES.map((g) => {
              const compatible = !g.forKind || g.forKind === room?.kind;
              return (
                <div key={g.id} style={{ padding: 10, border: '1px solid var(--line)', borderRadius: 6, background: compatible ? '#fff' : 'var(--bg-soft)', opacity: compatible ? 1 : 0.7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong>{g.title}</strong>
                    {!compatible && <span className="tag">подходит для {labelKind(g.forKind)}</span>}
                    <button className="btn btn--small btn--accent" style={{ marginLeft: 'auto' }} onClick={() => apply(g)}>Применить</button>
                  </div>
                  <div className="muted" style={{ marginTop: 4 }}>{g.description}</div>
                  <div className="muted" style={{ marginTop: 4, fontSize: 11 }}>
                    {g.items.length} объект{plural(g.items.length, 'а', 'ов')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="modal-f">
          <button className="btn" onClick={onClose}>Готово</button>
        </div>
      </div>
    </div>
  );
}

function labelKind(k?: string) {
  switch (k) {
    case 'living':  return 'жилых комнат';
    case 'kitchen': return 'кухни';
    case 'bath':    return 'ванной';
    case 'wc':      return 'туалета';
    case 'hall':    return 'коридора';
    default:        return 'любых помещений';
  }
}

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many;
}

function NewProjectModal({ hasObjects, onClose, onApply, onExportFirst }: {
  hasObjects: boolean;
  onClose: () => void;
  onApply: (data: ProjectData) => void;
  onExportFirst: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ minWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">Новый проект</div>
        <div className="modal-b">
          <p className="muted" style={{ margin: '0 0 10px' }}>
            Выбери шаблон. Текущая геометрия и расстановка будут заменены.
          </p>
          {hasObjects && (
            <div className="warning" style={{ marginBottom: 10 }}>
              ⚠ В текущем проекте есть размещённые объекты — они исчезнут.{' '}
              <button className="btn btn--small" style={{ marginLeft: 6 }} onClick={onExportFirst}>
                ⇩ Сохранить копию
              </button>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {FLAT_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  if (hasObjects && !confirm(`Заменить проект на «${t.title}»? Текущая расстановка будет потеряна.`)) return;
                  onApply(t.data);
                }}
                style={{
                  textAlign: 'left',
                  padding: 12,
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  background: 'var(--bg-card)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-soft)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)'; }}
              >
                <strong style={{ fontSize: 13 }}>{t.title}</strong>
                <span className="muted" style={{ fontSize: 11 }}>{t.subtitle}</span>
                <span className="muted" style={{ fontSize: 10 }}>
                  {t.data.geometry.rooms.length} помещений · {t.data.meta.totalArea} м²
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="modal-f">
          <button className="btn" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}
