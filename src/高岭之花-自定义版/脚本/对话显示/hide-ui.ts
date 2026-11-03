/**
 * 沉浸模式 —— 隐藏酒馆原生界面元素（输入栏 / 楼层头像 / 顶部栏），可开关。
 *
 * 运行环境：酒馆助手脚本（脚本内 `$` 即 `window.parent.$`，直接操作酒馆主页面 DOM）。
 *
 * 机制（单一数据源，开关状态以主页面 <body> 上的 `ch-hide-ui` class 为准）：
 *   1. 注入 CSS：所有隐藏规则挂在 `body.ch-hide-ui` 下，class 在 → 隐藏，不在 → 恢复。
 *   2. 持久化：状态写入 localStorage `ch:hide-ui`，刷新后自动恢复。
 *   3. 同步：App.vue 设置页的同名开关通过 onHideUIChange 订阅，保持双向一致。
 */

const STYLE_ID = 'ch-hide-ui-style';
const LS_KEY = 'ch:hide-ui';

/**
 * 隐藏规则：全部挂在 body.ch-hide-ui 下，想增减隐藏项就改这里。
 * 选择器参考 SillyTavern 桌面版 DOM（以实际 DevTools 选中元素为准，不同版本可能微调）：
 *   - #send_form      底部输入栏整体
 *   - .mes .avatar    聊天区每条消息的头像（限定 .mes 避免误伤其他头像）；沉浸模式下隐藏，让终端 UI 居中
 *   - #top-bar        顶部工具栏
 */
const HIDE_RULES = `
body.ch-hide-ui #send_form{display:none!important}
body.ch-hide-ui .mes .avatar{display:none!important}
body.ch-hide-ui #top-bar{display:none!important}
`;

type HideUIListener = (on: boolean) => void;

const listeners = new Set<HideUIListener>();
let initialized = false;

/** 主页面 <body>（脚本内 `$` 即 parent 的 jQuery） */
function parentBody(): JQuery<HTMLElement> | null {
  try {
    return $('body');
  } catch {
    return null;
  }
}

/** 当前是否处于沉浸模式（隐藏生效中） */
export function isHideUIOn(): boolean {
  return parentBody()?.hasClass('ch-hide-ui') ?? false;
}

function notify(on: boolean): void {
  listeners.forEach(fn => {
    try {
      fn(on);
    } catch {
      /* ignore */
    }
  });
}

/** 切换沉浸模式：改 body class + 持久化 + 通知订阅者 */
export function setHideUI(on: boolean): void {
  parentBody()?.toggleClass('ch-hide-ui', on);
  try {
    localStorage.setItem(LS_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
  notify(on);
}

/** 订阅开关状态变化（App.vue 设置页用）。返回取消订阅函数。 */
export function onHideUIChange(fn: HideUIListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** 注入样式，并从 localStorage 恢复上次状态（幂等）。脚本加载时调用一次。 */
export function initHideUI(): void {
  if (initialized) return;
  initialized = true;

  if (!$(`#${STYLE_ID}`).length) {
    $('<style>').attr('id', STYLE_ID).text(HIDE_RULES).appendTo('head');
  }

  // 恢复上次状态
  let saved = '';
  try {
    saved = localStorage.getItem(LS_KEY) ?? '';
  } catch {
    /* ignore */
  }
  if (saved === '1') setHideUI(true);
  else if (saved === '0') setHideUI(false);
}
