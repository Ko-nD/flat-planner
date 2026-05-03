import { useRef, useState, type CSSProperties } from 'react';
import { useProject, newObjectId } from '../../store/projectStore';
import { ALL_TEMPLATES, instantiateTemplate, type TemplateGroup } from '../../catalog/templates';
import { FLAT_TEMPLATES } from '../../templates/flatTemplates';
import {
  loadUserFlatTemplates,
  addUserFlatTemplate,
  removeUserFlatTemplate,
  parseFlatTemplateFile,
  type UserFlatTemplate,
} from '../../templates/userFlatTemplates';
import { buildBlankPlan } from '../../templates/blankPlan';
import { BtiImportDialog } from './BtiImportDialog';
import { buildShareUrl } from '../../utils/share';
import { DropdownMenu } from './DropdownMenu';
import { SettingsPopover } from './SettingsPopover';
import { exportJsonFile, exportMarkdown } from '../../utils/export';
import { polygonCentroid } from '../../utils/geometry';
import type { ProjectData } from '../../types';
import { PatchDialog } from './PatchDialog';

interface Props {
  onExportPng: () => void;
  onExportPdf: () => void;
  onExportForAi: () => void;
  isMobile?: boolean;
}

export function Toolbar({ onExportPng, onExportPdf, onExportForAi, isMobile = false }: Props) {
  const tool = useProject((s) => s.tool);
  const setTool = useProject((s) => s.setTool);
  // showGrid + snapMm управляются через <GridSettings />, см. tb-group ниже.
  const view = useProject((s) => s.view);
  const setView = useProject((s) => s.setView);
  const exportJson = useProject((s) => s.exportJson);
  const loadJson = useProject((s) => s.loadJson);
  const resetProject = useProject((s) => s.resetProject);
  const forceReloadTemplate = useProject((s) => s.forceReloadTemplate);
  const objects = useProject((s) => s.objects);
  const meta = useProject((s) => s.meta);
  const geometry = useProject((s) => s.geometry);
  const undo = useProject((s) => s.undo);
  const redo = useProject((s) => s.redo);
  const canUndo = useProject((s) => s.past.length > 0);
  const canRedo = useProject((s) => s.future.length > 0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPatch, setShowPatch] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showBti, setShowBti] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const handleShare = async () => {
    let url = '';
    try {
      url = await buildShareUrl(exportJson());
    } catch (e: any) {
      console.error('Share build failed', e);
      setShareStatus('error');
      setTimeout(() => setShareStatus('idle'), 2500);
      return;
    }
    if (url.length > 12000) {
      if (!confirm(`Длина ссылки ~${Math.round(url.length / 1024)} КБ. Некоторые мессенджеры обрежут URL такой длины. Всё равно скопировать?`)) return;
    }
    // Clipboard API доступен только на secure contexts (https / localhost). На http/file://
    // показываем prompt() с готовой строкой — пользователь скопирует её сам.
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 2000);
      } else {
        prompt('Скопируй ссылку (Ctrl+C → Enter):', url);
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 2000);
      }
    } catch (e: any) {
      console.error('Clipboard failed, fallback to prompt', e);
      prompt('Скопируй ссылку (Ctrl+C → Enter):', url);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    }
  };

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
      <div className="tb-title" title="Планировщик квартиры">
        🏠<span className="tb-title__text"> Планировщик квартиры</span>
      </div>

      {!isMobile && (
        <div className="tb-group">
          <button
            className="btn btn--small"
            onClick={() => undo()}
            disabled={!canUndo}
            title="Отменить (Ctrl+Z)"
          >
            ↶ Назад
          </button>
          <button
            className="btn btn--small"
            onClick={() => redo()}
            disabled={!canRedo}
            title="Повторить (Ctrl+Shift+Z или Ctrl+Y)"
          >
            ↷ Вперёд
          </button>
        </div>
      )}

      <div className="tb-group">
        {!isMobile && (
          <button className="btn btn--small" aria-pressed={tool === 'select'} onClick={() => setTool('select')} title="Выбор (V)">
            ▢ Выбор
          </button>
        )}
        <button className="btn btn--small" aria-pressed={tool === 'pan'} onClick={() => setTool('pan')} title="Двигать вид: тащи холст рукой. Также — Space + drag или средняя кнопка мыши.">
          ✋ Рука
        </button>
        <button className="btn btn--small" aria-pressed={tool === 'measure'} onClick={() => setTool(tool === 'measure' ? 'select' : 'measure')} title="Линейка (M)">
          📏 Линейка
        </button>
      </div>

      {!isMobile && (
        <div className="tb-group">
          <button
            className="btn btn--small"
            aria-pressed={tool === 'wall-draw'}
            onClick={() => setTool(tool === 'wall-draw' ? 'select' : 'wall-draw')}
            title="Рисовать стену: 1-й клик — старт, 2-й — конец. Shift — продолжать цепочку. Esc — отмена."
          >
            🧱 Стена
          </button>
          <button
            className="btn btn--small"
            aria-pressed={tool === 'room-draw'}
            onClick={() => setTool(tool === 'room-draw' ? 'select' : 'room-draw')}
            title="Рисовать комнату: клики — вершины полигона. Закрыть: клик в первую точку, Enter или правая кнопка. Esc — отмена."
          >
            🏠 Комната
          </button>
          <button
            className="btn btn--small"
            aria-pressed={tool === 'door-place'}
            onClick={() => setTool(tool === 'door-place' ? 'select' : 'door-place')}
            title="Поставить дверь: клик возле стены. Ширина 800 мм по умолчанию (правки — в Свойствах). Esc — отмена."
          >
            🚪 Дверь
          </button>
          <button
            className="btn btn--small"
            aria-pressed={tool === 'window-place'}
            onClick={() => setTool(tool === 'window-place' ? 'select' : 'window-place')}
            title="Поставить окно: клик возле стены. Ширина 1500 мм по умолчанию (правки — в Свойствах)."
          >
            🪟 Окно
          </button>
        </div>
      )}


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

      {!isMobile && (
        <div className="tb-group">
          <button className="btn btn--small" onClick={() => setShowTemplates(true)} title="Готовые шаблоны электрики">
            ⚡ Шаблоны
          </button>
          <button className="btn btn--small" onClick={() => setShowPatch(true)} title="Применить JSON-патч от AI (Claude / GPT / Qwen / Gemini): add/move/delete object, replace polygon, replace/remove wall, remove opening...">
            ⇩ AI-патч
          </button>
          <button className="btn btn--small" onClick={() => setShowBti(true)} title="Импорт скана БТИ через AI: даёт промпт для любой мультимодальной LLM, та читает фото плана и возвращает JSON с геометрией.">
            📷 БТИ→AI
          </button>
        </div>
      )}

      <div className="tb-spacer" />

      <div className="tb-group">
        {!isMobile && (
          <button className="btn btn--small btn--accent" onClick={onExportForAi} title="Скачать ZIP: план PNG + JSON + Markdown — для отправки в Claude / ChatGPT / Qwen / Gemini">
            📤 Для AI
          </button>
        )}
        {isMobile ? (
          <button className="btn btn--small" onClick={onExportPng} title="Скачать PNG плана">PNG</button>
        ) : (
          <DropdownMenu
            trigger={<>📥 Экспорт ▾</>}
            triggerTitle="Скачать план в разных форматах: PNG, PDF, JSON, Markdown. Или загрузить ранее сохранённый JSON."
            items={[
              { icon: '🖼', label: 'PNG (картинка)', onClick: onExportPng, title: 'Скачать растровое изображение плана' },
              { icon: '📄', label: 'PDF (A3, ландшафт)', onClick: onExportPdf, title: 'Скачать PDF для печати/строителя' },
              { icon: '{ }', label: 'JSON (исходник)', onClick: () => exportJsonFile(exportJson(), `${slug(meta.name)}.json`), title: 'Скачать ProjectData JSON для бэкапа или переноса' },
              { icon: '📝', label: 'Markdown (текст)', onClick: () => exportMarkdown(exportJson(), `${slug(meta.name)}.md`), title: 'Скачать описание планировки в Markdown с таблицей по комнатам' },
              'sep',
              { icon: '↑', label: 'Загрузить JSON…', onClick: () => fileInputRef.current?.click(), title: 'Загрузить ранее сохранённый JSON-проект с диска' },
            ]}
          />
        )}
        <button
          className="btn btn--small"
          onClick={handleShare}
          title="Скопировать ссылку с проектом — текущее состояние закодировано в URL (gzip + base64). Открыв ссылку, любой увидит твой план без файлов."
        >
          {shareStatus === 'copied' ? '✓ Ссылка' : shareStatus === 'error' ? '⚠ Ошибка' : '🔗 Поделиться'}
        </button>
        <input ref={fileInputRef} type="file" accept="application/json,.json" style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImport(f);
            e.target.value = '';
          }}
        />
      </div>

      <div className="tb-group">
        {!isMobile && (
          <button className="btn btn--small btn--accent" onClick={() => setShowNew(true)} title="Создать новый проект из готового шаблона (студия / 1-2-3 комн / blank)">
            ✨ Новый проект
          </button>
        )}
        <button className="btn btn--small" onClick={() => setShowHelp(true)} title="Горячие клавиши">?</button>
        {!isMobile && (
          <SettingsPopover
            hasObjects={objects.length > 0}
            onResetProject={resetProject}
            onReloadTemplate={forceReloadTemplate}
          />
        )}
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showTemplates && <TemplatesModal onClose={() => setShowTemplates(false)} />}
      {showPatch && <PatchDialog onClose={() => setShowPatch(false)} />}
      {showBti && <BtiImportDialog onClose={() => setShowBti(false)} />}
      {showNew && (
        <NewProjectModal
          hasObjects={objects.length > 0}
          getCurrentProject={() => exportJson()}
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
            <div><span>Space + drag</span><span className="kbd">Рука</span></div>
            <div><span>Средняя кнопка</span><span className="kbd">Рука</span></div>
            <div><span>Выделение</span><span className="kbd">V</span></div>
            <div><span>Линейка (1-й клик — начать, 2-й — зафиксировать, 3-й — новая)</span><span className="kbd">M</span></div>
            <div><span>Сетка вкл/выкл</span><span className="kbd">G</span></div>
            <div><span>Удалить выделенное (объекты, стены, комнаты)</span><span className="kbd">Del</span></div>
            <div><span>Дублировать</span><span className="kbd">Ctrl+D</span></div>
            <div><span>Отменить действие</span><span className="kbd">Ctrl+Z</span></div>
            <div><span>Повторить</span><span className="kbd">Ctrl+Shift+Z</span></div>
            <div><span>Поворот +15°</span><span className="kbd">R</span></div>
            <div><span>Поворот −15°</span><span className="kbd">Shift+R</span></div>
            <div><span>Снять выделение / отменить рисование</span><span className="kbd">Esc</span></div>
            <div><span>Shift при размещении</span><span>Не выходить из режима</span></div>
            <div><span>Shift в режиме 🧱 Стена</span><span>Цепочка стен от последней точки</span></div>
            <div><span>Enter в режиме 🏠 Комната</span><span>Замкнуть полигон</span></div>
          </div>
          <div className="muted" style={{ marginTop: 12 }}>
            Все размеры внутри хранятся в миллиметрах для точности; в интерфейсе показываются в см / м.
          </div>
          <div className="muted" style={{ marginTop: 8 }}>
            <strong>Где хранятся чертежи?</strong> В localStorage браузера. Автосохранение каждые 1.5 секунды (см. индикатор «✓ Сохранено» в нижнем статус-баре). Чтобы перенести план на другое устройство — кнопка <strong>JSON</strong> в тулбаре скачает снапшот.
          </div>
          <div className="muted" style={{ marginTop: 8 }}>
            <button
              className="btn btn--small"
              onClick={() => {
                try { localStorage.removeItem('flat-tutorial-seen-v1'); } catch {}
                location.reload();
              }}
              title="Сбросить флаг и заново показать обучение при перезагрузке"
            >
              ↻ Показать обучение снова
            </button>
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

function NewProjectModal({ hasObjects, getCurrentProject, onClose, onApply, onExportFirst }: {
  hasObjects: boolean;
  getCurrentProject: () => ProjectData;
  onClose: () => void;
  onApply: (data: ProjectData) => void;
  onExportFirst: () => void;
}) {
  const [userTemplates, setUserTemplates] = useState<UserFlatTemplate[]>(() => loadUserFlatTemplates());
  const [savingName, setSavingName] = useState<string | null>(null);
  const [blank, setBlank] = useState<{ name: string; w: string; h: string } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const applyBlank = () => {
    if (!blank) return;
    const w = Math.round(parseFloat(blank.w.replace(',', '.')) * 1000);
    const h = Math.round(parseFloat(blank.h.replace(',', '.')) * 1000);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 2000 || h < 2000 || w > 30000 || h > 30000) {
      alert('Размеры должны быть от 2 до 30 метров');
      return;
    }
    const data = buildBlankPlan({ name: blank.name.trim() || `Чистый план ${blank.w}×${blank.h} м`, widthMm: w, heightMm: h });
    if (hasObjects && !confirm('Заменить текущий план на чистую коробку? Текущая расстановка будет потеряна.')) return;
    onApply(data);
  };

  const refresh = () => setUserTemplates(loadUserFlatTemplates());

  const handleSave = () => {
    const name = (savingName ?? '').trim();
    if (!name) return;
    addUserFlatTemplate(name, getCurrentProject());
    setSavingName(null);
    refresh();
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Удалить шаблон «${title}»?`)) return;
    removeUserFlatTemplate(id);
    refresh();
  };

  const handleExport = (t: UserFlatTemplate) => {
    exportJsonFile(t.data, `template-${slug(t.title)}.json`);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { template, name } = parseFlatTemplateFile(reader.result as string);
        const tname = prompt('Название шаблона', name || file.name.replace(/\.json$/i, ''));
        if (tname === null) return;
        addUserFlatTemplate(tname, template);
        refresh();
      } catch (e: any) {
        alert(`Не удалось импортировать: ${e.message}`);
      }
    };
    reader.readAsText(file);
  };

  const sectionTitle: CSSProperties = {
    fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase',
    letterSpacing: 0.5, margin: '14px 0 6px', fontWeight: 600,
  };
  const cardStyle: CSSProperties = {
    textAlign: 'left', padding: 12, border: '1px solid var(--line)', borderRadius: 8,
    background: 'var(--bg-card)', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', gap: 4,
  };

  const askApply = (t: { title: string; data: ProjectData }) => {
    if (hasObjects && !confirm(`Заменить проект на «${t.title}»? Текущая расстановка будет потеряна.`)) return;
    onApply(t.data);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ minWidth: 600, maxHeight: '85vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
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

          {/* «С нуля»: пустая коробка W×H */}
          <div style={{ ...sectionTitle, marginTop: 0 }}>Создать с нуля</div>
          {blank ? (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto auto', gap: 6, alignItems: 'center', marginBottom: 8, padding: 10, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--bg-soft)' }}>
              <input
                type="text"
                value={blank.name}
                onChange={(e) => setBlank({ ...blank, name: e.target.value })}
                placeholder="Название (например, Моя 2-комн)"
                style={{ padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 4 }}
              />
              <input
                type="number"
                step="0.1"
                min="2"
                max="30"
                value={blank.w}
                onChange={(e) => setBlank({ ...blank, w: e.target.value })}
                placeholder="Ширина, м"
                style={{ padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 4 }}
              />
              <input
                type="number"
                step="0.1"
                min="2"
                max="30"
                value={blank.h}
                onChange={(e) => setBlank({ ...blank, h: e.target.value })}
                placeholder="Высота, м"
                style={{ padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 4 }}
              />
              <button className="btn btn--small btn--accent" onClick={applyBlank}>Создать</button>
              <button className="btn btn--small" onClick={() => setBlank(null)}>×</button>
            </div>
          ) : (
            <div style={{ marginBottom: 8 }}>
              <button
                className="btn btn--small"
                onClick={() => setBlank({ name: '', w: '6', h: '8' })}
                title="Создать пустую коробку с заданными размерами. Дальше — расставляй стены и комнаты прямо на холсте инструментами 🧱 / 🏠."
              >
                ➕ Пустой план N×M метров
              </button>
              <span className="muted" style={{ fontSize: 11, marginLeft: 8 }}>
                Дальше — рисуй стены 🧱 и комнаты 🏠 прямо на холсте.
              </span>
            </div>
          )}

          <div style={sectionTitle}>Встроенные</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {FLAT_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => askApply(t)}
                style={cardStyle}
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

          <div style={sectionTitle}>
            Мои шаблоны{userTemplates.length > 0 ? ` (${userTemplates.length})` : ''}
          </div>
          {userTemplates.length === 0 ? (
            <div className="muted" style={{ fontSize: 11, padding: '4px 0 8px' }}>
              Своих шаблонов пока нет. Сохрани текущий план или импортируй JSON ниже.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {userTemplates.map((t) => (
                <div key={t.id} style={{ ...cardStyle, cursor: 'default' }}>
                  <button
                    onClick={() => askApply(t)}
                    style={{ background: 'transparent', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, color: 'inherit' }}
                    title="Применить шаблон"
                  >
                    <strong style={{ fontSize: 13 }}>{t.title}</strong>
                    <span className="muted" style={{ fontSize: 11 }}>{t.subtitle}</span>
                    <span className="muted" style={{ fontSize: 10 }}>
                      {t.data.geometry.rooms.length} помещений · {t.data.meta.totalArea} м²
                    </span>
                  </button>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <button className="btn btn--small" onClick={() => handleExport(t)} title="Скачать JSON шаблона">⇩ JSON</button>
                    <button className="btn btn--small" onClick={() => handleDelete(t.id, t.title)} title="Удалить шаблон" style={{ marginLeft: 'auto', color: '#c00' }}>× Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {savingName !== null ? (
            <div style={{ marginTop: 12, padding: 10, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--bg-soft)' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginBottom: 6 }}>Название нового шаблона</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={savingName}
                  onChange={(e) => setSavingName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setSavingName(null); }}
                  autoFocus
                  style={{ flex: 1, padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 4 }}
                  placeholder="Например: Моя 2-комн 54 м²"
                />
                <button className="btn btn--small btn--accent" onClick={handleSave}>Сохранить</button>
                <button className="btn btn--small" onClick={() => setSavingName(null)}>Отмена</button>
              </div>
              <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>
                Сохранится в localStorage браузера. Чтобы перенести на другое устройство — экспортируй JSON.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              <button
                className="btn btn--small btn--accent"
                onClick={() => setSavingName(getCurrentProject().meta?.name ?? '')}
                title="Сохранить текущий план в localStorage как шаблон"
              >
                💾 Сохранить текущий как шаблон
              </button>
              <button
                className="btn btn--small"
                onClick={() => importInputRef.current?.click()}
                title="Импортировать шаблон из JSON-файла (свой или чужой ProjectData)"
              >
                ⇩ Импорт JSON
              </button>
              <input ref={importInputRef} type="file" accept="application/json,.json" style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImport(f);
                  e.target.value = '';
                }}
              />
            </div>
          )}
        </div>
        <div className="modal-f">
          <button className="btn" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}
