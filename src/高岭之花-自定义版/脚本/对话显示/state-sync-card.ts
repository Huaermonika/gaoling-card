/**
 * 终端状态同步卡片 —— 把聊天区一行「⚙ 终端状态已同步」美化为可折叠的状态变更卡片。
 *
 * 运行环境：酒馆助手脚本（脚本内 `$` 即 `window.parent.$`，直接操作酒馆主页面 DOM）。
 * 数据源：对应楼层的原始消息里 `<ch_state_update>` 内嵌的 JSON Patch 数组。
 *   JSON Patch 仅携带变更后的值（无旧值），因此 replace 显示「字段 → 新值」。
 *
 * 约束：不改正则开关、不破坏 sendControlUpdate 发送逻辑、无第三方依赖。
 */
type StatePatch = { op: 'replace' | 'remove'; path: string; value?: unknown };

/** 字段名中文化映射（首段） */
const FIELD_NAMES: Record<string, string> = {
  cpu使用率: 'CPU 使用率',
  内存使用率: '内存使用率',
  意识状态: '意识状态',
  电源状态: '电源状态',
  电量: '电量',
  好感度: '好感度',
  身份认知: '身份认知',
  身体认知: '身体认知',
  处境认知: '处境认知',
  常识认知: '常识认知',
  认知自洽: '认知自洽',
  性格: '性格',
  敏感度: '敏感度',
  快感值: '快感值',
  身体状态: '躯体状态',
  身体锁定: '躯体锁定',
  指令覆盖: '指令',
  记忆日志: '记忆',
  实际着装: '实际着装',
  系统状态: '系统状态',
  崩溃原因: '崩溃原因',
};

/** 以百分比展示的数值字段 */
const PERCENT_FIELDS = new Set(['cpu使用率', '内存使用率', '电量']);

const STYLE_ID = 'ch-state-sync-style';

/** 注入卡片样式（一次） */
function injectStyle(): void {
  if ($(`#${STYLE_ID}`).length) return;
  const css = `
.ch-sync-card{margin:8px 0;border:1px solid rgba(126,167,178,.28);border-radius:10px;background:rgba(13,20,27,.62);overflow:hidden;font-size:12px;line-height:1.5;box-shadow:0 2px 10px rgba(0,0,0,.18)}
.ch-sync-head{display:flex;align-items:center;gap:8px;width:100%;padding:8px 12px;background:transparent;border:none;color:#d5e9f0;cursor:pointer;font-family:inherit;font-size:inherit;text-align:left}
.ch-sync-head:hover{background:rgba(126,167,178,.09)}
.ch-sync-title{font-weight:600;letter-spacing:.5px}
.ch-sync-badge{margin-left:auto;font-size:10px;color:#8fb6c2;border:1px solid rgba(126,167,178,.32);border-radius:999px;padding:1px 8px;flex-shrink:0}
.ch-sync-arrow{color:#8fb6c2;font-size:10px;transition:transform .2s ease;flex-shrink:0}
.ch-sync-card.open .ch-sync-arrow{transform:rotate(180deg)}
.ch-sync-body{display:none;padding:2px 12px 10px;gap:5px}
.ch-sync-card.open .ch-sync-body{display:grid}
.ch-sync-item{display:flex;align-items:baseline;gap:8px}
.ch-sync-field{color:#9cc6d4;font-weight:600;flex-shrink:0}
.ch-sync-op{color:#5f7a85;font-size:10px;flex-shrink:0;width:12px;text-align:center}
.ch-sync-val{color:#e8f1f4;word-break:break-all}
.ch-sync-item.remove .ch-sync-val{color:#e07a7a}
`;
  $('<style>').attr('id', STYLE_ID).text(css).appendTo('head');
}

/** 从原始消息提取 JSON Patch 数组；无有效块返回 null */
function parsePatches(raw: string): StatePatch[] | null {
  // 只截取 <ch_state_update>...</ch_state_update> 之间的内容再 JSON.parse，
  // 不直接匹配数组边界，避免嵌套数组（如 系统日志 / bug报告）里的 `]` 提前截断。
  const m = raw.match(/<ch_state_update>([\s\S]*?)<\/ch_state_update>/i);
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[1].trim());
    return Array.isArray(parsed) ? (parsed as StatePatch[]) : null;
  } catch {
    return null;
  }
}

/** 把路径拆成字段段：/角色/<id>/状态/<字段…> → [字段, …]；兼容旧 /千鹤/<字段> */
function fieldSegmentsOf(path: string): string[] {
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === '角色') {
    const statusIndex = parts.indexOf('状态');
    return statusIndex >= 0 ? parts.slice(statusIndex + 1) : parts.slice(2);
  }
  return parts[0] === '千鹤' ? parts.slice(1) : parts;
}

/** 把 path（如 /角色/c1/状态/指令覆盖/01）转为人类可读标签 */
function fieldLabelOf(path: string): string {
  const segments = fieldSegmentsOf(path);
  const head = segments[0] ?? '';
  const label = FIELD_NAMES[head] || head;
  const suffix = segments
    .slice(1)
    .map(s => FIELD_NAMES[s] || s)
    .join(' · ');
  return suffix ? `${label} · ${suffix}` : label;
}

function formatValue(head: string, v: unknown): string {
  if (typeof v === 'number' && PERCENT_FIELDS.has(head)) return `${v}%`;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

type SyncItem = { label: string; value: string; op: StatePatch['op'] };

function patchToItems(patch: StatePatch): SyncItem[] {
  const label = fieldLabelOf(patch.path);
  const head = fieldSegmentsOf(patch.path)[0] ?? '';
  if (patch.op === 'remove') {
    return [{ label, value: '已移除', op: 'remove' }];
  }
  const v = patch.value;
  // 数组（记忆日志 / 系统日志 / bug报告）不整份展开，否则卡片会被 JSON 撑爆
  if (Array.isArray(v)) {
    const short = v.length <= 3 && v.every(item => typeof item !== 'object');
    return [
      {
        label,
        value: short ? v.join('、') : `已更新（共 ${v.length} 项）`,
        op: 'replace',
      },
    ];
  }
  // 嵌套对象（如 指令覆盖/01 = { 内容, 优先级 }）按子字段展开
  if (v !== null && typeof v === 'object') {
    return Object.entries(v).map(([k, val]) => ({
      label: `${label} · ${FIELD_NAMES[k] || k}`,
      value: formatValue(head, val),
      op: 'replace' as const,
    }));
  }
  return [{ label, value: formatValue(head, v), op: 'replace' }];
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** 生成卡片 HTML；无变更时返回 null（保持单行提示） */
function renderCardHTML(patches: StatePatch[]): string | null {
  if (!patches.length) return null;
  const items = patches.flatMap(patchToItems);
  const rows = items
    .map(
      it =>
        `<div class="ch-sync-item${it.op === 'remove' ? ' remove' : ''}"><span class="ch-sync-field">${escapeHtml(it.label)}</span><span class="ch-sync-op">${it.op === 'remove' ? '✕' : '→'}</span><span class="ch-sync-val">${escapeHtml(it.value)}</span></div>`,
    )
    .join('');
  return (
    `<div class="ch-sync-card"><button type="button" class="ch-sync-head">` +
    `<span class="ch-sync-title">⚙ 终端状态已同步</span>` +
    `<span class="ch-sync-badge">${items.length} 项变更</span>` +
    `<span class="ch-sync-arrow">▾</span></button>` +
    `<div class="ch-sync-body">${rows}</div></div>`
  );
}

/** 把某一楼层的同步提示替换为卡片 */
function beautifyMessage(message_id: number): void {
  const $mes = $(`.mes[mesid='${message_id}']`);
  const $sync = $mes.find('.ch-state-sync');
  if (!$sync.length) return;
  const raw = getChatMessages(message_id)?.[0]?.message ?? '';
  const patches = parsePatches(raw);
  const html = patches ? renderCardHTML(patches) : null;
  if (html === null) return; // 无 patch 时保持现有单行提示
  const $card = $(html).attr('data-ch-synced', '1');
  $card.on('click', '.ch-sync-head', function () {
    $(this).parent().toggleClass('open');
  });
  $sync.replaceWith($card);
}

/** 扫描所有用户楼层中尚未美化的同步提示 */
function scanAll(): void {
  injectStyle();
  $('#chat .mes[is_user="true"] .ch-state-sync:not([data-ch-synced])').each((_i, el) => {
    const message_id = Number($(el).closest('.mes').attr('mesid'));
    if (!Number.isNaN(message_id)) beautifyMessage(message_id);
  });
}

/** 初始化：注入样式、扫描既有楼层、观察新楼层 */
export function initStateSyncCard(): void {
  injectStyle();
  scanAll();
  const parentWin = window.parent as Window & typeof globalThis;
  const ObserverCtor = parentWin.MutationObserver;
  if (typeof ObserverCtor !== 'function') return;
  // 生成过程中楼层文本会持续变化，每次变化都全量扫描聊天区会让长聊天卡顿；合并成一次延迟扫描
  let timer: ReturnType<typeof setTimeout> | null = null;
  const scheduleScan = () => {
    if (timer !== null) return;
    timer = setTimeout(() => {
      timer = null;
      scanAll();
    }, 300);
  };
  const observer = new ObserverCtor(scheduleScan);
  const root = parentWin.document.getElementById('chat') ?? parentWin.document.body;
  observer.observe(root, { childList: true, subtree: true });
  $(window).on('pagehide', () => {
    observer.disconnect();
    if (timer !== null) clearTimeout(timer);
  });
}
