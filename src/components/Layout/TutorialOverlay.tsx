import { useState } from 'react';

const LS_KEY = 'flat-tutorial-seen-v1';

export function hasSeenTutorial(): boolean {
  try { return localStorage.getItem(LS_KEY) === '1'; } catch { return true; }
}

function markSeen() {
  try { localStorage.setItem(LS_KEY, '1'); } catch {}
}

interface Step {
  title: string;
  body: React.ReactNode;
}

const STEPS: Step[] = [
  {
    title: '👋 Это планировщик квартиры',
    body: (
      <>
        Здесь ты делаешь <strong>точную геометрию по БТИ</strong>, расставляешь мебель и розетки, отдаёшь PDF строителю или JSON в любую AI-модель. Всё локально, без регистрации, всё хранится в твоём браузере.
        <br /><br />
        Хочешь сразу попробовать? Жми «Дальше» — я покажу 4 главные кнопки. Не хочешь? Жми «Пропустить» — обучение больше не появится.
      </>
    ),
  },
  {
    title: '✨ Шаг 1. Откуда взять план',
    body: (
      <>
        В правой части тулбара кнопка <strong>«Новый проект»</strong>:
        <ul style={{ margin: '6px 0 0 18px', padding: 0, lineHeight: 1.55 }}>
          <li><strong>Создать с нуля</strong> — введи ширину и высоту в метрах, получишь пустую коробку</li>
          <li><strong>Встроенные</strong> — студия / 1-2-3 комн</li>
          <li><strong>📷 БТИ→AI</strong> (отдельная кнопка) — копируешь промпт, кидаешь его и фото плана в Claude/ChatGPT, получаешь готовый JSON</li>
          <li><strong>Мои шаблоны</strong> — твои сохранённые планы из localStorage</li>
        </ul>
      </>
    ),
  },
  {
    title: '🧱 Шаг 2. Рисование геометрии',
    body: (
      <>
        В тулбаре есть инструменты:
        <ul style={{ margin: '6px 0 0 18px', padding: 0, lineHeight: 1.55 }}>
          <li><strong>🧱 Стена</strong> — клик-клик. Shift — цепочка стен от последней точки</li>
          <li><strong>🏠 Комната</strong> — клики-вершины, замыкаешь Enter или кликом в первую точку</li>
          <li><strong>🚪 Дверь / 🪟 Окно</strong> — клик возле стены, проём встаёт на её ось</li>
        </ul>
        Выделил стену или комнату ▢ Выбором — появятся синие маркеры на концах/вершинах. Тяни их и геометрия меняется. <strong>Ctrl+Z</strong> отменяет любое действие.
      </>
    ),
  },
  {
    title: '🛋 Шаг 3. Мебель и электрика',
    body: (
      <>
        Слева — каталог из 265+ позиций: кровати, кухни, сантехника, розетки, выключатели, свет. Кликаешь по предмету → кликаешь на план — встаёт. Зажми <strong>Shift</strong> при размещении, чтобы ставить много подряд.
        <br /><br />
        Свойства выделенного объекта правишь справа. Перетащи разделитель между «Слои» и «Свойства», чтобы дать одной из панелей больше места.
      </>
    ),
  },
  {
    title: '🤖 Шаг 4. AI и экспорт',
    body: (
      <>
        Кнопка <strong>«📤 Для AI»</strong> собирает план в ZIP (PNG + JSON + Markdown с готовым промптом). Кидаешь в Claude / ChatGPT / Qwen / Gemini, просишь «найди ошибки в эргономике» — модель возвращает JSON-патч. Вставляешь его через <strong>«⇩ AI-патч»</strong> → видишь diff → Apply.
        <br /><br />
        Готово — отдавай <strong>PDF</strong> или <strong>Markdown</strong> строителю. <strong>🔗 Поделиться</strong> создаёт ссылку с проектом в URL.
        <br /><br />
        Все горячие клавиши и подсказки — кнопка <strong>?</strong> в правом краю тулбара. Удачи!
      </>
    ),
  },
];

export function TutorialOverlay({ onClose }: { onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  const step = STEPS[idx];
  const isLast = idx === STEPS.length - 1;

  const finish = () => { markSeen(); onClose(); };
  const skip = () => { markSeen(); onClose(); };

  return (
    <div className="modal-backdrop" onClick={skip}>
      <div className="modal tutorial" style={{ minWidth: 520, maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-h" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span>{step.title}</span>
          <button
            type="button"
            className="btn btn--small"
            onClick={skip}
            title="Больше не показывать"
            style={{ flex: '0 0 auto' }}
          >
            Пропустить обучение
          </button>
        </div>
        <div className="modal-b" style={{ minHeight: 180, lineHeight: 1.5 }}>
          {step.body}
        </div>
        <div className="modal-f" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="tutorial-dots" aria-hidden="true">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`tutorial-dot ${i === idx ? 'tutorial-dot--active' : ''}`}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {idx > 0 && (
              <button className="btn btn--small" onClick={() => setIdx((i) => Math.max(0, i - 1))}>← Назад</button>
            )}
            {!isLast && (
              <button className="btn btn--small btn--accent" onClick={() => setIdx((i) => Math.min(STEPS.length - 1, i + 1))}>
                Дальше →
              </button>
            )}
            {isLast && (
              <button className="btn btn--small btn--accent" onClick={finish}>Понятно, поехали</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
