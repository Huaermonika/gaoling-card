/** 玩家角色库：IndexedDB 存角色、开场与头像，支持 JSON 导入导出。 */

import type { 记忆条目 } from '../schema';

const DB_NAME = 'ch-role-library';
const DB_VERSION = 1;
const STORE = 'characters';

export interface StoredOpening {
  id: string;
  name: string;
  text: string;
  memories?: 记忆条目[];
}

export interface CharacterProfile {
  姓名: string;
  型号: string;
  外观: string;
  性格: string;
  背景: string;
  关系: string;
}

export interface CharacterWorld {
  持有者称呼: string;
  地点: string;
  时间: string;
  处境: string;
  设定: string;
}

export interface CharacterPreset {
  id: string;
  name: string;
  avatar?: string;
  profile: CharacterProfile;
  openings: StoredOpening[];
  world: CharacterWorld;
  source: 'custom' | 'official-copy';
  /** draft = 从未开始，自动保存；ready = 已经写过首楼 */
  status: 'draft' | 'ready';
  createdAt: number;
  updatedAt: number;
}

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
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('打开角色库失败'));
  });
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    db =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = fn(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('角色库操作失败'));
      }),
  );
}

export function listCharacters(): Promise<CharacterPreset[]> {
  return run('readonly', store => store.getAll()).then(list =>
    list.sort((a, b) => b.updatedAt - a.updatedAt),
  );
}

export function saveCharacter(record: CharacterPreset): Promise<IDBValidKey> {
  return run('readwrite', store => store.put(record));
}

export function deleteCharacter(id: string): Promise<undefined> {
  return run('readwrite', store => store.delete(id));
}

function newId(): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `char:${uuid}`;
}

export function makeCharacter(input: Omit<CharacterPreset, 'id' | 'createdAt' | 'updatedAt'>): CharacterPreset {
  const now = Date.now();
  return { ...input, status: input.status ?? 'draft', id: newId(), createdAt: now, updatedAt: now };
}

/** 导出为可分享的 JSON 文本 */
export function serializeCharacter(record: CharacterPreset): string {
  return JSON.stringify(
    {
      kind: 'gaoling.character',
      version: 1,
      character: toExportShape(record),
    },
    null,
    2,
  );
}

function toExportShape(record: CharacterPreset) {
  return {
    name: record.name,
    avatar: record.avatar ?? '',
    profile: record.profile,
    openings: record.openings,
    world: record.world,
    source: record.source,
    status: record.status,
  };
}

export function serializeCollection(records: CharacterPreset[]): string {
  return JSON.stringify(
    {
      kind: 'gaoling.collection',
      version: 1,
      characters: records.map(toExportShape),
    },
    null,
    2,
  );
}

/** 解析导入文件；只做结构校验，字段缺失时用空串兜底 */
export function parseCharacterFile(text: string): Omit<CharacterPreset, 'id' | 'createdAt' | 'updatedAt'> {
  const raw = JSON.parse(text) as any;
  if (raw?.kind !== 'gaoling.character' || !raw.character) throw new Error('不是角色文件');
  return parseCharacter(raw.character);
}

export function parseCollectionFile(text: string): Omit<CharacterPreset, 'id' | 'createdAt' | 'updatedAt'>[] {
  const raw = JSON.parse(text) as any;
  if (raw?.kind !== 'gaoling.collection' || !Array.isArray(raw.characters)) throw new Error('不是角色合集文件');
  return raw.characters.map((item: any) => parseCharacter(item));
}

function parseCharacter(c: any): Omit<CharacterPreset, 'id' | 'createdAt' | 'updatedAt'> {
  const name = String(c?.name ?? c?.profile?.姓名 ?? '').trim();
  if (!name) throw new Error('角色缺少姓名');
  const profile: CharacterProfile = {
    姓名: String(c.profile?.姓名 ?? name),
    型号: String(c.profile?.型号 ?? ''),
    外观: String(c.profile?.外观 ?? ''),
    性格: String(c.profile?.性格 ?? ''),
    背景: String(c.profile?.背景 ?? ''),
    关系: String(c.profile?.关系 ?? ''),
  };
  const openings: StoredOpening[] = Array.isArray(c.openings)
    ? c.openings
        .filter((item: any) => item?.text)
        .map((item: any, index: number) => ({
          id: String(item.id ?? `opening-${index}`),
          name: String(item.name ?? `开场 ${index + 1}`),
          text: String(item.text),
          memories: Array.isArray(item.memories) ? item.memories : undefined,
        }))
    : [];
  if (!openings.length) throw new Error('角色没有可用开场');

  return {
    name,
    avatar: typeof c.avatar === 'string' ? c.avatar : '',
    profile,
    openings,
    world: {
      持有者称呼: String(c.world?.持有者称呼 ?? '你'),
      地点: String(c.world?.地点 ?? ''),
      时间: String(c.world?.时间 ?? ''),
      处境: String(c.world?.处境 ?? ''),
      设定: String(c.world?.设定 ?? ''),
    },
    source: c.source === 'official-copy' ? 'official-copy' : 'custom',
    status: c.status === 'ready' ? 'ready' : 'draft',
  };
}
