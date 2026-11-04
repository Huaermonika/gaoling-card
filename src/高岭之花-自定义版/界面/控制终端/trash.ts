/** 角色回收站：删除的角色先存在聊天变量里，可恢复或彻底删除。 */

import { klona } from 'klona';

const KEY = 'ch_role_trash';
const LIMIT = 20;

export interface TrashEntry {
  /** 删除时的角色 id，恢复时若冲突会另生成 id */
  id: string;
  role: any;
  art: string;
  deletedAt: number;
}

function read(): TrashEntry[] {
  try {
    const vars = getVariables({ type: 'chat' }) as Record<string, any> | null;
    const list = vars?.[KEY];
    if (!Array.isArray(list)) return [];
    return list.filter(item => item && typeof item === 'object' && item.role);
  } catch {
    return [];
  }
}

function write(list: TrashEntry[]): void {
  try {
    void updateVariablesWith(vars => _.set(vars, KEY, list), { type: 'chat' });
  } catch {
    /* 变量接口不可用时只保留本次会话内的数据 */
  }
}

export function listTrash(): TrashEntry[] {
  return read();
}

export function addToTrash(id: string, role: any, art: string): void {
  const list = read().filter(item => item.id !== id);
  list.unshift({ id, role: klona(role), art, deletedAt: Date.now() });
  write(list.slice(0, LIMIT));
}

export function removeFromTrash(id: string): void {
  write(read().filter(item => item.id !== id));
}
