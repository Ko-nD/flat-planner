import { useMemo } from 'react';
import { useProject } from '../../store/projectStore';
import { findCatalog, LAYER_NAME } from '../../catalog/catalog';
import { fmtArea, parseSize } from '../../utils/format';
import { pointInPolygon } from '../../utils/geometry';

function NumInput({ value, onChange, suffix }: { value: number; onChange: (v: number) => void; suffix?: string }) {
  const display = String(Math.round(value / 10));
  return (
    <div style={{ position: 'relative' }}>
      <input
        type="number"
        defaultValue={display}
        onBlur={(e) => {
          const parsed = parseSize(e.target.value);
          if (parsed != null && parsed > 0) onChange(parsed);
          else e.target.value = display;
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        style={{ paddingRight: 28 }}
      />
      {suffix && (
        <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-mute)', fontSize: 11 }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

export function Properties() {
  const selectedIds = useProject((s) => s.selectedIds);
  const objects = useProject((s) => s.objects);
  const updateObject = useProject((s) => s.updateObject);
  const removeObjects = useProject((s) => s.removeObjects);
  const duplicateObjects = useProject((s) => s.duplicateObjects);
  const geometry = useProject((s) => s.geometry);

  const selected = useMemo(() => objects.filter((o) => selectedIds.includes(o.id)), [objects, selectedIds]);
  const single = selected.length === 1 ? selected[0] : null;
  const cat = single ? findCatalog(single.catalogId) : null;

  const room = useMemo(() => {
    if (!single) return null;
    const pt = { x: single.x, y: single.y };
    return geometry.rooms.find((r) => pointInPolygon(pt, r.polygon)) ?? null;
  }, [single, geometry.rooms]);

  if (selected.length === 0) {
    return (
      <div className="panel" style={{ flex: 1, minHeight: 0 }}>
        <div className="panel-header">Свойства</div>
        <div className="panel-body" style={{ flex: 1 }}>
          <ProjectInfo />
          <div style={{ borderTop: '1px solid var(--line-soft)', margin: '12px -10px 0' }} />
          <RoomsSummary />
        </div>
      </div>
    );
  }

  if (!single) {
    return (
      <div className="panel" style={{ flex: 1, minHeight: 0 }}>
        <div className="panel-header">Свойства</div>
        <div className="panel-body" style={{ flex: 1 }}>
          <div className="muted">Выбрано {selected.length} объектов</div>
          <div className="row" style={{ marginTop: 8, gap: 6 }}>
            <button className="btn btn--small" onClick={() => duplicateObjects(selected.map((o) => o.id))}>Дублировать</button>
            <button className="btn btn--small" onClick={() => removeObjects(selected.map((o) => o.id))}>Удалить</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel" style={{ flex: 1, minHeight: 0 }}>
      <div className="panel-header">Свойства</div>
      <div className="panel-body" style={{ flex: 1 }}>
        <div style={{ marginBottom: 6 }}>
          <span className="tag" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>{LAYER_NAME[single.layer]}</span>
          {room && <span className="tag" style={{ marginLeft: 4 }}>{room.name}</span>}
        </div>

        <div className="props-row">
          <label>Название</label>
          <input
            type="text"
            defaultValue={single.label ?? cat?.name ?? ''}
            onBlur={(e) => updateObject(single.id, { label: e.target.value || undefined })}
          />
        </div>
        <div className="props-row">
          <label>X (см)</label>
          <NumInput value={single.x} onChange={(v) => updateObject(single.id, { x: v })} suffix="см" />
        </div>
        <div className="props-row">
          <label>Y (см)</label>
          <NumInput value={single.y} onChange={(v) => updateObject(single.id, { y: v })} suffix="см" />
        </div>
        <div className="props-row">
          <label>Ширина</label>
          <NumInput value={single.width} onChange={(v) => updateObject(single.id, { width: v })} suffix="см" />
        </div>
        <div className="props-row">
          <label>Глубина</label>
          <NumInput value={single.depth} onChange={(v) => updateObject(single.id, { depth: v })} suffix="см" />
        </div>
        <div className="props-row">
          <label>Поворот</label>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn--small" type="button"
              onClick={() => updateObject(single.id, { rotation: ((single.rotation - 15) + 360) % 360 })}
              title="Повернуть −15°">−15°</button>
            <input
              key={single.id}
              type="number"
              defaultValue={Math.round(single.rotation)}
              onBlur={(e) => updateObject(single.id, { rotation: ((parseFloat(e.target.value) || 0) % 360 + 360) % 360 })}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              step={15}
              style={{ flex: 1, textAlign: 'center' }}
            />
            <button className="btn btn--small" type="button"
              onClick={() => updateObject(single.id, { rotation: (single.rotation + 15) % 360 })}
              title="Повернуть +15°">+15°</button>
          </div>
        </div>
        {cat?.symbol === 'l-sofa' && (
          <div className="props-row">
            <label>Угол</label>
            <select
              value={single.corner ?? 'bl'}
              onChange={(e) => updateObject(single.id, { corner: e.target.value as any })}
            >
              <option value="bl">Левый-нижний</option>
              <option value="br">Правый-нижний</option>
              <option value="tl">Левый-верхний</option>
              <option value="tr">Правый-верхний</option>
            </select>
          </div>
        )}
        {(['sockets', 'switches', 'lights', 'data', 'appliances'] as string[]).includes(single.layer) && (
          <div className="props-row">
            <label>Высота</label>
            <NumInput
              value={single.mountHeight ?? 0}
              onChange={(v) => updateObject(single.id, { mountHeight: v })}
              suffix="см от пола"
            />
          </div>
        )}
        <div className="props-row">
          <label>Заметка</label>
          <textarea
            defaultValue={single.notes ?? ''}
            placeholder="Например: «провод 3×2.5», «диммируемый», «розетка скрытая за ТВ»…"
            onBlur={(e) => updateObject(single.id, { notes: e.target.value || undefined })}
          />
        </div>

        {cat?.hint && (
          <div className="warning" style={{ marginTop: 6 }}>
            <strong>Подсказка:</strong> {cat.hint}
          </div>
        )}

        <div className="row" style={{ marginTop: 12, gap: 6 }}>
          <button className="btn btn--small" onClick={() => updateObject(single.id, { rotation: (single.rotation + 90) % 360 })}>
            Повернуть 90°
          </button>
          <button className="btn btn--small" onClick={() => duplicateObjects([single.id])}>Дублировать</button>
          <button className="btn btn--small" onClick={() => removeObjects([single.id])}>Удалить</button>
        </div>
      </div>
    </div>
  );
}

function ProjectInfo() {
  const meta = useProject((s) => s.meta);
  const setMeta = useProject((s) => s.setMeta);
  const objects = useProject((s) => s.objects);

  return (
    <div>
      <div className="props-row">
        <label>Проект</label>
        <input type="text" defaultValue={meta.name} onBlur={(e) => setMeta({ name: e.target.value })} />
      </div>
      <div className="props-row">
        <label>Адрес</label>
        <input type="text" defaultValue={meta.address ?? ''} onBlur={(e) => setMeta({ address: e.target.value || undefined })} placeholder="—" />
      </div>
      <div className="props-row">
        <label>Заметки</label>
        <textarea defaultValue={meta.notes ?? ''} onBlur={(e) => setMeta({ notes: e.target.value || undefined })} placeholder="Общие пожелания, бюджет, сроки…" />
      </div>
      <div style={{ marginTop: 6 }} className="muted">
        Площадь: <strong>{meta.totalArea} м²</strong> · жилая <strong>{meta.livingArea} м²</strong> · подсобная <strong>{meta.auxArea} м²</strong>
      </div>
      <div className="muted">Объектов в проекте: <strong>{objects.length}</strong></div>
    </div>
  );
}

function RoomsSummary() {
  const objects = useProject((s) => s.objects);
  const geometry = useProject((s) => s.geometry);

  const rooms = useMemo(() => geometry.rooms.map((r) => {
    const inRoom = objects.filter((o) => pointInPolygon({ x: o.x, y: o.y }, r.polygon));
    const sockets = inRoom.filter((o) => o.layer === 'sockets').length;
    const switches = inRoom.filter((o) => o.layer === 'switches').length;
    const lights = inRoom.filter((o) => o.layer === 'lights').length;
    return { ...r, totalObjects: inRoom.length, sockets, switches, lights };
  }), [objects, geometry.rooms]);

  return (
    <div style={{ marginTop: 8 }}>
      <div className="lib-group-title">Сводка по комнатам</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '4px 4px', color: 'var(--ink-soft)' }}>Помещение</th>
            <th style={{ textAlign: 'right', padding: '4px 4px', color: 'var(--ink-soft)' }}>Площ.</th>
            <th style={{ textAlign: 'right', padding: '4px 4px', color: 'var(--ink-soft)' }}>⚡</th>
            <th style={{ textAlign: 'right', padding: '4px 4px', color: 'var(--ink-soft)' }}>⌂</th>
            <th style={{ textAlign: 'right', padding: '4px 4px', color: 'var(--ink-soft)' }}>💡</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((r) => (
            <tr key={r.id} style={{ borderTop: '1px solid var(--line-soft)' }}>
              <td style={{ padding: '4px' }}>{r.name}</td>
              <td style={{ padding: '4px', textAlign: 'right' }}>{fmtArea(r.area)}</td>
              <td style={{ padding: '4px', textAlign: 'right' }}>{r.sockets || ''}</td>
              <td style={{ padding: '4px', textAlign: 'right' }}>{r.switches || ''}</td>
              <td style={{ padding: '4px', textAlign: 'right' }}>{r.lights || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
