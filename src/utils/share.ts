// Сжатие проекта в URL-hash для шеринга. Используется встроенный CompressionStream(gzip)
// + base64url. Проект ~22 КБ JSON → ~7-8 КБ gzipped → ~10-11 КБ base64url. Помещается в URL.

import type { ProjectData } from '../types';

const HASH_PREFIX = 'p=';

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64url.length + 3) % 4);
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function compress(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

async function decompress(bytes: Uint8Array): Promise<string> {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(stream).text();
}

/** Build a complete shareable URL with project data in the hash. */
export async function buildShareUrl(data: ProjectData): Promise<string> {
  const json = JSON.stringify(data);
  const compressed = await compress(json);
  const b64 = bytesToBase64Url(compressed);
  const base = `${location.origin}${location.pathname}`;
  return `${base}#${HASH_PREFIX}${b64}`;
}

/** Read project from current location.hash if it has the right prefix; otherwise null. */
export async function tryLoadFromHash(): Promise<ProjectData | null> {
  const h = location.hash.replace(/^#/, '');
  if (!h.startsWith(HASH_PREFIX)) return null;
  try {
    const b64 = h.slice(HASH_PREFIX.length);
    const bytes = base64UrlToBytes(b64);
    const json = await decompress(bytes);
    const data = JSON.parse(json) as ProjectData;
    if (!data.geometry || !data.meta) return null;
    return data;
  } catch (e) {
    console.warn('Failed to decode share hash:', e);
    return null;
  }
}

/** Strip the share prefix from URL hash without page reload. */
export function clearShareHash() {
  if (location.hash.startsWith('#' + HASH_PREFIX)) {
    history.replaceState(null, '', location.pathname + location.search);
  }
}
