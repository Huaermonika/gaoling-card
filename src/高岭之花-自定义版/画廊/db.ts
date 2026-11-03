/** IndexedDB：官方图 / 玩家上传 / 轻量键值。图片存 Blob，localStorage 只放设置。 */

import type { GalleryMeta, GalleryRecord, GalleryStats } from './types';

const DB_NAME = 'ch-gallery';
const DB_VERSION = 1;
const OFFICIAL = 'official_assets';
const PLAYER = 'player_images';
const KV = 'kv';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('当前环境不支持 IndexedDB'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OFFICIAL)) db.createObjectStore(OFFICIAL, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(PLAYER)) db.createObjectStore(PLAYER, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('打开画廊数据库失败'));
  });
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    db =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        const request = run(transaction.objectStore(store));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('画廊数据库操作失败'));
      }),
  );
}

export function putOfficial(record: GalleryRecord): Promise<IDBValidKey> {
  return tx(OFFICIAL, 'readwrite', s => s.put(record));
}

export function getOfficial(id: string): Promise<GalleryRecord | undefined> {
  return tx(OFFICIAL, 'readonly', s => s.get(id));
}

export function listOfficial(): Promise<GalleryRecord[]> {
  return tx(OFFICIAL, 'readonly', s => s.getAll());
}

export function deleteOfficial(id: string): Promise<undefined> {
  return tx(OFFICIAL, 'readwrite', s => s.delete(id));
}

export function putPlayer(record: GalleryRecord): Promise<IDBValidKey> {
  return tx(PLAYER, 'readwrite', s => s.put(record));
}

export function listPlayer(): Promise<GalleryRecord[]> {
  return tx(PLAYER, 'readonly', s => s.getAll());
}

export function deletePlayer(id: string): Promise<undefined> {
  return tx(PLAYER, 'readwrite', s => s.delete(id));
}

export function kvGet<T = unknown>(key: string): Promise<T | undefined> {
  return tx<{ key: string; value: T } | undefined>(KV, 'readonly', s => s.get(key)).then(row => row?.value);
}

export function kvSet<T = unknown>(key: string, value: T): Promise<IDBValidKey> {
  return tx(KV, 'readwrite', s => s.put({ key, value }));
}

function newId(prefix: 'official' | 'player'): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}:${uuid}`;
}

export function makeMeta(input: Partial<GalleryMeta> & Pick<GalleryMeta, 'title' | 'source'>): GalleryMeta {
  return {
    id: input.id ?? newId(input.source),
    title: input.title,
    tags: input.tags ?? [],
    source: input.source,
    characterId: input.characterId,
    description: input.description,
    trigger: input.trigger,
    width: input.width,
    height: input.height,
    bytes: input.bytes,
    createdAt: input.createdAt ?? Date.now(),
    version: input.version,
  };
}

export async function galleryStats(): Promise<GalleryStats> {
  const [official, player] = await Promise.all([listOfficial(), listPlayer()]);
  const bytes = [...official, ...player].reduce((sum, item) => sum + (item.blob?.size ?? 0) + (item.thumbBlob?.size ?? 0), 0);
  return { official: official.length, player: player.length, bytes };
}

export async function clearOfficial(): Promise<void> {
  await tx(OFFICIAL, 'readwrite', s => s.clear());
}
