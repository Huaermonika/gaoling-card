/**
 * 心跳时钟 —— 只影响显示，不直接写变量。
 *
 * 两条节奏：电量每 30 秒按真实经过时间结算一次，CPU/内存每 1.5 秒抖动一次，
 * 都只累加显示层的漂移量。
 * 漂移只叠加在界面上，stat_data 保持不动，直到终端发送消息时一次性并入变量
 * （见 ui-state.ts 的 sendControlUpdate），所以：
 * - 挂着不动不会改写变量，也不反复刷新变量；
 * - 切聊天、重ROLL 不会被心跳污染；
 * - AI 的充电等外部更新按原值生效，不被本地漂移盖掉。
 *
 * 设置项「启用心跳时钟」关闭时心跳整个停摆：不漂移、不告警、不自动关机，
 * 界面数值只随常规变量更新变化。
 */

const LS_KEY = 'ch:hb';

export interface HeartbeatSettings {
  /** 是否启用心跳时钟；关闭后没有任何心跳漂移 */
  启用: boolean;
}

const DEFAULT_SETTINGS: HeartbeatSettings = { 启用: true };

function loadSettings(): HeartbeatSettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<HeartbeatSettings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export const heartbeatSettings = reactive<HeartbeatSettings>(loadSettings());

export function saveHeartbeatSettings(patch?: Partial<HeartbeatSettings>): void {
  if (patch) Object.assign(heartbeatSettings, patch);
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(heartbeatSettings));
  } catch {
    /* ignore */
  }
}

// 关掉心跳时立刻丢掉残留漂移，界面马上回到变量原值
watch(
  () => heartbeatSettings.启用,
  enabled => {
    if (!enabled) resetHeartbeatDrift();
  },
);

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** 显示层漂移量：只做加法，不直接写进 data */
export const heartbeatDrift = reactive({ 电量: 0, cpu使用率: 0, 内存使用率: 0 });

/** 最近一次确认过的基准值；只有基准真的变了，对应漂移才归零 */
const externalBase = { 电量: Number.NaN, cpu使用率: Number.NaN, 内存使用率: Number.NaN };

export function resetHeartbeatDrift(): void {
  heartbeatDrift.电量 = 0;
  heartbeatDrift.cpu使用率 = 0;
  heartbeatDrift.内存使用率 = 0;
  pendingLogs.splice(0, pendingLogs.length);
  externalBase.电量 = Number.NaN;
  externalBase.cpu使用率 = Number.NaN;
  externalBase.内存使用率 = Number.NaN;
}

/** 界面显示值 = 变量值 + 心跳漂移 */
export const hbBattery = (base: number) => clamp(Math.round(base + heartbeatDrift.电量), 0, 100);
export const hbCpu = (base: number) => clamp(Math.round(base + heartbeatDrift.cpu使用率), 0, 100);
export const hbRam = (base: number) => clamp(Math.round(base + heartbeatDrift.内存使用率), 0, 100);

/**
 * 外部权威值到达（AI 变量更新 / 轮询同步）时调用。
 * 以前这里直接 `resetHeartbeatDrift()`，但轮询每 2 秒就可能同步一次，
 * 导致电量攒不到 1 点、CPU/内存的抖动刚产生就被清零。
 * 现在只在某个基准值确实变了的时候，清掉该字段的漂移。
 */
export function syncExternalBase(电量: number, cpu使用率: number, 内存使用率: number): void {
  if (!Number.isNaN(externalBase.电量) && externalBase.电量 !== 电量) heartbeatDrift.电量 = 0;
  if (!Number.isNaN(externalBase.cpu使用率) && externalBase.cpu使用率 !== cpu使用率) heartbeatDrift.cpu使用率 = 0;
  if (!Number.isNaN(externalBase.内存使用率) && externalBase.内存使用率 !== 内存使用率) heartbeatDrift.内存使用率 = 0;

  externalBase.电量 = 电量;
  externalBase.cpu使用率 = cpu使用率;
  externalBase.内存使用率 = 内存使用率;
}

// ==================== 待写入的系统日志 ====================

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
const SYSTEM_LOG_LIMIT = 20;

const pendingLogs: { 级别: LogLevel; 事件: string }[] = [];

/** 告警先排队，等发送时和其它变化一起落盘 */
export function queueHeartbeatLog(级别: LogLevel, 事件: string): void {
  pendingLogs.push({ 级别, 事件 });
}

// 阈值告警的锁：只在跨过阈值那一刻排一条，回到安全区再解锁
let lowBatteryWarned = false;
let highCpuWarned = false;

/**
 * 阈值告警：看的是当前数值本身，和心跳开没开无关。
 * 心跳每拍调一次；AI 变量更新到达时也调一次，所以关掉心跳后 AI 写的低电量照样告警。
 */
export function checkThresholds(电量: number, cpu: number): void {
  if (电量 <= 15 && 电量 > 0) {
    if (!lowBatteryWarned) {
      lowBatteryWarned = true;
      queueHeartbeatLog('WARN', `Low battery: ${Math.round(电量)}%. Please connect charger.`);
    }
  } else if (电量 > 15) {
    lowBatteryWarned = false;
  }

  if (cpu >= 90) {
    if (!highCpuWarned) {
      highCpuWarned = true;
      queueHeartbeatLog('WARN', `High CPU load: ${Math.round(cpu)}%.`);
    }
  } else if (cpu < 90) {
    highCpuWarned = false;
  }
}

function stampTime(currentTime: string): string {
  const m = currentTime.match(/(\d{2}:\d{2})/);
  return m ? m[1] : '--:--';
}

/** 心跳只需要这三个字段，用结构类型避免和 store.ts 互相引用 */
type HeartbeatTarget = {
  世界: { 当前时间: string };
  千鹤: { 电量: number; cpu使用率: number; 内存使用率: number };
  系统日志: { 时间: string; 级别: LogLevel; 事件: string }[];
};

/**
 * 发送前提交：把漂移并入变量，再清空漂移与排队日志。
 * 关闭「启用心跳时钟」时没有漂移可并，但排队中的告警照样写（告警看的是数值本身，不是心跳）。
 */
export function commitHeartbeatDrift(data: HeartbeatTarget): void {
  const logs = pendingLogs.splice(0, pendingLogs.length);

  const 千鹤 = data.千鹤;
  if (heartbeatSettings.启用) {
    if (heartbeatDrift.电量) 千鹤.电量 = clamp(千鹤.电量 + heartbeatDrift.电量, 0, 100);
    if (heartbeatDrift.cpu使用率) 千鹤.cpu使用率 = clamp(千鹤.cpu使用率 + heartbeatDrift.cpu使用率, 0, 100);
    if (heartbeatDrift.内存使用率) 千鹤.内存使用率 = clamp(千鹤.内存使用率 + heartbeatDrift.内存使用率, 0, 100);
  }
  resetHeartbeatDrift();
  // 定稿后的值就是新基准，避免下一次外部同步把它当成“基准变了”
  externalBase.电量 = 千鹤.电量;
  externalBase.cpu使用率 = 千鹤.cpu使用率;
  externalBase.内存使用率 = 千鹤.内存使用率;

  if (!logs.length) return;
  for (const log of logs) {
    data.系统日志.push({ 时间: stampTime(data.世界.当前时间), 级别: log.级别, 事件: log.事件 });
  }
  if (data.系统日志.length > SYSTEM_LOG_LIMIT) {
    data.系统日志.splice(0, data.系统日志.length - SYSTEM_LOG_LIMIT);
  }
}
