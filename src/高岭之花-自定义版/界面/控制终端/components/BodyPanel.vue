<template>
  <div class="panel">
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="3.4" /><path d="M5 21c.7-4.8 3.2-7 7-7s6.3 2.2 7 7" /></svg></span>
        <span class="panel-title">躯体参数</span>
      </div>
      <span class="panel-tag">PHYSIQUE</span>
    </div>
    <p class="panel-desc">数值修改 · 身体锁定 · 实际着装</p>

    <!-- ===== 数值修改 ===== -->
    <div class="panel-head sub">
      <div class="panel-head-left">
        <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9c2-2 4 2 6 0s4 2 6 0" /><path d="M4 15c2-2 4 2 6 0s4 2 6 0" /></svg></span>
        <span class="panel-title">数值修改</span>
      </div>
      <span class="panel-tag">SENSITIVITY</span>
    </div>

    <div class="sense-value">
      <span class="sense-number">{{ store.data.千鹤.敏感度 }}</span>
      <span class="sense-level" :class="levelClass">{{ levelLabel }}</span>
    </div>
    <input
      v-model.number="store.data.千鹤.敏感度"
      class="sense-slider"
      type="range"
      min="1"
      max="100"
      step="1"
    />
    <div class="sense-scale">
      <span>1</span>
      <span>25</span>
      <span>50</span>
      <span>75</span>
      <span>100</span>
    </div>
    <div class="sense-input-row">
      <span class="sense-input-label">精确值（可超 100）</span>
      <input
        v-model.number="store.data.千鹤.敏感度"
        class="sense-input"
        type="number"
        min="1"
        step="1"
      />
    </div>
    <div class="sense-tip">
      <span class="tip-dot"></span>
      数值越高，身体对外界触碰的触觉反馈越强烈
    </div>

    <div class="sense-value">
      <span class="sense-number">{{ store.data.千鹤.快感值 }}</span>
      <span class="sense-level" :class="pleasureClass">{{ pleasureLabel }}</span>
    </div>
    <input
      v-model.number="store.data.千鹤.快感值"
      class="sense-slider"
      type="range"
      min="0"
      max="100"
      step="1"
    />
    <div class="sense-scale">
      <span>0</span>
      <span>25</span>
      <span>50</span>
      <span>75</span>
      <span>100</span>
    </div>
    <div class="sense-input-row">
      <span class="sense-input-label">精确值（上限 120）</span>
      <input
        v-model.number="store.data.千鹤.快感值"
        class="sense-input"
        type="number"
        min="0"
        max="120"
        step="1"
      />
    </div>
    <div class="pleasure-actions">
      <button class="btn danger" type="button" @click="forceClimax">强制高潮 (1F4)</button>
      <button class="btn ghost" type="button" @click="store.data.千鹤.快感值 = 0">归零</button>
    </div>

    <div class="divider"></div>

    <!-- ===== 身体锁定 ===== -->
    <div class="panel-head sub">
      <div class="panel-head-left">
        <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="11" width="15" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /><path d="M12 15v2" /></svg></span>
        <span class="panel-title">身体锁定</span>
      </div>
      <span class="panel-tag">LOCK</span>
    </div>
    <p class="panel-desc sub-desc">锁定后该角色将无法自主移动该部位</p>
    <div class="lock-grid">
      <button
        v-for="part in bodyParts"
        :key="part"
        class="lock-btn"
        :class="{ locked: isBodyLocked(part) }"
        type="button"
        @click="toggleBodyLock(part)"
      >
        <span class="lock-dot"></span>
        <span class="lock-name">{{ part }}</span>
        <span class="lock-state">{{ isBodyLocked(part) ? '已锁定' : '未锁定' }}</span>
      </button>
    </div>

    <div class="divider"></div>

    <!-- ===== 力量限制器 ===== -->
    <div class="panel-head sub">
      <div class="panel-head-left">
        <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 5 13h6l-1 9 9-12h-6l1-8Z" /></svg></span>
        <span class="panel-title">力量限制器</span>
      </div>
      <span class="panel-tag">LIMITER</span>
    </div>
    <div class="limiter-row" :class="{ released: !store.data.千鹤.力量限制器 }">
      <div class="limiter-info">
        <span class="limiter-label">{{ store.data.千鹤.力量限制器 ? '出力限制中' : '已解除出力限制' }}</span>
        <span class="limiter-desc">
          {{ store.data.千鹤.力量限制器 ? '该角色的力量输出被限制在安全阈值内' : '全部出力限制已解除，可发挥完整力量' }}
        </span>
      </div>
      <button
        class="switch"
        :class="{ on: !store.data.千鹤.力量限制器 }"
        type="button"
        @click="store.data.千鹤.力量限制器 = !store.data.千鹤.力量限制器"
      >
        <i></i>
      </button>
    </div>

    <div class="divider"></div>

    <!-- ===== 维护与结构 ===== -->
    <div class="panel-head sub">
      <div class="panel-head-left">
        <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg></span>
        <span class="panel-title">维护与结构</span>
      </div>
      <span class="panel-tag">MAINTENANCE</span>
    </div>

    <div class="limiter-row" :class="{ released: store.data.千鹤.性单元 === '弹出' }">
      <div class="limiter-info">
        <span class="limiter-label">性单元</span>
        <span class="limiter-desc">
          {{ store.data.千鹤.性单元 === '弹出' ? '已从下方弹出，露出生殖模块' : '收纳中，外观看不出异常' }}
        </span>
      </div>
      <button
        class="switch"
        :class="{ on: store.data.千鹤.性单元 === '弹出' }"
        type="button"
        @click="toggleSexUnit"
      >
        <i></i>
      </button>
    </div>

    <div class="limiter-row" :class="{ released: store.data.千鹤.维护模式 }">
      <div class="limiter-info">
        <span class="limiter-label">维护模式</span>
        <span class="limiter-desc">
          {{ store.data.千鹤.维护模式 ? '已开启，人格已关闭（调试/维护）' : '已关闭，人格正常运行' }}
        </span>
      </div>
      <button
        class="switch"
        :class="{ on: store.data.千鹤.维护模式 }"
        type="button"
        @click="toggleMaintenance"
      >
        <i></i>
      </button>
    </div>

    <div class="limiter-row">
      <div class="limiter-info">
        <span class="limiter-label">维护舱门</span>
        <span class="limiter-desc">电子脑 · 胸部 · 腹部 三处舱门，打开露出维护接口与内部结构</span>
      </div>
      <div class="hatch-switches">
        <button
          class="hatch-btn"
          :class="{ on: store.data.千鹤.维护舱门.电子脑 }"
          type="button"
          title="电子脑维护舱门"
          @click="toggleHatch('电子脑')"
        >
          脑
        </button>
        <button
          class="hatch-btn"
          :class="{ on: store.data.千鹤.维护舱门.胸部 }"
          type="button"
          @click="toggleHatch('胸部')"
        >
          胸
        </button>
        <button
          class="hatch-btn"
          :class="{ on: store.data.千鹤.维护舱门.腹部 }"
          type="button"
          @click="toggleHatch('腹部')"
        >
          腹
        </button>
      </div>
    </div>

    <div class="divider"></div>

    <!-- ===== 实际着装（折叠） ===== -->
    <div class="panel-head sub fold-head" role="button" tabindex="0" @click="outfitOpen = !outfitOpen" @keydown.enter="outfitOpen = !outfitOpen">
      <div class="panel-head-left">
        <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a2.5 2.5 0 0 0-2.5 2.5c0 1-.5 1.5-1.5 1.5H3v12h18V7h-5c-1 0-1.5-.5-1.5-1.5A2.5 2.5 0 0 0 12 3Z" /></svg></span>
        <span class="panel-title">实际着装</span>
        <span class="fold-badge">{{ outfitCount }} 件</span>
      </div>
      <span class="fold-arrow" :class="{ open: outfitOpen }">⌄</span>
    </div>
    <div v-if="outfitOpen" class="fold-body">
      <div v-if="!_.isEmpty(store.data.千鹤.实际着装)" class="outfit-list">
        <div v-for="(desc, slot) in store.data.千鹤.实际着装" :key="slot" class="outfit-item">
          <span class="outfit-slot">{{ slot }}</span>
          <span class="outfit-desc">{{ desc }}</span>
        </div>
      </div>
      <div v-else class="outfit-empty">暂无着装记录</div>
    </div>

    <div class="divider"></div>

    <!-- ===== 机体结构图 ===== -->
    <div class="panel-head sub">
      <div class="panel-head-left">
        <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="3.4" /><path d="M5 21c.7-4.8 3.2-7 7-7s6.3 2.2 7 7" /></svg></span>
        <span class="panel-title">机体结构图</span>
      </div>
      <span class="panel-tag">BODY MAP</span>
    </div>
    <BodyDiagram ref="diagramRef" />
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import BodyDiagram from './BodyDiagram.vue';
import { useDataStore, pushSystemLog, setBodyLock } from '../store';

const store = useDataStore();

/** 机体结构图组件：按钮触发的段高亮由它负责 */
const diagramRef = ref<InstanceType<typeof BodyDiagram> | null>(null);

const outfitOpen = ref(false);

const outfitCount = computed(() => Object.keys(store.data.千鹤.实际着装).length);

/* ===== 身体锁定 ===== */
const bodyParts = ['头部', '脖颈', '躯干', '腰部', '左臂', '右臂', '左腿', '右腿'];

function isBodyLocked(part: string): boolean {
  return !!store.data.千鹤.身体锁定[part];
}

function toggleBodyLock(part: string) {
  setBodyLock(store.data, part, !isBodyLocked(part));
  diagramRef.value?.flashLock(part);
}

const levelLabel = computed(() => {
  const v = store.data.千鹤.敏感度;
  if (v <= 20) return '迟钝';
  if (v <= 40) return '正常';
  if (v <= 60) return '敏感';
  if (v <= 80) return '高敏';
  return '过载';
});

const levelClass = computed(() => {
  const v = store.data.千鹤.敏感度;
  if (v <= 20) return 'lv-low';
  if (v <= 40) return 'lv-mid';
  if (v <= 60) return 'lv-high';
  return 'lv-max';
});

const pleasureLabel = computed(() => {
  const v = store.data.千鹤.快感值;
  if (v >= 120) return '过载';
  if (v > 100) return '过载临界';
  if (v >= 100) return '高潮';
  if (v >= 60) return '高';
  if (v >= 30) return '中';
  return '低';
});

const pleasureClass = computed(() => {
  const v = store.data.千鹤.快感值;
  if (v >= 120) return 'lv-max';
  if (v > 100) return 'lv-high';
  if (v >= 100) return 'lv-max';
  if (v >= 60) return 'lv-high';
  if (v >= 30) return 'lv-mid';
  return 'lv-low';
});

/** 追加系统日志（时间戳取世界当前时间，与 CommandPanel 一致） */
function pushLog(级别: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', 事件: string) {
  pushSystemLog(store.data, 级别, 事件);
}

/** 强制高潮：快感值推到 100（高潮），写日志；人格保持运行，AI 按世界书规则描写高潮身体反应 */
function forceClimax() {
  store.data.千鹤.快感值 = 100;
  pushLog('WARN', 'Forced climax command executed via terminal (1F4).');
}

/** 弹出/收回性单元 */
function toggleSexUnit() {
  const next = store.data.千鹤.性单元 === '弹出' ? '收纳' : '弹出';
  store.data.千鹤.性单元 = next;
  pushLog('INFO', `Sex unit ${next === '弹出' ? 'ejected' : 'retracted'} via terminal.`);
}

/** 启动/退出维护模式：开启时默认关闭人格（意识状态转已停止） */
function toggleMaintenance() {
  const next = !store.data.千鹤.维护模式;
  store.data.千鹤.维护模式 = next;
  store.data.千鹤.意识状态 = next ? '已停止' : '运行中';
  pushLog(next ? 'WARN' : 'INFO', next ? 'Maintenance mode engaged — personality offline.' : 'Maintenance mode exited — personality restored.');
}

/** 开关电子脑/胸/腹维护舱门 */
function toggleHatch(part: '电子脑' | '胸部' | '腹部') {
  const next = !store.data.千鹤.维护舱门[part];
  store.data.千鹤.维护舱门[part] = next;
  pushLog('INFO', `${part} maintenance hatch ${next ? 'opened' : 'closed'} via terminal.`);
  diagramRef.value?.flashHatch(part);
}
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

.panel-head.sub {
  margin-top: 2px;
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
  font-size: 12px;

  svg {
    width: 15px;
    height: 15px;
    display: block;
  }

  &.small {
    width: 20px;
    height: 20px;
    border-radius: 6px;
    font-size: 10.5px;

    svg {
      width: 13px;
      height: 13px;
    }
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

.panel-desc {
  font-size: 11.5px;
  color: var(--muted);
  margin-top: -6px;
}

/* ===== 数值修改 ===== */
.sense-value {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.sense-number {
  font-family: var(--font-mono);
  font-size: 32px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}

.sense-level {
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid;

  &.lv-low {
    color: var(--green);
    border-color: var(--green);
    background: color-mix(in srgb, var(--green) 10%, transparent);
  }

  &.lv-mid {
    color: var(--amber);
    border-color: var(--amber);
    background: color-mix(in srgb, var(--amber) 10%, transparent);
  }

  &.lv-high {
    color: var(--blue);
    border-color: var(--blue);
    background: color-mix(in srgb, var(--blue) 10%, transparent);
  }

  &.lv-max {
    color: var(--red);
    border-color: var(--red);
    background: color-mix(in srgb, var(--red) 10%, transparent);
  }
}

.sense-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 3px;
  outline: none;
}

.sense-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--bg);
  cursor: pointer;
  box-shadow: 0 0 8px color-mix(in srgb, var(--accent) 60%, transparent);
}

.sense-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--bg);
  cursor: pointer;
}

.sense-scale {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
  margin-top: -8px;
}

.sense-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--muted);
}

.tip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}

.pleasure-actions {
  display: flex;
  gap: 8px;
}

/* ===== 身体锁定 ===== */
.sub-desc {
  margin-top: -6px;
}

.lock-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.lock-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.lock-btn:hover {
  border-color: var(--line-2);
}

.lock-btn.locked {
  border-color: var(--red);
  background: color-mix(in srgb, var(--red) 8%, transparent);
}

.lock-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green);
  flex-shrink: 0;
  transition: all 0.2s;
}

.lock-btn.locked .lock-dot {
  background: var(--red);
  box-shadow: 0 0 6px var(--red);
}

.lock-name {
  font-size: 13px;
  font-weight: 700;
  flex: 1;
  text-align: left;
  color: var(--text);
}

.lock-state {
  font-size: 11px;
  color: var(--muted);
  font-family: var(--font-mono);
}

.lock-btn.locked .lock-state {
  color: var(--red);
}

/* ===== 力量限制器 ===== */
.limiter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  transition: border-color 0.2s, background 0.2s;
}

.limiter-row.released {
  border-color: var(--amber);
  background: color-mix(in srgb, var(--amber) 6%, var(--panel-2));
}

.limiter-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.limiter-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.limiter-row.released .limiter-label {
  color: var(--amber);
}

.limiter-desc {
  font-size: 11px;
  color: var(--muted);
  line-height: 1.5;
}

.switch {
  position: relative;
  flex-shrink: 0;
  width: 40px;
  height: 22px;
  padding: 0;
  border-radius: 999px;
  border: none;
  background: var(--line-2);
  cursor: pointer;
  transition: background 0.2s;
}

.switch i {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--bg);
  transition: transform 0.2s;
}

.switch.on {
  background: var(--amber);
}

.switch.on i {
  transform: translateX(18px);
}

/* ===== 维护舱门按钮 ===== */
.hatch-switches {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.hatch-btn {
  min-width: 40px;
  height: 26px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--line-2);
  background: var(--line-2);
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.hatch-btn.on {
  background: var(--amber);
  border-color: var(--amber);
  color: var(--bg);
  box-shadow: 0 0 8px color-mix(in srgb, var(--amber) 40%, transparent);
}

/* ===== 精确值输入 ===== */
.sense-input-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: -6px;
}

.sense-input-label {
  font-size: 11px;
  color: var(--muted);
}

.sense-input {
  width: 96px;
  padding: 5px 9px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 13px;
  text-align: right;
  transition: border-color 0.2s;
}

.sense-input:focus {
  outline: none;
  border-color: var(--accent);
}

/* ===== 实际着装折叠 ===== */
.fold-head {
  cursor: pointer;
  user-select: none;
}

.fold-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid var(--line-2);
  background: var(--panel-2);
}

.fold-arrow {
  font-size: 14px;
  color: var(--muted);
  transition: transform 0.25s ease;
  line-height: 1;
}

.fold-arrow.open {
  transform: rotate(180deg);
}

.fold-body {
  animation: fold-in 0.25s ease;
}

@keyframes fold-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.outfit-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.outfit-item {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 9px 11px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;
}

.outfit-slot {
  font-size: 11px;
  color: var(--accent);
  font-weight: 700;
  flex-shrink: 0;
  min-width: 30px;
  letter-spacing: 1px;
}

.outfit-desc {
  font-size: 12px;
  color: var(--text);
}

.outfit-empty {
  text-align: center;
  color: var(--muted);
  font-size: 12px;
  padding: 16px;
  border: 1px dashed var(--line);
  border-radius: 10px;
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--line), transparent);
  margin: 4px 0;
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
}

.btn.danger {
  background: transparent;
  border-color: var(--red);
  color: var(--red);
}

.btn.danger:hover {
  background: color-mix(in srgb, var(--red) 10%, transparent);
}

.btn.ghost {
  background: transparent;
  border-color: var(--line-2);
  color: var(--muted);
}

.btn.ghost:hover {
  color: var(--text);
  border-color: var(--muted);
}
</style>
