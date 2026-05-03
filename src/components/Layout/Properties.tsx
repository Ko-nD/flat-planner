import { useMemo } from 'react';
import { useProject } from '../../store/projectStore';
import { findCatalog, LAYER_NAME } from '../../catalog/catalog';
import { TRANSFORMER_DIMS } from '../../catalog/transformer';
import { fmtArea, parseSize } from '../../utils/format';
import { pointInPolygon } from '../../utils/geometry';
import type { Opening, Room } from '../../types';

function NumInput({ value, onChange, suffix }: { value: number; onChange: (v: number) => void; suffix?: string }) {
  const display = String(Math.round(value / 10));
  return (
    <div style={{ position: 'relative' }}>
      <input
        // Перемонтируем input при каждом изменении value — иначе defaultValue
        // не обновляется при переключении на другой объект, и пользователь видит
        // старое число вместо актуального
        key={display}
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
  const selectedOpeningIds = useProject((s) => s.selectedOpeningIds);
  const selectedRoomIds = useProject((s) => s.selectedRoomIds);
  const objects = useProject((s) => s.objects);
  const updateObject = useProject((s) => s.updateObject);
  const removeObjects = useProject((s) => s.removeObjects);
  const duplicateObjects = useProject((s) => s.duplicateObjects);
  const geometry = useProject((s) => s.geometry);
  const updateOpening = useProject((s) => s.updateOpening);
  const removeSelectedOpenings = useProject((s) => s.removeSelectedOpenings);
  const updateRoom = useProject((s) => s.updateRoom);
  const removeSelectedRooms = useProject((s) => s.removeSelectedRooms);

  // ВАЖНО: все useMemo вызываются на каждом рендере, ДО любых early-return.
  // Иначе при переключении между «выбран проём» и «выбран объект» меняется число
  // вызванных хуков → React выбрасывает Rules-of-Hooks error и весь компонент
  // (правая панель) падает в Error-Boundary, исчезая с экрана.
  const selected = useMemo(() => objects.filter((o) => selectedIds.includes(o.id)), [objects, selectedIds]);
  const single = selected.length === 1 ? selected[0] : null;
  const cat = single ? findCatalog(single.catalogId) : null;

  const room = useMemo(() => {
    if (!single) return null;
    const pt = { x: single.x, y: single.y };
    return geometry.rooms.find((r) => pointInPolygon(pt, r.polygon)) ?? null;
  }, [single, geometry.rooms]);

  // Если выбран ровно один проём — показываем его редактор.
  const singleOpening = selectedOpeningIds.length === 1
    ? geometry.openings.find((o) => o.id === selectedOpeningIds[0]) ?? null
    : null;
  if (singleOpening) {
    return <OpeningEditor opening={singleOpening} onUpdate={(p) => updateOpening(singleOpening.id, p)} onRemove={removeSelectedOpenings} />;
  }

  // Если выбрана ровно одна комната — показываем её редактор (имя, тип, площадь).
  const singleRoom = selectedRoomIds.length === 1
    ? geometry.rooms.find((r) => r.id === selectedRoomIds[0]) ?? null
    : null;
  if (singleRoom) {
    return <RoomEditor room={singleRoom} onUpdate={(p) => updateRoom(singleRoom.id, p)} onRemove={removeSelectedRooms} />;
  }

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

  // Кровать-трансформер? Показываем кнопку «Сложить/Разложить»
  const transformerSymbol = cat?.symbol;
  const transformerDims = transformerSymbol ? TRANSFORMER_DIMS[transformerSymbol] : undefined;
  const toggleTransformer = () => {
    if (!single || !transformerDims) return;
    const isClosed = single.state === 'closed';
    const target = isClosed ? transformerDims.open : transformerDims.closed;
    const oldDepth = single.depth;
    const newDepth = target.depth;
    const delta = newDepth - oldDepth;
    // Корпус (стена) — у local y = -depth/2. При смене depth удерживаем эту точку
    // в мировых координатах: смещаем центр на delta/2 в направлении «от стены».
    const rad = (single.rotation * Math.PI) / 180;
    updateObject(single.id, {
      state: isClosed ? 'open' : 'closed',
      depth: newDepth,
      width: target.width,
      x: single.x - (delta / 2) * Math.sin(rad),
      y: single.y + (delta / 2) * Math.cos(rad),
    });
  };

  return (
    <div className="panel" style={{ flex: 1, minHeight: 0 }}>
      <div className="panel-header">Свойства</div>
      <div className="panel-body" style={{ flex: 1 }}>
        <div style={{ marginBottom: 6 }}>
          <span className="tag" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>{LAYER_NAME[single.layer]}</span>
          {room && <span className="tag" style={{ marginLeft: 4 }}>{room.name}</span>}
          {transformerDims && (
            <span className="tag" style={{ marginLeft: 4, background: single.state === 'closed' ? 'var(--bg-soft)' : 'var(--accent-soft)', color: single.state === 'closed' ? 'var(--ink-soft)' : 'var(--accent)' }}>
              {single.state === 'closed' ? 'сложен' : 'разложен'}
            </span>
          )}
        </div>

        {transformerDims && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <button
              className="btn btn--small btn--accent"
              style={{ flex: 1 }}
              onClick={toggleTransformer}
              title={single.state === 'closed'
                ? `Раскладывает кровать. Глубина изменится с ${Math.round(single.depth / 10)} см на ${Math.round(transformerDims.open.depth / 10)} см.`
                : `Складывает кровать. Глубина изменится с ${Math.round(single.depth / 10)} см на ${Math.round(transformerDims.closed.depth / 10)} см.`}
            >
              {single.state === 'closed' ? '⬇ Разложить' : '⬆ Сложить'}
            </button>
          </div>
        )}

        <div className="props-row">
          <label>Название</label>
          <input
            key={single.id}
            type="text"
            defaultValue={single.label ?? cat?.name ?? ''}
            onBlur={(e) => updateObject(single.id, { label: e.target.value || undefined })}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
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
              // Перемонтаж при смене rotation — иначе кнопки ±15° не обновляют поле
              key={`${single.id}-${Math.round(single.rotation)}`}
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
            key={single.id}
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

function OpeningEditor({ opening, onUpdate, onRemove }: {
  opening: Opening;
  onUpdate: (patch: Partial<Opening>) => void;
  onRemove: () => void;
}) {
  const geometry = useProject((s) => s.geometry);
  const wall = geometry.walls.find((w) => w.id === opening.wallId);
  const wallLen = wall ? Math.hypot(wall.b.x - wall.a.x, wall.b.y - wall.a.y) : 0;
  const isDoor = opening.kind === 'door';
  return (
    <div className="panel" style={{ flex: 1, minHeight: 0 }}>
      <div className="panel-header">
        Свойства {isDoor ? '🚪 двери' : '🪟 окна'}
        <button className="btn btn--small" style={{ marginLeft: 'auto' }} onClick={onRemove} title="Удалить проём">Удалить</button>
      </div>
      <div className="panel-body" style={{ flex: 1 }}>
        <div style={{ marginBottom: 6 }}>
          <span className="tag" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            {isDoor ? 'Дверь' : 'Окно'}
          </span>
          {wall && <span className="tag" style={{ marginLeft: 4 }}>стена {wall.id}</span>}
        </div>

        <div className="props-row">
          <label>Тип</label>
          <select
            value={opening.kind}
            onChange={(e) => onUpdate({ kind: e.target.value as 'door' | 'window' })}
          >
            <option value="door">Дверь</option>
            <option value="window">Окно</option>
          </select>
        </div>

        <div className="props-row">
          <label>Подпись</label>
          <input
            key={opening.id}
            type="text"
            defaultValue={opening.label ?? ''}
            placeholder={isDoor ? 'Входная' : 'Окно (Спальня)'}
            onBlur={(e) => onUpdate({ label: e.target.value || undefined })}
          />
        </div>

        <div className="props-row">
          <label>Ширина (см)</label>
          <NumInput
            value={opening.width}
            onChange={(v) => {
              // Не даём шире, чем стена позволяет
              const max = Math.max(400, wallLen - 40);
              onUpdate({ width: Math.min(v, max) });
            }}
            suffix="см"
          />
        </div>
        <div className="props-row">
          <label>Сдвиг от a (см)</label>
          <NumInput
            value={opening.offset}
            onChange={(v) => {
              const half = opening.width / 2;
              const safe = Math.max(half + 20, Math.min(wallLen - half - 20, v));
              onUpdate({ offset: safe });
            }}
            suffix="см"
          />
        </div>

        {isDoor && (
          <>
            <div className="props-row">
              <label>Открывание</label>
              <select
                value={opening.swing ?? 'right'}
                onChange={(e) => onUpdate({ swing: e.target.value as Opening['swing'] })}
              >
                <option value="left">Налево (петли у точки a)</option>
                <option value="right">Направо (петли у точки b)</option>
                <option value="sliding">Раздвижная</option>
                <option value="none">Без полотна (проём)</option>
              </select>
            </div>
            <div className="props-row">
              <label>Сторона петель</label>
              <select
                value={opening.hingeSide ?? 'in'}
                onChange={(e) => onUpdate({ hingeSide: e.target.value as 'in' | 'out' })}
              >
                <option value="in">Внутрь помещения</option>
                <option value="out">Наружу помещения</option>
              </select>
            </div>
          </>
        )}

        {!isDoor && (
          <>
            <div className="props-row">
              <label>Высота окна</label>
              <NumInput
                value={opening.height ?? 1500}
                onChange={(v) => onUpdate({ height: v })}
                suffix="см"
              />
            </div>
            <div className="props-row">
              <label>Высота от пола</label>
              <NumInput
                value={opening.sillHeight ?? 850}
                onChange={(v) => onUpdate({ sillHeight: v })}
                suffix="см"
              />
            </div>
          </>
        )}

        <div className="muted" style={{ fontSize: 11, marginTop: 12, lineHeight: 1.4 }}>
          Длина стены: <strong>{Math.round(wallLen / 10)} см</strong>.
          Изменения откатываются <span className="kbd">Ctrl+Z</span>.
        </div>
      </div>
    </div>
  );
}

const ROOM_KIND_LABELS: Record<Room['kind'], string> = {
  living: 'Жилая комната',
  kitchen: 'Кухня',
  bath: 'Ванная',
  wc: 'Туалет',
  hall: 'Коридор / прихожая',
  balcony: 'Балкон',
};

function RoomEditor({ room, onUpdate, onRemove }: {
  room: Room;
  onUpdate: (patch: Partial<Room>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="panel" style={{ flex: 1, minHeight: 0 }}>
      <div className="panel-header">
        Свойства комнаты
        <button className="btn btn--small" style={{ marginLeft: 'auto' }} onClick={onRemove} title="Удалить комнату (полигон + подпись)">Удалить</button>
      </div>
      <div className="panel-body" style={{ flex: 1 }}>
        <div style={{ marginBottom: 6 }}>
          <span className="tag" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>{ROOM_KIND_LABELS[room.kind]}</span>
        </div>

        <div className="props-row">
          <label>Название</label>
          <input
            type="text"
            defaultValue={room.name}
            placeholder="Например, Спальня 1"
            onBlur={(e) => onUpdate({ name: e.target.value.trim() || room.name })}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          />
        </div>

        <div className="props-row">
          <label>Тип</label>
          <select
            value={room.kind}
            onChange={(e) => onUpdate({ kind: e.target.value as Room['kind'] })}
          >
            {(Object.keys(ROOM_KIND_LABELS) as Room['kind'][]).map((k) => (
              <option key={k} value={k}>{ROOM_KIND_LABELS[k]}</option>
            ))}
          </select>
        </div>

        <div className="props-row">
          <label>Площадь (м²)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            defaultValue={room.area}
            onBlur={(e) => {
              const v = parseFloat(e.target.value.replace(',', '.'));
              if (Number.isFinite(v) && v >= 0) onUpdate({ area: +v.toFixed(2) });
              else e.target.value = String(room.area);
            }}
          />
        </div>

        <div className="props-row" style={{ gridTemplateColumns: '1fr', alignItems: 'start' }}>
          <label style={{ marginBottom: 4 }}>Заметка</label>
          <textarea
            defaultValue={room.notes ?? ''}
            placeholder="Свободные заметки про эту комнату"
            rows={3}
            onBlur={(e) => onUpdate({ notes: e.target.value.trim() || undefined })}
            style={{ width: '100%', resize: 'vertical', minHeight: 60 }}
          />
        </div>

        <div className="muted" style={{ fontSize: 11, marginTop: 12, lineHeight: 1.4 }}>
          Полигон комнаты редактируется маркерами на её вершинах прямо на холсте.
          Изменения откатываются <span className="kbd">Ctrl+Z</span>.
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
