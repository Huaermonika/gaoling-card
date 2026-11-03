<template>
  <!-- 操作台发送栏（v8 定稿）：单一「发送」按钮 —— 点击发送即自动携带状态更新。
       发送逻辑与 App.vue 的 sendChat 同款（sendControlUpdate：状态 diff + 玩家文本）。
       不再提供单独的「⟳ 状态」按钮；仅需同步状态、不发消息时用状态条右上角「⟳ 更新状态」。 -->
  <div class="cc-wrap">
    <form class="cc-bar" @submit.prevent="send">
      <input
        v-model="text"
        class="cc-input"
        type="text"
        placeholder="发送消息给千鹤…"
        autocomplete="off"
        spellcheck="false"
      />
      <button class="cc-send" type="submit" :disabled="sending || !text.trim()">
        {{ sending ? '发送中…' : '发送' }}
      </button>
    </form>
    <div class="cc-meta">
      <span>DATE {{ dateText }} · TIME {{ timeText }}</span>
      <span class="cc-loc">⌖ {{ store.data.世界.当前地点 }}</span>
      <span class="cc-res">CPU <b>{{ hbCpu(store.data.千鹤.cpu使用率) }}%</b></span>
      <span class="cc-res">RAM <b>{{ hbRam(store.data.千鹤.内存使用率) }}%</b></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../../界面/控制终端/store';
import { sendControlUpdate } from '../../界面/控制终端/ui-state';
import { hbCpu, hbRam } from '../../界面/控制终端/heartbeat';

const store = useDataStore();
const text = ref('');
const sending = ref(false);

const dateText = computed(() => {
  const m = store.data.世界.当前时间.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '----';
});

const timeText = computed(() => {
  const m = store.data.世界.当前时间.match(/(\d{2}:\d{2})/);
  return m ? m[1] : '--:--';
});

async function send() {
  if (sending.value || !text.value.trim()) return;
  sending.value = true;
  try {
    const msg = text.value;
    text.value = '';
    await sendControlUpdate(store.data as unknown as Record<string, unknown>, msg);
  } finally {
    sending.value = false;
  }
}
</script>

<style scoped lang="scss">
.cc-wrap {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: var(--font-ui);
  color: var(--text);
}

.cc-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cc-input {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text);
  background: color-mix(in srgb, var(--panel-2) 75%, transparent);
  border: 1px solid var(--line-2);
  border-radius: 999px;
  padding: 8px 14px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.cc-input::placeholder {
  color: var(--muted);
  opacity: 0.75;
}

.cc-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim);
}

.cc-send {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 7px 16px;
  color: #fff;
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 72%, var(--purple)));
  border: none;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 4px 12px -4px color-mix(in srgb, var(--accent) 65%, transparent);
  transition: filter 0.2s ease, transform 0.15s ease, opacity 0.15s ease;
}

.cc-send:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.cc-send:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* 元信息行：DATE / TIME / LOC / CPU / RAM */
.cc-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--muted);
  letter-spacing: 0.5px;
}

.cc-loc {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cc-res b {
  font-weight: 700;
  color: var(--accent);
}

.cc-meta .cc-res:last-child b {
  color: var(--amber);
}
</style>
