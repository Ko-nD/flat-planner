// Пользовательские шаблоны квартир — хранятся в localStorage.
// Формат идентичен встроенным `FLAT_TEMPLATES`, но с флагом userTemplate.

import type { ProjectData } from '../types';
import type { FlatTemplateMeta } from './flatTemplates';

const LS_KEY = 'flat-flat-templates-v1';

export interface UserFlatTemplate extends FlatTemplateMeta {
  userTemplate: true;
  createdAt: number;
}

export function loadUserFlatTemplates(): UserFlatTemplate[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return [];
    return items.map((t: any) => ({ ...t, userTemplate: true as const }));
  } catch { return []; }
}

export function saveUserFlatTemplates(items: UserFlatTemplate[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

export function addUserFlatTemplate(name: string, data: ProjectData, subtitle?: string): UserFlatTemplate {
  const id = 'user-' + Math.random().toString(36).slice(2, 9);
  const subtitleAuto = `${data.geometry.rooms.length} помещений · ${data.meta.totalArea} м²`;
  const item: UserFlatTemplate = {
    id,
    title: name.trim() || 'Без названия',
    subtitle: subtitle?.trim() || subtitleAuto,
    data,
    userTemplate: true,
    createdAt: Date.now(),
  };
  const list = loadUserFlatTemplates();
  saveUserFlatTemplates([...list, item]);
  return item;
}

export function removeUserFlatTemplate(id: string) {
  saveUserFlatTemplates(loadUserFlatTemplates().filter((t) => t.id !== id));
}

export function renameUserFlatTemplate(id: string, name: string) {
  const list = loadUserFlatTemplates();
  saveUserFlatTemplates(list.map((t) => t.id === id ? { ...t, title: name.trim() || t.title } : t));
}

// Жёсткая валидация JSON-файла шаблона
export function parseFlatTemplateFile(json: string): { template: ProjectData; name?: string } {
  const parsed = JSON.parse(json);
  // Допускаем 3 формата:
  //   1) ProjectData напрямую (как экспорт «JSON» из Toolbar)
  //   2) { name?: string, data: ProjectData }
  //   3) { template: ProjectData, name?: string }
  let data: ProjectData | undefined;
  let name: string | undefined;
  if (parsed?.geometry && parsed?.meta && parsed?.version) {
    data = parsed as ProjectData;
    name = parsed.meta?.name;
  } else if (parsed?.data?.geometry) {
    data = parsed.data as ProjectData;
    name = parsed.name ?? parsed.title;
  } else if (parsed?.template?.geometry) {
    data = parsed.template as ProjectData;
    name = parsed.name ?? parsed.title;
  }
  if (!data || !data.geometry || !data.meta) throw new Error('JSON не похож на ProjectData');
  return { template: data, name };
}
