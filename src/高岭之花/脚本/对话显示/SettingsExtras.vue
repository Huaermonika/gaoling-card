<template>
  <div class="settings-extras">
    <!-- 滚动小贴士：持续横向滚动，直说「解锁主题」等信息 -->
    <div class="tips-wrap">
      <div class="tips-track">
        <div v-for="s in 2" :key="s" class="tips-seq" aria-hidden="s === 2">
          <span v-for="(t, i) in TIPS" :key="i" class="tip">
            <i class="tip-mark">✦</i>{{ t }}
          </span>
        </div>
      </div>
    </div>

    <div class="settings-sec"><span class="settings-sec-bar"></span>关于</div>

    <!-- 关于：作品 + 作者 + 发布日期 -->
    <div class="setting-group about-group">
      <div class="about-card">
        <div class="about-row">
          <span class="about-key">作品</span>
          <span class="about-val">高岭之花 · 白峰千鹤 · AN-0170A</span>
        </div>
        <div class="about-row">
          <span class="about-key">作者</span>
          <span class="about-val">Urumir · 乌璐米尔</span>
        </div>
        <div class="about-row">
          <span class="about-key">发布日期</span>
          <span class="about-val">2026年9月1日 10:00</span>
        </div>
        <div class="about-row">
          <span class="about-key">声明</span>
          <span class="about-val">作品仅免费发布于 类脑</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const TIPS = [
  '在终端输入 unlock sakura，可解锁隐藏主题',
  '在终端输入 help，可查看全部命令',
  '角色卡内置了多个开局信息哦，电脑端ui可能看起来不太明显',
  '主题与主题色均可自由切换',
  '正文字号、界面大小均可独立调节',
];
</script>

<style scoped lang="scss">
.settings-extras {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 滚动小贴士：内容重复两遍，translateX(-50%) 实现无缝循环 */
.tips-wrap {
  overflow: hidden;
  padding: 8px 0;
  border-top: 1px dashed var(--line);
  border-bottom: 1px dashed var(--line);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
}

.tips-track {
  display: flex;
  width: max-content;
  animation: tips-scroll 26s linear infinite;
  will-change: transform;
}

.tips-track:hover {
  animation-play-state: paused;
}

.tips-seq {
  display: flex;
  gap: 30px;
  padding-right: 30px;
  white-space: nowrap;
}

.tip {
  font-size: 11px;
  color: var(--muted);
}

.tip-mark {
  font-style: normal;
  color: var(--accent);
  margin-right: 5px;
}

@keyframes tips-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
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

/* 关于 */
.about-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.about-card {
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
}

.about-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 4px 0;
}

.about-key {
  flex-shrink: 0;
  width: 56px;
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 1px;
}

.about-val {
  font-size: 13px;
  color: var(--text);
}

.about-placeholder {
  color: var(--muted);
  opacity: 0.7;
}
</style>
