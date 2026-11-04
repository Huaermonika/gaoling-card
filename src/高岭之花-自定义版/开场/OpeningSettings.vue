<template>
  <div class="os-overlay">
    <header class="os-head">
      <button class="os-back" type="button" @click="emit('close')">← 返回</button>
      <b>设置</b>
    </header>

    <div class="os-body">
      <section class="os-group">
        <h3>主题</h3>
        <div class="os-themes">
          <button
            v-for="(theme, key) in visibleThemes"
            :key="key"
            class="os-theme"
            :class="{ active: themeKey === key }"
            :style="{ ...themePreviewStyle(theme), color: theme.vars['--text'] }"
            type="button"
            @click="setTheme(key)"
          >
            <span class="os-theme-swatch"></span>
            <b>{{ theme.name }}</b>
            <small :style="{ color: theme.vars['--muted'] }">{{ theme.desc }}</small>
          </button>
        </div>
      </section>

      <section class="os-group">
        <h3>主题色</h3>
        <div class="os-accents">
          <button
            v-for="item in accentPresets"
            :key="item.color"
            class="os-accent"
            :class="{ active: currentAccent === item.color }"
            :style="{ background: item.color }"
            :title="item.name"
            type="button"
            @click="setCustomAccent(item.color)"
          ></button>
        </div>
      </section>

      <section class="os-group">
        <h3>正文字号</h3>
        <div class="os-chips">
          <button
            v-for="item in fontSizeOptions"
            :key="item.value"
            class="os-chip"
            :class="{ active: fontSize === item.value }"
            type="button"
            @click="setFontSize(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </section>

      <section class="os-group">
        <h3>显示形态</h3>
        <div class="os-chips">
          <button
            v-for="item in displayModes"
            :key="item.value"
            class="os-chip"
            :class="{ active: displayMode === item.value }"
            type="button"
            @click="setDisplayMode(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
        <p class="os-hint">电脑版会换成横向布局。</p>
      </section>

      <section class="os-group">
        <h3>界面大小</h3>
        <div class="os-chips">
          <button
            v-for="item in uiSizeOptions"
            :key="item.value"
            class="os-chip"
            :class="{ active: uiSize === item.value }"
            type="button"
            @click="setUiSize(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  accentPresets,
  customAccent,
  displayMode,
  displayModes,
  fontSize,
  fontSizeOptions,
  setCustomAccent,
  setDisplayMode,
  setFontSize,
  setTheme,
  setUiSize,
  themeKey,
  themePreviewStyle,
  uiSize,
  uiSizeOptions,
  visibleThemes,
} from '../脚本/对话显示/settings';

const emit = defineEmits<{ close: [] }>();

const currentAccent = computed(() => customAccent.value);
</script>

<style lang="scss">
.os-overlay {
  position: absolute;
  inset: 0;
  z-index: 130;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--text);
}

.os-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);

  b {
    font-size: 13px;
    letter-spacing: 1px;
  }
}

.os-back {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--muted);
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
}

.os-body {
  flex: 1;
  min-height: 0;
  padding: 14px 16px 30px;
  overflow-y: auto;
}

.os-group {
  margin-bottom: 18px;

  h3 {
    margin: 0 0 8px;
    color: var(--muted);
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 2px;
  }
}

.os-themes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.os-theme {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel);
  color: var(--text);
  font-family: inherit;
  text-align: left;
  cursor: pointer;

  &.active {
    border-color: var(--accent);
  }

  b {
    font-size: 11.5px;
    font-weight: 600;
  }

  small {
    color: var(--muted);
    font-size: 9px;
  }
}

.os-theme-swatch {
  width: 100%;
  height: 18px;
  margin-bottom: 4px;
  border-radius: 5px;
  background: linear-gradient(135deg, var(--pd), transparent);
}

.os-accents {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.os-accent {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;

  &.active {
    border-color: var(--text);
  }
}

.os-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.os-chip {
  padding: 6px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--panel);
  color: var(--muted);
  font-family: inherit;
  font-size: 10.5px;
  cursor: pointer;

  &.active {
    border-color: var(--accent);
    color: var(--accent);
  }
}

.os-hint {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 9.5px;
}
</style>
