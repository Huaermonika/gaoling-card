/** 开场落盘：把开场文本写进首楼，同时写入 stat_data 与开场完成标记。 */

import { klona } from 'klona';
import { stripOpeningHidden, type OpeningPreset } from './presets';

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
    const visible = text.replace(/[\s\u200b]/g, '');
    // 酒馆可能把首楼的 HTML 注释剥掉，零宽字符也不可见
    if (visible.includes('ch-opening-pending')) return true;
    if (!visible && getLastMessageId() === 0) return true;
    return false;
  } catch {
    return false;
  }
}

export async function applyOpening(preset: OpeningPreset, messageId: number): Promise<void> {
  const data = klona(preset.data);
  await updateVariablesWith(vars => _.set(vars, 'stat_data', data), { type: 'message', message_id: messageId });

  // 首楼只写正文；initvar 和提示词块都不留在聊天记录里
  const text = stripOpeningHidden(preset.text);

  await setChatMessages([{ message_id: messageId, message: text }], { refresh: 'affected' });

  const chat = (getVariables({ type: 'chat' }) ?? {}) as Record<string, unknown>;
  await replaceVariables({ ...chat, [CHAT_KEY]: true, ch_opening_id: preset.id }, { type: 'chat' });

  // 让脚本与界面重新按新变量加载
  window.setTimeout(() => window.location.reload(), 350);
}
