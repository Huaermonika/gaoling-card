/**
 * 额外提示词 —— 玩家自行填写的一段文字，随终端发送的玩家消息一起发出。
 *
 * 发送位置：紧跟在 <ch_state_update> 变量更新告知之后，中间空一行，不并入该标签内部。
 * 显示处理：外层包 <ch_extra>，由角色卡正则「[隐藏]额外提示词」在显示时抹掉，提示词保留。
 * 存储：localStorage（key = ch:extra-prompt），不进入变量，不跨聊天同步。
 */

const LS_KEY = 'ch:extra-prompt';

export interface ExtraPromptSettings {
  /** 玩家填写的原文，留空表示不发送 */
  内容: string;
}

const DEFAULT_SETTINGS: ExtraPromptSettings = { 内容: '' };

function loadSettings(): ExtraPromptSettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<ExtraPromptSettings>;
    return { 内容: typeof parsed.内容 === 'string' ? parsed.内容 : '' };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export const extraPromptSettings = reactive<ExtraPromptSettings>(loadSettings());

export function saveExtraPromptSettings(patch?: Partial<ExtraPromptSettings>): void {
  if (patch) Object.assign(extraPromptSettings, patch);
  if (typeof extraPromptSettings.内容 !== 'string') extraPromptSettings.内容 = '';
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(extraPromptSettings));
  } catch {
    /* ignore */
  }
}

/** 拼成要附在玩家消息里的块；没填时返回空串 */
export function buildExtraPromptBlock(): string {
  const text = extraPromptSettings.内容.trim();
  return text ? `<ch_extra>\n${text}\n</ch_extra>` : '';
}
