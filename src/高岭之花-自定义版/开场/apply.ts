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
    const messages = getChatMessages(messageId) as any;
    const first = Array.isArray(messages) ? messages[0] : messages;
    const text = String(first?.message ?? '');
    // 酒馆可能把首楼的 HTML 注释剥掉，所以同时认可见的占位句
    if (text.includes('ch-opening-pending') || text.includes('终端正在初始化')) return true;
    // 极端情况下占位文本被清空：只有首楼、且没写过开场，也接管
    return !text.trim() && getLastMessageId() === 0;
  } catch {
    return false;
  }
}

export async function applyOpening(preset: OpeningPreset, messageId: number): Promise<void> {
  const data = klona(preset.data);
  await updateVariablesWith(vars => _.set(vars, 'stat_data', data), { type: 'message', message_id: messageId });

  // 首楼只写正文；initvar 已经单独写进 stat_data，不再留在聊天记录里
  const text = preset.text
    .replace(/<initvar>[\s\S]*?<\/initvar>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();

  await setChatMessages([{ message_id: messageId, message: text }], { refresh: 'affected' });

  const chat = (getVariables({ type: 'chat' }) ?? {}) as Record<string, unknown>;
  await replaceVariables({ ...chat, [CHAT_KEY]: true, ch_opening_id: preset.id }, { type: 'chat' });

  // 让脚本与界面重新按新变量加载
  window.setTimeout(() => window.location.reload(), 350);
}
