import { useState } from 'react';
import { useProject } from '../../store/projectStore';
import { BTI_IMPORT_PROMPT } from '../../templates/btiPrompt';
import { parseFlatTemplateFile, addUserFlatTemplate } from '../../templates/userFlatTemplates';
import type { ProjectData } from '../../types';

type Step = 'prompt' | 'paste';

interface Props {
  onClose: () => void;
}

export function BtiImportDialog({ onClose }: Props) {
  const loadJson = useProject((s) => s.loadJson);
  const objects = useProject((s) => s.objects);

  const [step, setStep] = useState<Step>('prompt');
  const [json, setJson] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(BTI_IMPORT_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback — выделим textarea
      const ta = document.getElementById('bti-prompt-ta') as HTMLTextAreaElement | null;
      ta?.select();
    }
  };

  const apply = () => {
    setErr(null);
    try {
      const { template, name } = parseFlatTemplateFile(json);
      if (objects.length && !confirm('В текущем проекте есть размещённые объекты — они исчезнут при загрузке нового плана. Продолжить?')) return;
      // Сохраним как пользовательский шаблон тоже — пригодится повторно
      const tname = name || prompt('Сохранить этот план как «Мой шаблон»? Введи название (или Cancel чтобы пропустить).', 'Из БТИ ' + new Date().toLocaleDateString('ru-RU'));
      if (tname) addUserFlatTemplate(tname, template as ProjectData);
      loadJson(template as ProjectData);
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? 'Не удалось распарсить JSON');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ minWidth: 720, maxWidth: 820, maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">📷 Импорт скана БТИ через AI</div>
        <div className="modal-b">
          <p className="muted" style={{ margin: '0 0 12px' }}>
            У тебя есть скан БТИ или фото плана? Любая мультимодальная LLM (Claude, ChatGPT-4o, Qwen-VL, Gemini, Llama-Vision) умеет читать чертёж и возвращать готовый JSON для этого приложения.
          </p>

          <div className="bti-steps">
            <button
              className={`bti-step ${step === 'prompt' ? 'bti-step--active' : ''}`}
              onClick={() => setStep('prompt')}
            >
              <span className="bti-step__num">1</span>
              <span>Скопировать промпт</span>
            </button>
            <span className="bti-step__sep">›</span>
            <button
              className={`bti-step ${step === 'paste' ? 'bti-step--active' : ''}`}
              onClick={() => setStep('paste')}
            >
              <span className="bti-step__num">2</span>
              <span>Вставить JSON от LLM</span>
            </button>
          </div>

          {step === 'prompt' && (
            <div style={{ marginTop: 14 }}>
              <ol style={{ margin: '0 0 10px 18px', padding: 0, color: 'var(--ink-soft)', fontSize: 13, lineHeight: 1.55 }}>
                <li>Нажми <strong>«⇧ Скопировать промпт»</strong> ниже.</li>
                <li>Открой любой чат с мультимодальной моделью (Claude.ai, ChatGPT, Gemini, Qwen, …).</li>
                <li>Вставь промпт. Прикрепи фото/скан плана БТИ. Отправь.</li>
                <li>Модель вернёт JSON. Скопируй его и вернись сюда → шаг 2.</li>
              </ol>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <button className="btn btn--small btn--accent" onClick={copyPrompt}>
                  {copied ? '✓ Скопировано' : '⇧ Скопировать промпт'}
                </button>
                <button className="btn btn--small" onClick={() => setStep('paste')}>
                  → Дальше: вставить JSON
                </button>
              </div>
              <textarea
                id="bti-prompt-ta"
                readOnly
                value={BTI_IMPORT_PROMPT}
                style={{
                  width: '100%',
                  height: 280,
                  fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                  fontSize: 11,
                  padding: 10,
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  background: 'var(--bg-soft)',
                  color: 'var(--ink)',
                  resize: 'vertical',
                  whiteSpace: 'pre',
                }}
              />
            </div>
          )}

          {step === 'paste' && (
            <div style={{ marginTop: 14 }}>
              <p className="muted" style={{ fontSize: 12, margin: '0 0 6px' }}>
                Вставь JSON, который вернула модель. Принимаются три формата: чистый <code>ProjectData</code>, <code>{'{'} data: ProjectData {'}'}</code>, <code>{'{'} template: ProjectData {'}'}</code>.
              </p>
              <textarea
                value={json}
                onChange={(e) => { setJson(e.target.value); setErr(null); }}
                placeholder={'{ "version": "1.0", "meta": {...}, "geometry": {...}, ... }'}
                style={{
                  width: '100%',
                  height: 240,
                  fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                  fontSize: 12,
                  padding: 10,
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  background: '#fff',
                  resize: 'vertical',
                  whiteSpace: 'pre',
                }}
              />
              {err && (
                <div className="warning" style={{ marginTop: 8 }}>
                  ⚠ {err}
                </div>
              )}
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button className="btn btn--accent" onClick={apply} disabled={!json.trim()}>
                  Применить как новый план
                </button>
                <button className="btn" onClick={() => setStep('prompt')}>← Назад к промпту</button>
              </div>
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
