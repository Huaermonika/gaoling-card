/**
 * 楼层读取窗口：只保留最近两个千鹤楼层（以及它们之间的玩家楼层）参与界面渲染与 AI 上下文。
 * 更老的楼层：界面整楼隐藏，并标记为「不发给 AI」；回到窗口内的楼层会恢复。
 *
 * 隐藏标记写在消息的 extra.ch_old_hidden 上，只恢复本模块自己隐藏的楼层，
 * 玩家手动隐藏的楼层不动。
 */

const KEEP_AI_FLOORS = 2;
const HIDE_CLASS = 'ch-old-floor';
const MARK = 'ch_old_hidden';
const STYLE_ID = 'ch-floor-window-style';

/** 窗口起点缓存：渲染过滤器会频繁调用，楼层变化时失效 */
let cached_start = -1;
let applying = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let afterApply: (() => void) | undefined;

function computeStart(): number {
  const last = getLastMessageId();
  if (last < 0) return 0;
  const assistants = getChatMessages(`0-${last}`, { role: 'assistant' });
  if (assistants.length <= KEEP_AI_FLOORS) return 0;
  return assistants[assistants.length - KEEP_AI_FLOORS].message_id;
}

/** 窗口起点：倒数第二个千鹤楼层的楼层号；不足两个时从 0 开始 */
export function windowStart(): number {
  if (cached_start < 0) cached_start = computeStart();
  return cached_start;
}

export function inWindow(message_id: number): boolean {
  return message_id >= windowStart();
}

function injectStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `.${HIDE_CLASS}{display:none!important}`;
  document.head.appendChild(style);
}

async function applyWindow(): Promise<void> {
  if (applying) return;
  applying = true;
  try {
    cached_start = -1;
    const start = windowStart();
    injectStyle();

    // 界面：窗口外的楼层整楼隐藏
    $('#chat > .mes').each((_i, el) => {
      const id = Number($(el).attr('mesid'));
      if (Number.isNaN(id)) return;
      $(el).toggleClass(HIDE_CLASS, id < start);
    });

    // AI 上下文：窗口外的楼层隐藏，窗口内由本模块隐藏过的楼层恢复
    const changes: Array<{ message_id: number; is_hidden: boolean; extra: Record<string, any> }> = [];
    for (const m of getChatMessages(`0-${getLastMessageId()}`)) {
      if (m.message_id < start) {
        if (m.is_hidden) continue;
        changes.push({ message_id: m.message_id, is_hidden: true, extra: { ...m.extra, [MARK]: true } });
        continue;
      }
      if (m.extra?.[MARK] === true) {
        changes.push({ message_id: m.message_id, is_hidden: false, extra: { ...m.extra, [MARK]: false } });
      }
    }
    if (changes.length) await setChatMessages(changes, { refresh: 'none' });
  } catch (error) {
    console.error('[高岭之花] 楼层窗口处理失败', error);
  } finally {
    applying = false;
    afterApply?.();
  }
}

function scheduleApply(): void {
  cached_start = -1;
  if (timer !== null) return;
  timer = setTimeout(() => {
    timer = null;
    void applyWindow();
  }, 150);
}

/** 挂载楼层窗口；afterApply 用于卸载已经离开窗口的楼层界面 */
export function initFloorWindow(options: { afterApply?: () => void } = {}): void {
  afterApply = options.afterApply;
  cached_start = -1;
  void applyWindow();

  eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, () => scheduleApply());
  eventOn(tavern_events.CHAT_CHANGED, () => scheduleApply());
  eventOn(tavern_events.MESSAGE_SWIPED, () => scheduleApply());
  eventOn(tavern_events.MESSAGE_DELETED, () => scheduleApply());
  eventOn(tavern_events.MESSAGE_RECEIVED, () => scheduleApply());

  // 只观察聊天区的直接子节点：楼层增删会触发，楼层正文的流式更新不会
  const parentWin = window.parent as Window & typeof globalThis;
  if (typeof parentWin.MutationObserver === 'function') {
    const observer = new parentWin.MutationObserver(() => scheduleApply());
    const root = parentWin.document.getElementById('chat') ?? parentWin.document.body;
    observer.observe(root, { childList: true });
    $(window).on('pagehide', () => observer.disconnect());
  }
}
