import type { ProjectData, PlacedObject } from '../types';
import { LAYER_NAME, findCatalog } from '../catalog/catalog';
import { fmtArea, fmtDims, fmtHeight } from './format';
import { pointInPolygon } from './geometry';

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function exportJsonFile(data: ProjectData, name = 'apartment-project.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, name);
}

// «Снимок» всего плана: временно меняем scale/offset stage'а, чтобы вместить весь план,
// рендерим в data URL, потом откатываем.
export function renderFullPlanPng(stage: any, geometry: { bounds: { width: number; height: number } }, opts: { padding?: number; pixelRatio?: number; mimeType?: string; quality?: number; targetWidth?: number } = {}): string {
  const padding = opts.padding ?? 250;
  const pixelRatio = opts.pixelRatio ?? 2;
  const mimeType = opts.mimeType ?? 'image/png';
  const targetWidth = opts.targetWidth ?? 2400;

  const prev = {
    scale: stage.scaleX(),
    x: stage.x(),
    y: stage.y(),
    width: stage.width(),
    height: stage.height(),
  };

  // bounds.height уже включает балкон
  const planW = geometry.bounds.width + padding * 2;
  const planH = geometry.bounds.height + padding * 2;
  const scale = targetWidth / planW;
  const w = Math.round(planW * scale);
  const h = Math.round(planH * scale);

  stage.size({ width: w, height: h });
  stage.scale({ x: scale, y: scale });
  stage.position({ x: padding * scale, y: padding * scale });
  stage.draw();

  const dataUrl = stage.toDataURL({ pixelRatio, mimeType, quality: opts.quality ?? 0.95 });

  // Восстанавливаем
  stage.size({ width: prev.width, height: prev.height });
  stage.scale({ x: prev.scale, y: prev.scale });
  stage.position({ x: prev.x, y: prev.y });
  stage.draw();

  return dataUrl;
}

export function exportPng(stage: any, geometry: any, name = 'apartment-plan.png', pixelRatio = 2) {
  const dataUrl = renderFullPlanPng(stage, geometry, { pixelRatio, targetWidth: 2400 });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

interface RoomReport {
  roomName: string;
  area: number;
  byLayer: Record<string, PlacedObject[]>;
}

export function buildReport(data: ProjectData): RoomReport[] {
  const reports: RoomReport[] = [];
  for (const r of data.geometry.rooms) {
    const inRoom = data.objects.filter((o) => pointInPolygon({ x: o.x, y: o.y }, r.polygon));
    const byLayer: Record<string, PlacedObject[]> = {};
    for (const o of inRoom) {
      const k = o.layer;
      (byLayer[k] ||= []).push(o);
    }
    reports.push({ roomName: r.name, area: r.area, byLayer });
  }
  // Объекты «вне комнат»
  const inAnyRoom = new Set<string>();
  for (const r of data.geometry.rooms) {
    for (const o of data.objects) {
      if (pointInPolygon({ x: o.x, y: o.y }, r.polygon)) inAnyRoom.add(o.id);
    }
  }
  const orphan = data.objects.filter((o) => !inAnyRoom.has(o.id));
  if (orphan.length) {
    const byLayer: Record<string, PlacedObject[]> = {};
    for (const o of orphan) (byLayer[o.layer] ||= []).push(o);
    reports.push({ roomName: 'Вне помещений', area: 0, byLayer });
  }
  return reports;
}

export function exportMarkdown(data: ProjectData, name = 'apartment-brief.md') {
  const md = buildMarkdown(data);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(blob, name);
}

export function buildMarkdown(data: ProjectData): string {
  const reports = buildReport(data);
  const lines: string[] = [];
  lines.push(`# ${data.meta.name}`);
  if (data.meta.address) lines.push(`Адрес: ${data.meta.address}`);
  lines.push('');
  lines.push(`Площадь общая: **${data.meta.totalArea} м²**, жилая: **${data.meta.livingArea} м²**, подсобная: **${data.meta.auxArea} м²**`);
  lines.push(`Объектов в проекте: **${data.objects.length}**`);
  if (data.meta.notes) {
    lines.push('');
    lines.push('## Заметки к проекту');
    lines.push(data.meta.notes);
  }

  lines.push('');
  lines.push('## Геометрия квартиры');
  lines.push('');
  lines.push('| Помещение | Площадь | Размер сторон |');
  lines.push('|---|---|---|');
  for (const r of data.geometry.rooms) {
    const xs = r.polygon.map(p => p.x);
    const ys = r.polygon.map(p => p.y);
    const w = Math.max(...xs) - Math.min(...xs);
    const h = Math.max(...ys) - Math.min(...ys);
    lines.push(`| ${r.name} | ${fmtArea(r.area)} | ${fmtDims(w, h)} |`);
  }

  lines.push('');
  lines.push('## Объекты по комнатам');
  lines.push('');
  lines.push('| Помещение | Площадь | Объектов |');
  lines.push('|---|---|---|');
  for (const r of reports) {
    const total = Object.values(r.byLayer).reduce((s, arr) => s + arr.length, 0);
    lines.push(`| ${r.roomName} | ${r.area ? fmtArea(r.area) : '—'} | ${total} |`);
  }

  for (const r of reports) {
    const layers = Object.keys(r.byLayer);
    if (!layers.length) continue;
    lines.push('');
    lines.push(`## ${r.roomName}${r.area ? ` — ${fmtArea(r.area)}` : ''}`);
    for (const layer of layers) {
      const items = r.byLayer[layer];
      const layerName = LAYER_NAME[layer as keyof typeof LAYER_NAME] ?? layer;
      lines.push('');
      lines.push(`### ${layerName} (${items.length})`);
      lines.push('');
      lines.push('| № | Что | Размер | Высота | X, см | Y, см | Поворот | Заметка |');
      lines.push('|---|---|---|---|---|---|---|---|');
      items.forEach((o, idx) => {
        const cat = findCatalog(o.catalogId);
        const label = o.label ?? cat?.name ?? o.catalogId;
        const dims = fmtDims(o.width, o.depth);
        const height = fmtHeight(o.mountHeight);
        const x = Math.round(o.x / 10);
        const y = Math.round(o.y / 10);
        const rot = `${Math.round(o.rotation)}°`;
        const note = (o.notes ?? '').replace(/\|/g, '\\|');
        lines.push(`| ${idx + 1} | ${label} | ${dims} | ${height} | ${x} | ${y} | ${rot} | ${note} |`);
      });
    }
  }

  // Промпт для AI (любая мультимодальная LLM: Claude, GPT, Qwen-VL, Gemini, Llama-Vision...)
  lines.push('');
  lines.push('## Промпт для AI-анализа');
  lines.push('');
  lines.push('Скопируй текст ниже и приложи файлы из этого пакета (ZIP).');
  lines.push('Подходит для Claude, ChatGPT, Qwen, Gemini и других моделей с поддержкой изображений.');
  lines.push('');
  lines.push('```');
  lines.push('Проанализируй планировку квартиры по приложенным файлам:');
  lines.push('- plan.png — рендер плана со всеми объектами;');
  lines.push('- project.json — машинный формат геометрии и расстановки (координаты в мм);');
  lines.push('- apartment-brief.md — текстовое описание (этот файл).');
  lines.push('');
  lines.push('Найди проблемы по эргономике, проходам, мебели, розеткам и свету.');
  lines.push('Предложи улучшения. Верни изменения СТРОГО в формате JSON-патча:');
  lines.push('');
  lines.push('{');
  lines.push('  "version": "1.0",');
  lines.push('  "ops": [');
  lines.push('    { "op": "move_object", "id": "...", "x": 1500, "y": 2400, "reason": "..." },');
  lines.push('    { "op": "add_object", "object": { "id": "...", "catalogId": "socket-2", "layer": "sockets", "x": ..., "y": ..., "rotation": 0, "width": 160, "depth": 80 }, "reason": "..." },');
  lines.push('    { "op": "delete_object", "id": "...", "reason": "..." },');
  lines.push('    { "op": "remove_opening", "id": "...", "reason": "..." }');
  lines.push('  ]');
  lines.push('}');
  lines.push('');
  lines.push('Поддерживаемые операции: add_object, update_object, move_object, delete_object,');
  lines.push('add_room, update_room, replace_room_polygon, remove_room,');
  lines.push('add_wall, replace_wall, remove_wall, add_opening, update_opening, remove_opening.');
  lines.push('Координаты — в миллиметрах от верхнего-левого угла квартиры.');
  lines.push('```');

  lines.push('');
  lines.push('---');
  lines.push(`Сформировано: ${new Date().toLocaleString('ru-RU')}`);

  return lines.join('\n');
}

export async function exportPdf(stage: any, geometry: any, data: ProjectData, name = 'apartment-plan.pdf') {
  const { jsPDF } = await import('jspdf');
  const dataUrl = renderFullPlanPng(stage, geometry, { pixelRatio: 2, mimeType: 'image/jpeg', quality: 0.92, targetWidth: 2800 });
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const margin = 12;

  // Шапка
  pdf.setFontSize(16);
  pdf.text(data.meta.name, margin, margin + 6);
  pdf.setFontSize(10);
  pdf.setTextColor(120);
  const subtitle = `Площадь ${data.meta.totalArea} м²  ·  жилая ${data.meta.livingArea} м²  ·  объектов ${data.objects.length}  ·  ${new Date().toLocaleDateString('ru-RU')}`;
  pdf.text(subtitle, margin, margin + 11);
  pdf.setTextColor(0);

  // План — оставим место под легенду справа
  const planMaxW = pageW - margin * 2 - 90;
  const planMaxH = pageH - margin * 2 - 16;
  const img = new Image();
  img.src = dataUrl;
  await new Promise((r) => (img.onload = r));
  const aspect = img.naturalWidth / img.naturalHeight;
  let w = planMaxW;
  let h = w / aspect;
  if (h > planMaxH) {
    h = planMaxH;
    w = h * aspect;
  }
  pdf.addImage(dataUrl, 'JPEG', margin, margin + 16, w, h);

  // Легенда
  const reports = buildReport(data);
  const legendX = margin + planMaxW + 6;
  let y = margin + 16;
  pdf.setFontSize(11);
  pdf.text('Сводка', legendX, y);
  y += 5;
  pdf.setFontSize(9);
  for (const r of reports) {
    if (y > pageH - 20) {
      pdf.addPage();
      y = margin;
    }
    pdf.setTextColor(40);
    pdf.text(`${r.roomName}${r.area ? `  · ${r.area.toFixed(1).replace('.', ',')} м²` : ''}`, legendX, y);
    y += 4;
    const layers = Object.keys(r.byLayer);
    if (!layers.length) {
      pdf.setTextColor(140);
      pdf.text('—', legendX + 3, y);
      y += 4;
      continue;
    }
    for (const layer of layers) {
      const items = r.byLayer[layer];
      const layerName = LAYER_NAME[layer as keyof typeof LAYER_NAME] ?? layer;
      pdf.setTextColor(80);
      pdf.text(`${layerName} (${items.length})`, legendX + 3, y);
      y += 3.5;
    }
    y += 1;
  }

  pdf.save(name);
}

// «Пакет для AI» — ZIP-архив с уникальным именем по дате/времени.
// Совместим с любой мультимодальной LLM: Claude, GPT-4o, Qwen, Gemini, Llama-Vision и т.п.
// Внутри архива файлы имеют обычные имена.
export async function exportAiPackage(stage: any, geometry: any, data: ProjectData) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  // 1. project.json — машинный формат всей геометрии и расстановки (источник истины)
  zip.file('project.json', JSON.stringify(data, null, 2));

  // 2. apartment-brief.md — человекочитаемое описание + готовый промпт
  zip.file('apartment-brief.md', buildMarkdown(data));

  // 3. plan.png — рендер плана целиком
  const png = renderFullPlanPng(stage, geometry, { pixelRatio: 2, targetWidth: 2400 });
  const pngBlob = await (await fetch(png)).blob();
  zip.file('plan.png', pngBlob);

  // 4. README.txt — короткая инструкция
  zip.file('README.txt', [
    'Flat Planner — экспорт-пакет для AI-анализа',
    '',
    'Файлы:',
    '  project.json        — машинный формат: геометрия + объекты + слои',
    '  apartment-brief.md  — описание + готовый промпт для AI',
    '  plan.png            — рендер плана',
    '',
    'Подходит для Claude, ChatGPT, Qwen, Gemini и других моделей с поддержкой изображений.',
    'Скопируй промпт из apartment-brief.md (раздел «Промпт для AI-анализа») и приложи',
    'все три файла в чат с моделью.',
    '',
    'Чтобы вернуть JSON-патч обратно в приложение — кнопка «⇩ AI-патч».',
    '',
    `Сформировано: ${new Date().toLocaleString('ru-RU')}`,
  ].join('\n'));

  const archiveBlob = await zip.generateAsync({ type: 'blob' });
  const stamp = formatTimestamp(new Date());
  const slug = (data.meta.name || 'apartment').toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'apartment';
  downloadBlob(archiveBlob, `${slug}-${stamp}.zip`);
}

// Алиас для обратной совместимости (если где-то остались импорты старого имени)
export const exportGptPackage = exportAiPackage;

function formatTimestamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}
