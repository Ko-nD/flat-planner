// Fallback-проект на случай, если public/project.json не загрузился.
// Импортируется НАПРЯМУЮ из того же JSON-файла, что лежит в public/,
// поэтому fallback и runtime-template не расходятся.
//
// ИСТОЧНИК ИСТИНЫ — public/project.json. Здесь только thin re-export.

import projectData from '../../public/project.json';
import type { ApartmentGeometry, ProjectData, ProjectMeta } from '../types';

export const FALLBACK_PROJECT: ProjectData = projectData as unknown as ProjectData;
export const APARTMENT: ApartmentGeometry = FALLBACK_PROJECT.geometry;
export const META: ProjectMeta = FALLBACK_PROJECT.meta;
