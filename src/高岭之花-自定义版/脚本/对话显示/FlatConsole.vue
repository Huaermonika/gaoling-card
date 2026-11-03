<template>
  <!-- 操作台（FlatConsole）v8 定稿：关闭「流式美化」时挂载的完整操作界面。
       单一主体扁卡片（柔和玻璃圆角 / 渐变分隔线），结构：
         1. ConsoleStatusBar —— 顶部状态条，随视图切换：对话=精简双行；终端/设置=完整版（chips+机型徽章）
         2. 视图内容区（底部三视图导航切换）：
             对话   —— ConsoleComposer 发送栏（单「发送」按钮，发送即携带状态更新）+ 元信息行
             终端   —— 六面板（复用 StatusPanel 等原组件）+ 底部一行内部子菜单（与原 App.vue app-tabs 一致）
             设置   —— 主题 / 主色 / 字号 / 隐藏酒馆界面 / 副模型 / 扩展
         3. 底部导航 —— 对话 / 终端(中央圆主按钮) / 设置
       不渲染对话正文：关闭美化后正文由酒馆原生楼层显示，操作台专注「状态 + 操作 + 发送」。
       主题：优先继承外部注入（被 App.vue 引用时自动生效）；独立挂载时自注入 localStorage 主题。 -->
  <div ref="rootEl" class="console-card" :style="consoleVars">
    <ConsoleStatusBar
      :variant="view === 'chat' ? 'compact' : 'full'"
      :busy="sending"
      @update="sendStatusUpdate"
    />

    <hr class="card-rule" />

    <!-- ===== 视图内容区 ===== -->
    <div class="console-view">
      <!-- ① 对话视图：发送栏（正文由酒馆原生显示） -->
      <div v-show="view === 'chat'" class="view-chat">
        <ConsoleComposer />
      </div>

      <!-- ② 终端视图：六面板 + 页签（样式与手机壳控制终端一致） -->
      <div v-show="view === 'term'" class="view-term">
        <div class="app-panel">
          <StatusPanel v-if="activeTab === '状态'" />
          <CognitionPanel v-else-if="activeTab === '认知'" />
          <MemoryPanel v-else-if="activeTab === '记忆'" />
          <BodyPanel v-else-if="activeTab === '躯体参数'" />
          <CommandPanel v-else-if="activeTab === '指令'" />
          <SystemPanel v-else-if="activeTab === '系统'" />
        </div>
        <nav class="app-tabs">
          <button
            v-for="t in tabs"
            :key="t.id"
            class="app-tab"
            :class="{ active: activeTab === t.id }"
            type="button"
            @click="activeTab = t.id"
          >
            <span class="tab-icon" v-html="t.icon"></span>
            <span class="tab-label">{{ t.label }}</span>
          </button>
        </nav>
      </div>

      <!-- ③ 设置视图：样式与手机壳设置一致 -->
      <div v-show="view === 'settings'" class="view-settings">
        <div class="settings-view">
          <SettingsPanel
            sub="与对话界面共用同一套主题设置"
            hide-hint="隐藏原生输入栏 / 楼层头像 / 顶部栏，关闭美化时建议开启"
            pretty-hint="开启后恢复气泡式对话界面，正文由界面渲染"
          />
        </div>
      </div>
    </div>

    <hr class="card-rule" />

    <!-- ===== 底部导航：对话 / 终端 / 设置 ===== -->
    <nav class="console-nav">
      <button class="nav-btn" :class="{ active: view === 'chat' }" type="button" @click="view = 'chat'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/></svg>
        <span>对话</span>
      </button>
      <div class="nav-center">
        <button class="nav-center-btn" :class="{ active: view === 'term' }" type="button" title="控制终端" @click="view = 'term'">◈</button>
        <span class="nav-center-label" :class="{ active: view === 'term' }">终端</span>
      </div>
      <button class="nav-btn" :class="{ active: view === 'settings' }" type="button" @click="view = 'settings'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21 17 7"/><path d="M5 7h4"/><path d="M7 5v4"/><path d="M18 13h4"/><path d="M20 11v4"/></svg>
        <span>设置</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../../界面/控制终端/store';
import { trackControlState, sendControlUpdate } from '../../界面/控制终端/ui-state';
import { buildConsoleVars } from './console-theme';
import SettingsPanel from './SettingsPanel.vue';
import { customAccent, themeKey } from './settings';
import { panelTabs } from './panel-tabs';
import ConsoleStatusBar from './ConsoleStatusBar.vue';
import ConsoleComposer from './ConsoleComposer.vue';
import StatusPanel from '../../界面/控制终端/components/StatusPanel.vue';
import CognitionPanel from '../../界面/控制终端/components/CognitionPanel.vue';
import MemoryPanel from '../../界面/控制终端/components/MemoryPanel.vue';
import BodyPanel from '../../界面/控制终端/components/BodyPanel.vue';
import CommandPanel from '../../界面/控制终端/components/CommandPanel.vue';
import SystemPanel from '../../界面/控制终端/components/SystemPanel.vue';

const store = useDataStore();
trackControlState(store.data as unknown as Record<string, unknown>);

/* ============ 三视图 ============ */
const view = ref<'chat' | 'term' | 'settings'>('chat');

/* ============ 终端内部子菜单（底部一行，与原 App.vue app-tabs 一致） ============ */
const activeTab = ref('状态');
const tabs = panelTabs;

/* ============ 状态更新（状态条右上角「⟳ 更新状态」按钮） ============ */
const sending = ref(false);
async function sendStatusUpdate() {
  if (sending.value) return;
  sending.value = true;
  try {
    await sendControlUpdate(store.data as unknown as Record<string, unknown>, '');
  } finally {
    sending.value = false;
  }
}

/* ============ 主题：外部注入优先，独立挂载自注入 ============ */
const rootEl = ref<HTMLElement>();
const consoleVars = ref<Record<string, string>>({});

/** 主题 / 主题色来自 settings.ts，与外壳界面共用同一份状态 */
function refreshVars() {
  consoleVars.value = buildConsoleVars(themeKey.value, customAccent.value || undefined);
}

onMounted(() => {
  // 自身根元素若能继承到 --panel（被 App.vue 等外部注入），则不重复注入；否则自注入 localStorage 主题
  const inherited = rootEl.value ? getComputedStyle(rootEl.value).getPropertyValue('--panel').trim() : '';
  if (!inherited) refreshVars();
});

// 设置页切换主题 / 主色后立即重算根变量（原先散落在各个 setter 里手动调用）
watch([themeKey, customAccent], refreshVars);
</script>

<style scoped lang="scss">
/* ===== 单一主体扁卡片 ===== */
.console-card {
  /* 与 App.vue 一致的基础字体；被外部注入主题变量时直接继承 */
  --font-ui: system-ui, -apple-system, 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif;
  --font-mono: 'JetBrains Mono', 'Cascadia Code', 'Courier New', monospace;

  display: flex;
  flex-direction: column;
  font-family: var(--font-ui);
  color: var(--text);
  background:
    radial-gradient(120% 90% at 100% 0%, var(--accent-dim) 0%, transparent 46%),
    linear-gradient(170deg, color-mix(in srgb, var(--panel) 96%, var(--accent) 3%), var(--panel) 55%);
  border: 1px solid color-mix(in srgb, var(--line-2) 72%, transparent);
  border-radius: calc(var(--radius) + 8px);
  box-shadow:
    0 24px 64px -28px color-mix(in srgb, var(--accent) 45%, transparent),
    0 6px 20px -12px color-mix(in srgb, var(--text) 25%, transparent);
  /* 与手机壳 PC 形态一致的封顶高度：终端/设置内容超出时内部滚动，而非整卡无限撑高 */
  max-height: 820px;
  overflow: hidden;
}

.card-rule {
  height: 1px;
  border: none;
  margin: 0;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--line-2) 65%, transparent) 18%,
    color-mix(in srgb, var(--line-2) 65%, transparent) 82%,
    transparent
  );
  flex-shrink: 0;
}

/* ===== 视图内容区 ===== */
.console-view {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
}

.view-chat {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.view-term {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.view-settings {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* SettingsPanel 的样式在 App.vue 里是按 scoped 写的，操作台引用时命中不到；
   这里补一份同规格的滚动容器，卡片高度封顶后设置页可以内部滚动 */
.settings-view {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 18px 38px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ===== 终端视图：六面板 + 底部一行内部子菜单（样式与手机壳控制终端一致） ===== */
.app-panel {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 16px 34px;
  background: var(--panel);
}

.app-tabs {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  border-top: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg-2) 82%, transparent);
  padding-top: 2px;
}

.app-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 9px 0 9px;
  background: transparent;
  border: none;
  color: var(--muted);
  cursor: pointer;
  transition: color 0.2s;
  font-family: inherit;
  position: relative;
}

.app-tab::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 30%;
  right: 30%;
  height: 2px;
  border-radius: 2px;
  background: var(--accent);
  opacity: 0;
  transition: opacity 0.2s;
}

.app-tab:hover {
  color: var(--text);
}

.app-tab.active {
  color: var(--accent);
}

.app-tab.active::before {
  opacity: 1;
}

.tab-icon {
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 图标由 v-html 注入，没有 scope 属性，必须用 :deep 才能命中 */
.tab-icon :deep(svg) {
  width: 14px;
  height: 14px;
  display: block;
}

.tab-label {
  font-size: 10.5px;
  letter-spacing: 1px;
}

/* ===== 底部导航：对话 / 终端 / 设置 ===== */
.console-nav {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 8px 16px 10px;
  background: color-mix(in srgb, var(--panel-2) 55%, transparent);
  border-top: 1px solid color-mix(in srgb, var(--line) 75%, transparent);
  flex-shrink: 0;
}

.nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: 9.5px;
  color: var(--muted);
  padding: 4px 14px;
  border-radius: 12px;
  transition: color 0.2s ease;
}

.nav-btn svg {
  width: 17px;
  height: 17px;
}

.nav-btn.active {
  color: var(--accent);
}

.nav-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.nav-center-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 17px;
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 72%, var(--purple)));
  box-shadow: 0 6px 16px -6px color-mix(in srgb, var(--accent) 70%, transparent);
  transition: transform 0.15s ease;
}

.nav-center-btn:hover {
  transform: translateY(-1px);
}

.nav-center-btn.active {
  outline: 3px solid var(--accent-dim);
  outline-offset: 2px;
}

.nav-center-label {
  font-size: 9.5px;
  color: var(--muted);
}

.nav-center-label.active {
  color: var(--accent);
}

</style>
