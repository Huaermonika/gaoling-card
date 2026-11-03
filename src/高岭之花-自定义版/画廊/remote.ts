/** 官方图同步：拉 manifest → 比对版本 → 下载缺失文件 → 校验 → 写入 IndexedDB。 */

import { getOfficial, kvGet, kvSet, putOfficial } from './db';
import type { GalleryManifest, ManifestImage } from './types';

/** 官方图仓库；换仓库时只改这里 */
export const OFFICIAL_MANIFEST_URLS = [
  'https://testingcf.jsdelivr.net/gh/Huaermonika/gaoling-card@main/gallery/manifest.json',
  'https://cdn.jsdelivr.net/gh/Huaermonika/gaoling-card@main/gallery/manifest.json',
];

const MANIFEST_VERSION_KEY = 'manifest_version';

async function fetchFirst(urls: string[], init?: RequestInit): Promise<Response> {
  let lastError: unknown;
  for (const url of urls) {
    try {
      const response = await fetch(url, init);
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status} ${url}`);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('请求失败');
}

async function fetchManifest(): Promise<GalleryManifest> {
  const response = await fetchFirst(OFFICIAL_MANIFEST_URLS, { cache: 'no-store' });
  const data = (await response.json()) as GalleryManifest;
  if (!data || typeof data.version !== 'string' || !Array.isArray(data.images)) {
    throw new Error('manifest 格式不正确');
  }
  return data;
}

async function sha256(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function buildUrl(base: string, file: string): string {
  if (/^https?:/i.test(file)) return file;
  return new URL(file, base).href;
}

async function fetchBlob(base: string, file: string): Promise<Blob> {
  const response = await fetch(buildUrl(base, file));
  if (!response.ok) throw new Error(`下载失败：${file}`);
  return response.blob();
}

export interface SyncResult {
  updated: number;
  skipped: number;
  version: string;
}

/** 首次进入或换聊天时调用；失败时静默保留本地缓存 */
export async function syncOfficialGallery(force = false): Promise<SyncResult> {
  const manifest = await fetchManifest();
  const cachedVersion = await kvGet<string>(MANIFEST_VERSION_KEY);
  if (!force && cachedVersion === manifest.version) {
    return { updated: 0, skipped: manifest.images.length, version: manifest.version };
  }

  const base = OFFICIAL_MANIFEST_URLS[0];
  let updated = 0;
  let skipped = 0;

  for (const image of manifest.images) {
    try {
      const existing = await getOfficial(image.id);
      if (!force && existing?.meta.version === manifest.version) {
        skipped++;
        continue;
      }
      const blob = await fetchBlob(base, image.file);
      if (image.sha256 && typeof crypto !== 'undefined' && crypto.subtle) {
        const actual = await sha256(blob);
        if (actual !== image.sha256) throw new Error(`校验失败：${image.id}`);
      }
      const thumbBlob = image.thumb ? await fetchBlob(base, image.thumb) : undefined;
      await putOfficial({
        id: image.id,
        meta: toMeta(image, manifest.version),
        blob,
        thumbBlob,
      });
      updated++;
    } catch (error) {
      console.warn('[画廊] 官方图同步失败', image.id, error);
    }
  }

  await kvSet(MANIFEST_VERSION_KEY, manifest.version);
  return { updated, skipped, version: manifest.version };
}

function toMeta(image: ManifestImage, version: string) {
  return {
    id: image.id,
    title: image.title,
    tags: image.tags ?? [],
    source: 'official' as const,
    characterId: image.characterId,
    description: image.description,
    trigger: image.trigger,
    width: image.width,
    height: image.height,
    bytes: image.bytes,
    version,
    createdAt: Date.now(),
  };
}

/** 当前选择的立绘指针，供界面读取 */
export const CURRENT_ART_KEY = 'ch:gallery:current';

export function readCurrentArt(): { id: string; title: string; at: number } | null {
  try {
    const raw = localStorage.getItem(CURRENT_ART_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeCurrentArt(id: string, title: string): void {
  try {
    localStorage.setItem(CURRENT_ART_KEY, JSON.stringify({ id, title, at: Date.now() }));
    document.dispatchEvent(new CustomEvent('ch:gallery-art', { detail: { id, title } }));
  } catch {
    /* ignore */
  }
}
