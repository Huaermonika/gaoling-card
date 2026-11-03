<template>
  <div class="ow-overlay">
    <div class="ow-panel">
      <header class="ow-head">
        <b>开场设置</b>
        <span>选择预设，或从零写一个</span>
      </header>

      <div class="ow-tabs">
        <button type="button" class="ow-tab" :class="{ active: tab === 'preset' }" @click="tab = 'preset'">预设开场</button>
        <button type="button" class="ow-tab" :class="{ active: tab === 'custom' }" @click="tab = 'custom'">自定义</button>
      </div>

      <div class="ow-body">
        <template v-if="tab === 'preset'">
          <div class="ow-presets">
            <button
              v-for="preset in presets"
              :key="preset.id"
              type="button"
              class="ow-preset"
              :class="{ active: selected === preset.id }"
              @click="selected = preset.id"
            >
              <b>{{ preset.name }}</b>
              <span>{{ preset.subtitle }}</span>
            </button>
          </div>
          <div class="ow-preview">
            <div class="ow-preview-label">开场预览</div>
            <p>{{ previewText(activePreset?.text ?? '') }}</p>
          </div>
        </template>

        <template v-else>
          <div class="ow-grid">
            <label class="ow-field">
              <span>姓名 <i>必填</i></span>
              <input v-model="form.姓名" type="text" maxlength="20" placeholder="例如：岚" />
            </label>
            <label class="ow-field">
              <span>型号</span>
              <input v-model="form.型号" type="text" maxlength="30" placeholder="例如：HK-7" />
            </label>
          </div>

          <label class="ow-field">
            <span>外观</span>
            <textarea v-model="form.外观" rows="2" placeholder="外形、体型、常见着装、可注意的机械特征" />
          </label>

          <label class="ow-field">
            <span>性格</span>
            <textarea v-model="form.性格" rows="2" placeholder="决定语气与行为倾向" />
          </label>

          <label class="ow-field">
            <span>背景</span>
            <textarea v-model="form.背景" rows="2" placeholder="来历、经历、当前处境" />
          </label>

          <label class="ow-field">
            <span>关系</span>
            <textarea v-model="form.关系" rows="2" placeholder="与持有者的关系" />
          </label>

          <label class="ow-field">
            <span>开场白</span>
            <textarea v-model="form.开场白" rows="5" placeholder="第一段剧情；留空则使用默认模板" />
          </label>
        </template>

        <p v-if="error" class="ow-error">{{ error }}</p>
      </div>

      <footer class="ow-foot">
        <span class="ow-hint">开场只发送一次，写入首楼后会带上初始变量与记忆。</span>
        <button type="button" class="ow-start" :disabled="busy" @click="start">
          {{ busy ? '正在写入…' : '开始' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { buildCustomOpening, defaultCustomText, previewText, 千鹤开场, type OpeningPreset } from './presets';
import { applyOpening } from './apply';

const props = defineProps<{ messageId: number }>();
const emit = defineEmits<{ done: [] }>();

const presets = 千鹤开场;
const tab = ref<'preset' | 'custom'>('preset');
const selected = ref(presets[0]?.id ?? '');
const busy = ref(false);
const error = ref('');

const form = reactive({
  姓名: '',
  型号: '',
  外观: '',
  性格: '',
  背景: '',
  关系: '',
  开场白: '',
});

const activePreset = computed<OpeningPreset | undefined>(() => presets.find(item => item.id === selected.value));

watch(
  () => form.姓名,
  name => {
    if (!form.开场白.trim() || form.开场白 === defaultCustomText('')) {
      form.开场白 = defaultCustomText(name);
    }
  },
);

async function start() {
  error.value = '';
  busy.value = true;
  try {
    const preset = tab.value === 'preset' ? activePreset.value : buildCustomOpening(form);
    if (!preset) throw new Error('请选择一个开场');
    await applyOpening(preset, props.messageId);
    emit('done');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped lang="scss">
.ow-overlay {
  position: absolute;
  inset: 0;
  z-index: 70;
  background: var(--bg);
  color: var(--text);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ow-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.ow-head {
  flex-shrink: 0;
  padding: 16px 16px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  b {
    font-size: 17px;
    letter-spacing: 1px;
  }

  span {
    font-size: 11px;
    color: var(--muted);
  }
}

.ow-tabs {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  padding: 0 16px 10px;
}

.ow-tab {
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--muted);
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 11.5px;
  font-family: inherit;
  cursor: pointer;

  &.active {
    color: var(--accent);
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 8%, var(--panel));
  }
}

.ow-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ow-presets {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.ow-preset {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel);
  color: var(--text);
  font-family: inherit;
  text-align: left;
  cursor: pointer;

  b {
    font-size: 12.5px;
  }

  span {
    font-size: 10.5px;
    color: var(--muted);
  }

  &.active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 7%, var(--panel));
  }
}

.ow-preview {
  border: 1px dashed var(--line-2);
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--panel-2);

  p {
    margin: 6px 0 0;
    font-size: 11.5px;
    line-height: 1.65;
    color: var(--text);
    white-space: pre-wrap;
  }
}

.ow-preview-label {
  font-size: 10px;
  color: var(--muted);
  letter-spacing: 1px;
}

.ow-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.ow-field {
  display: flex;
  flex-direction: column;
  gap: 4px;

  > span {
    font-size: 10.5px;
    color: var(--muted);

    i {
      font-style: normal;
      color: var(--accent);
    }
  }

  input,
  textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--panel);
    color: var(--text);
    padding: 7px 9px;
    font-size: 11.5px;
    font-family: inherit;
    line-height: 1.5;
    resize: vertical;
  }
}

.ow-error {
  margin: 0;
  color: var(--red);
  font-size: 11px;
}

.ow-foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px calc(14px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--line);
}

.ow-hint {
  flex: 1;
  font-size: 9.5px;
  color: var(--muted);
  line-height: 1.4;
}

.ow-start {
  flex: 0 0 auto;
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #fff;
  border-radius: 9px;
  padding: 9px 22px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}
</style>
