<template>
  <div class="setting-group">
    <div class="setting-title">额外提示词</div>

    <div class="sub-field">
      <label class="sub-label">跟随玩家消息发送的文字（可留空）</label>
      <textarea
        v-model="extra.内容"
        class="sub-textarea"
        rows="6"
        placeholder="留空则不发送。填写后会附在变量更新告知之后，显示时被正则隐藏，只发给 AI。"
        spellcheck="false"
      ></textarea>
      <span class="setting-hint">
        发送顺序：玩家文本、变量更新告知、这段文字。它单独成段，不并入变量更新标签；显示时由正则「[隐藏]额外提示词」抹掉，提示词里保留。内容只保存在本机浏览器。
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { extraPromptSettings, saveExtraPromptSettings } from '../../界面/控制终端/extra-prompt';

const extra = extraPromptSettings;

watch(extra, () => saveExtraPromptSettings(), { deep: true });
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

.sub-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sub-label {
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.5px;
}

.sub-textarea {
  padding: 9px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--text);
  font-family: inherit;
  font-size: 12px;
  line-height: 1.6;
  resize: vertical;
}

.sub-textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.sub-textarea::placeholder {
  color: var(--muted);
  opacity: 0.7;
}

.setting-hint {
  font-size: 10.5px;
  color: var(--muted);
  line-height: 1.5;
}
</style>
