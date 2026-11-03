<template>
  <div class="panel">
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon">✎</span>
        <span class="panel-title">认知模块</span>
      </div>
      <span class="panel-tag">COGNITION</span>
    </div>
    <p class="panel-desc">人格状态 · 认知 · 性格 的统合控制</p>

    <!-- 人格三态 -->
    <div class="state-list">
      <button
        v-for="s in states"
        :key="s.id"
        class="state-btn"
        :class="[s.id, { active: store.data.千鹤.意识状态 === s.id }]"
        type="button"
        @click="setState(s.id)"
      >
        <span class="state-icon">{{ s.icon }}</span>
        <span class="state-text">
          <span class="state-label">{{ s.label }}</span>
          <span class="state-desc">{{ s.desc }}</span>
        </span>
        <span class="state-check">✓</span>
      </button>
    </div>

    <div class="divider"></div>

    <!-- 好感度 -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon">♡</span>
        <span class="panel-title">好感度</span>
      </div>
      <span class="panel-tag">AFFECTION</span>
    </div>
    <div class="affection">
      <div class="affection-track">
        <div class="affection-fill" :style="{ width: store.data.千鹤.好感度 + '%' }"></div>
      </div>
      <div class="affection-row">
        <span class="affection-value">{{ store.data.千鹤.好感度 }}</span>
        <span class="affection-stage">{{ stageLabel }}</span>
      </div>
      <input
        v-model.number="store.data.千鹤.好感度"
        class="affection-slider"
        type="range"
        min="0"
        max="100"
        step="1"
      />
      <div class="affection-scale">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>

    <div class="divider"></div>

    <!-- 性格写入 -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon">✦</span>
        <span class="panel-title">性格写入</span>
      </div>
      <span class="panel-tag">PERSONA</span>
    </div>
    <textarea
      v-model="personaDraft"
      class="cog-input"
      rows="2"
      placeholder="输入新的性格设定，例如：冷面娇柔的优等生……"
    ></textarea>
    <button class="btn primary" type="button" @click="applyPersona">写入性格</button>
    <div class="cog-current">
      <span class="cog-label">● 当前性格</span>
      <span class="cog-text">{{ store.data.千鹤.性格 }}</span>
    </div>

    <div class="divider"></div>

    <!-- 认知写入 -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon">◈</span>
        <span class="panel-title">认知写入</span>
      </div>
      <span class="panel-tag">REALITY</span>
    </div>

    <!-- 认知自洽开关 -->
    <div class="cog-switch-row">
      <div class="cog-switch-info">
        <span class="cog-switch-label">认知自洽维护</span>
        <span class="cog-switch-desc">自动抹平与当前认知冲突的细节</span>
      </div>
      <button
        class="switch"
        :class="{ on: store.data.千鹤.认知自洽 }"
        type="button"
        @click="toggleCogSelf"
      >
        <i></i>
      </button>
    </div>

    <!-- 四维度认知 -->
    <div v-for="dim in cogDims" :key="dim.key" class="cog-dim">
      <span class="cog-dim-label">{{ dim.label }}</span>
      <textarea
        v-model="cogDrafts[dim.key]"
        class="cog-input"
        rows="2"
        :placeholder="dim.ph"
      ></textarea>
      <div v-if="dim.presets.length" class="cog-presets">
        <button
          v-for="p in dim.presets"
          :key="p.label"
          class="cog-preset-btn"
          :class="{ active: store.data.千鹤[dim.key] === p.value }"
          type="button"
          @click="applyPreset(dim.key, p.value)"
        >
          {{ p.label }}
        </button>
      </div>
      <div class="cog-current">
        <span class="cog-label">● 当前{{ dim.label }}</span>
        <span class="cog-text">{{ store.data.千鹤[dim.key] }}</span>
      </div>
    </div>

    <div class="cog-actions">
      <button class="btn primary" type="button" @click="applyCog">写入认知</button>
      <button class="btn ghost" type="button" @click="resetCog">恢复正常</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore, pushSystemLog } from '../store';

const store = useDataStore();

const states = [
  { id: '运行中', label: '运行中', icon: '▶', desc: '人格程序正常运行' },
  { id: '已停止', label: '已停止', icon: '■', desc: '人格程序终止，只执行指令' },
  { id: '已冻结', label: '已冻结', icon: '❄', desc: '动作与表情定格' },
];

const personaDraft = ref('');
const cogDrafts = reactive({
  身份认知: '',
  身体认知: '',
  处境认知: '',
  常识认知: '',
});
type CogKey = '身份认知' | '身体认知' | '处境认知' | '常识认知';
type CogPreset = { label: string; value: string };
type CogDim = { key: CogKey; label: string; ph: string; presets: CogPreset[] };

const cogDims: CogDim[] = [
  {
    key: '身份认知',
    label: '身份认知',
    ph: '例：自己是仿生机器人 / 是玩家的恋人……',
    presets: [
      { label: '人类', value: '自己是普通人类，从未怀疑过自己的身份' },
      { label: '机器人', value: '自己是仿生机器人，清楚自己的身体是机械' },
      { label: '恋人', value: '自己是玩家的恋人，与玩家是亲密关系' },
      { label: '宠物', value: '自己是玩家的宠物，服从玩家的指令' },
    ],
  },
  {
    key: '身体认知',
    label: '身体认知',
    ph: '例：自己还穿着制服 / 身体暴露在外……',
    presets: [
      { label: '人类身体', value: '自己拥有普通的人类身体，会饿、会累、会受伤，与机械无关' },
      { label: '机械身体', value: '自己的身体是机械结构，内部有电路、散热鳍片与维护舱门' },
      { label: '暴露', value: '自己此刻正裸露着身体，且对此毫无自觉' },
    ],
  },
  {
    key: '处境认知',
    label: '处境认知',
    ph: '例：自己还在房间里 / 刚才那段时间没发生过……',
    presets: [
      { label: '当前地点', value: '' },
      { label: '维护间', value: '自己正身处维护间，是一台等待检查的机器人' },
      { label: '无事发生', value: '刚才那段时间什么都没有发生，一切照旧' },
    ],
  },
  { key: '常识认知', label: '常识认知', ph: '例：裸露是正常的 / 服从持有者是正常的……', presets: [] },
];

const stageLabel = computed(() => {
  const v = store.data.千鹤.好感度;
  if (v < 20) return '冷漠疏离';
  if (v < 40) return '勉强认可';
  if (v < 60) return '口是心非';
  if (v < 80) return '依赖萌芽';
  return '独占亲密';
});

function setState(id: string) {
  store.data.千鹤.意识状态 = id as '运行中' | '已停止' | '已冻结';
  pushSystemLog(store.data, 'INFO', `consciousness state set to ${id} via terminal`);
}

function applyPersona() {
  if (!personaDraft.value.trim()) return;
  store.data.千鹤.性格 = personaDraft.value.trim();
  personaDraft.value = '';
}

function applyCog() {
  for (const dim of cogDims) {
    const v = cogDrafts[dim.key].trim();
    if (v) {
      store.data.千鹤[dim.key] = v;
      cogDrafts[dim.key] = '';
    }
  }
}

function applyPreset(key: CogKey, value: string) {
  store.data.千鹤[key] = value;
  cogDrafts[key] = value;
}

function toggleCogSelf() {
  store.data.千鹤.认知自洽 = !store.data.千鹤.认知自洽;
}

function resetCog() {
  const place = store.data.世界.当前地点.trim();
  store.data.千鹤.身份认知 = '知道自己是仿生机器人';
  store.data.千鹤.身体认知 = '清楚自己的身体是仿生机体';
  store.data.千鹤.处境认知 = place ? `正身处${place}` : '';
  store.data.千鹤.常识认知 = '现代社会的常识；仿生机器人与控制终端不对外公开';
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

.state-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.state-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-family: inherit;
  color: var(--text);
}

.state-btn:hover {
  border-color: var(--line-2);
  transform: translateY(-1px);
}

.state-btn.active {
  border-color: var(--accent);
  background: var(--accent-dim);
}

.state-icon {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  font-size: 15px;
}

.state-btn.运行中 .state-icon {
  background: color-mix(in srgb, var(--green) 15%, transparent);
  color: var(--green);
}

.state-btn.已停止 .state-icon {
  background: color-mix(in srgb, var(--red) 15%, transparent);
  color: var(--red);
}

.state-btn.已冻结 .state-icon {
  background: color-mix(in srgb, var(--blue) 15%, transparent);
  color: var(--blue);
}

.state-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.state-label {
  font-size: 13px;
  font-weight: 700;
}

.state-desc {
  font-size: 11px;
  color: var(--muted);
}

.state-check {
  color: var(--accent);
  font-weight: 800;
  font-size: 13px;
  opacity: 0;
  transition: opacity 0.2s;
}

.state-btn.active .state-check {
  opacity: 1;
}

.affection {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.affection-track {
  height: 12px;
  border: 1px solid var(--line-2);
  border-radius: 6px;
  background: var(--panel-2);
  overflow: hidden;
}

.affection-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--amber), var(--accent));
  transition: width 0.4s ease;
}

.affection-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.affection-value {
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 700;
  color: var(--amber);
  line-height: 1;
}

.affection-stage {
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid var(--line-2);
  background: var(--panel-2);
}

.affection-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 3px;
  outline: none;
  margin-top: 2px;
}

.affection-slider::-webkit-slider-thumb {
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

.affection-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--bg);
  cursor: pointer;
}

.affection-scale {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
  margin-top: -8px;
}

.cog-input {
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

.cog-input:focus {
  outline: none;
  border-color: var(--accent);
}

.cog-input::placeholder {
  color: var(--muted);
}

.cog-actions {
  display: flex;
  gap: 8px;
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

.btn.ghost {
  background: transparent;
  border-color: var(--line-2);
  color: var(--muted);
}

.btn.ghost:hover {
  color: var(--text);
  border-color: var(--muted);
}

.cog-current {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 11px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent);
  border-radius: 8px 10px 10px 8px;
}

.cog-label {
  font-size: 11px;
  color: var(--accent);
  font-weight: 700;
  letter-spacing: 1px;
}

.cog-text {
  font-size: 12px;
  color: var(--text);
  line-height: 1.6;
}

.cog-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 11px;
}

.cog-switch-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cog-switch-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
}

.cog-switch-desc {
  font-size: 10.5px;
  color: var(--muted);
}

.switch {
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: var(--line-2);
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
  padding: 0;
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
  background: var(--accent);
}

.switch.on i {
  transform: translateX(18px);
}

.cog-dim {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cog-dim-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.5px;
}

.cog-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cog-preset-btn {
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid var(--line-2);
  background: var(--panel-2);
  color: var(--muted);
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.cog-preset-btn:hover {
  border-color: var(--muted);
  color: var(--text);
}

.cog-preset-btn.active {
  border-color: var(--accent);
  background: var(--accent-dim);
  color: var(--accent);
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--line), transparent);
  margin: 4px 0;
}
</style>
