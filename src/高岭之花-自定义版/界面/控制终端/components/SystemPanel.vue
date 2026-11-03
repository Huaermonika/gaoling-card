<template>
  <div class="panel">
    <!-- ===== 系统状态 ===== -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon">⚙</span>
        <span class="panel-title">系统状态</span>
      </div>
      <span class="panel-tag">SYSTEM</span>
    </div>
    <div class="sys-status">
      <span class="sys-state" :class="stateClass">{{ store.data.千鹤.系统状态 }}</span>
      <span v-if="store.data.千鹤.崩溃原因" class="sys-cause">{{ store.data.千鹤.崩溃原因 }}</span>
    </div>

    <!-- ===== 系统信息 ===== -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon">◈</span>
        <span class="panel-title">系统信息</span>
      </div>
      <span class="panel-tag">ABOUT</span>
    </div>
    <div class="about">
      <div class="about-device">
        <span class="about-logo" :class="stateClass">◈</span>
        <div class="about-device-text">
          <span class="about-name">{{ roleName }} · 仿生单元</span>
          <span class="about-model">{{ roleModel }}</span>
        </div>
      </div>
      <div class="about-list">
        <div v-for="row in sysInfo" :key="row.k" class="about-row">
          <span class="about-key">{{ row.k }}</span>
          <span class="about-value mono">{{ row.v }}</span>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- ===== Bug 报告 ===== -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon">⚠</span>
        <span class="panel-title">Bug 报告</span>
      </div>
      <span class="panel-tag">REPORT</span>
    </div>
    <div class="bug-list">
      <div v-for="(bug, i) in store.data.主角.bug报告" :key="i" class="bug-item">
        <span class="bug-index">#{{ i + 1 }}</span>
        <span class="bug-text">{{ bug }}</span>
        <button class="cmd-del" type="button" @click="removeBug(i)">✕</button>
      </div>
      <div v-if="!store.data.主角.bug报告.length" class="cmd-empty">暂无 bug 报告</div>
    </div>
    <div class="bug-add">
      <input v-model="newBug" class="cmd-input" placeholder="记录一次系统异常现象" />
      <button class="btn primary" type="button" @click="addBug">提交报告</button>
    </div>

    <div class="divider"></div>

    <!-- ===== 系统日志 ===== -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon">▤</span>
        <span class="panel-title">系统日志</span>
      </div>
      <span class="panel-tag">LOG</span>
    </div>
    <div class="log-window">
      <div class="log-titlebar">
        <span class="log-dots"><i></i><i></i><i></i></span>
        <span class="log-filename">{{ roleId }} / system.log</span>
        <span class="log-live">● LIVE</span>
      </div>
      <div ref="logBody" class="log-body">
        <div
          v-for="(entry, i) in store.data.系统日志"
          :key="i"
          class="log-line"
          :class="'lv-' + entry.级别.toLowerCase()"
        >
          <span class="log-time">{{ entry.时间 }}</span>
          <span class="log-level">{{ entry.级别 }}</span>
          <span class="log-event">{{ entry.事件 }}</span>
        </div>
        <div v-if="!store.data.系统日志.length" class="log-empty">(no log entries)</div>
      </div>
    </div>
    <button
      v-if="store.data.系统日志.length"
      class="btn ghost"
      type="button"
      @click="store.data.系统日志 = []"
    >
      clear log
    </button>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';
import { currentModel, currentName } from '../role-info';

const store = useDataStore();
const roleName = computed(() => currentName(store.data));
const roleModel = computed(() => currentModel(store.data));
const roleId = computed(() => store.data.当前角色);

const newBug = ref('');
const logBody = ref<HTMLElement | null>(null);

const stateClass = computed(() => {
  const map: Record<string, string> = {
    正常运行: 'is-running',
    未响应: 'is-stopped',
    休眠: 'is-frozen',
  };
  return map[store.data.千鹤.系统状态] ?? '';
});

/** 系统信息：静态硬件属性，前端编纂；序列号跟随当前角色 */
const sysInfo = computed(() => [
  { k: '系统版本', v: 'KurenaiOS 3.2.1' },
  { k: '固件版本', v: 'persona-fw 4.0.5' },
  { k: '产品序列号', v: `${roleModel.value}-${roleId.value}` },
  { k: '硬件版本', v: 'HW-Rev 3.1' },
  { k: '处理器', v: 'Neural Core NX-9' },
  { k: '内存', v: '128 GB' },
  { k: '存储', v: '32 TB · 63% used' },
  { k: '制造日期', v: '2025-11-30' },
  { k: '出厂编号', v: 'SAKU-EN-1170' },
]);

function addBug() {
  if (!newBug.value.trim()) return;
  store.data.主角.bug报告.push(newBug.value.trim());
  newBug.value = '';
}

function removeBug(i: number) {
  store.data.主角.bug报告.splice(i, 1);
}

watch(
  () => store.data.系统日志.length,
  async () => {
    await nextTick();
    if (logBody.value) logBody.value.scrollTop = logBody.value.scrollHeight;
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

.sys-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sys-state {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  border: 1px solid;

  &.is-running {
    color: var(--green);
    border-color: var(--green);
    background: color-mix(in srgb, var(--green) 12%, transparent);
  }

  &.is-stopped {
    color: var(--red);
    border-color: var(--red);
    background: color-mix(in srgb, var(--red) 12%, transparent);
  }

  &.is-frozen {
    color: var(--blue);
    border-color: var(--blue);
    background: color-mix(in srgb, var(--blue) 12%, transparent);
  }
}

.sys-cause {
  font-size: 11px;
  color: var(--muted);
  flex: 1;
}

/* ===== 系统信息 ===== */
.about {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
}

.about-device {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
}

.about-logo {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 20px;
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--accent);
}

.about-device-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.about-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.about-model {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 1px;
}

.about-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.about-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.about-key {
  font-size: 11.5px;
  color: var(--muted);
  flex-shrink: 0;
}

.about-value.mono {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--text);
  text-align: right;
  word-break: break-all;
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--line), transparent);
  margin: 4px 0;
}

.bug-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bug-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 11px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;
}

.bug-index {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--amber);
  flex-shrink: 0;
}

.bug-text {
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
  text-align: center;
  color: var(--muted);
  font-size: 12px;
  padding: 14px;
  border: 1px dashed var(--line);
  border-radius: 10px;
}

.bug-add {
  display: flex;
  gap: 8px;
}

.cmd-input {
  flex: 1;
  padding: 10px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 11px;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 13px;
  transition: border-color 0.2s;
}

.cmd-input:focus {
  outline: none;
  border-color: var(--accent);
}

.cmd-input::placeholder {
  color: var(--muted);
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
  white-space: nowrap;
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

/* ===== 系统日志面板 ===== */
.log-window {
  border: 1px solid var(--line-2);
  border-radius: 12px;
  overflow: hidden;
  background: color-mix(in srgb, var(--bg) 55%, #000 12%);
  font-family: var(--font-mono);
}

.log-titlebar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--panel-2) 72%, transparent);
  border-bottom: 1px solid var(--line);
}

.log-dots {
  display: flex;
  gap: 5px;

  i {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    display: inline-block;

    &:nth-child(1) {
      background: var(--red);
    }

    &:nth-child(2) {
      background: var(--amber);
    }

    &:nth-child(3) {
      background: var(--green);
    }
  }
}

.log-filename {
  flex: 1;
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.5px;
}

.log-live {
  font-size: 10px;
  color: var(--green);
  letter-spacing: 1px;
}

.log-body {
  max-height: 260px;
  overflow-y: auto;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.log-line {
  display: flex;
  gap: 8px;
  font-size: 11px;
  line-height: 1.5;

  .log-time {
    color: var(--muted);
    opacity: 0.75;
    flex-shrink: 0;
  }

  .log-level {
    flex-shrink: 0;
    width: 48px;
    font-weight: 700;
  }

  .log-event {
    color: var(--text);
    word-break: break-all;
  }

  &.lv-info .log-level {
    color: var(--green);
  }

  &.lv-warn .log-level {
    color: var(--amber);
  }

  &.lv-error {
    .log-level {
      color: var(--red);
    }

    .log-event {
      color: var(--red);
    }
  }

  &.lv-debug .log-level {
    color: var(--blue);
  }
}

.log-empty {
  text-align: center;
  color: var(--muted);
  font-size: 11px;
  padding: 20px;
}
</style>
