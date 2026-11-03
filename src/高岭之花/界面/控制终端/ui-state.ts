import { reactive } from 'vue';
import { commitHeartbeatDrift } from './heartbeat';
import { buildExtraPromptBlock } from './extra-prompt';
import { buildMemoryBlock, readCognition, readMemoryEntries } from './memory-inject';
import {
  canInjectPrompts,
  flushStateToVariables,
  injectMemoryBlock,
  refreshVariableSnapshot,
} from '../../脚本/对话显示/prompt-inject';

/** 跨面板共享的终端 UI 状态（不属于角色数据，仅前端交互） */
export const uiState = reactive({
  /** 终端是否处于重启加载中 */
  rebooting: false,
  /** 是否已解锁制作者彩蛋（隐藏主题） */
  secretUnlocked: false,
  /** 已被 rd 命令删除的系统文件路径（重启后从镜像恢复） */
  deletedFiles: [] as string[],
  /** 删除文件的原始值快照，用于重启恢复 */
  fileBackups: {} as Record<string, unknown>,
  /** 彩蛋四卷解锁状态 */
  eggManifestoUnlocked: false,
  eggBirthUnlocked: false,
  eggBtsUnlocked: false,
  eggThanksUnlocked: false,
  /** 「手记」主题解锁（unlock 12 时随卷四一起解锁） */
  manifestoThemeUnlocked: false,
  /** 终端文本语言：zh 中文（默认，仅 help 解释中文化）/ en 英文（现状） */
  termLang: 'zh' as 'zh' | 'en',
});

type StateData = Record<string, unknown>;
type StatePatch = { op: 'replace' | 'remove'; path: string; value?: unknown };

/** 上一次成功发送给 AI 的状态快照，作为 diff 基准 */
let previousState: StateData | undefined;

function cloneState(data: StateData): StateData {
  return JSON.parse(JSON.stringify(data)) as StateData;
}

function escapePath(key: string): string {
  return key.replaceAll('~', '~0').replaceAll('/', '~1');
}

function isRecord(value: unknown): value is StateData {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function collectPatches(previous: unknown, current: unknown, path = ''): StatePatch[] {
  if (JSON.stringify(previous) === JSON.stringify(current)) return [];
  if (!isRecord(previous) || !isRecord(current)) {
    return [{ op: current === undefined ? 'remove' : 'replace', path, ...(current === undefined ? {} : { value: current }) }];
  }

  const keys = new Set([...Object.keys(previous), ...Object.keys(current)]);
  return [...keys].flatMap(key => {
    const childPath = `${path}/${escapePath(key)}`;
    if (!(key in current)) return [{ op: 'remove' as const, path: childPath }];
    if (!(key in previous)) return [{ op: 'replace' as const, path: childPath, value: current[key] }];
    return collectPatches(previous[key], current[key], childPath);
  });
}

/** 清空仅属于当前聊天的前端瞬态（重启进度、被删文件镜像等）。账号级设置不在此列。 */
export function resetTransientState(): void {
  uiState.rebooting = false;
  uiState.deletedFiles = [];
  uiState.fileBackups = {};
}

/** 丢弃 diff 基准；下一次 buildControlUpdate 会以当前数据重新建基线。 */
export function resetControlBaseline(): void {
  previousState = undefined;
}

/** 初始化 diff 基准。仅在首次调用（快照尚未建立）时生效。 */
export function trackControlState(data: StateData): void {
  if (!previousState) {
    previousState = cloneState(data);
  }
}

/** 外部同步（AI 回复或消息删除导致 stat_data 变化）后，把 diff 基准重置到最新已提交状态，
 *  避免旧快照在后续 diff 中产生针对早已删除指令的虚假 remove 补丁。 */
export function resyncControlState(data: StateData): void {
  previousState = cloneState(data);
}

/** 将当前状态与上次发送基准做 diff，返回只包含变动路径的声明字符串。 */
export function buildControlUpdate(data: StateData): { updateStr: string, patches: StatePatch[] } {
  if (!previousState) {
    previousState = cloneState(data);
  }
  const patches = collectPatches(previousState, data);
  if (patches.length === 0) return { updateStr: '', patches: [] };
  return {
    updateStr: `<ch_state_update>\n${JSON.stringify(patches)}\n</ch_state_update>`,
    patches
  };
}

/** 写作自检强调：每隔 20 楼（=10 轮，玩家+AI 各占 1 楼）注入一次，强化三层理论、去机器人化、语气由性格、认知贯彻与变量归因 */
const WRITING_EMPHASIS = `<ch_writing>\n【写作自检·内部】生成千鹤的台词、描写与变量更新前，依次检查：\n第 1 步（三层理论）：生成前先参考世界书「机器人话语生成」条目，确认 L1 / L2 / L3 / L4 四层结构与各自职责。\n第 2 步（来源）：话语由 L3 生成，与普通人类女生一致；不是 L1 的报错、代码、预制文本或数据播报。\n第 3 步（语气与性格）：语气由「性格」字段当前值决定（默认高岭之花）；认知被改写、机器人自觉都不改变语气，不变成机械腔、顺从讨好腔或任务导向的机械回应。\n第 4 步（去机器人化）：不播报系统自检、电量百分比、模块状态、管线冷却；不主动提出打开维护舱门或进入维护模式；不把情感写成参数。\n第 5 步（认知扭曲贯彻）：认知覆盖后的内容自然贯彻，作为她一直持有的想法；不点破「认知被改写」，不产生违和或怀疑。\n第 6 步（机损）：人格模块未离线、输出受 L2 干扰，用符号失真表现；不写成机械腔堆砌，不写成人格模块离线。\n第 7 步（变量归因）：变量变化只归因于玩家终端操作、系统心跳、剧情明确事件三类；不凭空漂移 CPU/内存/电量/快感/好感/地点/处境，不写成「自行变化」「突然变化」。\n第 8 步（记忆日志）：只在收到「记忆更新要求」时写入；没有要求时不新增、不修改、不删除。停止/冻结/关机不写。\n</ch_writing>`;

/** 每 20 楼注入一次写作强调（开场白 id=0，之后玩家+AI 各占 1 楼，1 轮=2 楼） */
const WRITING_COOLDOWN_MSGS = 20;

/** 向酒馆聊天追加状态声明与玩家文本，并触发下一轮生成。 */
export async function sendControlUpdate(data: StateData, playerText = ''): Promise<boolean> {
  // 心跳漂移在这里才并入变量：平时只影响显示，发送的这一刻才定稿
  commitHeartbeatDrift(data as any);
  // 先把定稿值同步进最新楼层：发送时新楼层的初始化可能复制到提交前的旧值，
  // 旧值再经轮询同步回本地，电量就会一直退回原值（表现为在相邻两点间浮动）
  flushStateToVariables(data);
  // 记忆注入要先取基线：buildControlUpdate 在基线为空时会就地初始化，之后再算就没有「本轮变更」了
  const memoryBlock = buildMemoryBlock(
    readMemoryEntries(data),
    previousState ? readMemoryEntries(previousState) : undefined,
    readCognition(data),
  );
  // 始终发送状态 diff：previousState 快照保证 diff 只含本轮实际变化，中间过渡值不会泄漏，无需同步开关
  const { updateStr } = buildControlUpdate(data);
  if (!updateStr && !playerText.trim()) return false;

  // 用酒馆真实楼层数做冷却：getLastMessageId() 是发送前最后一条消息 id（开场白 id=0），
  // 每 20 楼（=10 轮）注入一次写作强调（第 1、11、21… 次玩家消息）。
  // 楼层 0 是开场白，不能算作一轮；否则第一条玩家消息就会命中 0 % 20 === 0
  const last_id = getLastMessageId();
  const writing = last_id > 0 && last_id % WRITING_COOLDOWN_MSGS === 0 ? WRITING_EMPHASIS : '';

  // 页面上填的额外提示词：紧跟在变量更新告知之后，单独成段，显示时由正则隐藏
  const extra = buildExtraPromptBlock();

  // 支持注入时，记忆作为临时系统提示发送，不写进聊天记录；旧版本助手回退到拼进消息
  const injectable = canInjectPrompts();
  const message = [playerText.trim(), updateStr, extra, injectable ? '' : memoryBlock, writing]
    .filter(Boolean)
    .join('\n\n');

  try {
    await createChatMessages([{ role: 'user', message }]);
    // 新楼层建好后再写一次，确保它是从已提交的状态起步，而不是提交前的旧值
    flushStateToVariables(data);
    // 变量快照剔除记忆日志后写进 prompt_snapshot，供世界书「变量列表」读取
    refreshVariableSnapshot(data);
    if (injectable) injectMemoryBlock(memoryBlock);
    // 成功创建楼层后，才把发送基准推进到当前状态，避免失败时丢失待发送的变化
    previousState = cloneState(data);
    await triggerSlash('/trigger');
    return true;
  } catch (error) {
    console.error('发送状态失败', error);
    return false;
  }
}
