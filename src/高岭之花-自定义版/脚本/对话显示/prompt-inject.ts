/**
 * 提示词注入 —— 变量快照与记忆块都不写进聊天记录，只在生成时随请求发送。
 *
 * 为什么要这样做：
 * - 变量快照以前由世界书条目直接输出 stat_data，记忆日志在数组里，每轮全量送进提示词；
 * - 记忆块以前拼进玩家消息，用 createChatMessages 写进聊天记录，之后每轮都会重复出现。
 * 现在：
 * - stat_data 复制一份、剔除「记忆日志」与「系统日志」后写进 message 变量 prompt_snapshot，
 *   世界书条目只输出 prompt_snapshot；
 * - 记忆块用 injectPrompts 注入成临时系统提示，不占用聊天楼层；
 * - 每次生成前重算一次，重 roll 后变量回退，注入内容也跟着回退。
 */

import { buildMemoryBlock, readCognition, readMemoryEntries } from '../../界面/控制终端/memory-inject';

const MEMORY_ID = 'ch:memory-block';
const PROFILE_ID = 'ch:profile-block';
const STAT_ROOT = { type: 'message', message_id: -1 } as const;

/** 能注入临时提示词时，档案改由档案块承载；否则留在变量快照里兜底 */
function canInject(): boolean {
  return typeof injectPrompts === 'function';
}

/** 复制 stat_data 并剔除不参与提示词的字段 */
function stripForPrompt(stat: unknown): Record<string, any> | null {
  if (!stat || typeof stat !== 'object') return null;
  const clone = JSON.parse(JSON.stringify(stat)) as Record<string, any>;
  const inject = canInject();
  const 角色 = clone.角色;
  if (角色 && typeof 角色 === 'object') {
    for (const [id, role] of Object.entries(角色)) {
      const item = role as Record<string, any>;
      if (!item) continue;
      // 背景角色只在档案块里出现，快照不再重复
      if (inject && item.类型 === '背景') {
        delete 角色[id];
        continue;
      }
      if (inject) delete item.档案;
      if (item.状态 && typeof item.状态 === 'object') delete item.状态.记忆日志;
    }
  }
  // 系统日志按设定只给玩家看，不构成剧情事实；留在变量与界面里，只是不进提示词
  delete clone.系统日志;
  return clone;
}

// ===== 角色档案块 =====

const PROFILE_TOTAL_LIMIT = 2400;
const OTHER_LIMIT = 400;

function clipText(value: unknown, limit: number): string {
  const text = String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

function archiveOf(role: Record<string, any>): Record<string, any> {
  return role?.档案 && typeof role.档案 === 'object' ? role.档案 : {};
}

/**
 * 当前角色完整档案 + 其他角色摘要。
 * 当前角色的空字段整行省略；其他角色只给姓名、型号与一句摘要，总额受限。
 */
export function buildCharacterProfile(stat: unknown): string {
  const data = stat as Record<string, any> | null;
  if (!data || typeof data !== 'object') return '';
  const 角色 = data.角色;
  if (!角色 || typeof 角色 !== 'object') return '';

  const currentId = String(data.当前角色 ?? '');
  const current = 角色[currentId] as Record<string, any> | undefined;
  if (!current || current.类型 !== '受控') return '';

  const archive = archiveOf(current);
  const lines = ['<character_profile>', '【当前角色档案】'];
  const push = (label: string, value: unknown) => {
    const text = String(value ?? '').trim();
    if (text) lines.push(`${label}：${text}`);
  };
  push('姓名', archive.姓名);
  push('型号', archive.型号);
  push('外观', archive.外观);
  push('性格', archive.性格);
  push('语言习惯', archive.语言习惯);
  push('背景', archive.背景);
  push('关系', archive.关系);
  push('其他', archive.其他);

  const others: string[] = [];
  for (const [id, role] of Object.entries(角色)) {
    if (id === currentId || !role || typeof role !== 'object') continue;
    const item = role as Record<string, any>;
    const a = archiveOf(item);
    const name = String(a.姓名 ?? '').trim() || id;
    if (item.类型 === '受控') {
      const bits: string[] = [];
      if (a.型号) bits.push(`型号 ${clipText(a.型号, 20)}`);
      if (a.性格) bits.push(clipText(a.性格, 50));
      else if (a.关系) bits.push(clipText(a.关系, 50));
      others.push(`- ${name}（受控 · 优先级 ${item.优先级 ?? 1}）${bits.length ? `：${bits.join('；')}` : ''}`);
    } else {
      const bits: string[] = [];
      if (a.外观) bits.push(clipText(a.外观, 30));
      if (a.关系) bits.push(clipText(a.关系, 30));
      others.push(`- ${name}（背景）${bits.length ? `：${bits.join('；')}` : ''}`);
    }
  }

  if (others.length) {
    let block = others.join('\n');
    if (block.length > OTHER_LIMIT) block = `${block.slice(0, OTHER_LIMIT)}…`;
    lines.push('', '【其他角色】', block);
  }

  lines.push('</character_profile>');
  const text = lines.join('\n');
  return text.length > PROFILE_TOTAL_LIMIT ? `${text.slice(0, PROFILE_TOTAL_LIMIT)}\n</character_profile>` : text;
}

function applyProfile(content: string): boolean {
  try {
    uninjectPrompts([PROFILE_ID]);
    if (content) {
      injectPrompts([
        {
          id: PROFILE_ID,
          position: 'in_chat',
          depth: 0,
          role: 'system',
          content,
        },
      ]);
    }
    return true;
  } catch {
    return false;
  }
}

/** 按当前变量重建档案块；切换角色、切换聊天、生成前都调用 */
export function refreshCharacterProfile(stat?: unknown): void {
  const source = stat ?? _.get(getVariables(STAT_ROOT), 'stat_data', {});
  applyProfile(buildCharacterProfile(source));
}

/** 构建要注入的变量快照文本 */
export function buildVariablesSnapshot(stat: unknown): string {
  const clone = stripForPrompt(stat);
  if (!clone) return '';
  return `<status_current_variable>\n${JSON.stringify(clone)}\n</status_current_variable>`;
}

/**
 * 把整份 stat_data 直接写进最新楼层。
 *
 * 心跳提交（电量等）只改了本地 data，正常情况下由深监听异步回写；但发送消息时新楼层的
 * 初始化可能早于这次回写，新楼层拿到的是提交前的旧值，轮询再把它同步回本地，提交就丢了。
 * 发送前后各调一次，让最新楼层（以及随后生成的新楼层）继承的始终是已提交的状态。
 */
export function flushStateToVariables(stat?: unknown): boolean {
  const source = stat ?? (_.get(getVariables(STAT_ROOT), 'stat_data', {}) as unknown);
  if (!source || typeof source !== 'object') return false;
  try {
    const clone = JSON.parse(JSON.stringify(source));
    updateVariablesWith(vars => _.set(vars, 'stat_data', clone), STAT_ROOT);
    return true;
  } catch {
    return false;
  }
}

/** 写入 prompt_snapshot，供世界书「变量列表」条目读取 */
export function refreshVariableSnapshot(stat?: unknown): boolean {
  const source = stat ?? (_.get(getVariables(STAT_ROOT), 'stat_data', {}) as unknown);
  const clone = stripForPrompt(source);
  if (!clone) return false;
  try {
    updateVariablesWith(vars => _.set(vars, 'prompt_snapshot', clone), STAT_ROOT);
    return true;
  } catch {
    return false;
  }
}

/** 当前环境是否支持提示词注入 */
export function canInjectPrompts(): boolean {
  return typeof injectPrompts === 'function';
}

/** 玩家发送时注入过的记忆块；这次生成沿用它（含「本轮变更」），生成结束后作废 */
let pendingMemory: string | null = null;

function applyInjection(content: string): boolean {
  try {
    uninjectPrompts([MEMORY_ID]);
    if (content) {
      injectPrompts([
        {
          id: MEMORY_ID,
          position: 'in_chat',
          depth: 0,
          role: 'system',
          content,
        },
      ]);
    }
    return true;
  } catch {
    return false;
  }
}

/** 注入 / 清除本轮记忆块；注入不可用时返回 false，由调用方回退到写进消息 */
export function injectMemoryBlock(content: string): boolean {
  pendingMemory = content;
  return applyInjection(content);
}

/** 按当前变量重建记忆块；重 roll 与继续生成都走这里，保证注入内容与回退后的变量一致 */
export function refreshInjectedMemory(): void {
  pendingMemory = null;
  const stat = _.get(getVariables(STAT_ROOT), 'stat_data', {});
  applyInjection(buildMemoryBlock(readMemoryEntries(stat), undefined, readCognition(stat)));
}

/** 当前聊天载入时刷新快照，并在切换聊天、每次生成前重新写入 */
export function initPromptInjection(): void {
  refreshVariableSnapshot();
  refreshCharacterProfile();
  eventOn(tavern_events.CHAT_CHANGED, () => {
    // 切换聊天时酒馆内部可能还没切完，延后读取，避免把上一段聊天的变量写进新聊天
    setTimeout(() => {
      refreshVariableSnapshot();
      refreshCharacterProfile();
      refreshInjectedMemory();
    }, 500);
  });
  eventOn(tavern_events.GENERATION_STARTED, () => {
    refreshVariableSnapshot();
    refreshCharacterProfile();
    // 玩家刚发送时注入的块带着「本轮变更」，这次直接用；重 roll 或继续生成才按变量重建
    if (pendingMemory !== null) {
      pendingMemory = null;
      return;
    }
    refreshInjectedMemory();
  });
}
