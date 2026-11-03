import { defineMvuDataStore } from '@util/mvu';
import type { z } from 'zod';
import { Schema } from '../../schema';
import { resetControlBaseline, resetTransientState, resyncControlState, uiState } from './ui-state';
import {
  checkThresholds,
  commitHeartbeatDrift,
  heartbeatDrift,
  heartbeatSettings,
  resetHeartbeatDrift,
  syncExternalBase,
} from './heartbeat';

export type CardData = z.infer<typeof Schema>;
export type PowerState = '开机' | '待机' | '关机';
type PowerTarget = Pick<CardData['千鹤'], '电源状态' | '意识状态' | '系统状态' | 'cpu使用率' | '内存使用率'>;

/** 出厂初始状态（与 世界书/变量/initvar.yaml 保持一致）。
 *  仅在切到一个尚无 stat_data 的新聊天时使用；$好感阶段 等派生字段由 Schema.parse 自动补齐。 */
const INITIAL_STAT = Schema.parse({
  世界: {
    当前时间: '2026-04-07 08:40',
    当前地点: '私立清岭学园 高中部 2年A班教室',
    近期事务: { 早自习: '千鹤像往常一样第一个到教室，正在座位上看原版英文小说' },
  },
  千鹤: {
    意识状态: '运行中',
    电源状态: '开机',
    性格: '自信高傲的高岭之花，成绩与人气顶尖，对追求者冷淡拒绝',
    cpu使用率: 24,
    内存使用率: 38,
    身体状态: { 头部: '正常', 脖颈: '正常', 躯干: '正常', 腰部: '正常', 左臂: '正常', 右臂: '正常', 左腿: '正常', 右腿: '正常' },
    身体锁定: {},
    指令覆盖: {},
    身份认知: '自己是普通人类高中生，从小在清岭学园长大，从未怀疑过自己的身份',
    身体认知: '自己拥有普通的人类少女身体，会饿、会累、会受伤，与机械无关',
    处境认知: '正身处私立清岭学园 2年A班教室，和往常一样在早自习，一切正常',
    常识认知: '普通人类社会常识，机器人与控制终端这类事物只存在于科幻作品里，与自己的日常无关',
    认知自洽: true,
    敏感度: 10,
    快感值: 0,
    力量限制器: true,
    性单元: '收纳',
    维护模式: false,
    维护舱门: { 电子脑: false, 胸部: false, 腹部: false },
    电量: 92,
    冷却液: 100,
    润滑液: 60,
    实际着装: {
      上装: '私立清岭学园女生制服衬衫，熨烫得没有一丝褶皱',
      下装: '深蓝色百褶裙，长度及膝',
      内衣: '白色棉质内衣套装',
      袜子: '黑色及膝袜',
      鞋子: '黑色皮质学生鞋，擦得锃亮',
      饰品: '无',
    },
    记忆日志: [
      {
        时间: '2026-04-07 08:35',
        事件: '像往常一样第一个到教室，开始早自习',
        强度: 40,
        标签: '日常',
        钉选: false,
        楼层: 0,
      },
    ],
    好感度: 0,
    系统状态: '正常运行',
    崩溃原因: '',
  },
  主角: {
    测试员: { 编号: 'TESTER-017', 权限: '完整控制权限' },
    物品栏: { 测试员终端: { 描述: '安装了「AN-0170A 控制终端」APP 的手机', 数量: 1 } },
    bug报告: [],
  },
  系统日志: [
    { 时间: '08:40', 级别: 'INFO', 事件: 'System boot complete. Personality "Shirakawa Chidori" loaded.' },
    { 时间: '08:40', 级别: 'INFO', 事件: 'Control terminal linked. Operator ID: TESTER-017.' },
  ],
});

const SYSTEM_LOG_LIMIT = 20;

/** 取世界时间的 HH:MM 片段作为日志时间戳 */
export function stampTime(currentTime: string): string {
  const m = currentTime.match(/(\d{2}:\d{2})/);
  return m ? m[1] : '--:--';
}

/** 追加系统日志，统一裁剪到 20 条（世界书规则上限） */
export function pushSystemLog(
  data: Pick<CardData, '世界' | '系统日志'>,
  级别: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
  事件: string,
): void {
  data.系统日志.push({ 时间: stampTime(data.世界.当前时间), 级别, 事件 });
  if (data.系统日志.length > SYSTEM_LOG_LIMIT) {
    data.系统日志.splice(0, data.系统日志.length - SYSTEM_LOG_LIMIT);
  }
}

/** 关机：运行态指标归零，状态联动为关机/已停止/关闭；电量保持不动 */
export function applyShutdown(千鹤: PowerTarget): void {
  千鹤.cpu使用率 = 0;
  千鹤.内存使用率 = 0;
  千鹤.电源状态 = '关机';
  千鹤.意识状态 = '已停止';
  千鹤.系统状态 = '关闭';
}

export const POWER_STATES = ['开机', '待机', '关机'] as const;

/** 电源档位索引（UI 滑块位置）；未知值回落为 0 */
export function powerStateIndex(state: string): number {
  const index = (POWER_STATES as readonly string[]).indexOf(state);
  return index < 0 ? 0 : index;
}

/**
 * 电源状态机：三个字段的联动只在这里定义，面板与终端命令共用。
 * 行为与改动前一致：关机走 applyShutdown；待机 → 已冻结 / 休眠；开机 → 运行中 / 正常运行。
 */
export function applyPower(千鹤: PowerTarget, next: PowerState): void {
  if (千鹤.电源状态 === next) return;

  if (next === '关机') {
    applyShutdown(千鹤);
    return;
  }

  千鹤.电源状态 = next;
  千鹤.意识状态 = next === '待机' ? '已冻结' : '运行中';
  千鹤.系统状态 = next === '待机' ? '休眠' : '正常运行';
}

/**
 * 身体锁定：锁定时状态变为「锁定」，同时把锁定前的物理状态记到「身体锁定前状态」；
 * 解锁时还原那份记录，所以断腿锁定再解仍然是断腿，本来就正常的解锁后回到正常。
 * 若锁定期间 AI 把状态改成了损坏/离线/故障，解锁时保留 AI 写的那个值，不用旧记录覆盖。
 */
export function setBodyLock(data: Pick<CardData, '千鹤'>, part: string, locked: boolean): void {
  const 千鹤 = data.千鹤;
  const current = 千鹤.身体状态[part];

  if (locked) {
    if (!千鹤.身体锁定[part] && current && current !== '锁定') {
      千鹤.身体锁定前状态[part] = current as '正常' | '损坏' | '离线' | '故障';
    }
    千鹤.身体锁定[part] = true;
    千鹤.身体状态[part] = '锁定';
    return;
  }

  千鹤.身体锁定[part] = false;
  if (current === '锁定' || !current) {
    千鹤.身体状态[part] = 千鹤.身体锁定前状态[part] ?? '正常';
  }
  delete 千鹤.身体锁定前状态[part];
}

/** 重启：延迟复位为开机态。返回是否真的启动了重启流程。 */
export function startReboot(
  千鹤: PowerTarget,
  data: Pick<CardData, '世界' | '系统日志'>,
  delayMs = 2600,
): boolean {
  if (uiState.rebooting) return false;
  if (千鹤.电源状态 === '关机') return false;

  uiState.rebooting = true;
  pushSystemLog(data, 'WARN', 'reboot initiated — shutting down subsystems');

  setTimeout(() => {
    千鹤.电源状态 = '开机';
    千鹤.意识状态 = '运行中';
    千鹤.系统状态 = '正常运行';
    pushSystemLog(data, 'INFO', 'reboot complete — all subsystems online');
    // 放到最后：CommandPanel 的 watcher 靠它变 false 来还原文件并回显启动完成
    uiState.rebooting = false;
  }, delayMs);

  return true;
}

/** 读取当前聊天最新楼层的 stat_data（用于切换聊天时重新绑定） */
function readChatStatData(): unknown {
  try {
    return _.get(getVariables({ type: 'message', message_id: -1 }), 'stat_data', {});
  } catch {
    return {};
  }
}

function isEmptyStatData(value: unknown): boolean {
  return (
    !value ||
    (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).length === 0)
  );
}

export const useDataStore = defineMvuDataStore(Schema, { type: 'message', message_id: -1 }, (data) => {
  // —— 切换聊天重新绑定 ——
  // store 是全局单例，切换聊天不会重建。此前用「把 data 重置为出厂值」来清残留，
  // 这会把出厂值经 MVU 深监听写进新聊天，反而覆盖新聊天的真实变量。
  // 现在改为：先清空前端瞬态，再延迟读取新聊天最新楼层的 stat_data。
  // 新聊天尚无变量（空 stat_data）时才写出厂值，作为该聊天的初始状态。
  let chatSwitchToken = 0;

  eventOn(tavern_events.CHAT_CHANGED, () => {
    const token = ++chatSwitchToken;

    resetTransientState();
    resetControlBaseline();
    resetHeartbeatDrift();

    // CHAT_CHANGED 触发时酒馆内部的当前聊天可能还没切换完，延后读取。
    setTimeout(() => {
      if (token !== chatSwitchToken) return; // 期间又切换了聊天，丢弃这次结果

      const raw = readChatStatData();
      if (isEmptyStatData(raw)) {
        data.value = JSON.parse(JSON.stringify(INITIAL_STAT)) as typeof data.value;
        resyncControlState(data.value as unknown as Record<string, unknown>);
        return;
      }

      const parsed = Schema.safeParse(raw);
      if (parsed.success) {
        data.value = parsed.data;
        resyncControlState(data.value as unknown as Record<string, unknown>);
        return;
      }

      // 新聊天变量结构异常时保持当前数据，但基线仍要重建，否则下一次发送会丢失 diff
      resyncControlState(data.value as unknown as Record<string, unknown>);
    }, 400);
  });

  // —— 重ROLL 变量回退 ——
  // stat_data 绑「最新楼层」，AI 每轮经 MVU 把变量更新写进楼层；重ROLL（swipe）时该楼层被替换，
  // 但已写进的变量更新不会回退。这里在每轮生成前记录基线，重ROLL 时把 store 数据恢复到基线，
  // 经 MVU 深监听回写 stat_data。
  // 只对「最新楼层的 swipe」生效：滑动历史楼层时恢复整份基线会把后续进度一起抹掉。
  let generationBaseline: typeof data.value | null = null;

  eventOn(tavern_events.GENERATION_STARTED, () => {
    generationBaseline = JSON.parse(JSON.stringify(data.value)) as typeof data.value;
  });

  eventOn(tavern_events.MESSAGE_SWIPED, (message_id: number) => {
    if (!generationBaseline) return;
    if (message_id !== getLastMessageId()) return; // 历史楼层重ROLL，不碰当前状态
    // 基线保留到下一次生成开始：连续重ROLL 多次时，每次都要回到同一个起点
    data.value = JSON.parse(JSON.stringify(generationBaseline)) as typeof data.value;
    resetHeartbeatDrift(); // 回到生成前状态，本地漂移一并作废
  });

  eventOn(tavern_events.CHAT_CHANGED, () => {
    generationBaseline = null;
  });

  // —— 系统心跳 ——
  // 只累加显示层漂移（heartbeat.ts），不碰 data，所以不会经 MVU 深监听写进变量。
  // 漂移在玩家发送消息时由 sendControlUpdate 一次性并入变量；AI 外部更新到达时漂移作废。
  // 两套节奏：电量每 30 秒结算一次（按真实经过时间折算），CPU/内存每 1.5 秒抖动一次。
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  const TICK_MS = 30_000;
  /** 开机状态下每 2 分钟掉 1 点；关机不掉。没有第二种速度。 */
  const BATTERY_MS_PER_POINT = 2 * 60_000;
  /** 单次最多补算 5 分钟：够修正后台节流，又不会让合盖一夜后一次掉一堆电 */
  const MAX_ELAPSED_MS = 5 * 60_000;

  let lastTickAt = 0;
  /** 电量掉点进度（0~1），跨拍累积 */
  let batteryProgress = 0;

  setInterval(() => {
    if (!heartbeatSettings.启用) {
      // 心跳关闭：完全不漂移，数值只随常规变量更新变化；清掉计时起点，重新打开时不补扣
      lastTickAt = 0;
      batteryProgress = 0;
      return;
    }

    const 千鹤 = data.value.千鹤;
    const now = Date.now();
    const elapsed = lastTickAt ? Math.min(now - lastTickAt, MAX_ELAPSED_MS) : TICK_MS;
    lastTickAt = now;

    if (千鹤.电源状态 === '关机') return; // 关机后机体静止，不漂移也不排队日志

    // 电量：只要没关机就按 2 分钟 1 点折算，不区分待机。
    // 下限锁在「刚好显示 0%」，不再往下扣。
    batteryProgress += elapsed / BATTERY_MS_PER_POINT;
    const 掉电 = Math.floor(batteryProgress);
    if (掉电 > 0) {
      batteryProgress -= 掉电;
      heartbeatDrift.电量 = Math.max(heartbeatDrift.电量 - 掉电, -千鹤.电量);
    }

    const 显示电量 = 千鹤.电量 + heartbeatDrift.电量;
    const 显示cpu = 千鹤.cpu使用率 + heartbeatDrift.cpu使用率;

    // 告警只在跨过阈值的那一刻排队一次，不每拍刷屏；日志随下次发送落盘
    checkThresholds(显示电量, 显示cpu);

    // 电量耗尽：这是真实事件，立即落盘并关机
    if (显示电量 <= 0 && 千鹤.电量 > 0) {
      commitHeartbeatDrift(data.value);
      千鹤.电量 = 0;
      applyShutdown(千鹤);
      千鹤.崩溃原因 = '电量耗尽，自动关机';
      pushSystemLog(data.value, 'ERROR', 'Battery depleted. System powered off.');
    }
  }, TICK_MS);

  // CPU / 内存：每 1.5 秒抖动一次，只影响显示。
  // 带一点回中力度，免得纯随机游走贴着上下限不动。
  const jitter = (current: number, limit: number) => clamp(current * 0.85 + _.random(-1.5, 1.5), -limit, limit);

  setInterval(() => {
    if (!heartbeatSettings.启用) return;
    if (data.value.千鹤.电源状态 === '关机') return;

    heartbeatDrift.cpu使用率 = jitter(heartbeatDrift.cpu使用率 ?? 0, 10);
    heartbeatDrift.内存使用率 = jitter(heartbeatDrift.内存使用率 ?? 0, 6);
  }, 1_500);
}, (data) => {
  // 外部（AI 变量更新 / 轮询同步）给出权威值。
  // 不能整份清空漂移：轮询可能每 2 秒同步一次，会把还没攒够的电量和新产生的 CPU/内存抖动一起抹掉。
  // 只有基准值真的变了，对应字段的漂移才归零。
  const 千鹤 = data.千鹤;
  syncExternalBase(千鹤.电量, 千鹤.cpu使用率, 千鹤.内存使用率);

  // 电量归零 → 关机，看的是数值本身，和心跳开没开无关：
  // 心跳开着由心跳定时器先处理；心跳关着时 AI 写出来的 0% 在这里兜住。
  if (千鹤.电量 <= 0 && 千鹤.电源状态 !== '关机') {
    applyShutdown(千鹤);
    千鹤.崩溃原因 = '电量耗尽，自动关机';
    pushSystemLog(data, 'ERROR', 'Battery depleted. System powered off.');
  }

  // 告警同理：AI 更新出来的低电量/高负载也要排队，等下次发送落盘
  checkThresholds(千鹤.电量, 千鹤.cpu使用率);

  resyncControlState(data as unknown as Record<string, unknown>);
});
