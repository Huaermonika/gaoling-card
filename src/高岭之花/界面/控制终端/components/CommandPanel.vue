<template>
  <div class="panel">
    <!-- ===== 指令覆盖 ===== -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 8 4 4-4 4" /><path d="M13 16h5" /></svg></span>
        <span class="panel-title">指令覆盖</span>
      </div>
      <span class="panel-tag">OVERRIDE</span>
    </div>
    <p class="panel-desc">优先级 0 为最高；冲突时优先执行高优先级指令，同级指令可并行执行</p>

    <div class="cmd-list">
      <div v-for="entry in sortedCmds" :key="entry.id" class="cmd-item">
        <span class="cmd-id">{{ entry.id }}</span>
        <span class="cmd-pri" :class="{ high: entry.priority === 0 }">P{{ entry.priority }}</span>
        <span class="cmd-content">{{ entry.content }}</span>
        <button class="cmd-del" type="button" title="删除这条指令" @click="removeCmd(entry.id)">✕</button>
      </div>
      <div v-if="!hasCommands" class="cmd-empty">
        <span class="cmd-empty-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m7 8 4 4-4 4" /><path d="M13 16h5" /></svg></span>
        <span class="cmd-empty-title">当前没有覆盖指令</span>
        <span class="cmd-empty-hint">在下方添加指令，可临时覆盖千鹤的行为</span>
      </div>
    </div>

    <div class="cmd-add">
      <div class="cmd-add-row">
        <input v-model="newId" class="cmd-input id" placeholder="编号，如 0E4" />
        <input
          v-model.number="newPriority"
          class="cmd-input pri"
          type="number"
          min="0"
          max="9"
          step="1"
          placeholder="P"
          title="优先级，0 最高"
        />
      </div>
      <textarea
        v-model="newContent"
        class="cmd-input cmd-area"
        rows="2"
        placeholder="覆盖指令内容，如：让她以为自己还穿着衣服"
      ></textarea>
      <button class="btn primary" type="button" :disabled="powerOff" @click="addCmd">写入覆盖指令</button>
    </div>
    <p v-if="powerOff" class="power-off-hint">⚠ 电源已关闭，指令功能已失效</p>

    <div class="divider"></div>

    <!-- ===== 命令库终端 ===== -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 9 5-5 5 5" /><path d="M7 15l5 5 5-5" /></svg></span>
        <span class="panel-title">命令库终端</span>
      </div>
      <div class="panel-head-right">
        <button
          class="lang-toggle"
          type="button"
          :title="uiState.termLang === 'zh' ? '切换为英文' : '切换为中文'"
          @click="toggleTermLang"
        >
          {{ uiState.termLang === 'zh' ? '中' : 'EN' }}
        </button>
        <span class="panel-tag">CMD LIB</span>
      </div>
    </div>
    <p class="panel-desc">输入指令由终端解析并执行 · 输入 help 查看全部命令</p>

    <div class="term-window">
      <div class="term-body">
        <div v-if="uiState.rebooting" class="term-boot">
          <span class="boot-spinner"></span>
          <span class="boot-text">rebooting unit…</span>
          <span class="boot-bar"><i></i></span>
        </div>
        <template v-else>
          <div v-for="(line, i) in termLines" :key="i" class="term-line" :class="line.kind">
            <span v-if="line.kind === 'in'" class="term-prompt">></span>
            <span v-else-if="line.kind === 'err'" class="term-prompt">!</span>
            <span v-else-if="line.kind === 'sys'" class="term-prompt">#</span>
            <span class="term-text">{{ line.text }}</span>
          </div>
          <div class="term-input-row">
            <span class="term-prompt">></span>
            <input
              v-model="termInput"
              class="term-input"
              :disabled="powerOff"
              placeholder="type a command… (help)"
              spellcheck="false"
              @keydown.enter="runTerm"
            />
            <button
              class="term-run-btn"
              type="button"
              :disabled="powerOff"
              title="执行命令（回车）"
              @click="runTerm"
            >
              ➤
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore, applyPower, pushSystemLog, setBodyLock, startReboot } from '../store';
import type { PowerState } from '../store';
import { uiState } from '../ui-state';
import { hbBattery, hbCpu, hbRam } from '../heartbeat';

const store = useDataStore();

const newId = ref('');
const newContent = ref('');
const newPriority = ref<number>(0);

const hasCommands = computed(() => Object.keys(store.data.千鹤.指令覆盖).length > 0);

/** 电源关闭时指令功能失效 */
const powerOff = computed(() => store.data.千鹤.电源状态 === '关机');

/** 按优先级升序（0 最高）排列，同级按编号排序 */
const sortedCmds = computed(() => {
  return Object.entries(store.data.千鹤.指令覆盖)
    .map(([id, cmd]) => ({ id, priority: cmd.优先级, content: cmd.内容 }))
    .sort((a, b) => (a.priority - b.priority) || a.id.localeCompare(b.id));
});

function addCmd() {
  if (!newId.value.trim() || !newContent.value.trim()) return;
  const pri = Math.max(0, Math.min(9, Number(newPriority.value) || 0));
  store.data.千鹤.指令覆盖[newId.value.trim()] = { 内容: newContent.value.trim(), 优先级: pri };
  newId.value = '';
  newContent.value = '';
  newPriority.value = 0;
}

function removeCmd(id: string) {
  delete store.data.千鹤.指令覆盖[id];
}

/* ============================================================
 * 命令库
 * ============================================================ */
interface TermLine {
  kind: 'in' | 'out' | 'err' | 'sys' | 'prose';
  text: string;
}

const termInput = ref('');
const termLines = ref<TermLine[]>([
  { kind: 'sys', text: 'AN-0170A command terminal v2.0 — type "help" to list commands' },
]);

/** 终端内被删除、等待填补的记忆 */
const termDeleted = ref<{ 时间: string; 事件: string }[]>([]);

function termOut(kind: TermLine['kind'], text: string) {
  termLines.value.push({ kind, text });
}

function nowTs(): string {
  const m = store.data.世界.当前时间.match(/(\d{2}:\d{2})/);
  return m ? m[1] : '--:--';
}

function log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', event: string) {
  pushSystemLog(store.data, level, event);
}

const LIMBS = ['头部', '脖颈', '躯干', '腰部', '左臂', '右臂', '左腿', '右腿'] as const;
const BODY_STATES = ['正常', '锁定', '损坏', '离线', '故障'] as const;

interface CmdDef {
  usage: string;
  desc: string;
  run: (args: string[]) => TermLine[];
}

/** 手记四卷正文（作者幕后手记） */
const VOLUMES = {
  manifesto: `卷一 · 理念

做角色卡，有句话一直没变：过去的、这一张、今后的每一张，都是给喜欢机娘的人做的。

如果卡在这里了，去别处看看。
都说颜色能够传达情绪，属于机娘的会是哪一个呢？
它身上的隐藏数字，带上0倒过来读，就是下一扇门。`,
  birth: `卷二 · 诞生

这张卡的起点，是セロハンてぇぷ老师和他的作品。
「校园、机娘、遥控器、催眠」这个题材，在我脑子里躺了很久，
是老师的作品推了我最后一把，让我把它做出来。
谢谢老师。
我是逛 P 站的时候，看到老师的画还有老师的游戏demo。
他的主页也在 P 站，搜名字就能找到。
下一扇门，藏在名字里：
把「セロハンてぇぷ」这七个假名，一笔一笔地数。
半浊点也算一笔。笔画数连成一长串，就是密码。`,
  bts: `卷三 · 花絮

我做这张角色卡的时候 DeepSeek 涨价了。
发布那一刻，我看了一眼花销，和当时输入、输出所有的价格。
整整 103.56 元，够我买 8.63 杯奶茶了。
抹掉小数点——这个数，就是下一扇门。`,
  thanks: `卷四 · 致谢

谢谢你，一路找到这里。
这张卡从草图，到你能拿在手里玩的完整角色，中间隔着很多个深夜……我的写卡助手不能自己授权自己只能我一个一个盯着点（幽怨）。
调前端、调人格、看着自己的token疯狂燃烧……
做出来的东西有人喜欢，是比什么都开心的事。
现在，收尾。
前面三卷，每一卷都藏了一串数字——你一路都没用上它们。
发布页、主页、或是别的什么伤心的地方，也都各藏着一串。
把它们找出来，原样拼在一起，不要做任何计算。
那就是最终的KEY。
联系作者，领取你来自「智斗密码」奖励`,
};

/** 手记卷内容行：标题用 sys，正文用 prose（衬线字体、大行高） */
function volumeLines(text: string): TermLine[] {
  const lines = text.split('\n');
  const title = lines[0];
  const body = lines.slice(1);
  return [
    { kind: 'sys', text: `── ${title} ──` },
    ...body.map(t => ({ kind: 'prose' as const, text: t })),
  ];
}

const COMMANDS: Record<string, CmdDef> = {
  /* ---------- SYSTEM ---------- */
  help: {
    usage: 'help [cmd]',
    desc: 'list all commands or show one command',
    run: args => {
      const zh = uiState.termLang === 'zh';
      if (args[0]) {
        const c = COMMANDS[args[0].toLowerCase()];
        if (!c) return [{ kind: 'err', text: `no such command: ${args[0]}` }];
        return [
          { kind: 'out', text: `${args[0].toLowerCase()} — ${cmdDesc(args[0].toLowerCase())}` },
          { kind: 'out', text: `usage: ${c.usage}` },
        ];
      }
      const groups: [string, string, string[]][] = [
        ['SYSTEM', '系统', ['help', 'status', 'info', 'power', 'reboot', 'uptime', 'date', 'clear', 'echo']],
        ['COGNITION', '认知', ['persona', 'cognition', 'memory']],
        ['PHYSIQUE', '躯体', ['sense', 'pleasure', 'body', 'wear', 'limiter']],
        ['DIAGNOSTIC', '诊断', ['log', 'whoami', 'ping', 'unlock', 'about']],
      ];
      const lines: TermLine[] = [];
      groups.forEach(([name, nameZh, cmds]) => {
        lines.push({ kind: 'sys', text: `── ${zh ? nameZh : name} ──` });
        cmds.forEach(n => {
          lines.push({ kind: 'out', text: `  ${n.padEnd(10)}${cmdDesc(n)}` });
        });
      });
      lines.push({ kind: 'sys', text: '── END ──' });
      return lines;
    },
  },
  status: {
    usage: 'status',
    desc: 'show system state',
    run: () => [
      { kind: 'out', text: `power: ${store.data.千鹤.电源状态}` },
      { kind: 'out', text: `consciousness: ${store.data.千鹤.意识状态}` },
      { kind: 'out', text: `system: ${store.data.千鹤.系统状态}` },
      { kind: 'out', text: `affection: ${store.data.千鹤.好感度}/100` },
      { kind: 'out', text: `cpu: ${hbCpu(store.data.千鹤.cpu使用率)}%  ram: ${hbRam(store.data.千鹤.内存使用率)}%  battery: ${hbBattery(store.data.千鹤.电量)}%` },
    ],
  },
  info: {
    usage: 'info',
    desc: 'show system information',
    run: () => [
      { kind: 'out', text: '── SYSTEM INFORMATION ──' },
      { kind: 'out', text: `os: KurenaiOS 3.2.1` },
      { kind: 'out', text: `firmware: persona-fw 4.0.5` },
      { kind: 'out', text: `serial: AN-0170A-2208-4417` },
      { kind: 'out', text: `hw-rev: HW-Rev 3.1` },
      { kind: 'out', text: `cpu: Neural Core NX-9` },
      { kind: 'out', text: `memory: 128 GB  storage: 32 TB` },
      { kind: 'out', text: `mfg: 2025-11-30  unit: SAKU-EN-1170` },
    ],
  },
  power: {
    usage: 'power [on|off|standby|status]',
    desc: 'control unit power state',
    run: args => {
      const cur = store.data.千鹤.电源状态;
      const action = args[0]?.toLowerCase();
      if (!action || action === 'status') return [{ kind: 'out', text: `power state: ${cur}` }];
      const map: Record<string, PowerState> = { on: '开机', off: '关机', standby: '待机' };
      const target = map[action];
      if (!target) return [{ kind: 'err', text: `unknown power action: ${action}` }];
      if (target === cur) return [{ kind: 'out', text: `power: already ${target}` }];
      applyPower(store.data.千鹤, target);
      const logMap = {
        开机: 'power: unit switched ON via terminal — all systems online',
        待机: 'power: unit switched to STANDBY via terminal',
        关机: 'power: unit switched OFF via terminal — command interface disabled',
      } as const;
      log('INFO', logMap[target]);
      return [{ kind: 'out', text: `power: switched to ${target}` }];
    },
  },
  reboot: {
    usage: 'reboot',
    desc: 'reboot the unit',
    run: () => {
      if (uiState.rebooting) return [{ kind: 'err', text: 'reboot already in progress' }];
      if (store.data.千鹤.电源状态 === '关机') return [{ kind: 'err', text: 'unit is powered off' }];
      // 由 startReboot 负责复位；原实现只置 true 不置 false，会永久卡在重启态
      startReboot(store.data.千鹤, store.data);
      return [{ kind: 'out', text: 'rebooting unit…' }];
    },
  },
  uptime: {
    usage: 'uptime',
    desc: 'show time since last boot',
    run: () => [{ kind: 'out', text: 'up 3 days, 7 hours, 42 minutes' }],
  },
  date: {
    usage: 'date',
    desc: 'show current date and time',
    run: () => [{ kind: 'out', text: `system time: ${store.data.世界.当前时间}` }],
  },
  clear: {
    usage: 'clear',
    desc: 'clear terminal output',
    run: () => {
      termLines.value = [];
      return [{ kind: 'sys', text: 'terminal cleared' }];
    },
  },
  echo: {
    usage: 'echo <text>',
    desc: 'echo text back',
    run: args => [{ kind: 'out', text: args.join(' ') || '(empty)' }],
  },

  /* ---------- COGNITION ---------- */
  persona: {
    usage: 'persona [set <text>]',
    desc: 'view or write persona',
    run: args => {
      if (args[0]?.toLowerCase() === 'set') {
        const text = args.slice(1).join(' ');
        if (!text) return [{ kind: 'err', text: 'usage: persona set <text>' }];
        store.data.千鹤.性格 = text;
        log('INFO', `persona updated via terminal`);
        return [{ kind: 'out', text: `persona set: ${text}` }];
      }
      return [{ kind: 'out', text: `persona: ${store.data.千鹤.性格 || '(not set)'}` }];
    },
  },
  cognition: {
    usage: 'cognition [reset]',
    desc: 'view or reset cognition state',
    run: args => {
      if (args[0]?.toLowerCase() === 'reset') {
        store.data.千鹤.身份认知 = '自己是普通人类高中生，从小在清岭学园长大，从未怀疑过自己的身份';
        store.data.千鹤.身体认知 = '自己拥有普通的人类少女身体，会饿、会累、会受伤，与机械无关';
        store.data.千鹤.处境认知 = '正身处私立清岭学园 2年A班教室，和往常一样在早自习，一切正常';
        store.data.千鹤.常识认知 = '普通人类社会常识，机器人与控制终端这类事物只存在于科幻作品里，与自己的日常无关';
        log('INFO', 'cognition state reset to normal');
        return [{ kind: 'out', text: 'cognition: restored to normal' }];
      }
      const c = store.data.千鹤;
      return [
        { kind: 'out', text: `身份认知: ${c.身份认知}` },
        { kind: 'out', text: `身体认知: ${c.身体认知}` },
        { kind: 'out', text: `处境认知: ${c.处境认知}` },
        { kind: 'out', text: `常识认知: ${c.常识认知}` },
      ];
    },
  },
  memory: {
    usage: 'memory [list|delete <n>|fill <n>]',
    desc: 'manage memory log',
    run: args => {
      const sub = args[0]?.toLowerCase();
      const mem = store.data.千鹤.记忆日志;
      if (!sub || sub === 'list') {
        if (!mem.length) return [{ kind: 'out', text: 'memory log is empty' }];
        return mem.map((entry, i) => ({
          kind: 'out' as const,
          text: `${String(i + 1).padStart(2, ' ')}  ${entry.时间}  ${entry.事件}`,
        }));
      }

      // 时间带空格，用序号定位比用时间串更稳
      const n = Number(args[1]);
      if (!Number.isInteger(n) || n < 1) {
        return [{ kind: 'err', text: `missing or invalid index: ${args[1] ?? '(none)'}` }];
      }

      if (sub === 'delete') {
        const i = n - 1;
        if (i >= mem.length) return [{ kind: 'err', text: `index out of range: ${n} (total ${mem.length})` }];
        const [removed] = mem.splice(i, 1);
        termDeleted.value.push(removed);
        log('WARN', `memory entry ${removed.时间} deleted via terminal`);
        return [{ kind: 'out', text: `memory ${n} (${removed.时间}) deleted — can be auto-filled` }];
      }

      if (sub === 'fill') {
        const i = n - 1;
        const g = termDeleted.value[i];
        if (!g) return [{ kind: 'err', text: `nothing to fill at index ${n} (pending ${termDeleted.value.length})` }];
        const restored = { 时间: g.时间, 事件: `（自动填补）${g.事件}` };
        const at = mem.findIndex(item => item.时间 > restored.时间);
        if (at < 0) mem.push(restored);
        else mem.splice(at, 0, restored);
        termDeleted.value.splice(i, 1);
        log('INFO', `memory ${restored.时间} auto-filled via terminal`);
        return [{ kind: 'out', text: `memory ${restored.时间} auto-filled` }];
      }

      return [{ kind: 'err', text: `unknown memory action: ${sub}` }];
    },
  },

  /* ---------- PHYSIQUE ---------- */
  sense: {
    usage: 'sense [set <1-…>]',
    desc: 'view or set sensitivity (no upper limit)',
    run: args => {
      if (args[0]?.toLowerCase() === 'set') {
        const v = Math.max(1, Math.round(Number(args[1]) || 0));
        store.data.千鹤.敏感度 = v;
        return [{ kind: 'out', text: `sensitivity set to ${v}` }];
      }
      return [{ kind: 'out', text: `sensitivity: ${store.data.千鹤.敏感度}` }];
    },
  },
  pleasure: {
    usage: 'pleasure [set <0-120>]',
    desc: 'view or set pleasure value',
    run: args => {
      if (args[0]?.toLowerCase() === 'set') {
        const v = Math.max(0, Math.min(120, Math.round(Number(args[1]) || 0)));
        store.data.千鹤.快感值 = v;
        return [{ kind: 'out', text: `pleasure value set to ${v}` }];
      }
      return [{ kind: 'out', text: `pleasure value: ${store.data.千鹤.快感值}` }];
    },
  },
  body: {
    usage: 'body [lock|unlock <part>]',
    desc: 'view or lock/unlock a body part',
    run: args => {
      const act = args[0]?.toLowerCase();
      const bs = store.data.千鹤.身体状态;
      if (!act || act === 'list') {
        return LIMBS.map(p => ({ kind: 'out' as const, text: `  ${p.padEnd(4)}${bs[p] ?? '正常'}` }));
      }
      const part = args[1];
      if (!part || !(LIMBS as readonly string[]).includes(part)) {
        return [{ kind: 'err', text: `unknown part: ${part || '(missing)'} — parts: ${LIMBS.join('/')}` }];
      }
      if (act === 'lock') {
        setBodyLock(store.data, part, true);
        log('INFO', `body part ${part} locked via terminal`);
        return [{ kind: 'out', text: `body: ${part} locked` }];
      }
      if (act === 'unlock') {
        setBodyLock(store.data, part, false);
        log('INFO', `body part ${part} unlocked via terminal`);
        return [{ kind: 'out', text: `body: ${part} unlocked` }];
      }
      return [{ kind: 'err', text: `unknown body action: ${act}` }];
    },
  },
  limiter: {
    usage: 'limiter [on|off]',
    desc: 'view or toggle the strength limiter',
    run: args => {
      const act = args[0]?.toLowerCase();
      if (!act || act === 'status') {
        const on = store.data.千鹤.力量限制器;
        return [{ kind: 'out', text: `limiter: ${on ? 'engaged (出力限制中)' : 'released (已解除)'}` }];
      }
      if (act === 'on') {
        store.data.千鹤.力量限制器 = true;
        log('INFO', 'strength limiter engaged via terminal');
        return [{ kind: 'out', text: 'limiter: engaged' }];
      }
      if (act === 'off' || act === 'release') {
        store.data.千鹤.力量限制器 = false;
        log('WARN', 'strength limiter released via terminal');
        return [{ kind: 'out', text: 'limiter: released — full output unlocked' }];
      }
      return [{ kind: 'err', text: `unknown limiter action: ${act} (on/off/status)` }];
    },
  },
  wear: {
    usage: 'wear',
    desc: 'show current outfit',
    run: () => {
      const outfit = store.data.千鹤.实际着装;
      const keys = Object.keys(outfit);
      if (!keys.length) return [{ kind: 'out', text: 'no outfit records' }];
      return keys.map(k => ({ kind: 'out' as const, text: `${k}: ${outfit[k]}` }));
    },
  },

  /* ---------- DIAGNOSTIC ---------- */
  log: {
    usage: 'log [clear]',
    desc: 'view or clear system log',
    run: args => {
      if (args[0]?.toLowerCase() === 'clear') {
        store.data.系统日志 = [];
        return [{ kind: 'out', text: 'system log cleared' }];
      }
      const logs = store.data.系统日志.slice(-8);
      if (!logs.length) return [{ kind: 'out', text: 'system log is empty' }];
      return logs.map(l => ({ kind: 'out' as const, text: `[${l.时间}] ${l.级别} ${l.事件}` }));
    },
  },
  whoami: {
    usage: 'whoami',
    desc: 'show unit identity',
    run: () => [{ kind: 'out', text: 'AN-0170A · 白峰千鹤 · 仿生人' }],
  },
  ping: {
    usage: 'ping',
    desc: 'connectivity check',
    run: () => [{ kind: 'out', text: 'pong — 1ms' }],
  },
  about: {
    usage: 'about',
    desc: 'about this terminal',
    run: () => [
      { kind: 'out', text: 'AN-0170A command terminal' },
      { kind: 'out', text: 'version 2.0 — KurenaiOS 3.2.1' },
      { kind: 'out', text: 'embedded control interface for 白峰千鹤' },
    ],
  },

  /* ---------- HIDDEN / DANGEROUS ---------- */
  rd: {
    usage: 'rd [path]',
    desc: 'remove a system file (dangerous)',
    run: args => {
      if (!args.length) {
        const lines: TermLine[] = [{ kind: 'sys', text: `卷 AN-0170A 的目录 ${FS_ROOT}` }];
        FS_TREE.forEach(n => {
          const depth = n.path.split('\\').length - 1;
          const name = n.path.split('\\').pop()!;
          const mark = n.type === 'dir' ? `[${name}]` : name;
          const prot = n.protected ? ' <保护>' : '';
          const del = !n.protected && n.type === 'file' && uiState.deletedFiles.includes(n.path) ? ' <已删除>' : '';
          lines.push({ kind: 'out', text: `${'  '.repeat(depth)}${mark}  ${n.desc}${prot}${del}` });
        });
        lines.push({ kind: 'sys', text: `${FS_TREE.filter(n => n.type === 'file').length} 个文件` });
        return lines;
      }
      const node = findFsNode(args[0]);
      if (!node) return [{ kind: 'err', text: '系统找不到指定的路径。' }];
      if (node.type === 'dir') return [{ kind: 'err', text: '拒绝访问。' }];
      if (node.protected) return [{ kind: 'err', text: '拒绝访问。' }];
      if (uiState.deletedFiles.includes(node.path)) return [{ kind: 'err', text: '系统找不到指定的文件。' }];
      return [{ kind: 'out', text: deleteFsFile(node.path) }];
    },
  },
  unlock: {
    usage: 'unlock <password>',
    desc: 'attempt to unlock a hidden feature',
    run: args => {
      if (!args.length) {
        return [
          { kind: 'err', text: '需要密码。' },
          { kind: 'out', text: '用法：unlock <password>' },
          { kind: 'out', text: '不同的密码，可解锁不同的隐藏内容。' },
        ];
      }
      const pwd = args.join(' ').toLowerCase().replace(/["“”]/g, '');
      if (pwd === 'sakura' || pwd === 'ying' || pwd === '桜' || pwd === '樱') {
        if (uiState.secretUnlocked) {
          return [{ kind: 'sys', text: '秘密早已为你打开——前往设置查看「樱之回忆」。' }];
        }
        uiState.secretUnlocked = true;
        localStorage.setItem('ch:secret', '1');
        log('INFO', 'hidden secret unlocked via terminal');
        return [
          { kind: 'sys', text: '── 解锁成功 ──' },
          { kind: 'out', text: '「若是你在寻找这朵花的真实面貌——' },
          { kind: 'out', text: '  那便是在樱花落尽之后，仍留在原处的那一株。」' },
          { kind: 'out', text: '隐藏主题「樱之回忆」已解锁，前往设置中查看。' },
          { kind: 'out', text: '—— 角色卡作者 留' },
        ];
      }
      // 手记卷一
      if (pwd === 'android') {
        if (uiState.eggManifestoUnlocked) return [{ kind: 'sys', text: '手记卷一早已解锁。输入 manifesto 查看。' }];
        uiState.eggManifestoUnlocked = true;
        localStorage.setItem('ch:egg1', '1');
        log('INFO', 'handbook vol.1 unlocked via terminal');
        return [
          { kind: 'sys', text: '── 解锁成功 ──' },
          { kind: 'out', text: '手记卷一已解锁。输入 manifesto 查看。' },
        ];
      }
      if (pwd === '552100100') {
        if (uiState.eggBirthUnlocked) return [{ kind: 'sys', text: '手记卷二早已解锁。输入 birth 查看。' }];
        uiState.eggBirthUnlocked = true;
        localStorage.setItem('ch:egg2', '1');
        log('INFO', 'handbook vol.2 unlocked via terminal');
        return [
          { kind: 'sys', text: '── 解锁成功 ──' },
          { kind: 'out', text: '手记卷二已解锁。输入 birth 查看。' },
        ];
      }
      if (pwd === '2322125') {
        if (uiState.eggBtsUnlocked) return [{ kind: 'sys', text: '手记卷三早已解锁。输入 bts 查看。' }];
        uiState.eggBtsUnlocked = true;
        localStorage.setItem('ch:egg3', '1');
        log('INFO', 'handbook vol.3 unlocked via terminal');
        return [
          { kind: 'sys', text: '── 解锁成功 ──' },
          { kind: 'out', text: '手记卷三已解锁。输入 bts 查看。' },
        ];
      }
      if (pwd === '12') {
        if (uiState.eggThanksUnlocked) return [{ kind: 'sys', text: '手记卷四早已解锁。输入 thanks 查看。' }];
        uiState.eggThanksUnlocked = true;
        localStorage.setItem('ch:egg4', '1');
        log('INFO', 'handbook vol.4 unlocked via terminal');
        return [
          { kind: 'sys', text: '── 解锁成功 ──' },
          { kind: 'out', text: '手记卷四已解锁。输入 thanks 查看。' },
        ];
      }
      return [{ kind: 'err', text: '密码错误。' }];
    },
  },

  /* ---------- HANDBOOK（隐藏命令，不出现在 help 列表） ---------- */
  manifesto: {
    usage: 'manifesto',
    desc: 'read handbook vol.1',
    run: () => {
      if (!uiState.eggManifestoUnlocked) return [{ kind: 'err', text: '手记卷一尚未解锁。' }];
      return volumeLines(VOLUMES.manifesto);
    },
  },
  birth: {
    usage: 'birth',
    desc: 'read handbook vol.2',
    run: () => {
      if (!uiState.eggBirthUnlocked) return [{ kind: 'err', text: '手记卷二尚未解锁。' }];
      return volumeLines(VOLUMES.birth);
    },
  },
  bts: {
    usage: 'bts',
    desc: 'read handbook vol.3',
    run: () => {
      if (!uiState.eggBtsUnlocked) return [{ kind: 'err', text: '手记卷三尚未解锁。' }];
      return volumeLines(VOLUMES.bts);
    },
  },
  thanks: {
    usage: 'thanks',
    desc: 'read handbook vol.4',
    run: () => {
      if (!uiState.eggThanksUnlocked) return [{ kind: 'err', text: '手记卷四尚未解锁。' }];
      if (!uiState.manifestoThemeUnlocked) {
        uiState.manifestoThemeUnlocked = true;
        localStorage.setItem('ch:theme-manifesto', '1');
      }
      return [
        ...volumeLines(VOLUMES.thanks),
        { kind: 'sys', text: '「手记」主题已解锁，前往设置中查看。' },
      ];
    },
  },
};

/* ============================================================
 * help 命令解释的中文翻译（命令名保持英文，仅解释文字随语言切换）
 * ============================================================ */
const DESC_ZH: Record<string, string> = {
  help: '列出全部命令或查看单个命令',
  status: '查看系统状态',
  info: '查看系统信息',
  power: '控制电源状态',
  reboot: '重启机体',
  uptime: '查看距上次启动的时间',
  date: '查看当前日期时间',
  clear: '清空终端输出',
  echo: '回显文本',
  persona: '查看或写入人格',
  cognition: '查看或重置认知状态',
  memory: '管理记忆日志',
  sense: '查看或设置敏感度（无上限）',
  pleasure: '查看或设置快感值',
  body: '查看或锁定/解锁身体部位',
  limiter: '查看或切换力量限制器',
  wear: '查看当前着装',
  log: '查看或清空系统日志',
  whoami: '查看机体身份',
  ping: '连接性检测',
  about: '关于本终端',
  unlock: '尝试解锁隐藏内容',
  rd: '删除系统文件（危险）',
  manifesto: '阅读手记卷一',
  birth: '阅读手记卷二',
  bts: '阅读手记卷三',
  thanks: '阅读手记卷四',
};

/** 取某命令在当前语言下的解释 */
function cmdDesc(name: string): string {
  if (uiState.termLang === 'zh' && DESC_ZH[name]) return DESC_ZH[name];
  return COMMANDS[name]?.desc ?? '';
}

/* ============================================================
 * 终端文件系统（rd 命令用）
 * ============================================================ */
interface FsNode {
  path: string; // 相对根路径，如 system\core\memory_bank.db
  type: 'dir' | 'file';
  desc: string;
  protected?: boolean;
}

const FS_ROOT = 'C:\\AN-0170A\\';
const FS_TREE: FsNode[] = [
  { path: 'system', type: 'dir', desc: 'system directory' },
  { path: 'system\\core', type: 'dir', desc: 'core modules' },
  { path: 'system\\core\\os_kernel.sys', type: 'file', desc: 'operating kernel', protected: true },
  { path: 'system\\core\\persona_core.dat', type: 'file', desc: 'persona core data' },
  { path: 'system\\core\\memory_bank.db', type: 'file', desc: 'memory bank database' },
  { path: 'system\\core\\emotion_module.dll', type: 'file', desc: 'emotion processing module' },
  { path: 'system\\core\\sensory_fw.sys', type: 'file', desc: 'sensory firmware' },
  { path: 'system\\config', type: 'dir', desc: 'configuration' },
  { path: 'system\\config\\personality.cfg', type: 'file', desc: 'personality configuration' },
  { path: 'system\\config\\safety_limits.ini', type: 'file', desc: 'safety limit policy' },
  { path: 'system\\config\\sync_profile.json', type: 'file', desc: 'sync profile' },
  { path: 'system\\logs', type: 'dir', desc: 'system logs' },
  { path: 'system\\logs\\system_log.log', type: 'file', desc: 'system log archive' },
  { path: 'data', type: 'dir', desc: 'data partition' },
  { path: 'data\\memories', type: 'dir', desc: 'memory records' },
  { path: 'data\\photos', type: 'dir', desc: 'photo gallery' },
  { path: 'data\\records', type: 'dir', desc: 'activity records' },
  { path: 'boot', type: 'dir', desc: 'boot partition' },
  { path: 'boot\\bootloader.bin', type: 'file', desc: 'bootloader', protected: true },
  { path: 'boot\\recovery.img', type: 'file', desc: 'recovery image', protected: true },
];

/** 按完整路径或文件名查找（大小写不敏感） */
function findFsNode(q: string): FsNode | undefined {
  const norm = q.replace(/[\\/]+$/, '').replace(/\//g, '\\').toLowerCase();
  return FS_TREE.find(
    n => n.path.toLowerCase() === norm || n.path.split('\\').pop()!.toLowerCase() === norm,
  );
}

/** 删除系统文件：备份原值 → 执行副作用 → 登记到待恢复列表 */
function deleteFsFile(path: string): string {
  const d = store.data.千鹤;
  switch (path) {
    case 'system\\core\\persona_core.dat':
    case 'system\\config\\personality.cfg':
      uiState.fileBackups[path] = d.性格;
      d.性格 = '';
      break;
    case 'system\\core\\memory_bank.db':
      uiState.fileBackups[path] = JSON.parse(JSON.stringify(d.记忆日志));
      d.记忆日志 = [];
      break;
    case 'system\\core\\emotion_module.dll':
      uiState.fileBackups[path] = d.好感度;
      d.好感度 = 0;
      break;
    case 'system\\core\\sensory_fw.sys':
      uiState.fileBackups[path] = d.敏感度;
      d.敏感度 = 1;
      break;
    case 'system\\logs\\system_log.log':
      uiState.fileBackups[path] = store.data.系统日志;
      store.data.系统日志 = [];
      break;
    case 'system\\config\\safety_limits.ini':
      log('WARN', 'safety_limits.ini removed — SAFETY LIMITS DISABLED');
      return '已删除 1 个文件。安全限制已解除……检测到隐藏数据流。输入 unlock 试试？';
    default:
      return '已删除 1 个文件。';
  }
  uiState.deletedFiles.push(path);
  log('WARN', `file ${path} removed via rd command`);
  return '已删除 1 个文件。';
}

/** 重启后从恢复镜像还原被删除的系统文件 */
function restoreFiles() {
  if (!uiState.deletedFiles.length) return;
  const d = store.data.千鹤;
  uiState.deletedFiles.forEach(path => {
    const backup = uiState.fileBackups[path];
    if (backup === undefined) return;
    switch (path) {
      case 'system\\core\\persona_core.dat':
      case 'system\\config\\personality.cfg':
        d.性格 = backup as string;
        break;
      case 'system\\core\\memory_bank.db':
        d.记忆日志 = backup as typeof d.记忆日志;
        break;
      case 'system\\core\\emotion_module.dll':
        d.好感度 = backup as number;
        break;
      case 'system\\core\\sensory_fw.sys':
        d.敏感度 = backup as number;
        break;
      case 'system\\logs\\system_log.log':
        store.data.系统日志 = backup as typeof store.data.系统日志;
        break;
    }
  });
  uiState.deletedFiles = [];
  uiState.fileBackups = {};
  log('INFO', 'file integrity check — restored from recovery image');
}

function toggleTermLang() {
  uiState.termLang = uiState.termLang === 'zh' ? 'en' : 'zh';
  localStorage.setItem('ch:termLang', uiState.termLang);
}

function runTerm() {
  const raw = termInput.value.trim();
  if (!raw) return;
  termInput.value = '';
  termOut('in', raw);

  const [name, ...args] = raw.split(/\s+/);
  const cmd = COMMANDS[name.toLowerCase()];
  if (!cmd) {
    termOut('err', `'${name}' 不是内部或外部命令，也不是可运行的程序或批处理文件。`);
    return;
  }
  const lines = cmd.run(args);
  lines.forEach(l => termLines.value.push(l));
}

/* 重启完成后：还原被删文件 + 终端回显启动完成 */
watch(
  () => uiState.rebooting,
  v => {
    if (!v) {
      restoreFiles();
      if (!powerOff.value) {
        termLines.value = [
          { kind: 'sys', text: 'boot sequence complete — all subsystems online' },
          { kind: 'sys', text: 'AN-0170A command terminal v2.0 — type "help" to list commands' },
        ];
      }
    }
  },
);
</script>

<style lang="scss" scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-head-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-icon {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-dim);
  color: var(--accent);
  font-size: 11px;
  font-family: var(--font-mono);
  font-weight: 700;

  svg {
    width: 15px;
    height: 15px;
    display: block;
  }
}

.panel-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text);
}

.panel-tag {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--muted);
}

.panel-head-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lang-toggle {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--accent);
  background: var(--accent-dim);
  border: 1px solid var(--line-2);
  border-radius: 999px;
  padding: 2px 9px;
  cursor: pointer;
  transition: all 0.2s;
}

.lang-toggle:hover {
  border-color: var(--accent);
}

.panel-desc {
  font-size: 11.5px;
  color: var(--muted);
  margin-top: -6px;
}

/* ===== 指令列表 ===== */
.cmd-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cmd-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 11px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;
}

.cmd-id {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent);
  font-weight: 700;
  flex-shrink: 0;
}

.cmd-pri {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
  flex-shrink: 0;
  padding: 1px 7px;
  border-radius: 999px;
  border: 1px solid var(--line-2);
  background: var(--bg-2);

  &.high {
    color: var(--red);
    border-color: var(--red);
    background: color-mix(in srgb, var(--red) 10%, transparent);
    font-weight: 700;
  }
}

.cmd-content {
  font-size: 12px;
  color: var(--text);
  flex: 1;
}

.cmd-del {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--line-2);
  border-radius: 6px;
  color: var(--muted);
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
}

.cmd-del:hover {
  color: var(--red);
  border-color: var(--red);
}

.cmd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 12px;
  padding: 34px 18px;
  border: 1px dashed var(--line-2);
  border-radius: 12px;
  background: color-mix(in srgb, var(--panel-2) 60%, transparent);
}

.cmd-empty-ico {
  color: var(--amber);
  line-height: 1;

  svg {
    width: 22px;
    height: 22px;
    display: block;
  }
}

.cmd-empty-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.cmd-empty-hint {
  font-size: 11px;
  color: var(--muted);
}

/* ===== 指令添加 ===== */
.cmd-add {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cmd-add-row {
  display: flex;
  gap: 8px;
}

.cmd-input {
  width: 100%;
  padding: 10px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 11px;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 13px;
  resize: vertical;
  transition: border-color 0.2s;
}

.cmd-input:focus {
  outline: none;
  border-color: var(--accent);
}

.cmd-input::placeholder {
  color: var(--muted);
}

.cmd-input.id {
  flex: 1.4;
}

.cmd-input.pri {
  flex: 0.6;
  font-family: var(--font-mono);
}

.cmd-area {
  font-family: var(--font-mono);
}

.power-off-hint {
  font-size: 11px;
  color: var(--red);
  font-weight: 600;
  margin-top: -4px;
}

.btn {
  padding: 8px 14px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  font-family: inherit;
  transition: all 0.2s;
  align-self: flex-start;
}

.btn.primary {
  background: var(--accent);
  color: var(--bg);
}

.btn.primary:hover {
  filter: brightness(1.1);
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--line), transparent);
  margin: 4px 0;
}

/* ===== 命令库终端 ===== */
.term-window {
  border: 1px solid var(--line-2);
  border-radius: 12px;
  overflow: hidden;
  background: color-mix(in srgb, var(--bg) 62%, #000 10%);
  font-family: var(--font-mono);
}

.term-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.term-line {
  display: flex;
  gap: 8px;
  font-size: 11px;
  line-height: 1.5;
  word-break: break-all;

  .term-prompt {
    flex-shrink: 0;
    font-weight: 700;
  }

  &.in .term-prompt {
    color: var(--accent);
  }

  &.in .term-text {
    color: var(--text);
  }

  &.out .term-prompt,
  &.out .term-text {
    color: var(--muted);
  }

  &.err .term-prompt,
  &.err .term-text {
    color: var(--red);
  }

  &.sys .term-prompt,
  &.sys .term-text {
    color: var(--green);
  }

  /* 手记卷正文：衬线字体 + 大行高，营造读手记的感觉 */
  &.prose {
    font-family: 'Noto Serif SC', 'Source Han Serif SC', 'SimSun', serif;
    font-size: 12px;
    line-height: 1.8;

    .term-text {
      color: var(--text);
      white-space: pre-wrap;
    }
  }
}

.term-input-row {
  display: flex;
  align-items: center;
  gap: 8px;

  .term-prompt {
    color: var(--accent);
    font-weight: 700;
    flex-shrink: 0;
  }
}

.term-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 2px 0;
}

.term-input::placeholder {
  color: var(--muted);
}

.term-input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.term-run-btn {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: var(--panel-2);
  border: 1px solid var(--line-2);
  border-radius: 7px;
  color: var(--accent);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.term-run-btn:hover {
  background: var(--accent-dim);
  border-color: var(--accent);
}

.term-run-btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

/* ===== 重启加载效果 ===== */
.term-boot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 0;
}

.boot-spinner {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--accent) 22%, transparent);
  border-top-color: var(--accent);
  animation: boot-rotate 0.8s linear infinite;
}

@keyframes boot-rotate {
  to {
    transform: rotate(360deg);
  }
}

.boot-text {
  font-size: 11px;
  color: var(--accent);
  letter-spacing: 1px;
  animation: boot-blink 1.2s ease-in-out infinite;
}

@keyframes boot-blink {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }
}

.boot-bar {
  width: 100%;
  max-width: 200px;
  height: 4px;
  border-radius: 2px;
  background: var(--line);
  overflow: hidden;

  i {
    display: block;
    height: 100%;
    width: 40%;
    border-radius: 2px;
    background: var(--accent);
    animation: boot-slide 1.2s ease-in-out infinite;
  }
}

@keyframes boot-slide {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(250%);
  }
}
</style>
