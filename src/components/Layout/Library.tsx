import { useMemo, useRef, useState } from 'react';
import { getCatalog, addCustomItem, removeCustomItem, LAYER_NAME, loadCustomItems, saveCustomItems } from '../../catalog/catalog';
import { useProject } from '../../store/projectStore';
import { fmtDims, fmtHeight, parseSize } from '../../utils/format';
import { downloadBlob } from '../../utils/export';
import type { CatalogItem, CatalogSymbol, LCorner, LayerId, Vec2 } from '../../types';

const newId = () => 'u-' + Math.random().toString(36).slice(2, 9);

export function Library() {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<{ mode: 'new' } | { mode: 'edit'; item: CatalogItem } | null>(null);
  // Перечитываем каталог при изменении nonce (после add/delete custom item)
  const [nonce, setNonce] = useState(0);
  const importInputRef = useRef<HTMLInputElement>(null);
  const placeCatalogId = useProject((s) => s.placeCatalogId);
  const startPlacement = useProject((s) => s.startPlacement);
  const cancelPlacement = useProject((s) => s.cancelPlacement);

  const fullCatalog = useMemo(() => getCatalog(), [nonce]);
  const refresh = () => setNonce((n) => n + 1);

  const handleExport = () => {
    const items = loadCustomItems();
    if (items.length === 0) { alert('Нет пользовательских шаблонов для экспорта'); return; }
    const blob = new Blob([JSON.stringify({ version: '1.0', items }, null, 2)], { type: 'application/json' });
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadBlob(blob, `flat-custom-items-${ts}.json`);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const items: CatalogItem[] = Array.isArray(parsed) ? parsed : parsed?.items;
        if (!Array.isArray(items)) throw new Error('Файл не содержит массива items');
        const existing = loadCustomItems();
        const existingIds = new Set(existing.map((i) => i.id));
        const newItems: CatalogItem[] = [];
        let dupCount = 0;
        for (const it of items) {
          if (!it.id || !it.name || !it.symbol) continue;
          if (existingIds.has(it.id)) { dupCount++; continue; }
          newItems.push({ ...it, userTemplate: true });
        }
        saveCustomItems([...existing, ...newItems]);
        refresh();
        alert(`Импортировано: ${newItems.length}${dupCount ? ` (пропущено дубликатов: ${dupCount})` : ''}`);
      } catch (e: any) {
        alert(`Не удалось загрузить: ${e.message}`);
      }
    };
    reader.readAsText(file);
  };

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fullCatalog;
    return fullCatalog
      .map((g) => ({ ...g, items: g.items.filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [query, fullCatalog]);

  return (
    <div className="library">
      <div className="panel-header">
        Каталог
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <button className="btn btn--small" onClick={handleExport} title="Скачать пользовательские шаблоны как JSON-файл">⇧</button>
          <button className="btn btn--small" onClick={() => importInputRef.current?.click()} title="Загрузить JSON-файл с шаблонами и добавить к существующим">⇩</button>
          <input ref={importInputRef} type="file" accept="application/json,.json" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ''; }} />
          <button className="btn btn--small btn--accent"
            onClick={() => setEditing({ mode: 'new' })}
            title="Создать собственный предмет (сохранится в «Мои предметы»)"
          >+ Новый</button>
        </div>
      </div>
      <div className="library-search">
        <input
          type="text"
          placeholder="Поиск: «диван», «розетка», «кухня»…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="panel-body" style={{ flex: 1 }}>
        {filteredGroups.map((group) => (
          <Group key={group.title}
            title={group.title}
            items={group.items}
            placeCatalogId={placeCatalogId}
            onPick={(id) => {
              if (placeCatalogId === id) cancelPlacement();
              else startPlacement(id);
            }}
            onDelete={(id) => { removeCustomItem(id); refresh(); }}
            onEdit={(item) => setEditing({ mode: 'edit', item })}
          />
        ))}
        {filteredGroups.length === 0 && (
          <div className="muted" style={{ padding: 16, textAlign: 'center' }}>Ничего не найдено</div>
        )}
      </div>

      {editing && (
        <ItemDialog
          mode={editing.mode}
          item={editing.mode === 'edit' ? editing.item : undefined}
          onClose={() => setEditing(null)}
          onSave={(item) => {
            if (editing.mode === 'edit') {
              addCustomItem({ ...item, id: editing.item.id });
            } else {
              addCustomItem({ ...item, id: newId() });
            }
            refresh();
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function Group({ title, items, placeCatalogId, onPick, onDelete, onEdit }: {
  title: string;
  items: CatalogItem[];
  placeCatalogId: string | null;
  onPick: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (item: CatalogItem) => void;
}) {
  const byCategory = useMemo(() => {
    const map = new Map<string, CatalogItem[]>();
    for (const i of items) {
      const list = map.get(i.category) ?? [];
      list.push(i);
      map.set(i.category, list);
    }
    return Array.from(map.entries());
  }, [items]);

  return (
    <div className="lib-group">
      <div className="lib-group-title">{title}</div>
      {byCategory.map(([cat, list]) => (
        <div key={cat}>
          <div className="lib-group-sub">{cat}</div>
          <div className="lib-grid">
            {list.map((it) => {
              const active = placeCatalogId === it.id;
              return (
                <div key={it.id} style={{ position: 'relative' }}>
                  <button className={`lib-item${active ? ' active' : ''}`} onClick={() => onPick(it.id)} title={it.hint ?? it.name} style={{ width: '100%' }}>
                    {it.name}
                    <small>{fmtDims(it.width, it.depth)}{it.mountHeight != null ? ` • ${fmtHeight(it.mountHeight)}` : ''}</small>
                  </button>
                  {it.userTemplate && (
                    <div style={{ position: 'absolute', top: 2, right: 2, display: 'flex', gap: 2 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(it); }}
                        title="Редактировать шаблон"
                        style={{
                          width: 20, height: 20, lineHeight: '16px',
                          border: 0, borderRadius: 3, background: 'rgba(0,0,0,0.05)',
                          color: 'var(--ink-soft)', fontSize: 12, cursor: 'pointer',
                        }}
                      >✎</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (confirm(`Удалить шаблон «${it.name}»?`)) onDelete(it.id); }}
                        title="Удалить пользовательский шаблон"
                        style={{
                          width: 20, height: 20, lineHeight: '16px',
                          border: 0, borderRadius: 3, background: 'rgba(0,0,0,0.05)',
                          color: 'var(--ink-soft)', fontSize: 14, cursor: 'pointer',
                        }}
                      >×</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const LAYER_OPTIONS: LayerId[] = ['furniture', 'appliances', 'plumbing'];
const SHAPE_OPTIONS: { id: CatalogSymbol; name: string }[] = [
  { id: 'rect',     name: 'Прямоугольник' },
  { id: 'circle',   name: 'Круг' },
  { id: 'l-shape',  name: 'L-форма (угловой)' },
  { id: 'polygon',  name: 'Произвольный полигон' },
];

const CORNER_OPTIONS: { id: LCorner; name: string }[] = [
  { id: 'bl', name: 'Левый-нижний' },
  { id: 'br', name: 'Правый-нижний' },
  { id: 'tl', name: 'Левый-верхний' },
  { id: 'tr', name: 'Правый-верхний' },
];

// Парсинг точек: «x1,y1; x2,y2; ...» (в см от центра); поддерживается и многострочный формат
function parsePolygonText(text: string): Vec2[] | { error: string } {
  const trimmed = text.trim();
  if (!trimmed) return { error: 'Введите хотя бы 3 точки' };
  // Разделители: ; , \n
  const pairs = trimmed.split(/[;\n]+/).map((s) => s.trim()).filter(Boolean);
  const points: Vec2[] = [];
  for (let i = 0; i < pairs.length; i++) {
    const parts = pairs[i].split(/[,\s]+/).filter(Boolean);
    if (parts.length !== 2) return { error: `Точка ${i + 1}: ожидаю «x,y»` };
    const x = parseFloat(parts[0].replace(',', '.'));
    const y = parseFloat(parts[1].replace(',', '.'));
    if (!Number.isFinite(x) || !Number.isFinite(y)) return { error: `Точка ${i + 1}: не число` };
    // Конвертируем см → мм
    points.push({ x: x * 10, y: y * 10 });
  }
  if (points.length < 3) return { error: 'Минимум 3 точки' };
  return points;
}

function pointsToText(points: Vec2[]): string {
  return points.map((p) => `${(p.x / 10).toFixed(1).replace(/\.0$/, '')},${(p.y / 10).toFixed(1).replace(/\.0$/, '')}`).join('; ');
}

function ItemDialog({ mode, item, onClose, onSave }: {
  mode: 'new' | 'edit';
  item?: CatalogItem;
  onClose: () => void;
  onSave: (item: Omit<CatalogItem, 'id'>) => void;
}) {
  const [name, setName] = useState(item?.name ?? '');
  const [layer, setLayer] = useState<LayerId>(item?.layer ?? 'furniture');
  const [shape, setShape] = useState<CatalogSymbol>(item?.symbol ?? 'rect');
  const [width, setWidth] = useState(item ? String(Math.round(item.width / 10)) : '80');
  const [depth, setDepth] = useState(item ? String(Math.round(item.depth / 10)) : '40');
  const [hint, setHint] = useState(item?.hint ?? '');
  // L-shape поля (см)
  const [legA, setLegA] = useState(item?.shapeData?.legA != null ? String(Math.round(item.shapeData.legA / 10)) : '40');
  const [legB, setLegB] = useState(item?.shapeData?.legB != null ? String(Math.round(item.shapeData.legB / 10)) : '40');
  const [corner, setCorner] = useState<LCorner>(item?.shapeData?.corner ?? 'bl');
  // Polygon поле
  const [polyText, setPolyText] = useState(item?.shapeData?.points ? pointsToText(item.shapeData.points) : '-40,-40; 40,-40; 40,40; -40,40');

  const wMm = parseSize(width);
  const dMm = parseSize(depth);
  const legAMm = parseSize(legA);
  const legBMm = parseSize(legB);
  const polyParsed = useMemo(() => shape === 'polygon' ? parsePolygonText(polyText) : null, [shape, polyText]);
  const polyError = polyParsed && 'error' in polyParsed ? polyParsed.error : null;
  const polyPoints = polyParsed && Array.isArray(polyParsed) ? polyParsed : null;

  // Для polygon — bounding box определяет width/depth автоматически
  const polyBounds = useMemo(() => {
    if (!polyPoints) return null;
    const xs = polyPoints.map((p) => p.x);
    const ys = polyPoints.map((p) => p.y);
    return {
      width: Math.max(...xs) - Math.min(...xs),
      depth: Math.max(...ys) - Math.min(...ys),
    };
  }, [polyPoints]);

  const validBasic = name.trim().length > 0;
  const validSize = (() => {
    if (shape === 'polygon') return !!polyPoints;
    if (shape === 'l-shape') return wMm! > 0 && dMm! > 0 && legAMm! > 0 && legBMm! > 0 && legAMm! < dMm! && legBMm! < wMm!;
    return wMm != null && dMm != null && wMm > 0 && dMm > 0;
  })();
  const valid = validBasic && validSize;

  const handleSave = () => {
    if (!valid) return;
    const base = {
      layer,
      category: 'Свои',
      name: name.trim(),
      symbol: shape,
      hint: hint.trim() || undefined,
      userTemplate: true as const,
    };
    if (shape === 'polygon' && polyPoints && polyBounds) {
      onSave({ ...base, width: polyBounds.width, depth: polyBounds.depth, shapeData: { points: polyPoints } });
    } else if (shape === 'l-shape') {
      onSave({ ...base, width: wMm!, depth: dMm!, shapeData: { legA: legAMm ?? undefined, legB: legBMm ?? undefined, corner } });
    } else {
      onSave({ ...base, width: wMm!, depth: dMm! });
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ minWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">{mode === 'edit' ? 'Редактировать шаблон' : 'Новый предмет'}</div>
        <div className="modal-b">
          <div className="props-row">
            <label>Название</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Стеллаж IKEA" autoFocus />
          </div>
          <div className="props-row">
            <label>Слой</label>
            <select value={layer} onChange={(e) => setLayer(e.target.value as LayerId)}>
              {LAYER_OPTIONS.map((l) => <option key={l} value={l}>{LAYER_NAME[l]}</option>)}
            </select>
          </div>
          <div className="props-row">
            <label>Форма</label>
            <select value={shape} onChange={(e) => setShape(e.target.value as CatalogSymbol)}>
              {SHAPE_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {shape !== 'polygon' && (
            <>
              <div className="props-row">
                <label>Ширина</label>
                <input type="text" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="в см (можно «80» или «0.8м»)" />
              </div>
              <div className="props-row">
                <label>{shape === 'circle' ? 'Диаметр' : 'Глубина'}</label>
                <input type="text" value={depth} onChange={(e) => setDepth(e.target.value)} placeholder="в см" />
              </div>
            </>
          )}

          {shape === 'l-shape' && (
            <>
              <div className="props-row">
                <label>Толщина «низа»</label>
                <input type="text" value={legA} onChange={(e) => setLegA(e.target.value)} placeholder="толщина горизонтальной ноги, см" />
              </div>
              <div className="props-row">
                <label>Толщина «бока»</label>
                <input type="text" value={legB} onChange={(e) => setLegB(e.target.value)} placeholder="толщина вертикальной ноги, см" />
              </div>
              <div className="props-row">
                <label>Угол</label>
                <select value={corner} onChange={(e) => setCorner(e.target.value as LCorner)}>
                  {CORNER_OPTIONS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </>
          )}

          {shape === 'polygon' && (
            <div className="props-row" style={{ alignItems: 'flex-start' }}>
              <label>Точки</label>
              <div style={{ flex: 1 }}>
                <textarea
                  value={polyText}
                  onChange={(e) => setPolyText(e.target.value)}
                  rows={4}
                  placeholder="x1,y1; x2,y2; x3,y3; ... (в см от центра, по часовой стрелке)"
                  style={{ width: '100%', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 }}
                />
                {polyError && <div style={{ color: 'var(--warn)', fontSize: 11, marginTop: 4 }}>⚠ {polyError}</div>}
                {polyBounds && (
                  <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                    Bounding box: {Math.round(polyBounds.width / 10)}×{Math.round(polyBounds.depth / 10)} см ({polyPoints!.length} точек)
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="props-row">
            <label>Подсказка</label>
            <textarea value={hint} onChange={(e) => setHint(e.target.value)} placeholder="(необязательно)" />
          </div>

          {!valid && validBasic && (
            <div className="muted" style={{ marginTop: 6, fontSize: 11 }}>
              {shape === 'l-shape' ? 'У L-формы толщины ног должны быть меньше общих размеров.' :
               shape === 'polygon' ? 'Введите минимум 3 точки в формате «x,y; x,y; …».' :
               'Введите положительные размеры.'}
            </div>
          )}
          {!validBasic && (
            <div className="muted" style={{ marginTop: 6, fontSize: 11 }}>Введите название.</div>
          )}
          {valid && shape !== 'polygon' && wMm && dMm && (
            <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
              Размер: {Math.round(wMm/10)}×{Math.round(dMm/10)} см
            </div>
          )}
        </div>
        <div className="modal-f">
          <button className="btn" onClick={onClose}>Отмена</button>
          <button className="btn btn--accent" disabled={!valid} onClick={handleSave}>
            {mode === 'edit' ? 'Сохранить изменения' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
}
