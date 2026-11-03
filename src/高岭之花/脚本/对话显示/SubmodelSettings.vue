<template>
  <div class="setting-group">
    <div class="setting-title">副模型</div>

    <label class="switch-row">
      <span class="switch-label">
        <span class="switch-title">启用副模型</span>
        <span class="switch-hint">用独立的 OpenAI 兼容模型处理变量更新与记忆整理。开关立即可用；配置完整并通过连通性测试后，记忆整理自动切到副模型</span>
      </span>
      <button
        class="switch"
        :class="{ on: cfg.enabled }"
        type="button"
        role="switch"
        :aria-checked="cfg.enabled"
        :disabled="probing"
        @click="toggleEnabled"
      >
        <span class="switch-knob"></span>
      </button>
    </label>

    <template v-if="cfg.enabled">
      <div class="sub-field">
        <label class="sub-label">Endpoint</label>
        <input v-model="cfg.endpoint" class="sub-input" type="text" placeholder="https://api.openai.com/v1" autocomplete="off" />
      </div>
      <div class="sub-field">
        <label class="sub-label">API Key</label>
        <input v-model="cfg.apiKey" class="sub-input" type="password" placeholder="sk-…" autocomplete="off" />
      </div>
      <div class="sub-field">
        <label class="sub-label">模型</label>
        <input v-model="cfg.model" class="sub-input" type="text" placeholder="gpt-4o-mini" autocomplete="off" />
        <div class="sub-actions">
          <button class="manual-btn" type="button" :disabled="listing" @click="loadModels">
            {{ listing ? '获取中…' : '获取模型列表' }}
          </button>
          <button class="manual-btn" type="button" :disabled="probing" @click="runTest">
            {{ probing ? '测试中…' : '测试连通性' }}
          </button>
        </div>
        <select v-if="modelOptions.length" v-model="cfg.model" class="sub-input">
          <option v-for="model in modelOptions" :key="model" :value="model">{{ model }}</option>
        </select>
        <span v-if="probeText" class="result-text" :class="{ bad: !probeOk }">{{ probeText }}</span>
      </div>
      <div class="sub-field">
        <label class="sub-label">温度</label>
        <input v-model.number="cfg.temperature" class="sub-input" type="number" min="0" max="2" step="0.1" />
      </div>

      <label class="switch-row">
        <span class="switch-label">
          <span class="switch-title">职责 · 变量更新</span>
          <span class="switch-hint">每轮主模型回复后，兜底修正遗漏的变量变化</span>
        </span>
        <button
          class="switch"
          :class="{ on: cfg.varUpdate }"
          type="button"
          role="switch"
          :aria-checked="cfg.varUpdate"
          @click="cfg.varUpdate = !cfg.varUpdate"
        >
          <span class="switch-knob"></span>
        </button>
      </label>

      <div class="setting-hint">副模型异步回填，不阻塞主模型生成；失败时静默跳过，不影响剧情。</div>
    </template>
  </div>

  <div class="setting-group">
    <div class="setting-title">记忆更新</div>

    <div class="mode-list">
      <button
        v-for="mode in MEMORY_MODES"
        :key="mode.value"
        class="mode-btn"
        :class="{ active: mem.mode === mode.value }"
        type="button"
        @click="mem.mode = mode.value"
      >
        <span class="mode-name">{{ mode.label }}</span>
        <span class="mode-hint">{{ mode.hint }}</span>
      </button>
    </div>

    <div v-if="mem.mode === 'main' || mem.mode === 'sub'" class="sub-field">
      <label class="sub-label">每 N 轮整理一次</label>
      <input v-model.number="mem.every" class="sub-input" type="number" min="1" step="1" />
    </div>

    <label class="switch-row">
      <span class="switch-label">
        <span class="switch-title">发送时注入记忆</span>
        <span class="switch-hint">把钉选、最近记忆、高强度记忆与本轮改动一起发给 AI，作为千鹤扮演时的依据</span>
      </span>
      <button
        class="switch"
        :class="{ on: inj.启用 }"
        type="button"
        role="switch"
        :aria-checked="inj.启用"
        @click="inj.启用 = !inj.启用"
      >
        <span class="switch-knob"></span>
      </button>
    </label>

    <label v-if="inj.启用" class="switch-row">
      <span class="switch-label">
        <span class="switch-title">注入当前认知</span>
        <span class="switch-hint">把身份、身体、处境、常识四项认知一并放进注入块，位置靠近提示词末尾</span>
      </span>
      <button
        class="switch"
        :class="{ on: inj.注入认知 }"
        type="button"
        role="switch"
        :aria-checked="inj.注入认知"
        @click="inj.注入认知 = !inj.注入认知"
      >
        <span class="switch-knob"></span>
      </button>
    </label>

    <div v-if="inj.启用" class="sub-field">
      <label class="sub-label">注入最近 N 条记忆</label>
      <input v-model.number="inj.条数" class="sub-input" type="number" min="1" step="1" />
    </div>

    <div v-if="inj.启用" class="sub-field">
      <label class="sub-label">额外注入高强度记忆（强度 ≥ 60）</label>
      <input v-model.number="inj.高强度条数" class="sub-input" type="number" min="0" step="1" />
    </div>

    <div v-if="inj.启用" class="sub-field">
      <label class="sub-label">记忆字符预算（钉选与本轮变更不计入）</label>
      <input v-model.number="inj.字符预算" class="sub-input" type="number" min="500" step="100" />
    </div>

    <div v-if="inj.启用" class="sub-field">
      <button class="manual-btn" type="button" @click="togglePreview">
        {{ previewing ? '收起注入预览' : '预览本轮注入' }}
      </button>
      <span v-if="previewing" class="result-text">
        注入 {{ previewPlan.pinned + previewPlan.recent + previewPlan.strong }} / 共 {{ previewPlan.total }} 条
        · 钉选 {{ previewPlan.pinned }} · 最近 {{ previewPlan.recent }} · 深刻 {{ previewPlan.strong }}
        · 认知 {{ previewPlan.cognition }} 项
        · {{ previewPlan.chars }} 字符
        <template v-if="previewPlan.omitted">（{{ previewPlan.omitted }} 条未注入）</template>
      </span>
      <span v-if="previewing && !canInject" class="result-text bad">当前环境不支持临时注入，记忆会拼进玩家消息</span>
    </div>

    <pre v-if="previewing && previewPlan.block" class="preview-block">{{ previewPlan.block }}</pre>

    <div class="sub-field">
      <div class="pending-head">
        <span class="sub-label">待整理楼层（{{ pending.length }}）</span>
        <button class="manual-btn" type="button" @click="refreshPending">刷新列表</button>
      </div>
      <div v-if="!pending.length" class="setting-hint">没有未整理的楼层。</div>
      <div v-else class="pending-list">
        <label v-for="floor in pending" :key="floor.id" class="pending-item">
          <input v-model="selectedIds" type="checkbox" :value="floor.id" />
          <span class="pending-tag">第 {{ floor.id }} 楼</span>
          <span class="pending-text">{{ floor.preview }}</span>
        </label>
      </div>
      <div v-if="pending.length" class="sub-actions">
        <button class="manual-btn" type="button" @click="selectAllPending">全选</button>
        <button class="manual-btn" type="button" @click="clearSelection">清空选择</button>
      </div>
      <div v-if="pending.length" class="setting-hint">
        默认勾选全部未整理楼层。楼层较多时可以分批勾选，一次请求的提示词长度随选中楼层数增长。
      </div>
    </div>

    <div class="sub-field">
      <button class="manual-btn" type="button" :disabled="running || !selectedIds.length" @click="runNow">
        {{ running ? '整理中…' : `整理选中楼层（${selectedIds.length}）` }}
      </button>
      <span v-if="resultText" class="result-text" :class="{ bad: !resultOk }">{{ resultText }}</span>
    </div>

    <div class="setting-hint">
      主模型模式与副模型模式会另发一次请求整理记忆；提示词模式由主模型按每轮发送的写入要求自己追加；关闭模式不做额外处理。注入顺序是认知、钉选、最近 N 条、高强度记忆，重复的只保留一次；最近与高强度超出字符预算时先丢最旧的，认知与钉选不计入预算。记忆被玩家在终端修改后，下一次发送会附带一条「更新了记忆……」告知 AI。
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  submodelConfig,
  saveSubmodelConfig,
  memoryConfig,
  saveMemoryConfig,
  MEMORY_MODES,
  runMemoryConsolidation,
  listPendingFloors,
  type PendingFloor,
  testAndActivateSubmodel,
  disableSubmodel,
  listSubmodelModels,
} from './submodel';
import {
  buildMemoryPlan,
  memoryInjectSettings,
  readCognition,
  readMemoryEntries,
  saveMemoryInjectSettings,
} from '../../界面/控制终端/memory-inject';
import { useDataStore } from '../../界面/控制终端/store';
import { canInjectPrompts } from './prompt-inject';

const cfg = submodelConfig;
const mem = memoryConfig;
const inj = memoryInjectSettings;

const store = useDataStore();
const canInject = canInjectPrompts();

const running = ref(false);
const resultText = ref('');
const resultOk = ref(true);

/** 待整理楼层与勾选：默认把所有未整理的楼层都选中 */
const pending = ref<PendingFloor[]>([]);
const selectedIds = ref<number[]>([]);

function refreshPending(): void {
  pending.value = listPendingFloors();
  selectedIds.value = pending.value.map(floor => floor.id);
}

function selectAllPending(): void {
  selectedIds.value = pending.value.map(floor => floor.id);
}

function clearSelection(): void {
  selectedIds.value = [];
}

onMounted(refreshPending);

// 副模型检测
const probing = ref(false);
const listing = ref(false);
const probeText = ref('');
const probeOk = ref(true);
const modelOptions = ref<string[]>([]);

/** 开关副模型：开关本身立即可用；配置完整时顺带测一次连通性 */
async function toggleEnabled(): Promise<void> {
  if (cfg.enabled) {
    disableSubmodel();
    probeText.value = '';
    return;
  }
  saveSubmodelConfig({ enabled: true });
  if (!cfg.endpoint.trim() || !cfg.model.trim()) {
    probeText.value = '已启用。填写 Endpoint 与模型后，点「测试连通性」完成验证';
    return;
  }
  await runTest();
}

async function loadModels(): Promise<void> {
  if (listing.value) return;
  listing.value = true;
  probeText.value = '';
  try {
    const r = await listSubmodelModels();
    probeOk.value = r.ok;
    if (r.ok) {
      modelOptions.value = r.models;
      probeText.value = `获取到 ${r.models.length} 个模型`;
    } else {
      probeText.value = `获取失败：${r.reason ?? '未知原因'}`;
    }
  } finally {
    listing.value = false;
  }
}

async function runTest(): Promise<void> {
  if (probing.value) return;
  probing.value = true;
  probeText.value = '';
  try {
    const r = await testAndActivateSubmodel();
    probeOk.value = r.ok;
    probeText.value = r.ok
      ? `连接正常（${r.ms ?? '?'} ms），已启用，记忆整理切换到副模型`
      : `连接失败：${r.reason ?? '未知原因'}`;
  } finally {
    probing.value = false;
  }
}

// 注入预览：只算当前记忆（不传上一次基线，所以不含「本轮变更」那一节）
const previewing = ref(false);
const previewPlan = computed(() =>
  buildMemoryPlan(readMemoryEntries(store.data), undefined, readCognition(store.data)),
);

function togglePreview(): void {
  previewing.value = !previewing.value;
}

/** 手动整理：只整理勾选的楼层，跑完重新读取待整理列表 */
async function runNow(): Promise<void> {
  if (running.value || !selectedIds.value.length) return;
  running.value = true;
  resultText.value = '';
  try {
    const r = await runMemoryConsolidation({ messageIds: [...selectedIds.value] });
    resultOk.value = r.ok;
    resultText.value = r.ok ? `新增 ${r.count} 条记忆` : `未写入：${r.reason ?? '未知原因'}`;
    refreshPending();
  } finally {
    running.value = false;
  }
}

// 任意字段变化即落盘（localStorage），刷新后保留
watch(cfg, () => saveSubmodelConfig(), { deep: true });
watch(mem, () => saveMemoryConfig(), { deep: true });
watch(inj, () => saveMemoryInjectSettings(), { deep: true });
</script>

<style scoped lang="scss">
.setting-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.setting-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--muted);
}

.setting-hint {
  font-size: 10.5px;
  color: var(--muted);
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  cursor: pointer;
}

.switch-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.switch-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.switch-hint {
  font-size: 11px;
  color: var(--muted);
}

.switch {
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 26px;
  padding: 0;
  border-radius: 999px;
  border: 1px solid var(--line-2);
  background: var(--line-2);
  cursor: pointer;
  transition: background 0.2s ease;
}

.switch.on {
  background: var(--accent);
  border-color: var(--accent);
}

.switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease;
}

.switch.on .switch-knob {
  transform: translateX(18px);
}

.switch:disabled {
  opacity: 0.6;
  cursor: default;
}

.sub-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.sub-label {
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.5px;
}

.sub-input {
  padding: 9px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--text);
  font-family: inherit;
  font-size: 13px;
  transition: border-color 0.2s;
}

.sub-input:focus {
  outline: none;
  border-color: var(--accent);
}

.sub-input::placeholder {
  color: var(--muted);
  opacity: 0.7;
}

.sub-actions {
  display: flex;
  gap: 8px;
}

.mode-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mode-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 10px 12px;
  text-align: left;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  color: var(--text);
  font-family: inherit;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
}

.mode-btn.active {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, var(--panel-2));
}

.mode-name {
  font-size: 13px;
  font-weight: 600;
}

.mode-hint {
  font-size: 11px;
  color: var(--muted);
  line-height: 1.4;
}

.manual-btn {
  padding: 10px 14px;
  background: var(--panel-2);
  border: 1px solid var(--line-2);
  border-radius: 10px;
  color: var(--text);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s;
}

.manual-btn:hover:not(:disabled) {
  border-color: var(--accent);
}

.manual-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.pending-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pending-head .manual-btn {
  padding: 6px 10px;
  font-size: 11px;
}

.pending-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 220px;
  padding: 6px 8px;
  overflow-y: auto;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;
}

.pending-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 5px 4px;
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--text);
  cursor: pointer;
}

.pending-item input {
  flex-shrink: 0;
  margin-top: 2px;
  accent-color: var(--accent);
}

.pending-tag {
  flex-shrink: 0;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.pending-text {
  flex: 1;
  min-width: 0;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.result-text {
  font-size: 11px;
  color: var(--accent);
}

.result-text.bad {
  color: var(--muted);
}

.preview-block {
  max-height: 280px;
  margin: 0;
  padding: 10px 12px;
  overflow: auto;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--text);
  font-family: inherit;
  font-size: 11px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
