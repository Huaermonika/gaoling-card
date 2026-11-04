<template>
  <div class="settings-panel">
    <div class="settings-head">
      <div class="settings-head-row">
        <span class="settings-head-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 9 9c0-1.7-1.3-3-3-3h-2.5a2.5 2.5 0 0 1-2.5-2.5c0-.7.3-1.4.7-1.9.5-.6.8-1.3.8-2.1A2.5 2.5 0 0 0 12 3Z" /><circle cx="7.5" cy="10.5" r="1" /><circle cx="10.5" cy="7.5" r="1" /><circle cx="16.5" cy="14.5" r="1" /></svg></span>
        <div class="settings-head-text">
          <div class="settings-title">{{ title }}</div>
          <div class="settings-sub">{{ sub }}</div>
        </div>
      </div>
      <span class="settings-head-tag">PREFERENCES</span>
    </div>

    <div class="settings-sec"><span class="settings-sec-bar"></span>外观</div>

    <!-- 主题风格 -->
    <div class="setting-group">
      <div class="setting-title">主题风格</div>
      <div class="theme-grid">
        <button
          v-for="(t, key) in visibleThemes"
          :key="key"
          class="theme-card"
          :class="{ active: themeKey === key }"
          type="button"
          @click="setTheme(key)"
        >
          <span class="theme-preview" :style="themePreviewStyle(t)">
            <span class="preview-dot"></span>
          </span>
          <span class="theme-card-text">
            <span class="theme-name">{{ t.name }}</span>
            <span class="theme-desc">{{ t.desc }}</span>
          </span>
          <span class="theme-check">✓</span>
        </button>
      </div>
    </div>

    <!-- 主题色 -->
    <div class="setting-group">
      <div class="setting-title">主题色</div>
      <div class="swatches">
        <button
          v-for="c in accentPresets"
          :key="c.color"
          class="swatch"
          :class="{ active: (customAccent || currentTheme.vars['--accent']) === c.color }"
          type="button"
          @click="setCustomAccent(c.color)"
        >
          <span class="swatch-dot" :style="{ background: c.color }"></span>
          <span class="swatch-name">{{ c.name }}</span>
        </button>
      </div>
      <label class="custom-color">
        <span>自定义</span>
        <input
          type="color"
          :value="customAccent || currentTheme.vars['--accent']"
          @input="setCustomAccent(($event.target as HTMLInputElement).value)"
        />
      </label>
      <button v-if="customAccent" class="link-btn" type="button" @click="resetAccent">恢复主题默认色</button>
    </div>

    <!-- 正文字号 -->
    <div class="setting-group">
      <div class="setting-title">正文字号</div>
      <div class="size-options">
        <button
          v-for="s in fontSizeOptions"
          :key="s.value"
          class="size-btn"
          :class="{ active: fontSize === s.value }"
          type="button"
          @click="setFontSize(s.value)"
        >
          {{ s.label }}
        </button>
      </div>
      <div class="font-sample" :style="{ fontSize: fontSize + 'px' }">早安 · Aa 123</div>
    </div>

    <!-- 以下四项只在外壳界面（手机 / PC）出现，操作台不显示 -->
    <template v-if="showLayout">
      <div class="settings-sec"><span class="settings-sec-bar"></span>形态</div>

      <div class="setting-group">
        <div class="setting-title">显示形态</div>
        <div class="mode-row">
          <button
            v-for="m in displayModes"
            :key="m.value"
            class="mode-btn"
            :class="{ active: displayMode === m.value }"
            type="button"
            @click="setDisplayMode(m.value as DisplayMode)"
          >
            {{ m.label }}
          </button>
        </div>
        <div class="setting-hint">自适应将根据窗口宽度自动在手机 / PC 布局间切换</div>
      </div>

      <div class="setting-group">
        <div class="setting-title">屏幕比例</div>
        <div class="size-options">
          <button
            v-for="a in aspectOptions"
            :key="a.value"
            class="size-btn"
            :class="{ active: phoneAspect === a.value }"
            type="button"
            @click="setPhoneAspect(a.value as PhoneAspect)"
          >
            {{ a.label }}
          </button>
        </div>
        <div class="setting-hint">仅手机形态生效</div>
      </div>

      <div class="setting-group">
        <div class="setting-title">界面大小</div>
        <div class="size-options">
          <button
            v-for="s in uiSizeOptions"
            :key="s.value"
            class="size-btn"
            :class="{ active: uiSize === s.value }"
            type="button"
            @click="setUiSize(s.value as UiSize)"
          >
            {{ s.label }}
          </button>
        </div>
      </div>

      <div class="setting-group">
        <div class="setting-title">老年机模式</div>
        <label class="switch-row">
          <span class="switch-label">
            <span class="switch-title">超大字号 · 大按钮</span>
            <span class="switch-hint">文字与按钮整体放大，切换为单栏大字体界面</span>
          </span>
          <button
            class="switch"
            :class="{ on: elderMode }"
            type="button"
            role="switch"
            :aria-checked="elderMode"
            @click="setElderMode(!elderMode)"
          >
            <span class="switch-knob"></span>
          </button>
        </label>
      </div>
    </template>

    <div class="settings-sec"><span class="settings-sec-bar"></span>界面</div>

    <!-- 酒馆界面 -->
    <div class="setting-group">
      <div class="setting-title">酒馆界面</div>
      <label class="switch-row">
        <span class="switch-label">
          <span class="switch-title">隐藏酒馆界面元素</span>
          <span class="switch-hint">{{ hideHint }}</span>
        </span>
        <button
          class="switch"
          :class="{ on: hideTavernUI }"
          type="button"
          role="switch"
          :aria-checked="hideTavernUI"
          @click="setHideTavernUI(!hideTavernUI)"
        >
          <span class="switch-knob"></span>
        </button>
      </label>
    </div>

    <!-- 流式美化 -->
    <div class="setting-group">
      <div class="setting-title">流式美化</div>
      <label class="switch-row">
        <span class="switch-label">
          <span class="switch-title">启用流式美化</span>
          <span class="switch-hint">{{ prettyHint }}</span>
        </span>
        <button
          class="switch"
          :class="{ on: prettyEnabled }"
          type="button"
          role="switch"
          :aria-checked="prettyEnabled"
          @click="setPrettyEnabled(!prettyEnabled)"
        >
          <span class="switch-knob"></span>
        </button>
      </label>
    </div>

    <!-- 系统心跳 -->
    <div class="setting-group">
      <div class="setting-title">系统心跳</div>
      <label class="switch-row">
        <span class="switch-label">
          <span class="switch-title">启用心跳时钟</span>
          <span class="switch-hint">关闭后电量与负载不再随心跳漂移，只随常规变量更新变化</span>
        </span>
        <button
          class="switch"
          :class="{ on: heartbeatSettings.启用 }"
          type="button"
          role="switch"
          :aria-checked="heartbeatSettings.启用"
          @click="toggleHeartbeat"
        >
          <span class="switch-knob"></span>
        </button>
      </label>
      <div class="setting-hint">
        开机状态下电量每 2 分钟下降 1%，关机后停止。CPU 与内存每 1~2 秒小幅浮动。心跳漂移平时只改变界面显示，不反复刷新变量；玩家发送消息时才把当前值一次性写进变量。
      </div>
    </div>

    <div class="setting-group">
      <div class="setting-title">角色与开场</div>
      <div class="setting-hint">局外角色库：编辑、导入导出。和终端里的角色引擎分开，不影响当前聊天。</div>
      <button class="mode-btn" type="button" @click="emit('open-library')">打开角色库</button>
    </div>

    <div class="settings-sec"><span class="settings-sec-bar"></span>额外提示词</div>
    <ExtraPromptSettings />

    <div class="settings-sec"><span class="settings-sec-bar"></span>模型</div>
    <SubmodelSettings />
    <SettingsExtras />
  </div>
</template>

<script setup lang="ts">
import ExtraPromptSettings from './ExtraPromptSettings.vue';
import SubmodelSettings from './SubmodelSettings.vue';
import SettingsExtras from './SettingsExtras.vue';
import { heartbeatSettings, saveHeartbeatSettings } from '../../界面/控制终端/heartbeat';
import {
  accentPresets,
  aspectOptions,
  currentTheme,
  customAccent,
  displayMode,
  displayModes,
  elderMode,
  fontSize,
  fontSizeOptions,
  hideTavernUI,
  phoneAspect,
  prettyEnabled,
  resetAccent,
  setCustomAccent,
  setDisplayMode,
  setElderMode,
  setFontSize,
  setHideTavernUI,
  setPhoneAspect,
  setPrettyEnabled,
  setTheme,
  setUiSize,
  themeKey,
  themePreviewStyle,
  uiSize,
  uiSizeOptions,
  visibleThemes,
  type DisplayMode,
  type PhoneAspect,
  type UiSize,
} from './settings';

withDefaults(
  defineProps<{
    /** 标题 / 副标题：操作台与外壳的措辞不同 */
    title?: string;
    sub?: string;
    /** 是否显示「显示形态 / 屏幕比例 / 界面大小 / 老年机」四项（只有外壳有） */
    showLayout?: boolean;
    hideHint?: string;
    prettyHint?: string;
  }>(),
  {
    title: '外观设置',
    sub: '为你的屏幕挑选一套风格',
    showLayout: false,
    hideHint: '隐藏原生输入栏 / 楼层头像 / 顶部栏',
    prettyHint: '关闭后回退酒馆原生正文显示，兼容特殊预设的正则',
  },
);

const emit = defineEmits<{ 'open-library': [] }>();

function toggleHeartbeat(): void {
  saveHeartbeatSettings({ 启用: !heartbeatSettings.启用 });
}
</script>

<style scoped lang="scss">
/* 间距跟随外层容器（手机与操作台 24px，PC 22px） */
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: inherit;
}

.settings-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--line);
}

.settings-head-row {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-head-ico {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-dim);
  color: var(--accent);

  svg {
    width: 17px;
    height: 17px;
    display: block;
  }
}

.settings-head-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.settings-head-tag {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--muted);
  margin-left: auto;
  align-self: center;
  flex-shrink: 0;
}

.settings-sec {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 3px;
  color: var(--text);
  padding-top: 6px;
  margin-top: 6px;
}

.settings-sec-bar {
  width: 18px;
  height: 3px;
  border-radius: 2px;
  background: var(--accent);
  opacity: 0.85;
  flex-shrink: 0;
}

.settings-title {
  font-size: 19px;
  font-weight: 800;
  letter-spacing: 1px;
}

.settings-sub {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}

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

.theme-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.theme-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--panel-2);
  border: 1.5px solid var(--line);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-family: inherit;
  color: var(--text);
}

.theme-card:hover {
  border-color: var(--line-2);
  transform: translateY(-1px);
}

.theme-card.active {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 9%, var(--panel-2));
}

.theme-preview {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid;
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding: 6px;
}

.preview-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--pd);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--pd) 22%, transparent);
}

.theme-card-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.theme-name {
  font-size: 13px;
  font-weight: 700;
}

.theme-desc {
  font-size: 10.5px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.theme-check {
  color: var(--accent);
  font-size: 14px;
  font-weight: 800;
  opacity: 0;
  transition: opacity 0.2s;
}

.theme-card.active .theme-check {
  opacity: 1;
}

.swatches {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.swatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}

.swatch-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.swatch.active .swatch-dot {
  border-color: var(--text);
  box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--text);
}

.swatch-name {
  font-size: 10px;
  color: var(--muted);
  line-height: 1;
}

.custom-color {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--muted);
}

.custom-color input[type='color'] {
  width: 34px;
  height: 26px;
  border: 1px solid var(--line-2);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  padding: 1px;
}

.link-btn {
  align-self: flex-start;
  background: transparent;
  border: none;
  border-bottom: 1px dashed var(--line-2);
  color: var(--muted);
  font-size: 11px;
  cursor: pointer;
  padding: 2px 0;
  font-family: inherit;
  transition: color 0.2s;
}

.link-btn:hover {
  color: var(--accent);
}

.size-options {
  display: flex;
  gap: 8px;
}

.size-btn {
  padding: 7px 16px;
  border-radius: 9px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.size-btn:hover {
  color: var(--text);
}

.size-btn.active {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-dim);
}

.mode-row {
  display: flex;
  gap: 8px;
}

.mode-btn {
  padding: 8px 18px;
  border-radius: 10px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.mode-btn:hover {
  color: var(--text);
}

.mode-btn.active {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-dim);
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

.font-sample {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--panel-2);
  border: 1px dashed var(--line);
  border-radius: 10px;
  color: var(--text);
  line-height: 1.4;
  word-break: break-word;
}
</style>
