import { useMemo, useRef, useState } from 'react';
import { useProject } from '../../store/projectStore';
import { applyPatch, parsePatch, previewPatch, type GptPatch, type PatchPreview } from '../../utils/patch';

interface Props {
  onClose: () => void;
}

const EXAMPLE = `{
  "version": "1.0",
  "ops": [
    {
      "op": "add_object",
      "object": {
        "id": "demo-bed",
        "catalogId": "bed-160",
        "layer": "furniture",
        "x": 1500, "y": 2400,
        "rotation": 0,
        "width": 1600, "depth": 2000,
        "label": "Кровать (демо)"
      },
      "reason": "Пример: добавить кровать в спальню 1"
    },
    {
      "op": "remove_opening",
      "id": "door-balcony-kitchen",
      "reason": "Пример: убрать дверь на балкон с кухни"
    }
  ]
}`;

export function PatchDialog({ onClose }: Props) {
  const exportJson = useProject((s) => s.exportJson);
  const loadJson   = useProject((s) => s.loadJson);

  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<GptPatch | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const preview = useMemo<PatchPreview | null>(() => {
    if (!parsed) return null;
    try {
      return previewPatch(exportJson(), parsed);
    } catch (e: any) {
      setParseError(e?.message ?? 'Ошибка предпросмотра');
      return null;
    }
  }, [parsed, exportJson]);

  const tryParse = () => {
    setParseError(null);
    if (!text.trim()) { setParsed(null); return; }
    try { setParsed(parsePatch(text)); }
    catch (e: any) { setParseError(e.message); setParsed(null); }
  };

  const handleApply = () => {
    if (!parsed) return;
    const next = applyPatch(exportJson(), parsed);
    loadJson(next);
    onClose();
  };

  const handleFile = (file: File) => {
    const r = new FileReader();
    r.onload = () => {
      const t = r.result as string;
      setText(t);
      try { setParsed(parsePatch(t)); setParseError(null); }
      catch (e: any) { setParseError(e.message); setParsed(null); }
    };
    r.readAsText(file);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ minWidth: 720, maxWidth: 920 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">Импорт GPT-патча</div>
        <div className="modal-b" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Левая: ввод JSON */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <strong>JSON-патч</strong>
              <button className="btn btn--small" onClick={() => fileInput.current?.click()}>↑ Файл…</button>
              <button className="btn btn--small" onClick={() => { setText(EXAMPLE); setParsed(parsePatch(EXAMPLE)); setParseError(null); }}>Пример</button>
              <input ref={fileInput} type="file" accept="application/json,.json" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={tryParse}
              placeholder='{"ops":[{"op":"move_object","id":"...","x":1500,"y":2400}]}'
              style={{ width: '100%', minHeight: 320, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12, padding: 8, border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-card)' }}
            />
            <div className="row" style={{ marginTop: 6 }}>
              <button className="btn btn--small" onClick={tryParse}>Распарсить</button>
              {parseError && <span style={{ color: 'var(--warn)' }}>⚠ {parseError}</span>}
              {!parseError && parsed && <span className="muted">ops: {parsed.ops.length}</span>}
            </div>
          </div>

          {/* Правая: предпросмотр */}
          <div>
            <strong>Предпросмотр изменений</strong>
            <div style={{ marginTop: 6, maxHeight: 360, overflow: 'auto', border: '1px solid var(--line-soft)', borderRadius: 6, background: 'var(--bg-soft)' }}>
              {!preview && <div style={{ padding: 10, color: 'var(--ink-mute)' }}>Вставьте JSON-патч слева, чтобы увидеть, что изменится.</div>}
              {preview && preview.items.length === 0 && <div style={{ padding: 10, color: 'var(--ink-mute)' }}>Нет операций.</div>}
              {preview && preview.items.map((it) => (
                <div key={it.index} style={{ padding: '6px 10px', borderBottom: '1px solid var(--line-soft)', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: it.ok ? 'var(--good)' : 'var(--warn)', fontWeight: 700 }}>{it.ok ? '✓' : '✗'}</span>
                    <span style={{ fontFamily: 'ui-monospace', color: 'var(--ink-soft)' }}>{it.op}</span>
                    <span style={{ flex: 1 }}>{it.summary}</span>
                  </div>
                  {it.reason && <div className="muted" style={{ paddingLeft: 18, fontStyle: 'italic' }}>{it.reason}</div>}
                  {it.error && <div style={{ paddingLeft: 18, color: 'var(--warn)' }}>{it.error}</div>}
                </div>
              ))}
            </div>
            {preview && (
              <div style={{ marginTop: 6, fontSize: 12 }}>
                <span style={{ color: 'var(--good)' }}>✓ {preview.okCount}</span>
                {' · '}
                <span style={{ color: preview.errorCount ? 'var(--warn)' : 'var(--ink-mute)' }}>✗ {preview.errorCount}</span>
              </div>
            )}
          </div>
        </div>
        <div className="modal-f">
          <button className="btn" onClick={onClose}>Отмена</button>
          <button
            className="btn btn--accent"
            disabled={!preview || preview.okCount === 0}
            onClick={handleApply}
            title={preview?.errorCount ? 'Сломанные операции будут пропущены' : ''}
          >
            Apply ({preview?.okCount ?? 0})
          </button>
        </div>
      </div>
    </div>
  );
}
