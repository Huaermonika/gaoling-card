<template>
  <!-- 操作台状态栏（v8 定稿）：单一主体扁卡片内的顶部状态条，随视图切换两种形态。
       完整版（variant="full"，终端 / 设置视图）：
         行1 识别行：◈ 白峰千鹤 + 机型徽章 AN-0170A + 状态灯 + 意识状态 + 「⟳ 更新状态」大按钮
         行2 状态行：意识 / 电源 / 系统 三个状态 chips + 电量 / 好感度 双进度条
       精简版（variant="compact"，对话视图）：
         行1 识别行：◈ 白峰千鹤 + 状态灯 + 意识状态 + 「⟳ 更新状态」大按钮
         行2 进度行：电量 / 好感度 双进度条
       完整细节（电源 / 系统 / 资源占用等）由终端面板提供，状态条只保留最常用信息。 -->
  <div class="cs-bar" :class="variant === 'compact' ? 'cs-compact' : 'cs-full'">
    <!-- ===== 行1 · 识别行 ===== -->
    <div class="cs-row1">
      <span class="cs-logo" :class="stateClass">◈</span>
      <span class="cs-name">白峰千鹤</span>
      <span v-if="variant === 'full'" class="cs-model">AN-0170A</span>
      <span class="cs-spacer"></span>
      <span class="cs-dot" :class="stateClass"></span>
      <span class="cs-state" :class="stateClass">{{ statusText }}</span>
      <button class="cs-update" type="button" :disabled="busy" @click="$emit('update')">
        {{ busy ? '同步中…' : '⟳ 更新状态' }}
      </button>
    </div>

    <!-- ===== 行2 · 状态行 / 进度行 ===== -->
    <div class="cs-row2">
      <template v-if="variant === 'full'">
        <span class="cs-chip" :class="stateClass"><i class="cs-chip-dot"></i>意识 · {{ store.data.千鹤.意识状态 }}</span>
        <span class="cs-chip"><i class="cs-chip-dot"></i>电源 · {{ store.data.千鹤.电源状态 }}</span>
        <span class="cs-chip"><i class="cs-chip-dot"></i>系统 · {{ store.data.千鹤.系统状态 }}</span>
        <span class="cs-spacer"></span>
      </template>
      <div class="cs-gauges">
        <span class="cs-gauge">
          <span class="cs-gauge-label">电量</span>
          <span class="cs-track"><i :style="{ width: hbBattery(store.data.千鹤.电量) + '%' }"></i></span>
          <span class="cs-gauge-value">{{ hbBattery(store.data.千鹤.电量) }}%</span>
        </span>
        <span class="cs-gauge amber">
          <span class="cs-gauge-label">好感</span>
          <span class="cs-track"><i :style="{ width: store.data.千鹤.好感度 + '%' }"></i></span>
          <span class="cs-gauge-value">{{ store.data.千鹤.好感度 }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../../界面/控制终端/store';
import { hbBattery } from '../../界面/控制终端/heartbeat';

const props = withDefaults(defineProps<{ busy?: boolean; variant?: 'compact' | 'full' }>(), {
  busy: false,
  variant: 'full',
});
defineEmits<{ update: [] }>();

const store = useDataStore();

const stateClass = computed(() => {
  const map: Record<string, string> = {
    运行中: 'is-running',
    已停止: 'is-stopped',
    已冻结: 'is-frozen',
  };
  return map[store.data.千鹤.意识状态] ?? '';
});

const statusText = computed(() => {
  const map: Record<string, string> = {
    运行中: '运行中',
    已停止: '已停止',
    已冻结: '已冻结',
  };
  return map[store.data.千鹤.意识状态] ?? store.data.千鹤.意识状态;
});
</script>

<style scoped lang="scss">
.cs-bar {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px 10px;
  font-family: var(--font-ui);
  color: var(--text);
}

/* ===== 行1 · 识别行 ===== */
.cs-row1 {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}

.cs-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  font-size: 14px;
  color: #fff;
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 55%, var(--purple)));
  border-radius: 50%;
  box-shadow: 0 4px 10px -4px color-mix(in srgb, var(--accent) 70%, transparent);
  flex-shrink: 0;
}

.cs-logo.is-stopped {
  background: linear-gradient(135deg, var(--red), color-mix(in srgb, var(--red) 55%, var(--purple)));
}

.cs-logo.is-frozen {
  background: linear-gradient(135deg, var(--blue), color-mix(in srgb, var(--blue) 55%, var(--purple)));
}

.cs-name {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  white-space: nowrap;
}

.cs-model {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--muted);
  letter-spacing: 1px;
  padding: 1px 8px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 999px;
  white-space: nowrap;
}

.cs-spacer {
  flex: 1;
}

.cs-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--green) 22%, transparent), 0 0 8px color-mix(in srgb, var(--green) 60%, transparent);
  flex-shrink: 0;
}

.cs-dot.is-stopped {
  background: var(--red);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--red) 22%, transparent), 0 0 8px color-mix(in srgb, var(--red) 60%, transparent);
}

.cs-dot.is-frozen {
  background: var(--blue);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--blue) 22%, transparent), 0 0 8px color-mix(in srgb, var(--blue) 60%, transparent);
}

.cs-state {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--green);
  white-space: nowrap;
}

.cs-state.is-stopped {
  color: var(--red);
}

.cs-state.is-frozen {
  color: var(--blue);
}

.cs-update {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 8px 16px;
  color: #fff;
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 72%, var(--purple)));
  border: none;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 5px 14px -4px color-mix(in srgb, var(--accent) 70%, transparent);
  transition: filter 0.2s ease, transform 0.15s ease, opacity 0.15s ease;
}

.cs-update:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.cs-update:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ===== 行2 · 状态行 / 进度行 ===== */
.cs-row2 {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.cs-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;
  color: var(--text);
  background: color-mix(in srgb, var(--panel-2) 80%, transparent);
  border: 1px solid var(--line-2);
}

.cs-chip-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--muted);
}

.cs-chip.is-running {
  color: var(--green);
}

.cs-chip.is-running .cs-chip-dot {
  background: var(--green);
  box-shadow: 0 0 5px color-mix(in srgb, var(--green) 60%, transparent);
}

.cs-chip.is-stopped {
  color: var(--red);
}

.cs-chip.is-stopped .cs-chip-dot {
  background: var(--red);
  box-shadow: 0 0 5px color-mix(in srgb, var(--red) 60%, transparent);
}

.cs-chip.is-frozen {
  color: var(--blue);
}

.cs-chip.is-frozen .cs-chip-dot {
  background: var(--blue);
  box-shadow: 0 0 5px color-mix(in srgb, var(--blue) 60%, transparent);
}

.cs-gauges {
  display: flex;
  gap: 14px;
  flex: 1;
  min-width: 150px;
}

.cs-gauge {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.cs-gauge-label {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--muted);
  letter-spacing: 1px;
}

.cs-track {
  flex: 1;
  height: 7px;
  min-width: 40px;
  background: color-mix(in srgb, var(--bg-2) 90%, transparent);
  border: 1px solid var(--line);
  border-radius: 999px;
  overflow: hidden;
}

.cs-track i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 78%, white));
  transition: width 0.4s ease;
}

.cs-gauge.amber .cs-track i {
  background: linear-gradient(90deg, var(--amber), color-mix(in srgb, var(--amber) 78%, white));
}

.cs-gauge-value {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  min-width: 26px;
  text-align: right;
}

/* 精简版（对话视图）：行2 进度条直接顶格 */
.cs-compact .cs-row2 {
  gap: 14px;
}
</style>
