/**
 * 记忆注入 —— 发送时把记忆日志里「钉选」「最近 N 条」「高强度」和「本轮变更」
 * 拼成一段 <memory> 块，随玩家消息一起送给 AI。
 *
 * 记忆日志本身仍然是变量的一部分，这里是它的读取视图：
 * - 钉选：终端里手动钉住的条目，永远是千鹤记得最牢的那部分；
 * - 最近 N 条：她刚经历过的事；
 * - 高强度：满足强度门槛的记忆里再挑最高的一批，防止很久以前的重要记忆被挤掉；
 * - 本轮变更：玩家在终端里增删改记忆后，用「更新了记忆……」这样的自然语句
 *   告知写故事的 AI，记忆已经变了。变更只在真正发送的那一次出现，不重复播报。
 * - 当前认知：可选。身份、身体、处境、常识四项认知排在记忆之前一并注入，
 *   把千鹤此刻的主观认知放到提示词末尾。
 *
 * 三类条目按时间去重，同一个时间与事件只出现一次。
 * 最近与高强度两类受字符预算约束，装不下就丢最旧的；钉选与本轮变更不受限制。
 * 设置项关闭时整块不注入，AI 只从变量快照里读记忆。
 */

const LS_KEY = 'ch:mem-inject';

/** 高强度记忆的准入门槛 */
const STRONG_MIN = 60;

export interface MemoryInjectSettings {
  /** 是否在发送时注入记忆块 */
  启用: boolean;
  /** 注入最近多少条记忆 */
  条数: number;
  /** 额外挑多少条高强度记忆，0 表示不挑 */
  高强度条数: number;
  /** 记忆部分的字符预算；钉选不受此限制 */
  字符预算: number;
  /** 是否把当前认知一并注入 */
  注入认知: boolean;
}

const DEFAULT_SETTINGS: MemoryInjectSettings = { 启用: true, 条数: 10, 高强度条数: 6, 字符预算: 4000, 注入认知: true };

function loadSettings(): MemoryInjectSettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<MemoryInjectSettings>;
    return {
      启用: parsed.启用 !== false,
      条数: Math.max(1, Math.round(Number(parsed.条数) || DEFAULT_SETTINGS.条数)),
      高强度条数:
        parsed.高强度条数 === undefined
          ? DEFAULT_SETTINGS.高强度条数
          : Math.max(0, Math.round(Number(parsed.高强度条数) || 0)),
      字符预算:
        parsed.字符预算 === undefined
          ? DEFAULT_SETTINGS.字符预算
          : Math.max(500, Math.round(Number(parsed.字符预算) || DEFAULT_SETTINGS.字符预算)),
      注入认知: parsed.注入认知 !== false,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export const memoryInjectSettings = reactive<MemoryInjectSettings>(loadSettings());

export function saveMemoryInjectSettings(patch?: Partial<MemoryInjectSettings>): void {
  if (patch) Object.assign(memoryInjectSettings, patch);
  memoryInjectSettings.条数 = Math.max(1, Math.round(Number(memoryInjectSettings.条数) || 1));
  memoryInjectSettings.高强度条数 = Math.max(0, Math.round(Number(memoryInjectSettings.高强度条数) || 0));
  memoryInjectSettings.字符预算 = Math.max(500, Math.round(Number(memoryInjectSettings.字符预算) || 500));
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(memoryInjectSettings));
  } catch {
    /* ignore */
  }
}

/** 与 schema 的 记忆标签 保持一致 */
export const 记忆标签 = ['日常', '重要', '约定', '亲密', '秘密', '其他'] as const;

export interface MemoryEntry {
  时间: string;
  事件: string;
  强度: number;
  标签: string;
  钉选: boolean;
  /** 来源楼层 id；0 表示没有对应楼层（手动新增、旧存档或提示词模式写入） */
  楼层: number;
}

function normalizeTag(value: unknown): string {
  return typeof value === 'string' && (记忆标签 as readonly string[]).includes(value) ? value : '其他';
}

function normalizeStrength(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** 从根数据里取出当前受控角色的状态；解析后的数据走「千鹤」别名，原始 stat_data 走 角色[当前角色] */
export function currentStateOf(data: unknown): Record<string, unknown> | null {
  const anyData = data as Record<string, any> | null;
  if (!anyData || typeof anyData !== 'object') return null;
  if (anyData.千鹤 && typeof anyData.千鹤 === 'object') return anyData.千鹤 as Record<string, unknown>;
  const 角色 = anyData.角色;
  const id = anyData.当前角色;
  const role = 角色 && typeof 角色 === 'object' ? 角色[id] : null;
  if (role && role.类型 === '受控' && role.状态 && typeof role.状态 === 'object') {
    return role.状态 as Record<string, unknown>;
  }
  return null;
}

/** 从任意一层数据里读出记忆日志（结构不符时返回空数组） */
export function readMemoryEntries(data: unknown): MemoryEntry[] {
  const log = currentStateOf(data)?.记忆日志;
  if (!Array.isArray(log)) return [];
  return log
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const raw = item as Record<string, unknown>;
      const floor = Number(raw.楼层);
      return {
        时间: String(raw.时间 ?? '').trim(),
        事件: String(raw.事件 ?? '').trim(),
        强度: normalizeStrength(raw.强度),
        标签: normalizeTag(raw.标签),
        钉选: raw.钉选 === true,
        楼层: Number.isFinite(floor) && floor > 0 ? Math.round(floor) : 0,
      };
    })
    .filter(entry => entry.事件);
}

function entryKey(entry: MemoryEntry): string {
  return `${entry.时间}\u0000${entry.事件}`;
}

const COGNITION_FIELDS: ReadonlyArray<[string, string]> = [
  ['身份', '身份认知'],
  ['身体', '身体认知'],
  ['处境', '处境认知'],
  ['常识', '常识认知'],
];

/** 读出当前角色此刻的四项主观认知；空字段不占行 */
export function readCognition(data: unknown): string[] {
  const bird = currentStateOf(data);
  if (!bird) return [];
  return COGNITION_FIELDS.map(([label, key]) => {
    const value = String(bird[key] ?? '').trim();
    return value ? `- ${label}：${value}` : '';
  }).filter(Boolean);
}

/** 对比上一次发送时的记忆，输出自然人话的变更行 */
export function diffMemory(previous: MemoryEntry[], current: MemoryEntry[]): string[] {
  const prevKeys = new Set(previous.map(entryKey));
  const curKeys = new Set(current.map(entryKey));

  const added = current.filter(entry => !prevKeys.has(entryKey(entry)));
  const removed = previous.filter(entry => !curKeys.has(entryKey(entry)));

  // 同一时间点一删一增视为「修改」；时间不同则分别算新增与删除
  const removedByTime = new Map<string, MemoryEntry[]>();
  for (const entry of removed) {
    const bucket = removedByTime.get(entry.时间);
    if (bucket) bucket.push(entry);
    else removedByTime.set(entry.时间, [entry]);
  }

  const lines: string[] = [];
  for (const entry of added) {
    const bucket = removedByTime.get(entry.时间);
    if (bucket?.length) {
      const old = bucket.shift() as MemoryEntry;
      lines.push(`- 更新了记忆「${entry.时间}」：由「${old.事件}」改为「${entry.事件}」`);
    } else {
      lines.push(`- 新增记忆「${entry.时间}」：${entry.事件}`);
    }
  }
  // 终端里合并一批旧条目时，不逐条播报，免得 AI 以为记忆被清空
  const leftovers = [...removedByTime.values()].flat();
  if (leftovers.length > 3) {
    lines.push(`- 删除记忆：早前的 ${leftovers.length} 条已合并，不再单独保留`);
  } else {
    for (const entry of leftovers) lines.push(`- 删除记忆「${entry.时间}」：${entry.事件}`);
  }
  return lines;
}

/** 04-11 09:50；无法识别时原样返回 */
function shortTime(value: string): string {
  const m = value.match(/\d{4}-(\d{2})-(\d{2})[ T]+(\d{2}):(\d{2})/);
  return m ? `${m[1]}-${m[2]} ${m[3]}:${m[4]}` : value;
}

function formatEntry(entry: MemoryEntry): string {
  const meta = [shortTime(entry.时间), entry.标签, String(entry.强度), entry.楼层 > 0 ? `第${entry.楼层}楼` : '']
    .filter(Boolean)
    .join(' | ');
  return meta ? `- [${meta}] ${entry.事件}` : `- ${entry.事件}`;
}

const HEAD_TITLE = '【当前角色的记忆】';
const HEAD_NOTE = [
  '记忆为该角色本人持有的经历记录，与世界日志相互独立。',
  '记忆与变量中的世界事实可以不一致；不一致不触发校对、纠正或追问。',
  '记忆来源包括亲身经历与外部写入的过去，时间上可以早于当前剧情。',
  '记忆以该角色本人的口吻引用，内容可以模糊、记错或只保留一部分。',
  '记忆之外的事项不主动提起，缺失细节不从聊天记录补全。',
].join('\n');
const COGNITION_TITLE = '此刻的认知：';
const COGNITION_NOTE = '以下为该角色此刻的主观认知，可与世界事实不一致；不一致不触发校对、纠正或追问。';
const PINNED_TITLE = '钉选的记忆：';
const RECENT_TITLE = '最近的记忆：';
const STRONG_TITLE = '深刻的记忆：';
const CHANGES_TITLE = '记忆变更（本轮已生效）：';

/** 一次注入的选中结果，供预览面板显示 */
export interface MemoryPlan {
  /** 完整注入块，空串表示不注入 */
  block: string;
  /** 记忆日志总条数 */
  total: number;
  /** 钉选条数 */
  pinned: number;
  /** 最近记忆条数 */
  recent: number;
  /** 高强度记忆条数 */
  strong: number;
  /** 一并注入的认知项数 */
  cognition: number;
  /** 本轮没有进入注入块的条数 */
  omitted: number;
  /** 注入块字符数 */
  chars: number;
}

/** 小节标题占两行：标题本身和它前面的空行 */
const TITLE_COST = (title: string) => title.length + 2;

/**
 * 生成注入计划。previous 传上一次发送时的记忆（没有基线时传 undefined，只给当前记忆）。
 * 钉选与「本轮变更」不受字符预算限制；最近与高强度按预算依次装填，装不下就丢最旧的。
 */
export function buildMemoryPlan(
  current: MemoryEntry[],
  previous?: MemoryEntry[],
  cognition: string[] = [],
): MemoryPlan {
  const total = current.length;
  const cognitionLines = memoryInjectSettings.注入认知
    ? cognition.map(line => line.trim()).filter(Boolean)
    : [];
  if (!memoryInjectSettings.启用 || (!total && !cognitionLines.length)) {
    return { block: '', total, pinned: 0, recent: 0, strong: 0, cognition: 0, omitted: total, chars: 0 };
  }

  const recentLimit = Math.max(1, Math.round(Number(memoryInjectSettings.条数) || 1));
  const strongLimit = Math.max(0, Math.round(Number(memoryInjectSettings.高强度条数) || 0));
  const budget = Math.max(500, Math.round(Number(memoryInjectSettings.字符预算) || 500));

  const used = new Set<string>();
  const take = (entry: MemoryEntry): boolean => {
    const key = entryKey(entry);
    if (used.has(key)) return false;
    used.add(key);
    return true;
  };

  const lines = ['<memory>'];
  // 基础开销：已排好的行，加上结尾换行与 </memory>
  let spent = lines.join('\n').length + 1 + '</memory>'.length + 1;
  // 没有记忆时不写记忆标题与说明，避免空标题
  if (total) {
    lines.push(HEAD_TITLE, HEAD_NOTE);
    spent += HEAD_TITLE.length + 1 + HEAD_NOTE.length + 1;
  }

  // 认知：排在记忆之前，不参与预算裁切
  if (cognitionLines.length) {
    const gap = lines.length > 1 ? 1 : 0;
    lines.push(...(gap ? [''] : []), COGNITION_TITLE, COGNITION_NOTE, ...cognitionLines);
    spent +=
      gap +
      COGNITION_TITLE.length +
      1 +
      COGNITION_NOTE.length +
      1 +
      cognitionLines.reduce((sum, line) => sum + line.length + 1, 0);
  }

  // 钉选：不参与预算裁切
  const pinned: string[] = [];
  for (const entry of current) {
    if (!entry.钉选 || !take(entry)) continue;
    const line = formatEntry(entry);
    pinned.push(line);
    spent += line.length + 1;
  }
  if (pinned.length) {
    lines.push('', PINNED_TITLE, ...pinned);
    spent += TITLE_COST(PINNED_TITLE);
  }

  // 最近：从新到旧装预算，超了先丢最旧的；整池预占去重，避免和「深刻」重复
  const recentPool = current.slice(-recentLimit).filter(entry => !used.has(entryKey(entry)));
  for (const entry of recentPool) used.add(entryKey(entry));
  const recent: string[] = [];
  if (recentPool.length && spent + TITLE_COST(RECENT_TITLE) <= budget) {
    let inner = spent + TITLE_COST(RECENT_TITLE);
    for (let i = recentPool.length - 1; i >= 0; i--) {
      const line = formatEntry(recentPool[i]);
      if (inner + line.length + 1 > budget) break;
      inner += line.length + 1;
      recent.unshift(line);
    }
    if (recent.length) {
      spent = inner;
      lines.push('', RECENT_TITLE, ...recent);
    }
  }

  // 深刻：按强度从高到低装预算，显示时按时间正序
  const strongPool = current
    .filter(entry => entry.强度 >= STRONG_MIN && !used.has(entryKey(entry)))
    .sort((a, b) => b.强度 - a.强度)
    .slice(0, strongLimit);
  const strong: MemoryEntry[] = [];
  if (strongPool.length && spent + TITLE_COST(STRONG_TITLE) <= budget) {
    let inner = spent + TITLE_COST(STRONG_TITLE);
    for (const entry of strongPool) {
      const line = formatEntry(entry);
      if (inner + line.length + 1 > budget) break;
      inner += line.length + 1;
      strong.push(entry);
    }
    if (strong.length) {
      spent = inner;
      lines.push('', STRONG_TITLE, ...strong.sort((a, b) => a.时间.localeCompare(b.时间)).map(formatEntry));
    }
  }

  // 本轮变更不参与预算：这是玩家刚改过的内容，必须让 AI 看到
  const changes = previous ? diffMemory(previous, current) : [];
  if (changes.length) {
    lines.push('', CHANGES_TITLE, ...changes);
  }

  lines.push('</memory>');
  const block = lines.join('\n');
  const injected = pinned.length + recent.length + strong.length;
  return {
    block,
    total,
    pinned: pinned.length,
    recent: recent.length,
    strong: strong.length,
    cognition: cognitionLines.length,
    omitted: Math.max(0, total - injected),
    chars: block.length,
  };
}

/** 只要注入文本的简写；没有内容或设置关闭时返回空字符串 */
export function buildMemoryBlock(
  current: MemoryEntry[],
  previous?: MemoryEntry[],
  cognition: string[] = [],
): string {
  return buildMemoryPlan(current, previous, cognition).block;
}
