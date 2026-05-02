# Flat Planner

Веб-планировщик квартиры на React + Konva. Делает то, что нужно для **реального ремонта**: точная геометрия по БТИ, расстановка мебели/техники/сантехники, **полный электрический проект** (розетки, выключатели, свет, слаботочка), экспорт для строителей и для AI-моделей.

> Простой, локальный, бесплатный, без регистрации. Всё в браузере. Геометрия и расстановка живут в одном `project.json`.

![Главный вид плана](docs/screenshots/main.png)

---

## ✨ Что внутри

- 🏠 **Точная геометрия** — стены, скосы, ниши, окна, двери с правильными дугами открывания на любых стенах (включая диагональные)
- 🛋 **265+ позиций каталога** — мебель, техника (Bosch, Tion и др.), сантехника, светильники, кондиционеры, бризеры
- ⚡ **Электрика** — розетки 220V и 32A, IP44 для влажных зон, выключатели (одно-/двух-/трёхклавишные, проходные, диммеры), свет (потолочные/споты/трек/LED/бра/торшеры/IP44 для ванной), слаботочка (RJ45, ТВ, антенна, HDMI)
- 🧩 **Свои предметы** — конструктор форм: прямоугольник, круг, **L-форма** (4 ориентации с настраиваемыми ногами), **произвольный полигон**. Сохраняются в localStorage, экспортируются/импортируются JSON
- 🤖 **AI-патчи** — отправляешь архив (план + JSON + Markdown) в **любую мультимодальную LLM** (Claude / ChatGPT / Qwen / Gemini / Llama-Vision …), получаешь JSON-патч с правками, приложение показывает diff и применяет одним кликом
- 🆕 **Шаблоны квартир** — студия / 1-2-3 комн / blank, выбор одной кнопкой
- 📐 **Линейка**, привязка к сетке (1/5/10/20 см), поворот с visual handle на канвасе (snap 15°, Shift — свободно)
- 🧱 **Wall-mounted** — ТВ/кондиционеры/бризеры/полотенцесушители при размещении автоматически прилипают к ближайшей стене
- 🖼 **Экспорт**: ZIP с timestamp, PNG, PDF (A3 ландшафт), JSON, Markdown с таблицами по комнатам
- 👁 **Слои**: стены, двери, окна, подписи, мебель, техника, сантехника, розетки, выключатели, свет, слаботочка, заметки — каждый можно скрыть отдельно
- ↻ **Поворот всего плана** на 90°/180°/270°
- 🇷🇺 Размеры внутри в **миллиметрах** (стандарт стройки), в UI — в **см / м** (понятно)

## 📸 Скриншоты

| | |
|---|---|
| **Узел санузла** со скошенной фасадной стеной — двери ванной и туалета на диагональной стенке открываются правильными дугами | ![Санузел](docs/screenshots/sanitary-zoom.png) |
| **«✨ Новый проект»** — выбор шаблона квартиры одной кнопкой | ![Новый проект](docs/screenshots/new-project-dialog.png) |
| **«⇩ AI-патч»** — вставляешь JSON от любой LLM, видишь diff построчно, применяешь по кнопке Apply | ![AI-патч](docs/screenshots/ai-patch-dialog.png) |
| **«+ Новый»** — конструктор пользовательских предметов: прямоугольник / круг / L-форма / произвольный полигон | ![Свой предмет](docs/screenshots/custom-item-dialog.png) |

## 🚀 Быстрый старт

```bash
git clone https://github.com/Ko-nD/flat-planner.git
cd flat-planner
npm install
npm run dev
```

Откроется http://localhost:5180

## 📋 Workflow

1. **Выбери шаблон или загрузи свой план** — кнопка **«✨ Новый проект»** в Toolbar (студия / 1-2-3 комн / blank). Или открой `public/project.json` в редакторе и подставь свою геометрию (см. формат ниже). Или нажми **«↑ Загрузить»** и подгрузи готовый JSON.
2. **Расставь мебель** — клик по предмету в каталоге → клик на план. Можно сразу применять **готовые шаблоны** электрики (кровать с розетками и бра, ТВ-зона, кухонный блок и т.д.).
3. **Получи правки от AI** — нажми **«📤 Для AI»**, кинь ZIP в любой чат с моделью с поддержкой изображений (Claude, ChatGPT, Qwen, Gemini …) и попроси «найди ошибки в эргономике и розетках».
4. **Примени патч** — **«⇩ AI-патч»** → вставь JSON → увидишь превью изменений → **Apply**.
5. **Отдай строителю** — экспорт PDF или Markdown со всеми координатами в см.

## 🧠 Совместимые AI-модели

Любая мультимодальная LLM, которая принимает картинки и возвращает текст:

| Модель | Где | Заметки |
|---|---|---|
| **Anthropic Claude** (Opus / Sonnet) | claude.ai | хорошо понимает архитектурные планы и JSON-схемы |
| **OpenAI GPT-4o / o1** | chat.openai.com | возвращает JSON по запросу, надёжно |
| **Qwen-VL** (`qwen2-vl-72b`, `qwen-vl-max`) | chat.qwen.ai / API | отличный анализ изображений, бесплатный лимит |
| **Google Gemini** (Pro / Flash) | gemini.google.com | большое контекстное окно для длинных проектов |
| **Llama-Vision** / **Mistral Pixtral** | self-hosted, OpenRouter | для офлайн-работы |

Внутри ZIP-пакета (кнопка **«📤 Для AI»**) лежит готовый промпт в `apartment-brief.md` — просто скопируй его в чат и приложи три файла.

## 📁 Формат `project.json`

```json
{
  "version": "1.0",
  "meta": { "name": "Моя квартира", "totalArea": 60.5, "livingArea": 44.8, "auxArea": 14.4 },
  "geometry": {
    "bounds": { "width": 6130, "height": 10820 },
    "rooms": [
      { "id": "r1", "name": "Спальня 1", "kind": "living", "area": 14.9,
        "polygon": [{"x":0,"y":0},{"x":3070,"y":0},{"x":3070,"y":4860},{"x":0,"y":4860}] }
    ],
    "walls": [
      { "id": "ext-n", "a": {"x":0,"y":0}, "b": {"x":6130,"y":0}, "thickness": 250, "external": true }
    ],
    "openings": [
      { "id": "win-r1", "kind": "window", "wallId": "ext-n",
        "offset": 1500, "width": 1500, "sillHeight": 850, "height": 1500 }
    ]
  },
  "objects": [
    { "id": "abc", "catalogId": "bed-160", "layer": "furniture",
      "x": 1500, "y": 2400, "rotation": 0, "width": 1600, "depth": 2000 }
  ],
  "layerVisibility": { "walls": true, "doors": true }
}
```

Все размеры — в **миллиметрах**. Координаты от внутреннего верхнего-левого угла квартиры.

## 🤖 Формат AI-патча

```json
{
  "version": "1.0",
  "ops": [
    { "op": "move_object", "id": "abc", "x": 1800, "y": 2400, "reason": "перенести кровать к стене" },
    { "op": "add_object", "object": {
      "id": "new1", "catalogId": "socket-2", "layer": "sockets",
      "x": 1700, "y": 2200, "rotation": 0, "width": 160, "depth": 80, "mountHeight": 300
    } },
    { "op": "remove_opening", "id": "door-balcony-kitchen" },
    { "op": "replace_room_polygon", "id": "bath", "polygon": [] },
    { "op": "remove_wall", "id": "w-old" }
  ]
}
```

Поддерживаемые операции:

- **Объекты**: `add_object` · `update_object` · `move_object` · `delete_object`
- **Помещения**: `add_room` · `update_room` · `replace_room_polygon` · `remove_room`
- **Стены**: `add_wall` · `replace_wall` · `remove_wall` (заодно убирает все openings на этой стене)
- **Проёмы**: `add_opening` · `update_opening` · `remove_opening`

Каждая операция принимает опциональное поле `reason` — оно показывается в превью. Сломанные операции пропускаются при Apply, успешные — применяются.

Готовый промпт лежит в `apartment-brief.md` внутри ZIP-пакета — просто перешли пакет любой AI-модели и попроси «верни JSON-патч».

## ⌨️ Горячие клавиши

| Клавиша | Действие |
|---|---|
| Колесо мыши | Зум |
| Space + drag, средняя кнопка | Пан |
| `V` / `H` / `M` | Выбор / Пан / Линейка |
| `G` | Сетка вкл/выкл |
| `R` / `Shift+R` | Поворот ±15° |
| `Del` | Удалить выделенное |
| `Ctrl+D` | Дублировать |
| `Esc` | Снять выделение / выйти из placement |
| `Shift` при клике-размещении | Не выходить из режима — ставить много подряд |

## 🛠 Стек

- React 19 + TypeScript + Vite
- [Konva](https://konvajs.org) (`react-konva`) для канваса
- [Zustand](https://zustand.docs.pmnd.rs/) для состояния
- [JSZip](https://stuk.github.io/jszip/) для пакета «Для AI»
- [jsPDF](https://github.com/parallax/jsPDF) + html2canvas для PDF

## 🔧 Разработка

```bash
npm run dev      # дев-сервер на 5180 с HMR
npm run build    # production build
npm run preview  # просмотр прод-версии
```

Структура:

```
src/
├── data/apartment.ts          # fallback-импорт public/project.json
├── catalog/
│   ├── catalog.ts             # 265+ позиций каталога
│   └── templates.ts           # готовые шаблоны электрики
├── templates/
│   └── flatTemplates.ts       # 5 шаблонов квартир для «Новый проект»
├── store/projectStore.ts      # zustand: state + persistence + bootstrap fetch
├── utils/
│   ├── geometry.ts            # nearestWall, openingSegment, polygonArea...
│   ├── format.ts              # mm ↔ см ↔ м, парсинг ввода
│   ├── patch.ts               # AI-патч: parse/preview/apply
│   └── export.ts              # PNG / PDF / Markdown / ZIP
├── components/
│   ├── Canvas/                # PlanCanvas, Walls, Openings, Rooms, ObjectShape, RotateHandle...
│   └── Layout/                # Toolbar, Library, LayersPanel, Properties, Statusbar, PatchDialog
└── types/index.ts             # все типы
```

`public/project.json` — единственный источник истины для геометрии. После правки — кнопка **«↻ Шаблон»** или `localStorage.removeItem('flat-planner-project-v2')` + reload.

## 🔒 Личная работа без коммитов

Если ты форкнул репо чтобы спланировать **свою** квартиру, а демо в `public/project.json` хочешь оставить как есть для других — есть два способа.

**Способ 1: localStorage (рекомендую)**
Просто работай в UI. Всё автосохраняется в браузере. В репо ничего не уходит. Скачивай бэкапы через **JSON** в Toolbar и клади в локальную папку `private/` — она в `.gitignore`.

**Способ 2: skip-worktree (если редактируешь `public/project.json` напрямую)**
После первого коммита заморозь файл локально:

```bash
git update-index --skip-worktree public/project.json
```

Теперь твои локальные правки этого файла Git **не видит** — `git status` молчит, push ничего не отправляет. В репо демо остаётся стабильным.

Чтобы потом подтянуть обновления из main:
```bash
git update-index --no-skip-worktree public/project.json
git pull
git update-index --skip-worktree public/project.json
```

Откатить весь skip-worktree:
```bash
git update-index --no-skip-worktree public/project.json
```

## 🧭 Roadmap

- [x] Кнопка «Новый проект» с шаблонами квартир (студия / 1-2-3 комн / blank)
- [x] Свои предметы: rect / circle / L-shape / polygon + редактирование шаблонов
- [x] AI-патчи (Claude / GPT / Qwen / Gemini / etc.)
- [ ] Импорт скана БТИ как фоновое изображение для обведения
- [ ] Wall editor в UI (drag вершин, добавить/удалить стену)
- [ ] Mobile read-only режим
- [ ] EN-локализация
- [ ] Shareable URL (project в hash)
- [ ] Tutorial overlay при первом заходе
- [ ] CI: автодеплой на GitHub Pages

## 🤝 Contributing

PR-ы приветствуются. Перед коммитом проверь:

```bash
npx tsc --noEmit
npm run build
```

## 📝 License

MIT — см. [LICENSE](LICENSE)

---

Сделано для своих ремонтов и проектов перепланировки. Если пригодилось — поставь ⭐ и форкни под свою квартиру.
