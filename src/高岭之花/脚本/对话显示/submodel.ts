/**
 * 副模型机制 —— 可配置的 OpenAI 兼容辅助模型，承担「变量更新」与「记忆整理」两个职责，减轻主模型负担。
 *
 * 运行环境：酒馆助手脚本（对话显示脚本），脚本内可直接访问酒馆全局（eventOn / getChatMessages / getVariables 等）。
 * 数据读写：直接读写 message 变量 stat_data，与 MVU store 心跳并行；store 每 2 秒轮询会把变化同步到 UI。
 * 配置存储：localStorage（key = ch:sub），不进入主模型上下文，API key 不会泄露给主模型。
 * 依赖：只用原生 fetch（不引 axios / klona，避免 CDN external 加载失败点）。
 */
import { Schema } from '../../schema';
import { preprocessForDisplay } from './strip-framework';

// ==================== 配置 ====================

export interface SubmodelConfig {
  enabled: boolean;
  endpoint: string;
  apiKey: string;
  model: string;
  temperature: number;
  /** 职责 1：变量更新（兜底主模型遗漏的变化） */
  varUpdate: boolean;
}

const LS_KEY = 'ch:sub';

const defaultConfig: SubmodelConfig = {
  enabled: false,
  endpoint: '',
  apiKey: '',
  model: '',
  temperature: 0.3,
  varUpdate: false,
};

function loadConfig(): SubmodelConfig {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...defaultConfig };
    return { ...defaultConfig, ...(JSON.parse(raw) as Partial<SubmodelConfig>) };
  } catch {
    return { ...defaultConfig };
  }
}

/** 副模型配置（响应式，配置 UI 直接绑定） */
export const submodelConfig = reactive<SubmodelConfig>(loadConfig());

/** 保存配置到 localStorage；传入 patch 则先合并再保存 */
export function saveSubmodelConfig(patch?: Partial<SubmodelConfig>): void {
  if (patch) Object.assign(submodelConfig, patch);
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(submodelConfig));
  } catch {
    /* ignore */
  }
}

// ==================== JSONPatch 应用 ====================

type PatchOp = {
  op: 'replace' | 'add' | 'insert' | 'remove' | 'move' | 'delta';
  path: string;
  value?: unknown;
  from?: string;
};

function parsePointer(path: string): string[] {
  return path
    .replace(/^\//, '')
    .split('/')
    .map(seg => seg.replace(/~1/g, '/').replace(/~0/g, '~'));
}

function getAt(obj: Record<string, any>, segments: string[]): unknown {
  return segments.reduce((cur, seg) => (cur == null ? undefined : cur[seg]), obj as any);
}

function setAt(obj: Record<string, any>, segments: string[], value: unknown): void {
  let cur = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (cur[seg] == null || typeof cur[seg] !== 'object') cur[seg] = {};
    cur = cur[seg];
  }
  cur[segments[segments.length - 1]] = value;
}

function deleteAt(obj: Record<string, any>, segments: string[]): void {
  let cur = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (cur == null || typeof cur !== 'object') return;
    cur = cur[seg];
  }
  if (cur && typeof cur === 'object') delete cur[segments[segments.length - 1]];
}

/** 在 obj 上应用 JSONPatch（RFC6902 子集 + 自定义 delta 数值增量） */
function applyPatch(obj: Record<string, any>, patches: PatchOp[]): void {
  for (const p of patches) {
    if (!p || typeof p.path !== 'string') continue;
    const segments = parsePointer(p.path);
    switch (p.op) {
      case 'replace':
      case 'add':
      case 'insert':
        setAt(obj, segments, p.value);
        break;
      case 'remove':
        deleteAt(obj, segments);
        break;
      case 'delta': {
        const cur = getAt(obj, segments);
        const delta = Number(p.value);
        if (typeof cur === 'number' && !Number.isNaN(delta)) setAt(obj, segments, cur + delta);
        break;
      }
      case 'move': {
        if (!p.from) break;
        const v = getAt(obj, parsePointer(p.from));
        deleteAt(obj, parsePointer(p.from));
        setAt(obj, segments, v);
        break;
      }
    }
  }
}

// ==================== OpenAI 兼容调用 ====================

async function callSubmodel(system: string, user: string): Promise<string | null> {
  const cfg = submodelConfig;
  if (!cfg.enabled || !cfg.endpoint || !cfg.apiKey || !cfg.model) return null;
  const base = cfg.endpoint.replace(/\/+$/, '');
  const url = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        temperature: cfg.temperature,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!resp.ok) return null;
    const json = await resp.json();
    return json?.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

// ==================== 副模型配置检测 ====================

export interface SubmodelProbe {
  ok: boolean;
  reason?: string;
  /** 往返耗时（毫秒） */
  ms?: number;
}

function apiBase(): string {
  return submodelConfig.endpoint.trim().replace(/\/+$/, '');
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const key = submodelConfig.apiKey.trim();
  if (key) headers.Authorization = `Bearer ${key}`;
  return headers;
}

/** 拉取 OpenAI 兼容端点的模型列表 */
export async function listSubmodelModels(): Promise<{ ok: boolean; models: string[]; reason?: string }> {
  const base = apiBase();
  if (!base) return { ok: false, models: [], reason: '先填写 Endpoint' };
  const url = base.endsWith('/models') ? base : `${base}/models`;
  try {
    const resp = await fetch(url, { headers: authHeaders() });
    if (!resp.ok) {
      const detail = await resp.text().catch(() => '');
      return { ok: false, models: [], reason: `HTTP ${resp.status}${detail ? `：${detail.slice(0, 120)}` : ''}` };
    }
    const json = await resp.json();
    const models = Array.isArray(json?.data)
      ? json.data.map((item: { id?: unknown }) => String(item?.id ?? '')).filter(Boolean)
      : [];
    if (!models.length) return { ok: false, models: [], reason: '返回里没有模型列表' };
    return { ok: true, models };
  } catch (error) {
    return { ok: false, models: [], reason: `请求失败：${String(error)}` };
  }
}

/** 发一次最小对话请求，确认地址、密钥与模型都可用 */
export async function testSubmodel(): Promise<SubmodelProbe> {
  const base = apiBase();
  if (!base) return { ok: false, reason: '先填写 Endpoint' };
  const model = submodelConfig.model.trim();
  if (!model) return { ok: false, reason: '先填写模型名' };
  const url = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;
  const started = Date.now();
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        model,
        max_tokens: 8,
        messages: [{ role: 'user', content: 'ping' }],
      }),
    });
    const ms = Date.now() - started;
    if (!resp.ok) {
      const detail = await resp.text().catch(() => '');
      return { ok: false, reason: `HTTP ${resp.status}${detail ? `：${detail.slice(0, 120)}` : ''}`, ms };
    }
    const json = await resp.json();
    if (!Array.isArray(json?.choices) || !json.choices.length) {
      return { ok: false, reason: '返回里没有 choices', ms };
    }
    return { ok: true, ms };
  } catch (error) {
    return { ok: false, reason: `请求失败：${String(error)}`, ms: Date.now() - started };
  }
}

/** 从模型回复里稳健解析出 JSON（容忍 <thinking> 检查块、markdown 围栏与前后解释文字） */
function parseJson<T>(text: string): T | null {
  const stripped = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
  const fenced = stripped.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : stripped).trim();

  try {
    return JSON.parse(body) as T;
  } catch {
    /* 继续宽松解析 */
  }

  // 检查块没闭合、或 JSON 前后带了解释文字时，截取第一个 { 到最后一个 }
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(body.slice(start, end + 1)) as T;
    } catch {
      return null;
    }
  }
  return null;
}

/** 剥离结构化标签，只留对话正文；思维链、规划、提示块都不算剧情 */
function stripStructural(text: string): string {
  return text
    .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, '')
    .replace(/<ch_state_update>[\s\S]*?<\/ch_state_update>/gi, '')
    .replace(/<StatusPlaceHolderImpl\s*\/>/gi, '')
    .replace(/<tableEdit>[\s\S]*?<\/tableEdit>/gi, '')
    .replace(/<scene\b[^>]*?\/?>/gi, '')
    .replace(/<\/?content\s*>/gi, '')
    // 思维链与规划块：不同预设的标签名不一致，常见的几种都剥掉
    .replace(/<(?:thinking|thought|analysis|plan|planning)>[\s\S]*?<\/(?:thinking|thought|analysis|plan|planning)>/gi, '')
    .replace(/<(?:剧情规划|plot|outline|notes|summary)>[\s\S]*?<\/(?:剧情规划|plot|outline|notes|summary)>/gi, '')
    // 本卡自身注入的块：旧记忆块、写作自检、变量快照
    .replace(/<memory>[\s\S]*?<\/memory>/gi, '')
    .replace(/<ch_writing>[\s\S]*?<\/ch_writing>/gi, '')
    .replace(/<status_current_variable>[\s\S]*?<\/status_current_variable>/gi, '')
    // 预设有时把样式或脚本直接写在正文里，这些都不是剧情
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
}

const SYNC_MARKER = /⚙\s*终端状态已同步/g;

/** 预设常把思维链、推理过程做成折叠容器或固定类名，这些都不是正文 */
const NON_BODY_HINT = /think|reason|analysis|cot|chain[-_]?of[-_]?thought|scratchpad/i;

/** 显示层 HTML 转纯文本：折叠容器、思维链容器整块丢弃，块级元素断行；转换失败返回 null */
function htmlToText(html: string): string | null {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(
      html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(?:p|div|li|h[1-6]|blockquote|tr)>/gi, '\n'),
      'text/html',
    );
    // 样式、脚本、模板不是正文：预设的状态栏样式与前端脚本会跟着消息一起进 HTML，
    // 直接读 textContent 会把整段 CSS/JS 当成剧情材料。
    doc
      .querySelectorAll('style, script, link, meta, template, noscript, pre')
      .forEach(el => el.remove());
    doc.querySelectorAll('details, div, span, section, blockquote').forEach(el => {
      const hint = `${typeof el.className === 'string' ? el.className : ''} ${el.id || ''}`;
      const inlineStyle = el.getAttribute('style') ?? '';
      if (NON_BODY_HINT.test(hint) || /display\s*:\s*none|visibility\s*:\s*hidden/i.test(inlineStyle)) {
        el.remove();
      }
    });
    return (doc.body?.textContent ?? '')
      .replace(/\r/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } catch {
    return null;
  }
}

/**
 * 楼层正文：走酒馆的显示流程（预处理 → 预设与角色卡的显示正则 → HTML），再取纯文本。
 * 预设用正则隐藏的思维链、规划块在这一步已经不存在，显示为空就说明这楼没有玩家可见的正文；
 * 只有在显示流程本身不可用时，才退回本地标签剥离。
 */
function floorBody(message: { message: string; message_id: number; role?: string }): string {
  const source = message.role === 'user' ? 'user_input' : 'ai_output';
  try {
    const preprocessed = preprocessForDisplay(message.message, message.message_id, source);
    const html = formatAsDisplayedMessage(preprocessed, { message_id: message.message_id });
    const shown = htmlToText(html);
    if (shown !== null) return shown.replace(SYNC_MARKER, '').trim();
  } catch {
    /* 显示流程不可用，走本地剥离 */
  }
  return stripStructural(message.message).replace(SYNC_MARKER, '').trim();
}

function clip(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

const STAT_ROOT = { type: 'message', message_id: -1 } as const;

function readStat(): Record<string, any> {
  return (_.get(getVariables(STAT_ROOT), 'stat_data', {}) ?? {}) as Record<string, any>;
}

// ==================== 职责 1 · 变量更新 ====================

const VAR_UPDATE_SYSTEM = `你是角色卡「高岭之花」的变量维护副模型。根据对话内容，输出需要修正的变量变更，格式为 JSONPatch 数组。

规则：
1. 只修正「对话明确发生、但当前变量尚未反映」的变化；无变化输出 []。
2. 禁止凭空漂移 cpu使用率、内存使用率、电量、快感值、好感度、当前地点、处境认知。
3. 不得新增或修改 记忆日志、系统日志 这两个字段。
4. path 用 JSON Pointer（/ 分隔），根为 stat_data，如 /千鹤/好感度。
5. op 支持 replace / add / remove / delta（delta 仅用于数值增量，value 为带正负号的数）。
6. 只输出 JSON 数组本身，不要解释文字，不要 markdown 代码块。`;

/** 变量快照：排除记忆/系统日志（不归副模型职责） */
function variableSnapshot(stat: Record<string, any>): Record<string, any> {
  const snap = JSON.parse(JSON.stringify(stat)) as Record<string, any>;
  delete snap.千鹤?.记忆日志;
  delete snap.系统日志;
  return snap;
}

async function runVariableUpdate(): Promise<void> {
  const stat = readStat();
  const snapshot = variableSnapshot(stat);
  const last = getLastMessageId();
  const from = Math.max(0, last - 5);
  const recent = getChatMessages(`${from}-${last}`)
    .map(m => `${m.role === 'user' ? '玩家' : '千鹤'}：${clip(stripStructural(m.message), 400)}`)
    .join('\n');

  const user = `当前变量（不含记忆/系统日志）：\n${JSON.stringify(snapshot, null, 1)}\n\n最近对话：\n${recent}\n\n输出 JSONPatch 数组。`;
  const text = await callSubmodel(VAR_UPDATE_SYSTEM, user);
  if (!text) return;

  const patches = parseJson<unknown[]>(text);
  if (!patches) return;

  const next = JSON.parse(JSON.stringify(stat)) as Record<string, any>;
  applyPatch(next, patches as PatchOp[]);

  const result = Schema.safeParse(next);
  if (!result.success) return;
  updateVariablesWith(vars => _.set(vars, 'stat_data', result.data), STAT_ROOT);
}

// ==================== 记忆条目读取 ====================

/** 与 schema 的 记忆标签 保持一致 */
const MEMORY_TAGS = ['日常', '重要', '约定', '亲密', '秘密', '其他'] as const;

function normalizeTag(value: unknown, fallback = '日常'): string {
  return typeof value === 'string' && (MEMORY_TAGS as readonly string[]).includes(value) ? value : fallback;
}

function normalizeStrength(value: unknown, fallback = 50): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, Math.round(n)));
}

type MemoryEntry = { 时间: string; 事件: string; 强度: number; 标签: string; 钉选: boolean; 楼层: number };

function normalizeFloor(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

/** 记忆日志可能是旧存档的对象形态，也可能是当前的数组形态；读取时保留强度/标签/钉选/来源楼层 */
function readMemoryEntries(log: unknown): MemoryEntry[] {
  if (Array.isArray(log)) {
    return log
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      .map(item => ({
        时间: String(item.时间 ?? ''),
        事件: String(item.事件 ?? ''),
        强度: normalizeStrength(item.强度),
        标签: normalizeTag(item.标签),
        钉选: item.钉选 === true,
        楼层: normalizeFloor(item.楼层),
      }))
      .filter(item => item.事件.trim());
  }
  if (log && typeof log === 'object') {
    return Object.entries(log as Record<string, unknown>).map(([时间, 事件]) => ({
      时间,
      事件: String(事件),
      强度: 50,
      标签: '日常',
      钉选: false,
      楼层: 0,
    }));
  }
  return [];
}

// ==================== 职责 3 · 记忆整理（按模式） ====================

export type MemoryMode = 'prompt' | 'main' | 'sub' | 'off';

export interface MemoryConfig {
  /** 记忆更新方式 */
  mode: MemoryMode;
  /** 每 N 轮触发一次整理，最小 1 */
  every: number;
}

const LS_MEM_KEY = 'ch:mem';
/** 配置版本：旧版本没有版本号，读取时按新默认模式重置一次 */
const MEM_VERSION = 2;

const defaultMemoryConfig: MemoryConfig = { mode: 'main', every: 1 };

function loadMemoryConfig(): MemoryConfig {
  try {
    const raw = localStorage.getItem(LS_MEM_KEY);
    if (!raw) return { ...defaultMemoryConfig };
    const parsed = JSON.parse(raw) as Partial<MemoryConfig> & { version?: number };
    const every = Math.max(1, Math.round(Number(parsed.every) || 1));
    if (parsed.version !== MEM_VERSION) {
      // 旧配置里的模式是旧默认值留下的，不沿用；其它字段保留
      return { mode: defaultMemoryConfig.mode, every };
    }
    return {
      mode: (['prompt', 'main', 'sub', 'off'] as const).includes(parsed.mode as MemoryMode)
        ? (parsed.mode as MemoryMode)
        : defaultMemoryConfig.mode,
      every,
    };
  } catch {
    return { ...defaultMemoryConfig };
  }
}

/** 记忆整理配置（响应式，设置页直接绑定） */
export const memoryConfig = reactive<MemoryConfig>(loadMemoryConfig());

export function saveMemoryConfig(patch?: Partial<MemoryConfig>): void {
  if (patch) Object.assign(memoryConfig, patch);
  memoryConfig.every = Math.max(1, Math.round(Number(memoryConfig.every) || 1));
  try {
    localStorage.setItem(LS_MEM_KEY, JSON.stringify({ ...memoryConfig, version: MEM_VERSION }));
  } catch {
    /* ignore */
  }
}

/**
 * 测试连通性。通过后自动启用副模型，并把记忆整理切到副模型；
 * 未通过时不动开关与模式。
 */
export async function testAndActivateSubmodel(): Promise<SubmodelProbe> {
  const probe = await testSubmodel();
  if (!probe.ok) return probe;
  saveSubmodelConfig({ enabled: true });
  saveMemoryConfig({ mode: 'sub' });
  return probe;
}

/** 关闭副模型：记忆整理若正走副模型，退回默认的主模型模式 */
export function disableSubmodel(): void {
  saveSubmodelConfig({ enabled: false });
  if (memoryConfig.mode === 'sub') saveMemoryConfig({ mode: 'main' });
}

export const MEMORY_MODES: { value: MemoryMode; label: string; hint: string }[] = [
  { value: 'main', label: '主模型模式', hint: '每 N 轮调用主 API 整理记忆后写回' },
  { value: 'sub', label: '副模型模式', hint: '优先用副模型整理；没配置副模型时回落到主模型' },
  { value: 'prompt', label: '提示词模式', hint: '每轮发送要求更新的提示词，记忆由主模型自己写' },
  { value: 'off', label: '关闭模式', hint: '不发提示词也不整理，记忆只在剧情里随缘写入' },
];

/**
 * 记忆整理提示词：逐楼核查，先输出 <thinking> 检查记录，再输出根键为 floors 的 JSON。
 * 输入由 runMemoryConsolidation 拼装：世界当前时间 + 现有记忆日志 + 待整理楼层（仅千鹤楼层，玩家消息作上下文）。
 */
const MEMORY_CONSOLIDATE_SYSTEM = `【输出前思考(逐楼核查)】
【检查记录与最终结果输出协议】
- 回复正文先输出一个简短的 <thinking>...</thinking> 检查记录块，再输出一个完整 JSON 对象；不输出寒暄、额外解释或 Markdown 围栏。
- 记录只写关键依据、处理结论和必要修正，不展开内部推演，不复述规范或预写摘要/JSON 草稿。不要求逐段登记、事实编号或多轮表格；需要引用时沿用输入里的「第 n 楼」或原文短证据。
- 完成后闭合 </thinking>，再输出 JSON。不要开启第二个检查块。
- 最终 JSON 不要新增核查编号、来源列表或审计字段。人物称述、推测与限定属于剧情事实，应自然保留在对应字符串中，不是要删除的检查标记。

在同一个检查块内按楼层顺序完成以下检查，全部完成后闭合检查块再输出 JSON：
1. 逐楼定位：这批楼数以用户消息里的「这批共 N 楼」为准，N 只计千鹤楼层。玩家上一条以括号附在楼内，仅用于理解千鹤在回应什么，不单独计数、不单独产出元素。严格按先后顺序为每楼产出一个数组元素，n 依次 1..N，不漏、不重、不乱序。
2. 时间单调且完整：每楼标起止时间，后一楼不早于前一楼。时间一律写成 YYYY-MM-DD HH:MM，年月日与时分都要完整，不得缩写成月日或单独时刻。没有明确依据时，按「世界当前时间」和剧情流逝合理推算。
3. 收笔：每楼 summary 止步于该楼正文最后一个明文动作，不续写、不跨入下一楼。
4. 字段固定：每个元素只含 n / summary / timeStart / timeEnd / tag / weight，不输出物品、计划、地点等字段。tag 取 日常 / 重要 / 约定 / 亲密 / 秘密 / 其他 之一，拿不准用「其他」；weight 是 0~100 的整数，普通日常 30~50，重要事件 70~90。

【记忆条目规格】
- summary 只写千鹤在剧情里亲身经历、亲眼看到或亲耳听到的事，写成一句陈述，20~60 字，单行，不用分号、编号或列表。
- 只写已经发生的事实与结果。计划、预告、下一步安排、剧情走向都不算记忆。
- 以下内容一律不进入 summary：角色思考、剧情规划、支线编号、写作要求、风格约束、禁词表、预设或提示词原文、变量更新、系统日志、作者或玩家的操作意图。即使这些内容里出现了人物、地点或事件，也不算她经历过的事。
- 材料中若残留代码块（三反引号、缩进代码或等宽字体块）、样式与脚本、模板标签、思维链或规划区块，整段忽略，不从中提取任何人物、地点、动作或事件；只整理明确属于千鹤正文的句子。
- 判据：一句话读给不了解这张卡的人听，听起来像「她经历过的事」才保留；听起来像「给模型的指令」或「作者的安排」就丢弃。
- 反例（禁止产出）：「千鹤角色思考，规划后续剧情：……强调剧情需避免老套校园日常……要求细节描写丰富、避免禁词……」这类是规划与要求，不是她的经历。
- 正例：「在后院因电量耗尽关机，醒来时夏茉正在更换电池。」

【摘要取舍】
- 只整理本次待处理材料；现有记忆日志与世界设定用于核对时间线和称呼，不当作本轮新增事件。单楼只摘本楼，不借后面楼补结论，不补写未提供的原文。
- 优先保留关键事件与结果、状态变化、明确情报、比较基准，以及影响当前未结束局面或后续理解的条件。临时但仍有效的限制也可进入 summary，不套用长期档案的准入门槛；先压缩重复动作与修饰，不因删日常过程而丢掉其中的重要事实。
- 保留主体、说话人、关键数值与范围、确定程度；条件连同受影响对象及具体影响一起保留，不只留下主题词。区分建议、已决定、已启动与已完成，不把人物说法自动当作客观事实。
- 明确变化保留必要的前后阶段，不让旧状态冒充现状，也不把新状态倒写进过去；局部观察不扩大为普遍规则。冲突未获解释时保留分歧，不自行编造原因、精确时间或结论。

【摘要复核】
- 对照原材料确认关键事实、限定与了结结果在 summary 中实际保留，合并不能吞掉独立事实；删除无依据的推断和续写。
- 只简记关键取舍与实际修正，不重复抄写摘要。

核查完所有楼后闭合 </thinking>，再输出 JSON 对象（根键 floors），无 markdown 围栏、无额外解释：
{"floors":[{"n":1,"summary":"……","timeStart":"2026-04-07 08:41","timeEnd":"2026-04-07 08:47","tag":"日常","weight":40}]}`;

export interface MemoryRunResult {
  ok: boolean;
  reason?: string;
  count?: number;
}

/** 主模型通道：静默生成，不写入聊天历史 */
async function callMainModel(system: string, user: string): Promise<string> {
  const result = await generateRaw({
    user_input: user,
    ordered_prompts: [{ role: 'system', content: system }, 'user_input'],
    should_silence: true,
    max_chat_history: 0,
  });
  return typeof result === 'string' ? result : '';
}

function submodelReady(): boolean {
  const cfg = submodelConfig;
  return Boolean(cfg.enabled && cfg.endpoint.trim() && cfg.apiKey.trim() && cfg.model.trim());
}

/** 手动触发时也允许跑：副模型可用就优先，否则走主模型 */
function resolveChannel(): 'sub' | 'main' {
  if (memoryConfig.mode === 'main') return 'main';
  return submodelReady() ? 'sub' : 'main';
}

const pad2 = (n: string | number) => String(Number(n)).padStart(2, '0');

/** 统一成 YYYY-MM-DD HH:MM；无法识别时退回锚点时间 */
function normalizeStamp(raw: string, fallback: string): string {
  const m = raw.match(/(\d{4})-(\d{1,2})-(\d{1,2})[ T]*(\d{1,2})[:：](\d{2})/);
  if (!m) return fallback;
  return `${m[1]}-${pad2(m[2])}-${pad2(m[3])} ${pad2(m[4])}:${m[5]}`;
}

/** 整理游标存在聊天变量里：切换聊天、刷新页面都不会把上一段聊天的进度带过来 */
const CHAT_SCOPE = { type: 'chat' } as const;

function readCursor(): number {
  try {
    const value = Number(_.get(getVariables(CHAT_SCOPE), 'memory_cursor', -1));
    return Number.isInteger(value) && value >= 0 ? value : -1;
  } catch {
    return -1;
  }
}

function writeCursor(id: number): void {
  try {
    updateVariablesWith(vars => _.set(vars, 'memory_cursor', id), CHAT_SCOPE);
  } catch {
    /* 聊天变量不可用时，本次会话内不记录进度 */
  }
}

interface BatchFloor {
  n: number;
  /** 来源消息的楼层 id，写进记忆条目，用于定位与去重 */
  id: number;
  role: string;
  text: string;
  /** 玩家上一条，仅作理解上下文，不单独产生记忆 */
  context?: string;
}

/** 已整理过的来源楼层，旧存档的条目没有楼层号，按 0 跳过 */
function readDoneFloors(stat: Record<string, any>): Set<number> {
  return new Set(
    readMemoryEntries(stat.千鹤?.记忆日志)
      .map(entry => entry.楼层)
      .filter(n => n > 0),
  );
}

/**
 * 取待整理楼层。自动触发取游标之后的新楼层；手动整理传入选中的楼层 id。
 * 已写入记忆日志的楼层不再进入批次，低层玩家消息只作上一条的上下文附注。
 * 只收千鹤楼层；玩家消息不单独计数、不单独产出记忆。
 */
function collectBatch(rounds: number, messageIds?: number[]): BatchFloor[] {
  const last = getLastMessageId();
  if (last < 1) return [];

  const selected = messageIds?.length ? new Set(messageIds) : null;
  const cursor = readCursor();
  // 选中楼层时多取前一条，让玩家上一条能作为上下文
  const from = selected
    ? Math.max(1, Math.min(...selected) - 1)
    : cursor >= 0
      ? cursor + 1
      : Math.max(1, last - rounds * 2 + 1);
  const to = selected ? Math.max(...selected) : last;
  if (from > to) return [];

  const done = readDoneFloors(readStat());
  const floors: BatchFloor[] = [];
  let previousUser = '';
  for (const m of getChatMessages(`${from}-${to}`)) {
    // 玩家消息只更新上下文，不进入批次
    if (m.role === 'user') {
      const userText = floorBody(m);
      previousUser = userText ? clip(userText, 500) : '';
      continue;
    }
    // 手动整理时跳过没选中的楼层，同时清掉它前面的玩家上下文
    if (selected && !selected.has(m.message_id)) {
      previousUser = '';
      continue;
    }
    // 已经写过记忆的楼层直接跳过
    if (done.has(m.message_id)) {
      previousUser = '';
      continue;
    }
    // 只取玩家在聊天区看得到的正文：预设隐藏的思维链、规划块不算剧情
    const text = floorBody(m);
    // 显示层没有正文（整楼都是被隐藏的思维链/规划/变量块）时不参与整理
    if (!text) {
      previousUser = '';
      continue;
    }
    floors.push({
      n: floors.length + 1,
      id: m.message_id,
      role: '千鹤',
      text: clip(text, 1200),
      context: previousUser || undefined,
    });
    previousUser = '';
  }

  return floors;
}

/** 设置页的待整理楼层：游标之后、有正文、尚未写入记忆日志的千鹤楼层 */
export interface PendingFloor {
  id: number;
  preview: string;
}

export function listPendingFloors(): PendingFloor[] {
  const last = getLastMessageId();
  if (last < 1) return [];

  const from = Math.max(1, readCursor() + 1);
  if (from > last) return [];

  const done = readDoneFloors(readStat());
  const pending: PendingFloor[] = [];
  for (const m of getChatMessages(`${from}-${last}`)) {
    if (m.role === 'user') continue;
    if (done.has(m.message_id)) continue;
    const text = floorBody(m);
    if (!text) continue;
    pending.push({ id: m.message_id, preview: clip(text.replace(/\s+/g, ' '), 60) });
  }
  return pending;
}

/**
 * 整理完成后把游标往前推：本次处理过的楼层、玩家楼层、无正文楼层、已有记忆的楼层依次越过，
 * 遇到第一个未整理且可整理的楼层就停下。这样手动只整理一部分时，剩下的楼层仍留在待整理列表里。
 */
function advanceCursor(processed: Set<number>): void {
  const last = getLastMessageId();
  if (last < 1) return;

  const cursor = readCursor();
  const from = Math.max(1, cursor + 1);
  if (from > last) return;

  const done = readDoneFloors(readStat());
  let advanced = cursor;
  for (const m of getChatMessages(`${from}-${last}`)) {
    const settled = m.role === 'user' || processed.has(m.message_id) || done.has(m.message_id) || !floorBody(m);
    if (!settled) break;
    advanced = m.message_id;
  }
  if (advanced > cursor) writeCursor(advanced);
}

/** 元叙述强标记：出现任意一条即可判定不是她的经历 */
const META_STRONG = [
  '剧情规划',
  '支线',
  '预设',
  '提示词',
  '思维链',
  '角色思考',
  '三层结构',
  '禁词',
  '细节描写',
  '正文末尾',
  '后续剧情',
  '写作要求',
];

/** 元叙述弱标记：同时出现两条以上才判定 */
const META_WEAK = ['规划', '剧情', '要求', '强调', '避免', '不得', '写作', '变量', '系统日志', '口语化'];

/**
 * 判断一条摘要是否像「她经历过的事」。
 * 提示词已经要求模型自己排除规划与要求，这里只兜底：超长、多行、或带元叙述标记的条目一律丢弃。
 */
function looksLikeStory(summary: string): boolean {
  if (!summary) return false;
  if (summary.length > 80) return false;
  if (/[\n\r]/.test(summary)) return false;
  if (META_STRONG.some(key => summary.includes(key))) return false;
  if (META_WEAK.filter(key => summary.includes(key)).length >= 2) return false;
  return true;
}

/**
 * 记忆整理：把待整理楼层逐楼总结成记忆条目，追加进记忆日志。
 * 任何一步失败都保留原记忆，不写入半成品。
 */
export async function runMemoryConsolidation(
  options: { rounds?: number; messageIds?: number[] } = {},
): Promise<MemoryRunResult> {
  const rounds = options.rounds ?? 3;
  const stat = readStat();
  const entries = readMemoryEntries(stat.千鹤?.记忆日志);
  const floors = collectBatch(rounds, options.messageIds);
  if (!floors.length) return { ok: false, reason: '没有可整理的楼层' };
  const processed = new Set(floors.map(floor => floor.id));

  const user = [
    `世界当前时间：${String(stat.世界?.当前时间 ?? '')}`,
    `现有记忆日志：\n${entries.length ? entries.map(e => `${e.时间}: ${e.事件}`).join('\n') : '(空)'}`,
    `待整理材料（这批共 ${floors.length} 楼，均为千鹤楼层，已按酒馆显示正则与预设正则去掉思维链、样式脚本与非正文块；括号内为玩家上一条，仅作上下文）：\n${floors
      .map(f => `第 ${f.n} 楼 [${f.role}]${f.context ? `（玩家上一条：${f.context}）` : ''}：${f.text}`)
      .join('\n\n')}`,
    '按协议输出检查记录与 JSON。',
  ].join('\n\n');

  let text = '';
  try {
    if (resolveChannel() === 'sub') {
      text = (await callSubmodel(MEMORY_CONSOLIDATE_SYSTEM, user)) ?? '';
    }
    // 副模型调用失败（未配置完整 / 网络错误）时回落到主模型，记忆不因副模型挂掉而跳过
    if (!text) text = await callMainModel(MEMORY_CONSOLIDATE_SYSTEM, user);
  } catch (error) {
    return { ok: false, reason: `调用失败：${String(error)}` };
  }
  if (!text) return { ok: false, reason: '模型没有返回内容' };

  const parsed = parseJson<{ floors?: unknown }>(text);
  const list = parsed && Array.isArray(parsed.floors) ? parsed.floors : null;
  if (!list) return { ok: false, reason: '返回格式不是 {"floors":[...]}' };

  const anchor = String(stat.世界?.当前时间 ?? '').trim();
  const floorIdOf = new Map(floors.map(floor => [floor.n, floor.id]));
  const raw = list
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map(item => ({
      n: Number(item.n),
      楼层: floorIdOf.get(Number(item.n)) ?? 0,
      时间: normalizeStamp(String(item.timeStart ?? ''), anchor),
      事件: String(item.summary ?? '').trim(),
      强度: normalizeStrength(item.weight),
      标签: normalizeTag(item.tag, '其他'),
    }))
    .filter(item => item.事件);
  const added: MemoryEntry[] = raw
    .filter(item => looksLikeStory(item.事件))
    .sort((a, b) => a.n - b.n)
    .map(({ 时间, 事件, 强度, 标签, 楼层 }) => ({ 时间, 事件, 强度, 标签, 钉选: false, 楼层 }));

  if (!added.length) {
    // 这批楼层已经被模型处理过，只是没有可写入的条目；不推进游标会让它们每轮重跑一次
    advanceCursor(processed);
    return {
      ok: false,
      reason: raw.length ? `整理结果里 ${raw.length} 条是规划或要求，已丢弃` : '整理结果为空，保留原记忆',
    };
  }

  // 追加而不是覆盖；同一来源楼层只整理一次，同一时间同一事件也不重复写入
  const seen = new Set(entries.map(e => `${e.时间}|${e.事件}`));
  const doneFloors = new Set(entries.map(e => e.楼层).filter(n => n > 0));
  const fresh = added.filter(e => {
    if (e.楼层 > 0 && doneFloors.has(e.楼层)) return false;
    const key = `${e.时间}|${e.事件}`;
    if (seen.has(key)) return false;
    seen.add(key);
    if (e.楼层 > 0) doneFloors.add(e.楼层);
    return true;
  });
  if (!fresh.length) {
    // 这些楼层在记忆日志里已有对应条目，推进游标避免反复重跑同一段
    advanceCursor(processed);
    return { ok: false, reason: '这批楼层已整理过' };
  }

  const merged = [...entries, ...fresh].sort((a, b) => a.时间.localeCompare(b.时间));

  const draft = JSON.parse(JSON.stringify(stat)) as Record<string, any>;
  _.set(draft, '千鹤.记忆日志', merged);
  const checked = Schema.safeParse(draft);
  if (!checked.success) return { ok: false, reason: '整理结果未通过校验，保留原记忆' };

  updateVariablesWith(vars => _.set(vars, 'stat_data', checked.data), STAT_ROOT);
  advanceCursor(processed);
  return { ok: true, count: fresh.length };
}

// ==================== 初始化 ====================

let inFlight = false;
/** 已完成的角色回复轮数，用于「每 N 轮整理一次」 */
let memoryRounds = 0;

async function onCharacterRendered(): Promise<void> {
  if (inFlight) return;
  inFlight = true;
  try {
    // 副模型职责受启用开关约束；记忆整理另有模式开关，主模型模式不需要副模型
    if (submodelConfig.enabled && submodelConfig.varUpdate) {
      await runVariableUpdate();
    }
  } finally {
    inFlight = false;
  }

  // 记忆整理与副模型开关无关：主模型模式不需要副模型
  if (memoryConfig.mode !== 'main' && memoryConfig.mode !== 'sub') return;
  memoryRounds += 1;
  if (memoryRounds % memoryConfig.every !== 0) return;
  await runMemoryConsolidation();
}

/**
 * 记忆写入要求的唯一来源，与改动前一致：
 * - 提示词模式：每轮要求主模型自己追加一条；
 * - 主模型 / 副模型 / 关闭模式：要求主模型不要碰记忆日志。
 */
const MEMORY_WRITE_PROMPT = `【记忆更新要求】本轮结束时，在 JSONPatch 里为「记忆日志」追加一条本楼的关键事件，只追加这一条。
- 用 insert 追加到 /千鹤/记忆日志/-，value 为 { "时间": "YYYY-MM-DD HH:MM", "事件": "……", "强度": 40, "标签": "日常", "钉选": false }。
- 时间取本楼结束时的世界时间（世界.当前时间），必须是完整年月日时分，不得只写时分。
- 事件只写本楼发生的关键进展，一两句；不写内心独白、不写评价。
- 强度 0~100 的整数：普通日常 30~50，重要事件 70~90。标签只能是 日常 / 重要 / 约定 / 亲密 / 秘密 / 其他，拿不准时用「其他」。
- 钉选一律写 false；不修改、不删除已有条目；记忆不设上限，不要合并、压缩或摘要。
- 停止/冻结/关机期间不写入。`;

const MEMORY_SUPPRESS_PROMPT = `本轮不要改动「记忆日志」字段：不新增、不修改、不删除。记忆由系统在后台维护。其余变量照常按规则更新。`;

/** 挂载副模型：监听主模型回复完成，异步触发两个职责（不阻塞主流程） */
export function initSubmodel(): void {
  // 刷新、重载、滚动加载历史时，本界面会为已有楼层补发 rerender 事件；这不是新回复，
  // 不能当成一轮生成去跑变量更新与记忆整理，否则每次刷新都会触发一次后台整理。
  eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, (_message_id: number, type: string) => {
    if (type === 'rerender') return;
    void onCharacterRendered();
  });

  // filter 在每次生成时求值，切换模式立刻生效；生成前再注入一次，防止注入在切换聊天后失效
  refreshMemoryPrompts();
  eventOn(tavern_events.GENERATION_STARTED, () => refreshMemoryPrompts());

  // 切换聊天：轮数从头算；游标本身存在聊天变量里，天然按聊天隔离
  eventOn(tavern_events.CHAT_CHANGED, () => {
    memoryRounds = 0;
  });

  // 重 roll：该楼及之后的整理进度作废，下一次重新整理
  eventOn(tavern_events.MESSAGE_SWIPED, (message_id: number) => {
    const cursor = readCursor();
    if (cursor >= message_id) writeCursor(message_id - 1);
    memoryRounds = 0;
  });
}

function refreshMemoryPrompts(): void {
  try {
    if (typeof uninjectPrompts === 'function') {
      uninjectPrompts(['ch:memory-write', 'ch:memory-suppress']);
    }
    injectPrompts([
      {
        id: 'ch:memory-write',
        position: 'in_chat',
        depth: 0,
        role: 'system',
        content: MEMORY_WRITE_PROMPT,
        filter: () => memoryConfig.mode === 'prompt',
      },
      {
        id: 'ch:memory-suppress',
        position: 'in_chat',
        depth: 0,
        role: 'system',
        content: MEMORY_SUPPRESS_PROMPT,
        filter: () => memoryConfig.mode !== 'prompt',
      },
    ]);
  } catch {
    /* 酒馆助手版本过旧、没有 injectPrompts 时忽略：记忆写入退化为完全由世界书决定 */
  }
}
