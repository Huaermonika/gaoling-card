/** 开场落盘：把开场文本写进首楼，同时写入 stat_data 与开场完成标记。 */

import { klona } from 'klona';
import type { OpeningPreset } from './presets';

const CHAT_KEY = 'ch_opening_done';

export function isOpeningDone(): boolean {
  try {
    return Boolean(_.get(getVariables({ type: 'chat' }), CHAT_KEY, false));
  } catch {
    return false;
  }
}

/** 只接管带占位标记的首楼，避免旧聊天打开时误弹开场设置 */
export function isOpeningPending(messageId = 0): boolean {
  if (isOpeningDone()) return false;
  try {
    const messages = getChatMessages(messageId);
    const text = Array.isArray(messages) ? (messages[0]?.message ?? '') : '';
    return text.includes('ch-opening-pending');
  } catch {
    return false;
  }
}

export async function applyOpening(preset: OpeningPreset, messageId: number): Promise<void> {
  const data = klona(preset.data);
  await updateVariablesWith(vars => _.set(vars, 'stat_data', data), { type: 'message', message_id: messageId });

  await setChatMessages([{ message_id: messageId, message: preset.text }], { refresh: 'affected' });

  const chat = (getVariables({ type: 'chat' }) ?? {}) as Record<string, unknown>;
  await replaceVariables({ ...chat, [CHAT_KEY]: true, ch_opening_id: preset.id }, { type: 'chat' });

  // 让脚本与界面重新按新变量加载
  window.setTimeout(() => window.location.reload(), 350);
}
