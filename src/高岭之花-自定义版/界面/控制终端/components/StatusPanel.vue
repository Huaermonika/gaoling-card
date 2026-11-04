<template>
  <div class="panel">
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2-6 4 12 2-6h6" /></svg></span>
        <span class="panel-title">状态总览</span>
      </div>
      <span class="panel-tag">OVERVIEW</span>
    </div>
    <p class="panel-desc">该角色当前的整体运行概况</p>

    <div v-if="varUpdateState.status === 'fail'" class="var-fail">
      <span class="var-fail-text">{{ varUpdateState.message }}</span>
      <button class="var-retry" type="button" @click="retryVariableUpdate">重试</button>
    </div>

    <!-- 核心状态 -->
    <div class="core-row">
      <div class="core-cell" :class="awareClass">
        <span class="core-label">意识状态</span>
        <span class="core-value">{{ store.data.千鹤.意识状态 }}</span>
        <span class="core-dot"></span>
      </div>
      <div class="core-cell" :class="sysClass">
        <span class="core-label">系统状态</span>
        <span class="core-value">{{ store.data.千鹤.系统状态 }}</span>
        <span class="core-dot"></span>
      </div>
    </div>

    <!-- 关键指标 -->
    <div class="metric-grid">
      <div class="metric">
        <span class="metric-label">电量</span>
        <span class="metric-num">{{ hbBattery(store.data.千鹤.电量) }}<i>%</i></span>
        <span class="metric-bar"><i :style="{ width: hbBattery(store.data.千鹤.电量) + '%' }"></i></span>
      </div>
      <div class="metric">
        <span class="metric-label">好感度</span>
        <span class="metric-num">{{ store.data.千鹤.好感度 }}<i>/100</i></span>
        <span class="metric-bar amber"><i :style="{ width: store.data.千鹤.好感度 + '%' }"></i></span>
        <span class="metric-stage">{{ stageLabel }}</span>
      </div>
      <div class="metric">
        <span class="metric-label">敏感度</span>
        <span class="metric-num">{{ store.data.千鹤.敏感度 }}</span>
        <span class="metric-bar blue"><i :style="{ width: store.data.千鹤.敏感度 + '%' }"></i></span>
      </div>
      <div class="metric">
        <span class="metric-label">快感值</span>
        <span class="metric-num">{{ store.data.千鹤.快感值 }}</span>
        <span class="metric-bar red"><i :style="{ width: store.data.千鹤.快感值 + '%' }"></i></span>
      </div>
      <div class="metric">
        <span class="metric-label">CPU 使用率</span>
        <span class="metric-num">{{ hbCpu(store.data.千鹤.cpu使用率) }}<i>%</i></span>
        <span class="metric-bar blue"><i :style="{ width: hbCpu(store.data.千鹤.cpu使用率) + '%' }"></i></span>
      </div>
      <div class="metric">
        <span class="metric-label">RAM 使用率</span>
        <span class="metric-num">{{ hbRam(store.data.千鹤.内存使用率) }}<i>%</i></span>
        <span class="metric-bar purple"><i :style="{ width: hbRam(store.data.千鹤.内存使用率) + '%' }"></i></span>
      </div>
    </div>

    <!-- 环境 -->
    <div class="env-row">
      <span class="env-item"><span class="env-ico">◷</span>{{ store.data.世界.当前时间 }}</span>
      <span class="env-item"><span class="env-ico">⌖</span>{{ store.data.世界.当前地点 }}</span>
      <button class="env-edit" type="button" @click="openScene">改</button>
    </div>
    <div v-if="sceneEditing" class="scene-edit">
      <label><span>时间</span><input v-model="sceneDraft.time" type="text" /></label>
      <label><span>地点</span><input v-model="sceneDraft.place" type="text" /></label>
      <label><span>处境</span><input v-model="sceneDraft.situation" type="text" /></label>
      <div class="scene-actions">
        <button class="btn primary sm" type="button" @click="saveScene">保存</button>
        <button class="btn ghost sm" type="button" @click="sceneEditing = false">取消</button>
      </div>
    </div>

    <!-- 认知摘要 -->
    <div class="cog-summary">
      <div class="cog-summary-head">
        <span class="cog-tag">认知</span>
        <span class="cog-self" :class="{ off: !store.data.千鹤.认知自洽 }">
          {{ store.data.千鹤.认知自洽 ? '自洽·开' : '自洽·关' }}
        </span>
      </div>
      <div class="cog-dim-row">
        <span class="cog-dim-key">身份</span>
        <span class="cog-text">{{ store.data.千鹤.身份认知 }}</span>
      </div>
      <div class="cog-dim-row">
        <span class="cog-dim-key">身体</span>
        <span class="cog-text">{{ store.data.千鹤.身体认知 }}</span>
      </div>
      <div class="cog-dim-row">
        <span class="cog-dim-key">处境</span>
        <span class="cog-text">{{ store.data.千鹤.处境认知 }}</span>
      </div>
      <div class="cog-dim-row">
        <span class="cog-dim-key">常识</span>
        <span class="cog-text">{{ store.data.千鹤.常识认知 }}</span>
      </div>
    </div>

    <!-- 运行概况 -->
    <div class="overview-row">
      <div class="ov-item">
        <span class="ov-num">{{ abnormalCount }}</span>
        <span class="ov-label">躯体异常</span>
      </div>
      <div class="ov-item">
        <span class="ov-num">{{ cmdCount }}</span>
        <span class="ov-label">覆盖指令</span>
      </div>
      <div class="ov-item">
        <span class="ov-num">{{ memCount }}</span>
        <span class="ov-label">记忆条</span>
      </div>
      <div class="ov-item">
        <span class="ov-num">{{ bugCount }}</span>
        <span class="ov-label">Bug</span>
      </div>
    </div>

    <!-- 机体总览 + 液体储备（左右并排） -->
    <div class="body-cols">
      <div class="body-col">
        <div class="panel-head sub body-thumb-head">
          <div class="panel-head-left">
            <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="3.4" /><path d="M5 21c.7-4.8 3.2-7 7-7s6.3 2.2 7 7" /></svg></span>
            <span class="panel-title">机体总览</span>
          </div>
          <span class="panel-tag">BODY</span>
        </div>
        <BodyDiagram thumb />
      </div>

      <div class="body-col">
        <div class="panel-head sub body-fluid-head">
          <div class="panel-head-left">
            <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" /></svg></span>
            <span class="panel-title">液体储备</span>
          </div>
          <span class="panel-tag">FLUID</span>
        </div>
        <div class="body-fluid-wrap">
          <div class="fluid-gauges-c">
            <div class="fluid-gauge">
              <span class="fg-track"><i :style="{ height: coolant + '%' }"></i></span>
              <b class="fg-val">{{ coolant }}%</b>
              <span class="fg-label">冷却液</span>
            </div>
            <div class="fluid-gauge pink">
              <span class="fg-track"><i :style="{ height: lubricant + '%' }"></i></span>
              <b class="fg-val">{{ lubricant }}%</b>
              <span class="fg-label">润滑液</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 电源控制 -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v8" /><path d="M18.4 6.6a8 8 0 1 1-12.8 0" /></svg></span>
        <span class="panel-title">电源控制</span>
      </div>
      <span class="panel-tag">POWER</span>
    </div>
    <div class="power-seg">
      <button
        v-for="p in powerStates"
        :key="p"
        class="power-opt"
        :class="{ active: store.data.千鹤.电源状态 === p }"
        type="button"
        :disabled="uiState.rebooting"
        @click="setPower(p)"
      >
        {{ p }}
      </button>
      <span class="power-thumb" :class="'thumb-' + powerIndex"></span>
    </div>
    <div class="power-actions">
      <button
        class="reboot-btn"
        type="button"
        :disabled="uiState.rebooting || store.data.千鹤.电源状态 === '关机'"
        @click="reboot"
      >
        <span class="reboot-ico" :class="{ spin: uiState.rebooting }">⟳</span>
        <span>{{ uiState.rebooting ? '重启中…' : '重启' }}</span>
      </button>
      <span v-if="store.data.千鹤.电源状态 === '关机'" class="power-hint">电源已关闭 · 终端指令已失效</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import BodyDiagram from './BodyDiagram.vue';
import { ref, reactive } from 'vue';
import { varUpdateState, retryVariableUpdate } from '../../../脚本/对话显示/submodel';
import { POWER_STATES, useDataStore, applyPower, powerStateIndex, pushSystemLog, startReboot } from '../store';
import type { PowerState } from '../store';
import { uiState } from '../ui-state';
import { hbBattery, hbCpu, hbRam } from '../heartbeat';

const store = useDataStore();

const sceneEditing = ref(false);
const sceneDraft = reactive({ time: '', place: '', situation: '' });

function openScene() {
  sceneDraft.time = store.data.世界.当前时间;
  sceneDraft.place = store.data.世界.当前地点;
  sceneDraft.situation = store.data.千鹤.处境认知;
  sceneEditing.value = true;
}

function saveScene() {
  store.data.世界.当前时间 = sceneDraft.time.trim();
  store.data.世界.当前地点 = sceneDraft.place.trim();
  store.data.千鹤.处境认知 = sceneDraft.situation.trim();
  sceneEditing.value = false;
  toastr.success('场景已更新');
}

function clsOf(s: string): string {
  const map: Record<string, string> = {
    运行中: 'is-running',
    已停止: 'is-stopped',
    已冻结: 'is-frozen',
    正常运行: 'is-running',
    未响应: 'is-stopped',
    休眠: 'is-frozen',
  };
  return map[s] ?? '';
}

const awareClass = computed(() => clsOf(store.data.千鹤.意识状态));
const sysClass = computed(() => clsOf(store.data.千鹤.系统状态));

// 好感阶段实时映射（不再读 schema 固化的 $好感阶段，避免好感度 100 仍显示旧阶段）
const stageLabel = computed(() => {
  const v = store.data.千鹤.好感度;
  if (v < 20) return '冷漠疏离';
  if (v < 40) return '勉强认可';
  if (v < 60) return '口是心非';
  if (v < 80) return '依赖萌芽';
  return '独占亲密';
});

const abnormalCount = computed(() => Object.values(store.data.千鹤.身体状态).filter(s => s !== '正常').length);

/* ===== 液体储备 ===== */
/** 旧存档可能缺这两个字段，缺值按 0 显示 */
function liquidOf(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.round(Math.min(100, Math.max(0, value)));
}

const coolant = computed(() => liquidOf(store.data.千鹤.冷却液));
const lubricant = computed(() => liquidOf(store.data.千鹤.润滑液));
const cmdCount = computed(() => Object.keys(store.data.千鹤.指令覆盖).length);
const memCount = computed(() => store.data.千鹤.记忆日志.length);
const bugCount = computed(() => store.data.主角.bug报告.length);

/* ===== 电源控制 ===== */
const powerStates = POWER_STATES;

const powerIndex = computed(() => powerStateIndex(store.data.千鹤.电源状态));

const LOG_MAP: Record<PowerState, string> = {
  开机: 'power: unit switched ON — all systems online',
  待机: 'power: unit switched to STANDBY — high-level functions suspended',
  关机: 'power: unit switched OFF — command interface disabled',
};

function setPower(p: PowerState) {
  if (uiState.rebooting || store.data.千鹤.电源状态 === p) return;
  applyPower(store.data.千鹤, p);
  pushSystemLog(store.data, 'INFO', LOG_MAP[p]);
}

function reboot() {
  startReboot(store.data.千鹤, store.data);
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

  &.small svg {
    width: 13px;
    height: 13px;
  }
}

.panel-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text);
  white-space: nowrap;
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

/* ===== 核心状态 ===== */
.core-row {
  display: flex;
  gap: 9px;
}

.core-cell {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 11px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
}

.core-label {
  font-size: 10px;
  color: var(--muted);
  letter-spacing: 1px;
}

.core-value {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 1px;
}

.core-dot {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--green) 18%, transparent);
}

.core-cell.is-running .core-value {
  color: var(--green);
}

.core-cell.is-running .core-dot {
  background: var(--green);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--green) 18%, transparent);
}

.core-cell.is-stopped .core-value {
  color: var(--red);
}

.core-cell.is-stopped .core-dot {
  background: var(--red);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--red) 18%, transparent);
}

.core-cell.is-frozen .core-value {
  color: var(--blue);
}

.core-cell.is-frozen .core-dot {
  background: var(--blue);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--blue) 18%, transparent);
}

/* ===== 关键指标 ===== */
.metric-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 11px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
}

.metric-label {
  font-size: 10px;
  color: var(--muted);
  letter-spacing: 1px;
}

.metric-num {
  font-family: var(--font-mono);
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  color: var(--text);

  i {
    font-style: normal;
    font-size: 11px;
    color: var(--muted);
    margin-left: 2px;
  }
}

.metric-bar {
  height: 5px;
  border-radius: 3px;
  background: var(--line);
  overflow: hidden;

  i {
    display: block;
    height: 100%;
    border-radius: 3px;
    background: var(--accent);
    transition: width 0.4s ease;
  }
}

.metric-bar.amber i {
  background: var(--amber);
}

.metric-bar.blue i {
  background: var(--blue);
}

.metric-bar.purple i {
  background: var(--purple);
}

.metric-bar.red i {
  background: var(--red);
}

.metric-stage {
  font-size: 10.5px;
  color: var(--amber);
  font-weight: 700;
  margin-top: -1px;
}

/* ===== 环境 ===== */
.env-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.env-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 11px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 11.5px;
  color: var(--text);
}

.env-ico {
  color: var(--accent);
  font-size: 12px;
  line-height: 1;
}

.env-edit {
  margin-left: auto;
  padding: 5px 11px;
  border: 1px solid var(--line-2);
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font-family: inherit;
  font-size: 10.5px;
  cursor: pointer;
}

.env-edit:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.scene-edit {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 10px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;
}

.scene-edit label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--muted);
}

.scene-edit input {
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 6px;
  font-family: inherit;
  font-size: 11.5px;
  color: var(--text);
  outline: none;
}

.scene-edit input:focus {
  border-color: var(--accent);
}

.scene-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.var-fail {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: color-mix(in srgb, #c85a5a 12%, var(--panel));
  border: 1px solid color-mix(in srgb, #c85a5a 40%, var(--line));
  border-radius: 8px;
}

.var-fail-text {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  line-height: 1.5;
  color: #a34444;
}

.var-retry {
  flex-shrink: 0;
  padding: 4px 10px;
  border: 1px solid #c85a5a;
  border-radius: 999px;
  background: transparent;
  color: #a34444;
  font-family: inherit;
  font-size: 10.5px;
  cursor: pointer;
}

/* ===== 认知摘要 ===== */
.cog-summary {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 9px 11px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent);
  border-radius: 8px 10px 10px 8px;
}

.cog-summary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cog-self {
  font-size: 9.5px;
  color: var(--accent);
  font-weight: 700;
  letter-spacing: 0.5px;
}

.cog-self.off {
  color: var(--muted);
}

.cog-dim-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.cog-dim-key {
  font-size: 10px;
  color: var(--muted);
  font-weight: 700;
  flex-shrink: 0;
  min-width: 28px;
}

.cog-tag {
  font-size: 10px;
  color: var(--accent);
  font-weight: 700;
  letter-spacing: 1px;
  flex-shrink: 0;
}

.cog-text {
  font-size: 11.5px;
  color: var(--text);
  line-height: 1.55;
}

/* ===== 运行概况 ===== */
.overview-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.ov-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 9px 4px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
}

.ov-num {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}

.ov-label {
  font-size: 9.5px;
  color: var(--muted);
  letter-spacing: 1px;
}

/* ===== 机体总览 + 液体储备 ===== */
.body-cols {
  display: flex;
  gap: 10px;
  width: 100%;
}

.body-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  box-sizing: border-box;

  &:first-child {
    width: 70%;
  }

  &:last-child {
    width: 30%;
  }
}

.body-thumb-head {
  width: 100%;
  box-sizing: border-box;
}

.body-fluid-head {
  width: 100%;
}

.body-fluid-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 474px;
  width: 100%;
  box-sizing: border-box;
  padding: 10px 8px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
}

.fluid-gauges-c {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  padding: 6px 0;
}

.fluid-gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.fg-track {
  position: relative;
  display: block;
  width: 26px;
  height: 400px;
  border-radius: 13px;
  background: var(--panel);
  border: 1px solid var(--line);
  overflow: hidden;

  i {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    border-radius: 10px 10px 11px 11px;
    background: linear-gradient(180deg, var(--blue), color-mix(in srgb, var(--blue) 70%, #fff));
  }
}

.fluid-gauge.pink .fg-track i {
  background: linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #fff));
}

.fg-val {
  font-size: 12px;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--text);
}

.fg-label {
  font-size: 11px;
  color: var(--muted);
}

/* ===== 电源控制 ===== */
.power-seg {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 4px;
  overflow: hidden;
}

.power-opt {
  position: relative;
  z-index: 1;
  padding: 9px 0;
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  font-family: inherit;
  transition: color 0.25s;
}

.power-opt:hover:not(:disabled) {
  color: var(--text);
}

.power-opt:disabled {
  cursor: not-allowed;
}

.power-opt.active {
  color: #fff;
}

.power-thumb {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc((100% - 8px) / 3);
  border-radius: 9px;
  background: var(--accent);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--accent) 50%, transparent);
  transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1), background 0.32s ease;
}

.power-thumb.thumb-0 {
  transform: translateX(0);
  background: var(--green);
}

.power-thumb.thumb-1 {
  transform: translateX(100%);
  background: var(--amber);
}

.power-thumb.thumb-2 {
  transform: translateX(200%);
  background: var(--red);
}

.power-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.reboot-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 10px;
  border: 1px solid var(--line-2);
  background: var(--panel-2);
  color: var(--text);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.reboot-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-1px);
}

.reboot-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reboot-ico {
  font-size: 14px;
  line-height: 1;
}

.reboot-ico.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.power-hint {
  font-size: 11px;
  color: var(--red);
  font-weight: 600;
}
</style>
