<!--
  高岭之花 · 前端美化（单文件导出）

  覆盖范围：对话外壳（手机 / PC）+ 气泡 + 终端状态同步卡片 + 外观设置
            + 控制终端六面板（状态 / 认知 / 记忆 / 躯体参数 / 指令 / 系统）。

  这份文件是「可视化改稿底稿」：数据是一份静态快照（见 <script> 里的 store），
  样式全部是编译后的普通 CSS，作用域靠类名前缀（.fe-app / .fe-status / ...）实现。
  改完把 <template> / <style> 交回即可，不需要动真实运行时的逻辑。

  预览：同目录的 前端美化.html 用浏览器直接打开即可，与本文件同源。
-->
<template>
<div class="fe-stage">
<div class="fe-demo">
  <!-- 预览工具条：只为查看两种形态，整合时整段删除 -->
  <b>前端美化预览</b>
  <button type="button" :class="{ on: displayMode === 'mobile' }" @click="setDisplayMode('mobile')">手机</button>
  <button type="button" :class="{ on: displayMode === 'desktop' }" @click="setDisplayMode('desktop')">PC</button>
  <button type="button" :class="{ on: displayMode === 'auto' }" @click="setDisplayMode('auto')">自适应</button>
  <span>窗口窄于 820px 时自适应会切到手机形态 · 面板里的控件可以直接点</span>
</div>
<div class="fe-app">
  <div class="phone" :class="{ mobile: isMobile, desktop: !isMobile, elder: elderMode }" :style="phoneVars">
    <!-- 环境氛围光斑（降低空荡感） -->
    <div class="phone-deco" aria-hidden="true">
      <span class="deco-blob deco-a"></span>
      <span class="deco-blob deco-b"></span>
      <span class="deco-blob deco-c"></span>
    </div>

    <!-- ==================== 手机形态 ==================== -->
    <template v-if="isMobile">
    <main class="phone-screen">
      <!-- ========== 对话视图 ========== -->
      <div v-if="view === 'chat'" class="view chat-view">
        <div class="chat-head">
          <div class="avatar" :class="stateClass">
            <img v-if="avatarSrc" class="avatar-img" :src="avatarSrc" alt="" />
            <span v-else class="avatar-char">千</span>
          </div>
          <div class="chat-head-info">
            <div class="chat-name">白峰千鹤</div>
            <div class="chat-sub">
              <span class="sub-dot" :class="stateClass"></span>
              <span>{{ statusText }}</span>
            </div>
          </div>
          <div class="chat-time">{{ timeText }}</div>
        </div>

        <div class="chat-body">
          <div class="chat-scroll">
            <div class="chat-label">
              <span class="label-line"></span>
              <span>来自千鹤 · 新消息</span>
              <span class="label-line"></span>
            </div>
            <div class="chat-bubble" v-html="dialogHtml"></div>
            <div class="ch-sync-card open">
              <button type="button" class="ch-sync-head">
                <span class="ch-sync-title">⚙ 终端状态已同步</span>
                <span class="ch-sync-badge">3 项变更</span>
                <span class="ch-sync-arrow">▾</span>
              </button>
              <div class="ch-sync-body">
                <div class="ch-sync-item"><span class="ch-sync-field">敏感度</span><span class="ch-sync-op">→</span><span class="ch-sync-val">34</span></div>
                <div class="ch-sync-item"><span class="ch-sync-field">快感值</span><span class="ch-sync-op">→</span><span class="ch-sync-val">18</span></div>
                <div class="ch-sync-item"><span class="ch-sync-field">好感度</span><span class="ch-sync-op">→</span><span class="ch-sync-val">42</span></div>
              </div>
            </div>
          </div>
          <form class="chat-compose" @submit.prevent="sendChat">
            <input v-model="chatInput" type="text" placeholder="输入要发送的话…" autocomplete="off" />
            <button type="submit" :disabled="sending || !chatInput.trim()">发送</button>
          </form>
          <div class="chat-foot">
            <span class="foot-dot"></span>
            <span>message encrypted · an-0170a</span>
          </div>
        </div>
      </div>

      <!-- ========== APP 控制终端视图 ========== -->
      <div v-else-if="view === 'app'" class="view app-view">
        <header class="app-head">
          <div class="app-head-row">
            <div class="app-brand">
              <span class="app-logo" :class="stateClass">◈</span>
              <div class="app-brand-text">
                <div class="app-name">白峰千鹤</div>
                <div class="app-model">AN-0170A · 控制终端</div>
              </div>
            </div>
            <span class="app-state" :class="stateClass">{{ store.data.千鹤.意识状态 }}</span>
          </div>
          <div class="app-meta">
            <div class="meta-cell">
              <span class="meta-label">电量</span>
              <span class="meta-value">{{ hbBattery(store.data.千鹤.电量) }}%</span>
              <span class="meta-bar"><i :style="{ width: hbBattery(store.data.千鹤.电量) + '%' }"></i></span>
            </div>
            <div class="meta-cell">
              <span class="meta-label">好感度</span>
              <span class="meta-value">{{ store.data.千鹤.好感度 }}</span>
              <span class="meta-bar amber"><i :style="{ width: store.data.千鹤.好感度 + '%' }"></i></span>
            </div>
            <div class="meta-cell">
              <span class="meta-label">系统时间</span>
              <span class="meta-value mono">{{ timeText }}</span>
              <span class="meta-bar"><i style="width: 100%"></i></span>
            </div>
          </div>
        </header>

        <div class="app-panel">
          <button class="status-update" type="button" :disabled="sending" @click="sendStatusUpdate">
            {{ sending ? '正在更新…' : '更新状态' }}
          </button>
          <div v-if="active_tab === '状态'" class="pane"><div class="panel fe-status">
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2-6 4 12 2-6h6" /></svg></span>
        <span class="panel-title">状态总览</span>
      </div>
      <span class="panel-tag">OVERVIEW</span>
    </div>
    <p class="panel-desc">千鹤当前的整体运行概况</p>

    <!-- 核心状态 -->
    <div class="core-row">
      <div class="core-cell" :class="awareClass">
        <span class="core-label">意识状态</span>
        <span class="core-value">{{ store.data.千鹤.意识状态 }}</span>
        <span class="core-dot"></span>
      </div>
      <div class="core-cell" :class="sysClass">
        <span class="core-label">系统状态</span>
        <span class="core-value">{{ store.data.千鹤.系统状态 }}</span>
        <span class="core-dot"></span>
      </div>
    </div>

    <!-- 关键指标 -->
    <div class="metric-grid">
      <div class="metric">
        <span class="metric-label">电量</span>
        <span class="metric-num">{{ hbBattery(store.data.千鹤.电量) }}<i>%</i></span>
        <span class="metric-bar"><i :style="{ width: hbBattery(store.data.千鹤.电量) + '%' }"></i></span>
      </div>
      <div class="metric">
        <span class="metric-label">好感度</span>
        <span class="metric-num">{{ store.data.千鹤.好感度 }}<i>/100</i></span>
        <span class="metric-bar amber"><i :style="{ width: store.data.千鹤.好感度 + '%' }"></i></span>
        <span class="metric-stage">{{ stageLabel }}</span>
      </div>
      <div class="metric">
        <span class="metric-label">敏感度</span>
        <span class="metric-num">{{ store.data.千鹤.敏感度 }}</span>
        <span class="metric-bar blue"><i :style="{ width: store.data.千鹤.敏感度 + '%' }"></i></span>
      </div>
      <div class="metric">
        <span class="metric-label">快感值</span>
        <span class="metric-num">{{ store.data.千鹤.快感值 }}</span>
        <span class="metric-bar red"><i :style="{ width: store.data.千鹤.快感值 + '%' }"></i></span>
      </div>
      <div class="metric">
        <span class="metric-label">CPU 使用率</span>
        <span class="metric-num">{{ hbCpu(store.data.千鹤.cpu使用率) }}<i>%</i></span>
        <span class="metric-bar blue"><i :style="{ width: hbCpu(store.data.千鹤.cpu使用率) + '%' }"></i></span>
      </div>
      <div class="metric">
        <span class="metric-label">RAM 使用率</span>
        <span class="metric-num">{{ hbRam(store.data.千鹤.内存使用率) }}<i>%</i></span>
        <span class="metric-bar purple"><i :style="{ width: hbRam(store.data.千鹤.内存使用率) + '%' }"></i></span>
      </div>
    </div>

    <!-- 环境 -->
    <div class="env-row">
      <span class="env-item"><span class="env-ico">◷</span>{{ store.data.世界.当前时间 }}</span>
      <span class="env-item"><span class="env-ico">⌖</span>{{ store.data.世界.当前地点 }}</span>
    </div>

    <!-- 认知摘要 -->
    <div class="cog-summary">
      <div class="cog-summary-head">
        <span class="cog-tag">认知</span>
        <span class="cog-self" :class="{ off: !store.data.千鹤.认知自洽 }">
          {{ store.data.千鹤.认知自洽 ? '自洽·开' : '自洽·关' }}
        </span>
      </div>
      <div class="cog-dim-row">
        <span class="cog-dim-key">身份</span>
        <span class="cog-text">{{ store.data.千鹤.身份认知 }}</span>
      </div>
      <div class="cog-dim-row">
        <span class="cog-dim-key">身体</span>
        <span class="cog-text">{{ store.data.千鹤.身体认知 }}</span>
      </div>
      <div class="cog-dim-row">
        <span class="cog-dim-key">处境</span>
        <span class="cog-text">{{ store.data.千鹤.处境认知 }}</span>
      </div>
      <div class="cog-dim-row">
        <span class="cog-dim-key">常识</span>
        <span class="cog-text">{{ store.data.千鹤.常识认知 }}</span>
      </div>
    </div>

    <!-- 运行概况 -->
    <div class="overview-row">
      <div class="ov-item">
        <span class="ov-num">{{ abnormalCount }}</span>
        <span class="ov-label">躯体异常</span>
      </div>
      <div class="ov-item">
        <span class="ov-num">{{ cmdCount }}</span>
        <span class="ov-label">覆盖指令</span>
      </div>
      <div class="ov-item">
        <span class="ov-num">{{ memCount }}</span>
        <span class="ov-label">记忆条</span>
      </div>
      <div class="ov-item">
        <span class="ov-num">{{ bugCount }}</span>
        <span class="ov-label">Bug</span>
      </div>
    </div>

    <!-- 机体总览 + 液体储备（左右并排） -->
    <div class="body-cols">
      <div class="body-col">
        <div class="panel-head sub body-thumb-head">
          <div class="panel-head-left">
            <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="3.4" /><path d="M5 21c.7-4.8 3.2-7 7-7s6.3 2.2 7 7" /></svg></span>
            <span class="panel-title">机体总览</span>
          </div>
          <span class="panel-tag">BODY</span>
        </div>
        <div class="body-thumb-wrap">
          <svg class="body-thumb-svg" viewBox="0 0 1672 2508" preserveAspectRatio="xMidYMid meet" role="img" aria-label="机体总览缩略图">
            <g class="shell-layer"></g>
            <g class="segs-layer"></g>
            <g class="iparts-layer"></g>
          </svg>
        </div>
      </div>

      <div class="body-col">
        <div class="panel-head sub body-fluid-head">
          <div class="panel-head-left">
            <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" /></svg></span>
            <span class="panel-title">液体储备</span>
          </div>
          <span class="panel-tag">FLUID</span>
        </div>
        <div class="body-fluid-wrap">
          <div class="fluid-gauges-c">
            <div class="fluid-gauge">
              <span class="fg-track"><i :style="{ height: (store.data.千鹤.冷却液 || 0) + '%' }"></i></span>
              <b class="fg-val">{{ store.data.千鹤.冷却液 }}%</b>
              <span class="fg-label">冷却液</span>
            </div>
            <div class="fluid-gauge pink">
              <span class="fg-track"><i :style="{ height: (store.data.千鹤.爱液 || 0) + '%' }"></i></span>
              <b class="fg-val">{{ store.data.千鹤.爱液 }}%</b>
              <span class="fg-label">爱液</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 电源控制 -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v8" /><path d="M18.4 6.6a8 8 0 1 1-12.8 0" /></svg></span>
        <span class="panel-title">电源控制</span>
      </div>
      <span class="panel-tag">POWER</span>
    </div>
    <div class="power-seg">
      <button
        v-for="p in powerStates"
        :key="p"
        class="power-opt"
        :class="{ active: store.data.千鹤.电源状态 === p }"
        type="button"
        :disabled="uiState.rebooting"
        @click="setPower(p)"
      >
        {{ p }}
      </button>
      <span class="power-thumb" :class="'thumb-' + powerIndex"></span>
    </div>
    <div class="power-actions">
      <button
        class="reboot-btn"
        type="button"
        :disabled="uiState.rebooting || store.data.千鹤.电源状态 === '关机'"
        @click="reboot"
      >
        <span class="reboot-ico" :class="{ spin: uiState.rebooting }">⟳</span>
        <span>{{ uiState.rebooting ? '重启中…' : '重启' }}</span>
      </button>
      <span v-if="store.data.千鹤.电源状态 === '关机'" class="power-hint">电源已关闭 · 终端指令已失效</span>
    </div>
  </div>
</div>
          <div v-else-if="active_tab === '认知'" class="pane"><div class="panel fe-cognition">
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.4" /><path d="M12 2v3" /><path d="M12 19v3" /><path d="M4.9 4.9l2.1 2.1" /><path d="M17 17l2.1 2.1" /><path d="M2 12h3" /><path d="M19 12h3" /><path d="M4.9 19.1 7 17" /><path d="M17 7l2.1-2.1" /></svg></span>
        <span class="panel-title">认知模块</span>
      </div>
      <span class="panel-tag">COGNITION</span>
    </div>
    <p class="panel-desc">人格状态 · 认知 · 性格 的统合控制</p>

    <!-- 人格三态 -->
    <div class="state-list">
      <button
        v-for="s in states"
        :key="s.id"
        class="state-btn"
        :class="[s.id, { active: store.data.千鹤.意识状态 === s.id }]"
        type="button"
        @click="setState(s.id)"
      >
        <span class="state-icon">{{ s.icon }}</span>
        <span class="state-text">
          <span class="state-label">{{ s.label }}</span>
          <span class="state-desc">{{ s.desc }}</span>
        </span>
        <span class="state-check">✓</span>
      </button>
    </div>

    <div class="divider"></div>

    <!-- 好感度 -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.6-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.4-9 9-9 9Z" /></svg></span>
        <span class="panel-title">好感度</span>
      </div>
      <span class="panel-tag">AFFECTION</span>
    </div>
    <div class="affection">
      <div class="affection-track">
        <div class="affection-fill" :style="{ width: store.data.千鹤.好感度 + '%' }"></div>
      </div>
      <div class="affection-row">
        <span class="affection-value">{{ store.data.千鹤.好感度 }}</span>
        <span class="affection-stage">{{ stageLabel }}</span>
      </div>
      <input
        v-model.number="store.data.千鹤.好感度"
        class="affection-slider"
        type="range"
        min="0"
        max="100"
        step="1"
      />
      <div class="affection-scale">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>

    <div class="divider"></div>

    <!-- 性格写入 -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.4 5.7 6.1.5-4.6 4 1.4 6-5.3-3.2-5.3 3.2 1.4-6-4.6-4 6.1-.5Z" /></svg></span>
        <span class="panel-title">性格写入</span>
      </div>
      <span class="panel-tag">PERSONA</span>
    </div>
    <textarea
      v-model="personaDraft"
      class="cog-input"
      rows="2"
      placeholder="输入新的性格设定，例如：冷面娇柔的优等生……"
    ></textarea>
    <button class="btn primary" type="button" @click="applyPersona">写入性格</button>
    <div class="cog-current">
      <span class="cog-label">● 当前性格</span>
      <span class="cog-text">{{ store.data.千鹤.性格 }}</span>
    </div>

    <div class="divider"></div>

    <!-- 认知写入 -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a2.5 2.5 0 0 0-2.5 2.5c0 1-.5 1.5-1.5 1.5H3v12h18V7h-5c-1 0-1.5-.5-1.5-1.5A2.5 2.5 0 0 0 12 3Z" /></svg></span>
        <span class="panel-title">认知写入</span>
      </div>
      <span class="panel-tag">REALITY</span>
    </div>

    <!-- 认知自洽开关 -->
    <div class="cog-switch-row">
      <div class="cog-switch-info">
        <span class="cog-switch-label">认知自洽维护</span>
        <span class="cog-switch-desc">自动抹平与当前认知冲突的细节</span>
      </div>
      <button
        class="switch"
        :class="{ on: store.data.千鹤.认知自洽 }"
        type="button"
        @click="toggleCogSelf"
      >
        <i></i>
      </button>
    </div>

    <!-- 四维度认知 -->
    <div v-for="dim in cogDims" :key="dim.key" class="cog-dim">
      <span class="cog-dim-label">{{ dim.label }}</span>
      <textarea
        v-model="cogDrafts[dim.key]"
        class="cog-input"
        rows="2"
        :placeholder="dim.ph"
      ></textarea>
      <div v-if="dim.presets.length" class="cog-presets">
        <button
          v-for="p in dim.presets"
          :key="p.label"
          class="cog-preset-btn"
          :class="{ active: store.data.千鹤[dim.key] === p.value }"
          type="button"
          @click="applyPreset(dim.key, p.value)"
        >
          {{ p.label }}
        </button>
      </div>
      <div class="cog-current">
        <span class="cog-label">● 当前{{ dim.label }}</span>
        <span class="cog-text">{{ store.data.千鹤[dim.key] }}</span>
      </div>
    </div>

    <div class="cog-actions">
      <button class="btn primary" type="button" @click="applyCog">写入认知</button>
      <button class="btn ghost" type="button" @click="resetCog">恢复正常</button>
    </div>
  </div>
</div>
          <div v-else-if="active_tab === '记忆'" class="pane"><div class="panel fe-memory">
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" /><path d="M9 8h7" /><path d="M9 12h7" /><path d="M9 16h4" /></svg></span>
        <span class="panel-title">记忆</span>
      </div>
      <span class="panel-tag">MEMORY</span>
    </div>
    <p class="panel-desc">删除的记忆可由系统自动填补 · 修改过的记忆带「修改」标记</p>

    <button
      v-if="!adding"
      class="btn primary sm"
      type="button"
      @click="startAdd"
    >
      ＋ 新增记忆
    </button>

    <div v-if="adding" class="add-box">
      <input v-model="newEntry.时间" class="add-input" type="text" placeholder="YYYY-MM-DD HH:MM" />
      <textarea v-model="newEntry.事件" class="edit-area" rows="2" placeholder="记忆内容"></textarea>
      <div class="edit-actions">
        <button class="btn primary sm" type="button" @click="addMemory">保存</button>
        <button class="btn ghost sm" type="button" @click="cancelAdd">取消</button>
      </div>
    </div>

    <p v-if="error" class="mem-error">{{ error }}</p>

    <div v-if="memoryLog.length" class="memory-list">
      <div v-for="(entry, i) in memoryLog" :key="entry.时间 + '|' + i" class="memory-item">
        <span class="memory-time">{{ formatDate(entry.时间) }}</span>
        <span v-if="filledTags.includes(tagOf(entry))" class="mem-tag tag-fill">填补</span>
        <span v-if="editedTags.includes(tagOf(entry))" class="mem-tag tag-edit">修改</span>
        <div class="memory-main">
          <template v-if="editingIndex === i">
            <input v-model="editDraft.时间" class="add-input" type="text" placeholder="YYYY-MM-DD HH:MM" />
            <textarea v-model="editDraft.事件" class="edit-area" rows="2"></textarea>
            <div class="edit-actions">
              <button class="btn primary sm" type="button" @click="saveEdit(i)">保存</button>
              <button class="btn ghost sm" type="button" @click="editingIndex = null">取消</button>
            </div>
          </template>
          <span v-else class="memory-event">{{ entry.事件 }}</span>
        </div>
        <div class="memory-ops">
          <button class="op-btn" type="button" title="修改这条记忆" @click="startEdit(i)">✎</button>
          <button class="op-btn del" type="button" title="删除这条记忆" @click="removeMemory(i)">✕</button>
        </div>
      </div>
    </div>
    <div v-else class="memory-empty">
      <span class="memory-empty-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" /><path d="M9 8h7" /><path d="M9 12h7" /><path d="M9 16h4" /></svg></span>
      <span class="memory-empty-title">记忆日志为空</span>
      <span class="memory-empty-hint">与千鹤的互动会沉淀为记忆条目，显示在这里</span>
    </div>

    <!-- 待填补区 -->
    <div v-if="deletedLog.length" class="gap-section">
      <div class="gap-head">
        <span class="gap-title">记忆缺失 · 待填补</span>
        <span class="gap-count">{{ deletedLog.length }} 段</span>
      </div>
      <div v-for="(g, i) in deletedLog" :key="g.时间 + '|' + i" class="gap-item">
        <span class="gap-time">{{ formatDate(g.时间) }}</span>
        <span class="gap-content">{{ g.事件 }}</span>
        <button class="btn primary sm" type="button" @click="fillGap(i)">自动填补</button>
      </div>
    </div>

    <button
      v-if="memoryLog.length"
      class="btn danger"
      type="button"
      @click="clearMemory"
    >
      清空全部记忆
    </button>
  </div>
</div>
          <div v-else-if="active_tab === '躯体参数'" class="pane"><div class="panel fe-body">
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="3.4" /><path d="M5 21c.7-4.8 3.2-7 7-7s6.3 2.2 7 7" /></svg></span>
        <span class="panel-title">躯体参数</span>
      </div>
      <span class="panel-tag">PHYSIQUE</span>
    </div>
    <p class="panel-desc">数值修改 · 身体锁定 · 实际着装</p>

    <!-- ===== 数值修改 ===== -->
    <div class="panel-head sub">
      <div class="panel-head-left">
        <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9c2-2 4 2 6 0s4 2 6 0" /><path d="M4 15c2-2 4 2 6 0s4 2 6 0" /></svg></span>
        <span class="panel-title">数值修改</span>
      </div>
      <span class="panel-tag">SENSITIVITY</span>
    </div>

    <div class="sense-value">
      <span class="sense-number">{{ store.data.千鹤.敏感度 }}</span>
      <span class="sense-level" :class="levelClass">{{ levelLabel }}</span>
    </div>
    <input
      v-model.number="store.data.千鹤.敏感度"
      class="sense-slider"
      type="range"
      min="1"
      max="100"
      step="1"
    />
    <div class="sense-scale">
      <span>1</span>
      <span>25</span>
      <span>50</span>
      <span>75</span>
      <span>100</span>
    </div>
    <div class="sense-input-row">
      <span class="sense-input-label">精确值（可超 100）</span>
      <input
        v-model.number="store.data.千鹤.敏感度"
        class="sense-input"
        type="number"
        min="1"
        step="1"
      />
    </div>
    <div class="sense-tip">
      <span class="tip-dot"></span>
      数值越高，身体对外界触碰的触觉反馈越强烈
    </div>

    <div class="sense-value">
      <span class="sense-number">{{ store.data.千鹤.快感值 }}</span>
      <span class="sense-level" :class="pleasureClass">{{ pleasureLabel }}</span>
    </div>
    <input
      v-model.number="store.data.千鹤.快感值"
      class="sense-slider"
      type="range"
      min="0"
      max="100"
      step="1"
    />
    <div class="sense-scale">
      <span>0</span>
      <span>25</span>
      <span>50</span>
      <span>75</span>
      <span>100</span>
    </div>
    <div class="sense-input-row">
      <span class="sense-input-label">精确值（上限 120）</span>
      <input
        v-model.number="store.data.千鹤.快感值"
        class="sense-input"
        type="number"
        min="0"
        max="120"
        step="1"
      />
    </div>
    <div class="pleasure-actions">
      <button class="btn danger" type="button" @click="forceClimax">强制高潮 (1F4)</button>
      <button class="btn ghost" type="button" @click="store.data.千鹤.快感值 = 0">归零</button>
    </div>

    <div class="divider"></div>

    <!-- ===== 身体锁定 ===== -->
    <div class="panel-head sub">
      <div class="panel-head-left">
        <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="11" width="15" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /><path d="M12 15v2" /></svg></span>
        <span class="panel-title">身体锁定</span>
      </div>
      <span class="panel-tag">LOCK</span>
    </div>
    <p class="panel-desc sub-desc">锁定后千鹤将无法自主移动该部位</p>
    <div class="lock-grid">
      <button
        v-for="part in bodyParts"
        :key="part"
        class="lock-btn"
        :class="{ locked: isBodyLocked(part) }"
        type="button"
        @click="toggleBodyLock(part)"
      >
        <span class="lock-dot"></span>
        <span class="lock-name">{{ part }}</span>
        <span class="lock-state">{{ isBodyLocked(part) ? '已锁定' : '未锁定' }}</span>
      </button>
    </div>

    <div class="divider"></div>

    <!-- ===== 力量限制器 ===== -->
    <div class="panel-head sub">
      <div class="panel-head-left">
        <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 5 13h6l-1 9 9-12h-6l1-8Z" /></svg></span>
        <span class="panel-title">力量限制器</span>
      </div>
      <span class="panel-tag">LIMITER</span>
    </div>
    <div class="limiter-row" :class="{ released: !store.data.千鹤.力量限制器 }">
      <div class="limiter-info">
        <span class="limiter-label">{{ store.data.千鹤.力量限制器 ? '出力限制中' : '已解除出力限制' }}</span>
        <span class="limiter-desc">
          {{ store.data.千鹤.力量限制器 ? '千鹤的力量输出被限制在安全阈值内' : '全部出力限制已解除，可发挥完整力量' }}
        </span>
      </div>
      <button
        class="switch"
        :class="{ on: !store.data.千鹤.力量限制器 }"
        type="button"
        @click="store.data.千鹤.力量限制器 = !store.data.千鹤.力量限制器"
      >
        <i></i>
      </button>
    </div>

    <div class="divider"></div>

    <!-- ===== 维护与结构 ===== -->
    <div class="panel-head sub">
      <div class="panel-head-left">
        <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg></span>
        <span class="panel-title">维护与结构</span>
      </div>
      <span class="panel-tag">MAINTENANCE</span>
    </div>

    <div class="limiter-row" :class="{ released: store.data.千鹤.性单元 === '弹出' }">
      <div class="limiter-info">
        <span class="limiter-label">性单元</span>
        <span class="limiter-desc">
          {{ store.data.千鹤.性单元 === '弹出' ? '已从下方弹出，露出生殖模块' : '收纳中，外观看不出异常' }}
        </span>
      </div>
      <button
        class="switch"
        :class="{ on: store.data.千鹤.性单元 === '弹出' }"
        type="button"
        @click="toggleSexUnit"
      >
        <i></i>
      </button>
    </div>

    <div class="limiter-row" :class="{ released: store.data.千鹤.维护模式 }">
      <div class="limiter-info">
        <span class="limiter-label">维护模式</span>
        <span class="limiter-desc">
          {{ store.data.千鹤.维护模式 ? '已开启，人格已关闭（调试/维护）' : '已关闭，人格正常运行' }}
        </span>
      </div>
      <button
        class="switch"
        :class="{ on: store.data.千鹤.维护模式 }"
        type="button"
        @click="toggleMaintenance"
      >
        <i></i>
      </button>
    </div>

    <div class="limiter-row">
      <div class="limiter-info">
        <span class="limiter-label">维护舱门</span>
        <span class="limiter-desc">电子脑 · 胸部 · 腹部 三处舱门，打开露出维护接口与内部结构</span>
      </div>
      <div class="hatch-switches">
        <button
          class="hatch-btn"
          :class="{ on: store.data.千鹤.维护舱门.电子脑 }"
          type="button"
          title="电子脑维护舱门"
          @click="toggleHatch('电子脑')"
        >
          脑
        </button>
        <button
          class="hatch-btn"
          :class="{ on: store.data.千鹤.维护舱门.胸部 }"
          type="button"
          @click="toggleHatch('胸部')"
        >
          胸
        </button>
        <button
          class="hatch-btn"
          :class="{ on: store.data.千鹤.维护舱门.腹部 }"
          type="button"
          @click="toggleHatch('腹部')"
        >
          腹
        </button>
      </div>
    </div>

    <div class="divider"></div>

    <!-- ===== 实际着装（折叠） ===== -->
    <div class="panel-head sub fold-head" role="button" tabindex="0" @click="outfitOpen = !outfitOpen" @keydown.enter="outfitOpen = !outfitOpen">
      <div class="panel-head-left">
        <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a2.5 2.5 0 0 0-2.5 2.5c0 1-.5 1.5-1.5 1.5H3v12h18V7h-5c-1 0-1.5-.5-1.5-1.5A2.5 2.5 0 0 0 12 3Z" /></svg></span>
        <span class="panel-title">实际着装</span>
        <span class="fold-badge">{{ outfitCount }} 件</span>
      </div>
      <span class="fold-arrow" :class="{ open: outfitOpen }">⌄</span>
    </div>
    <div v-if="outfitOpen" class="fold-body">
      <div v-if="!_.isEmpty(store.data.千鹤.实际着装)" class="outfit-list">
        <div v-for="(desc, slot) in store.data.千鹤.实际着装" :key="slot" class="outfit-item">
          <span class="outfit-slot">{{ slot }}</span>
          <span class="outfit-desc">{{ desc }}</span>
        </div>
      </div>
      <div v-else class="outfit-empty">暂无着装记录</div>
    </div>

    <div class="divider"></div>

    <!-- ===== 机体结构图（人体图融合） ===== -->
    <div class="panel-head sub">
      <div class="panel-head-left">
        <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="3.4" /><path d="M5 21c.7-4.8 3.2-7 7-7s6.3 2.2 7 7" /></svg></span>
        <span class="panel-title">机体结构图</span>
      </div>
      <span class="panel-tag">BODY MAP</span>
    </div>
    <div class="body-wrap">
      <div class="body-tools">
        <button type="button" class="layer-quick-btn" :class="{ active: bodyLayer === 1 }" @click="bodySetLayer(1)">L1</button>
        <button type="button" class="layer-quick-btn" :class="{ active: bodyLayer === 2 }" @click="bodySetLayer(2)">L2</button>
        <button type="button" class="layer-quick-btn" :class="{ active: bodyLayer === 3 }" @click="bodySetLayer(3)">L3</button>
        <button type="button" class="layer-quick-btn" :class="{ active: bodyShowIparts }" title="显示/隐藏内部部件" @click="bodyToggleIparts">部件</button>
        <button type="button" class="body-tool-btn" @click="bodyZoomOut">−</button>
        <span class="body-pct">{{ Math.round(bodyZoom * 100) }}%</span>
        <button type="button" class="body-tool-btn" @click="bodyZoomIn">＋</button>
        <button type="button" class="body-tool-btn" @click="bodyReset">复位</button>
      </div>
      <svg ref="bodySvgEl" class="body-svg" viewBox="0 0 1672 2508" preserveAspectRatio="xMidYMid meet" role="img" aria-label="机体结构图">
        <g class="shell-layer"></g>
        <g class="segs-layer"></g>
        <g class="iparts-layer"></g>
      </svg>
      <div class="body-legend">
        <span class="legend-item"><i class="dot dot-完好"></i>完好</span>
        <span class="legend-item"><i class="dot dot-受损"></i>受损</span>
        <span class="legend-item"><i class="dot dot-损毁"></i>损毁</span>
        <span class="legend-item"><i class="dot dot-拆除"></i>拆除</span>
        <span class="legend-item"><i class="dot dot-module"></i>内部部件</span>
      </div>
      <div v-if="bodyDetailText" class="body-detail">
        <span class="body-detail-text">{{ bodyDetailText }}</span>
        <template v-if="bodySelected && bodySelected.type === 'seg' && segLockInfo(bodySelected.seg)">
          <button
            class="btn ghost sm"
            type="button"
            @click="bodyToggleLockFromSeg(bodySelected.seg)"
          >{{ isBodyLocked(segLockInfo(bodySelected.seg)) ? '解锁' : '锁定' }} {{ segLockInfo(bodySelected.seg) }}</button>
        </template>
      </div>
      <div v-else class="body-detail hint-only">
        <span class="body-detail-hint">点击机体段或内部部件查看详情；点「脑/胸/腹」舱门或身体锁定按钮可联动高亮</span>
      </div>
    </div>
  </div>
</div>
          <div v-else-if="active_tab === '指令'" class="pane"><div class="panel fe-command">
    <!-- ===== 指令覆盖 ===== -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 8 4 4-4 4" /><path d="M13 16h5" /></svg></span>
        <span class="panel-title">指令覆盖</span>
      </div>
      <span class="panel-tag">OVERRIDE</span>
    </div>
    <p class="panel-desc">优先级 0 为最高；冲突时优先执行高优先级指令，同级指令可并行执行</p>

    <div class="cmd-list">
      <div v-for="entry in sortedCmds" :key="entry.id" class="cmd-item">
        <span class="cmd-id">{{ entry.id }}</span>
        <span class="cmd-pri" :class="{ high: entry.priority === 0 }">P{{ entry.priority }}</span>
        <span class="cmd-content">{{ entry.content }}</span>
        <button class="cmd-del" type="button" title="删除这条指令" @click="removeCmd(entry.id)">✕</button>
      </div>
      <div v-if="!hasCommands" class="cmd-empty">
        <span class="cmd-empty-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m7 8 4 4-4 4" /><path d="M13 16h5" /></svg></span>
        <span class="cmd-empty-title">当前没有覆盖指令</span>
        <span class="cmd-empty-hint">在下方添加指令，可临时覆盖千鹤的行为</span>
      </div>
    </div>

    <div class="cmd-add">
      <div class="cmd-add-row">
        <input v-model="newId" class="cmd-input id" placeholder="编号，如 0E4" />
        <input
          v-model.number="newPriority"
          class="cmd-input pri"
          type="number"
          min="0"
          max="9"
          step="1"
          placeholder="P"
          title="优先级，0 最高"
        />
      </div>
      <textarea
        v-model="newContent"
        class="cmd-input cmd-area"
        rows="2"
        placeholder="覆盖指令内容，如：让她以为自己还穿着衣服"
      ></textarea>
      <button class="btn primary" type="button" :disabled="powerOff" @click="addCmd">写入覆盖指令</button>
    </div>
    <p v-if="powerOff" class="power-off-hint">⚠ 电源已关闭，指令功能已失效</p>

    <div class="divider"></div>

    <!-- ===== 命令库终端 ===== -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 9 5-5 5 5" /><path d="M7 15l5 5 5-5" /></svg></span>
        <span class="panel-title">命令库终端</span>
      </div>
      <div class="panel-head-right">
        <button
          class="lang-toggle"
          type="button"
          :title="uiState.termLang === 'zh' ? '切换为英文' : '切换为中文'"
          @click="toggleTermLang"
        >
          {{ uiState.termLang === 'zh' ? '中' : 'EN' }}
        </button>
        <span class="panel-tag">CMD LIB</span>
      </div>
    </div>
    <p class="panel-desc">输入指令由终端解析并执行 · 输入 help 查看全部命令</p>

    <div class="term-window">
      <div class="term-body">
        <div v-if="uiState.rebooting" class="term-boot">
          <span class="boot-spinner"></span>
          <span class="boot-text">rebooting unit…</span>
          <span class="boot-bar"><i></i></span>
        </div>
        <template v-else>
          <div v-for="(line, i) in termLines" :key="i" class="term-line" :class="line.kind">
            <span v-if="line.kind === 'in'" class="term-prompt">></span>
            <span v-else-if="line.kind === 'err'" class="term-prompt">!</span>
            <span v-else-if="line.kind === 'sys'" class="term-prompt">#</span>
            <span class="term-text">{{ line.text }}</span>
          </div>
          <div class="term-input-row">
            <span class="term-prompt">></span>
            <input
              v-model="termInput"
              class="term-input"
              :disabled="powerOff"
              placeholder="type a command… (help)"
              spellcheck="false"
              @keydown.enter="runTerm"
            />
            <button
              class="term-run-btn"
              type="button"
              :disabled="powerOff"
              title="执行命令（回车）"
              @click="runTerm"
            >
              ➤
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</div>
          <div v-else-if="active_tab === '系统'" class="pane"><div class="panel fe-system">
    <!-- ===== 系统状态 ===== -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg></span>
        <span class="panel-title">系统状态</span>
      </div>
      <span class="panel-tag">SYSTEM</span>
    </div>
    <div class="sys-status">
      <span class="sys-state" :class="sysStateClass">{{ store.data.千鹤.系统状态 }}</span>
      <span v-if="store.data.千鹤.崩溃原因" class="sys-cause">{{ store.data.千鹤.崩溃原因 }}</span>
    </div>

    <!-- ===== 系统信息 ===== -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a2.5 2.5 0 0 0-2.5 2.5c0 1-.5 1.5-1.5 1.5H3v12h18V7h-5c-1 0-1.5-.5-1.5-1.5A2.5 2.5 0 0 0 12 3Z" /></svg></span>
        <span class="panel-title">系统信息</span>
      </div>
      <span class="panel-tag">ABOUT</span>
    </div>
    <div class="about">
      <div class="about-device">
        <span class="about-logo" :class="sysStateClass">◈</span>
        <div class="about-device-text">
          <span class="about-name">白峰千鹤 · 仿生单元</span>
          <span class="about-model">AN-0170A</span>
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
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 10v5" /><path d="M12 18h.01" /></svg></span>
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
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" /><path d="M9 8h7" /><path d="M9 12h7" /><path d="M9 16h4" /></svg></span>
        <span class="panel-title">系统日志</span>
      </div>
      <span class="panel-tag">LOG</span>
    </div>
    <div class="log-window">
      <div class="log-titlebar">
        <span class="log-dots"><i></i><i></i><i></i></span>
        <span class="log-filename">an-0170a / system.log</span>
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
</div>
        </div>

        <nav class="app-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="app-tab"
            :class="{ active: active_tab === tab.id }"
            type="button"
            @click="active_tab = tab.id"
          >
            <span class="tab-icon" v-html="tab.icon"></span>
            <span class="tab-label">{{ tab.label }}</span>
          </button>
        </nav>
      </div>

      <!-- ========== 设置视图 ========== -->
      <div v-else class="view settings-view">
        <div class="settings-panel fe-settings">
    <div class="settings-head">
      <div class="settings-head-row">
        <span class="settings-head-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 9 9c0-1.7-1.3-3-3-3h-2.5a2.5 2.5 0 0 1-2.5-2.5c0-.7.3-1.4.7-1.9.5-.6.8-1.3.8-2.1A2.5 2.5 0 0 0 12 3Z" /><circle cx="7.5" cy="10.5" r="1" /><circle cx="10.5" cy="7.5" r="1" /><circle cx="16.5" cy="14.5" r="1" /></svg></span>
        <div class="settings-head-text">
          <div class="settings-title">外观设置</div>
          <div class="settings-sub">为你的屏幕挑选一套风格</div>
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
          @input="setCustomAccent($event.target.value)"
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
      <div class="font-sample" :style="{ fontSize: fontSize + 'px' }">千鹤早安 · Aa 123</div>
    </div>

    <!-- 以下四项只在外壳界面（手机 / PC）出现，操作台不显示 -->
    <template v-if="showLayout">
      <div class="setting-group">
    <div class="settings-sec"><span class="settings-sec-bar"></span>形态</div>
        <div class="setting-title">显示形态</div>
        <div class="mode-row">
          <button
            v-for="m in displayModes"
            :key="m.value"
            class="mode-btn"
            :class="{ active: displayMode === m.value }"
            type="button"
            @click="setDisplayMode(m.value)"
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
            @click="setPhoneAspect(a.value)"
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
            @click="setUiSize(s.value)"
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

    <!-- 酒馆界面 -->
    <div class="setting-group">
    <div class="settings-sec"><span class="settings-sec-bar"></span>界面</div>
      <div class="setting-title">酒馆界面</div>
      <label class="switch-row">
        <span class="switch-label">
          <span class="switch-title">隐藏酒馆界面元素</span>
          <span class="switch-hint">隐藏原生输入栏 / 楼层头像 / 顶部栏</span>
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
          <span class="switch-hint">关闭后回退酒馆原生正文显示，兼容特殊预设的正则</span>
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

    <div class="settings-sec"><span class="settings-sec-bar"></span>模型</div>
    <div class="fe-submodel">
<div class="setting-group">
    <div class="setting-title">副模型</div>

    <label class="switch-row">
      <span class="switch-label">
        <span class="switch-title">启用副模型</span>
        <span class="switch-hint">用独立的 OpenAI 兼容模型处理变量更新与记忆压缩，减轻主模型负担</span>
      </span>
      <button
        class="switch"
        :class="{ on: cfg.enabled }"
        type="button"
        role="switch"
        :aria-checked="cfg.enabled"
        @click="cfg.enabled = !cfg.enabled"
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

      <label class="switch-row">
        <span class="switch-label">
          <span class="switch-title">职责 · 记忆压缩</span>
          <span class="switch-hint">记忆日志超过 30 条时，把旧条目压缩成摘要</span>
        </span>
        <button
          class="switch"
          :class="{ on: cfg.memCompress }"
          type="button"
          role="switch"
          :aria-checked="cfg.memCompress"
          @click="cfg.memCompress = !cfg.memCompress"
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
        <span class="switch-hint">把最近记忆与本轮改动一起发给 AI，作为千鹤扮演时的依据</span>
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

    <div v-if="inj.启用" class="sub-field">
      <label class="sub-label">注入最近 N 条记忆</label>
      <input v-model.number="inj.条数" class="sub-input" type="number" min="1" step="1" />
    </div>

    <div class="sub-field">
      <button class="manual-btn" type="button" :disabled="running" @click="runNow">
        {{ running ? '整理中…' : '立即整理记忆' }}
      </button>
      <span v-if="resultText" class="result-text" :class="{ bad: !resultOk }">{{ resultText }}</span>
    </div>

    <div class="setting-hint">
      主模型模式与副模型模式会另发一次请求整理记忆；提示词模式只靠每轮要求更新的提示词，关闭模式什么都不做。记忆被玩家在终端修改后，下一次发送会附带一条「更新了记忆……」告知 AI。
    </div>
  </div>

</div>
    <div class="settings-extras fe-extras">
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
      <div class="setting-title">关于</div>
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

  </div>

      </div>
    </main>

    <!-- 底部导航（中央主按钮式） -->
    <nav class="phone-nav">
      <button class="nav-btn" :class="{ active: view === 'chat' }" type="button" @click="view = 'chat'">
        <span class="nav-ico">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4Z" /></svg>
        </span>
        <span class="nav-label">对话</span>
      </button>

      <div class="nav-center">
        <button
          class="center-btn"
          :class="{ active: view === 'app' }"
          type="button"
          @click="view = 'app'"
          title="控制终端"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 22 12 12 22 2 12Z" /></svg>
        </button>
        <span class="center-label" :class="{ active: view === 'app' }">终端</span>
      </div>

      <button class="nav-btn" :class="{ active: view === 'settings' }" type="button" @click="view = 'settings'">
        <span class="nav-ico">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21 17 7" /><path d="M5 7h4" /><path d="M7 5v4" /><path d="M18 13h4" /><path d="M20 11v4" /></svg>
        </span>
        <span class="nav-label">设置</span>
      </button>
    </nav>
    </template>

    <!-- ==================== PC 形态：顶部导航 + 双栏 ==================== -->
    <template v-else>
      <header class="pc-head">
        <div class="pc-brand">
          <span class="pc-logo" :class="stateClass">◈</span>
          <div class="pc-brand-text">
            <div class="pc-name">白峰千鹤</div>
            <div class="pc-model">AN-0170A · 控制终端 · {{ store.data.千鹤.意识状态 }}</div>
          </div>
        </div>
        <nav class="pc-nav">
          <button :class="{ active: view !== 'settings' }" type="button" @click="view = 'chat'">对话</button>
          <button :class="{ active: view === 'settings' }" type="button" @click="view = 'settings'">设置</button>
        </nav>
      </header>

      <main class="pc-main">
        <!-- PC 设置面板 -->
        <template v-if="view === 'settings'">
          <div class="pc-settings">
            <div class="settings-panel fe-settings">
    <div class="settings-head">
      <div class="settings-head-row">
        <span class="settings-head-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 9 9c0-1.7-1.3-3-3-3h-2.5a2.5 2.5 0 0 1-2.5-2.5c0-.7.3-1.4.7-1.9.5-.6.8-1.3.8-2.1A2.5 2.5 0 0 0 12 3Z" /><circle cx="7.5" cy="10.5" r="1" /><circle cx="10.5" cy="7.5" r="1" /><circle cx="16.5" cy="14.5" r="1" /></svg></span>
        <div class="settings-head-text">
          <div class="settings-title">外观与显示</div>
          <div class="settings-sub">为你的屏幕挑选一套风格与形态</div>
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
          @input="setCustomAccent($event.target.value)"
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
      <div class="font-sample" :style="{ fontSize: fontSize + 'px' }">千鹤早安 · Aa 123</div>
    </div>

    <!-- 以下四项只在外壳界面（手机 / PC）出现，操作台不显示 -->
    <template v-if="showLayout">
      <div class="setting-group">
    <div class="settings-sec"><span class="settings-sec-bar"></span>形态</div>
        <div class="setting-title">显示形态</div>
        <div class="mode-row">
          <button
            v-for="m in displayModes"
            :key="m.value"
            class="mode-btn"
            :class="{ active: displayMode === m.value }"
            type="button"
            @click="setDisplayMode(m.value)"
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
            @click="setPhoneAspect(a.value)"
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
            @click="setUiSize(s.value)"
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

    <!-- 酒馆界面 -->
    <div class="setting-group">
    <div class="settings-sec"><span class="settings-sec-bar"></span>界面</div>
      <div class="setting-title">酒馆界面</div>
      <label class="switch-row">
        <span class="switch-label">
          <span class="switch-title">隐藏酒馆界面元素</span>
          <span class="switch-hint">隐藏原生输入栏 / 楼层头像 / 顶部栏</span>
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
          <span class="switch-hint">关闭后回退酒馆原生正文显示，兼容特殊预设的正则</span>
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

    <div class="settings-sec"><span class="settings-sec-bar"></span>模型</div>
    <div class="fe-submodel">
<div class="setting-group">
    <div class="setting-title">副模型</div>

    <label class="switch-row">
      <span class="switch-label">
        <span class="switch-title">启用副模型</span>
        <span class="switch-hint">用独立的 OpenAI 兼容模型处理变量更新与记忆压缩，减轻主模型负担</span>
      </span>
      <button
        class="switch"
        :class="{ on: cfg.enabled }"
        type="button"
        role="switch"
        :aria-checked="cfg.enabled"
        @click="cfg.enabled = !cfg.enabled"
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

      <label class="switch-row">
        <span class="switch-label">
          <span class="switch-title">职责 · 记忆压缩</span>
          <span class="switch-hint">记忆日志超过 30 条时，把旧条目压缩成摘要</span>
        </span>
        <button
          class="switch"
          :class="{ on: cfg.memCompress }"
          type="button"
          role="switch"
          :aria-checked="cfg.memCompress"
          @click="cfg.memCompress = !cfg.memCompress"
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
        <span class="switch-hint">把最近记忆与本轮改动一起发给 AI，作为千鹤扮演时的依据</span>
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

    <div v-if="inj.启用" class="sub-field">
      <label class="sub-label">注入最近 N 条记忆</label>
      <input v-model.number="inj.条数" class="sub-input" type="number" min="1" step="1" />
    </div>

    <div class="sub-field">
      <button class="manual-btn" type="button" :disabled="running" @click="runNow">
        {{ running ? '整理中…' : '立即整理记忆' }}
      </button>
      <span v-if="resultText" class="result-text" :class="{ bad: !resultOk }">{{ resultText }}</span>
    </div>

    <div class="setting-hint">
      主模型模式与副模型模式会另发一次请求整理记忆；提示词模式只靠每轮要求更新的提示词，关闭模式什么都不做。记忆被玩家在终端修改后，下一次发送会附带一条「更新了记忆……」告知 AI。
    </div>
  </div>

</div>
    <div class="settings-extras fe-extras">
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
      <div class="setting-title">关于</div>
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

  </div>

          </div>
        </template>

        <!-- PC 对话 + 终端 双栏 -->
        <template v-else>
          <section class="pc-col pc-chat-col">
            <div class="chat-head">
              <div class="avatar" :class="stateClass">
                <img v-if="avatarSrc" class="avatar-img" :src="avatarSrc" alt="" />
                <span v-else class="avatar-char">千</span>
              </div>
              <div class="chat-head-info">
                <div class="chat-name">白峰千鹤</div>
                <div class="chat-sub">
                  <span class="sub-dot" :class="stateClass"></span>
                  <span>{{ statusText }}</span>
                </div>
              </div>
              <div class="chat-time">{{ timeText }}</div>
            </div>
            <div class="chat-body pc-chat-body">
              <div class="chat-scroll">
                <div class="chat-label">
                  <span class="label-line"></span>
                  <span>来自千鹤 · 新消息</span>
                  <span class="label-line"></span>
                </div>
                <div class="chat-bubble" v-html="dialogHtml"></div>
            <div class="ch-sync-card open">
              <button type="button" class="ch-sync-head">
                <span class="ch-sync-title">⚙ 终端状态已同步</span>
                <span class="ch-sync-badge">3 项变更</span>
                <span class="ch-sync-arrow">▾</span>
              </button>
              <div class="ch-sync-body">
                <div class="ch-sync-item"><span class="ch-sync-field">敏感度</span><span class="ch-sync-op">→</span><span class="ch-sync-val">34</span></div>
                <div class="ch-sync-item"><span class="ch-sync-field">快感值</span><span class="ch-sync-op">→</span><span class="ch-sync-val">18</span></div>
                <div class="ch-sync-item"><span class="ch-sync-field">好感度</span><span class="ch-sync-op">→</span><span class="ch-sync-val">42</span></div>
              </div>
            </div>
              </div>
              <form class="chat-compose" @submit.prevent="sendChat">
                <input v-model="chatInput" type="text" placeholder="输入要发送的话…" autocomplete="off" />
                <button type="submit" :disabled="sending || !chatInput.trim()">发送</button>
              </form>
              <div class="chat-foot">
                <span class="foot-dot"></span>
                <span>message encrypted · an-0170a</span>
              </div>
            </div>
          </section>

          <section class="pc-col pc-term-col">
            <header class="app-head">
              <div class="app-head-row">
                <div class="app-brand">
                  <span class="app-logo" :class="stateClass">◈</span>
                  <div class="app-brand-text">
                    <div class="app-name">白峰千鹤</div>
                    <div class="app-model">AN-0170A · 控制终端</div>
                  </div>
                </div>
                <span class="app-state" :class="stateClass">{{ store.data.千鹤.意识状态 }}</span>
              </div>
              <div class="app-meta">
                <div class="meta-cell">
                  <span class="meta-label">电量</span>
                  <span class="meta-value">{{ hbBattery(store.data.千鹤.电量) }}%</span>
                  <span class="meta-bar"><i :style="{ width: hbBattery(store.data.千鹤.电量) + '%' }"></i></span>
                </div>
                <div class="meta-cell">
                  <span class="meta-label">好感度</span>
                  <span class="meta-value">{{ store.data.千鹤.好感度 }}</span>
                  <span class="meta-bar amber"><i :style="{ width: store.data.千鹤.好感度 + '%' }"></i></span>
                </div>
                <div class="meta-cell">
                  <span class="meta-label">系统时间</span>
                  <span class="meta-value mono">{{ timeText }}</span>
                  <span class="meta-bar"><i style="width: 100%"></i></span>
                </div>
              </div>
            </header>

            <div class="app-panel pc-panel">
              <button class="status-update" type="button" :disabled="sending" @click="sendStatusUpdate">
                {{ sending ? '正在更新…' : '更新状态' }}
              </button>
              <div v-if="active_tab === '状态'" class="pane"><div class="panel fe-status">
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2-6 4 12 2-6h6" /></svg></span>
        <span class="panel-title">状态总览</span>
      </div>
      <span class="panel-tag">OVERVIEW</span>
    </div>
    <p class="panel-desc">千鹤当前的整体运行概况</p>

    <!-- 核心状态 -->
    <div class="core-row">
      <div class="core-cell" :class="awareClass">
        <span class="core-label">意识状态</span>
        <span class="core-value">{{ store.data.千鹤.意识状态 }}</span>
        <span class="core-dot"></span>
      </div>
      <div class="core-cell" :class="sysClass">
        <span class="core-label">系统状态</span>
        <span class="core-value">{{ store.data.千鹤.系统状态 }}</span>
        <span class="core-dot"></span>
      </div>
    </div>

    <!-- 关键指标 -->
    <div class="metric-grid">
      <div class="metric">
        <span class="metric-label">电量</span>
        <span class="metric-num">{{ hbBattery(store.data.千鹤.电量) }}<i>%</i></span>
        <span class="metric-bar"><i :style="{ width: hbBattery(store.data.千鹤.电量) + '%' }"></i></span>
      </div>
      <div class="metric">
        <span class="metric-label">好感度</span>
        <span class="metric-num">{{ store.data.千鹤.好感度 }}<i>/100</i></span>
        <span class="metric-bar amber"><i :style="{ width: store.data.千鹤.好感度 + '%' }"></i></span>
        <span class="metric-stage">{{ stageLabel }}</span>
      </div>
      <div class="metric">
        <span class="metric-label">敏感度</span>
        <span class="metric-num">{{ store.data.千鹤.敏感度 }}</span>
        <span class="metric-bar blue"><i :style="{ width: store.data.千鹤.敏感度 + '%' }"></i></span>
      </div>
      <div class="metric">
        <span class="metric-label">快感值</span>
        <span class="metric-num">{{ store.data.千鹤.快感值 }}</span>
        <span class="metric-bar red"><i :style="{ width: store.data.千鹤.快感值 + '%' }"></i></span>
      </div>
      <div class="metric">
        <span class="metric-label">CPU 使用率</span>
        <span class="metric-num">{{ hbCpu(store.data.千鹤.cpu使用率) }}<i>%</i></span>
        <span class="metric-bar blue"><i :style="{ width: hbCpu(store.data.千鹤.cpu使用率) + '%' }"></i></span>
      </div>
      <div class="metric">
        <span class="metric-label">RAM 使用率</span>
        <span class="metric-num">{{ hbRam(store.data.千鹤.内存使用率) }}<i>%</i></span>
        <span class="metric-bar purple"><i :style="{ width: hbRam(store.data.千鹤.内存使用率) + '%' }"></i></span>
      </div>
    </div>

    <!-- 环境 -->
    <div class="env-row">
      <span class="env-item"><span class="env-ico">◷</span>{{ store.data.世界.当前时间 }}</span>
      <span class="env-item"><span class="env-ico">⌖</span>{{ store.data.世界.当前地点 }}</span>
    </div>

    <!-- 认知摘要 -->
    <div class="cog-summary">
      <div class="cog-summary-head">
        <span class="cog-tag">认知</span>
        <span class="cog-self" :class="{ off: !store.data.千鹤.认知自洽 }">
          {{ store.data.千鹤.认知自洽 ? '自洽·开' : '自洽·关' }}
        </span>
      </div>
      <div class="cog-dim-row">
        <span class="cog-dim-key">身份</span>
        <span class="cog-text">{{ store.data.千鹤.身份认知 }}</span>
      </div>
      <div class="cog-dim-row">
        <span class="cog-dim-key">身体</span>
        <span class="cog-text">{{ store.data.千鹤.身体认知 }}</span>
      </div>
      <div class="cog-dim-row">
        <span class="cog-dim-key">处境</span>
        <span class="cog-text">{{ store.data.千鹤.处境认知 }}</span>
      </div>
      <div class="cog-dim-row">
        <span class="cog-dim-key">常识</span>
        <span class="cog-text">{{ store.data.千鹤.常识认知 }}</span>
      </div>
    </div>

    <!-- 运行概况 -->
    <div class="overview-row">
      <div class="ov-item">
        <span class="ov-num">{{ abnormalCount }}</span>
        <span class="ov-label">躯体异常</span>
      </div>
      <div class="ov-item">
        <span class="ov-num">{{ cmdCount }}</span>
        <span class="ov-label">覆盖指令</span>
      </div>
      <div class="ov-item">
        <span class="ov-num">{{ memCount }}</span>
        <span class="ov-label">记忆条</span>
      </div>
      <div class="ov-item">
        <span class="ov-num">{{ bugCount }}</span>
        <span class="ov-label">Bug</span>
      </div>
    </div>

    <!-- 机体总览 + 液体储备（左右并排） -->
    <div class="body-cols">
      <div class="body-col">
        <div class="panel-head sub body-thumb-head">
          <div class="panel-head-left">
            <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="3.4" /><path d="M5 21c.7-4.8 3.2-7 7-7s6.3 2.2 7 7" /></svg></span>
            <span class="panel-title">机体总览</span>
          </div>
          <span class="panel-tag">BODY</span>
        </div>
        <div class="body-thumb-wrap">
          <svg class="body-thumb-svg" viewBox="0 0 1672 2508" preserveAspectRatio="xMidYMid meet" role="img" aria-label="机体总览缩略图">
            <g class="shell-layer"></g>
            <g class="segs-layer"></g>
            <g class="iparts-layer"></g>
          </svg>
        </div>
      </div>

      <div class="body-col">
        <div class="panel-head sub body-fluid-head">
          <div class="panel-head-left">
            <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" /></svg></span>
            <span class="panel-title">液体储备</span>
          </div>
          <span class="panel-tag">FLUID</span>
        </div>
        <div class="body-fluid-wrap">
          <div class="fluid-gauges-c">
            <div class="fluid-gauge">
              <span class="fg-track"><i :style="{ height: (store.data.千鹤.冷却液 || 0) + '%' }"></i></span>
              <b class="fg-val">{{ store.data.千鹤.冷却液 }}%</b>
              <span class="fg-label">冷却液</span>
            </div>
            <div class="fluid-gauge pink">
              <span class="fg-track"><i :style="{ height: (store.data.千鹤.爱液 || 0) + '%' }"></i></span>
              <b class="fg-val">{{ store.data.千鹤.爱液 }}%</b>
              <span class="fg-label">爱液</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 电源控制 -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v8" /><path d="M18.4 6.6a8 8 0 1 1-12.8 0" /></svg></span>
        <span class="panel-title">电源控制</span>
      </div>
      <span class="panel-tag">POWER</span>
    </div>
    <div class="power-seg">
      <button
        v-for="p in powerStates"
        :key="p"
        class="power-opt"
        :class="{ active: store.data.千鹤.电源状态 === p }"
        type="button"
        :disabled="uiState.rebooting"
        @click="setPower(p)"
      >
        {{ p }}
      </button>
      <span class="power-thumb" :class="'thumb-' + powerIndex"></span>
    </div>
    <div class="power-actions">
      <button
        class="reboot-btn"
        type="button"
        :disabled="uiState.rebooting || store.data.千鹤.电源状态 === '关机'"
        @click="reboot"
      >
        <span class="reboot-ico" :class="{ spin: uiState.rebooting }">⟳</span>
        <span>{{ uiState.rebooting ? '重启中…' : '重启' }}</span>
      </button>
      <span v-if="store.data.千鹤.电源状态 === '关机'" class="power-hint">电源已关闭 · 终端指令已失效</span>
    </div>
  </div>
</div>
              <div v-else-if="active_tab === '认知'" class="pane"><div class="panel fe-cognition">
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.4" /><path d="M12 2v3" /><path d="M12 19v3" /><path d="M4.9 4.9l2.1 2.1" /><path d="M17 17l2.1 2.1" /><path d="M2 12h3" /><path d="M19 12h3" /><path d="M4.9 19.1 7 17" /><path d="M17 7l2.1-2.1" /></svg></span>
        <span class="panel-title">认知模块</span>
      </div>
      <span class="panel-tag">COGNITION</span>
    </div>
    <p class="panel-desc">人格状态 · 认知 · 性格 的统合控制</p>

    <!-- 人格三态 -->
    <div class="state-list">
      <button
        v-for="s in states"
        :key="s.id"
        class="state-btn"
        :class="[s.id, { active: store.data.千鹤.意识状态 === s.id }]"
        type="button"
        @click="setState(s.id)"
      >
        <span class="state-icon">{{ s.icon }}</span>
        <span class="state-text">
          <span class="state-label">{{ s.label }}</span>
          <span class="state-desc">{{ s.desc }}</span>
        </span>
        <span class="state-check">✓</span>
      </button>
    </div>

    <div class="divider"></div>

    <!-- 好感度 -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.6-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.4-9 9-9 9Z" /></svg></span>
        <span class="panel-title">好感度</span>
      </div>
      <span class="panel-tag">AFFECTION</span>
    </div>
    <div class="affection">
      <div class="affection-track">
        <div class="affection-fill" :style="{ width: store.data.千鹤.好感度 + '%' }"></div>
      </div>
      <div class="affection-row">
        <span class="affection-value">{{ store.data.千鹤.好感度 }}</span>
        <span class="affection-stage">{{ stageLabel }}</span>
      </div>
      <input
        v-model.number="store.data.千鹤.好感度"
        class="affection-slider"
        type="range"
        min="0"
        max="100"
        step="1"
      />
      <div class="affection-scale">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>

    <div class="divider"></div>

    <!-- 性格写入 -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.4 5.7 6.1.5-4.6 4 1.4 6-5.3-3.2-5.3 3.2 1.4-6-4.6-4 6.1-.5Z" /></svg></span>
        <span class="panel-title">性格写入</span>
      </div>
      <span class="panel-tag">PERSONA</span>
    </div>
    <textarea
      v-model="personaDraft"
      class="cog-input"
      rows="2"
      placeholder="输入新的性格设定，例如：冷面娇柔的优等生……"
    ></textarea>
    <button class="btn primary" type="button" @click="applyPersona">写入性格</button>
    <div class="cog-current">
      <span class="cog-label">● 当前性格</span>
      <span class="cog-text">{{ store.data.千鹤.性格 }}</span>
    </div>

    <div class="divider"></div>

    <!-- 认知写入 -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a2.5 2.5 0 0 0-2.5 2.5c0 1-.5 1.5-1.5 1.5H3v12h18V7h-5c-1 0-1.5-.5-1.5-1.5A2.5 2.5 0 0 0 12 3Z" /></svg></span>
        <span class="panel-title">认知写入</span>
      </div>
      <span class="panel-tag">REALITY</span>
    </div>

    <!-- 认知自洽开关 -->
    <div class="cog-switch-row">
      <div class="cog-switch-info">
        <span class="cog-switch-label">认知自洽维护</span>
        <span class="cog-switch-desc">自动抹平与当前认知冲突的细节</span>
      </div>
      <button
        class="switch"
        :class="{ on: store.data.千鹤.认知自洽 }"
        type="button"
        @click="toggleCogSelf"
      >
        <i></i>
      </button>
    </div>

    <!-- 四维度认知 -->
    <div v-for="dim in cogDims" :key="dim.key" class="cog-dim">
      <span class="cog-dim-label">{{ dim.label }}</span>
      <textarea
        v-model="cogDrafts[dim.key]"
        class="cog-input"
        rows="2"
        :placeholder="dim.ph"
      ></textarea>
      <div v-if="dim.presets.length" class="cog-presets">
        <button
          v-for="p in dim.presets"
          :key="p.label"
          class="cog-preset-btn"
          :class="{ active: store.data.千鹤[dim.key] === p.value }"
          type="button"
          @click="applyPreset(dim.key, p.value)"
        >
          {{ p.label }}
        </button>
      </div>
      <div class="cog-current">
        <span class="cog-label">● 当前{{ dim.label }}</span>
        <span class="cog-text">{{ store.data.千鹤[dim.key] }}</span>
      </div>
    </div>

    <div class="cog-actions">
      <button class="btn primary" type="button" @click="applyCog">写入认知</button>
      <button class="btn ghost" type="button" @click="resetCog">恢复正常</button>
    </div>
  </div>
</div>
              <div v-else-if="active_tab === '记忆'" class="pane"><div class="panel fe-memory">
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" /><path d="M9 8h7" /><path d="M9 12h7" /><path d="M9 16h4" /></svg></span>
        <span class="panel-title">记忆</span>
      </div>
      <span class="panel-tag">MEMORY</span>
    </div>
    <p class="panel-desc">删除的记忆可由系统自动填补 · 修改过的记忆带「修改」标记</p>

    <button
      v-if="!adding"
      class="btn primary sm"
      type="button"
      @click="startAdd"
    >
      ＋ 新增记忆
    </button>

    <div v-if="adding" class="add-box">
      <input v-model="newEntry.时间" class="add-input" type="text" placeholder="YYYY-MM-DD HH:MM" />
      <textarea v-model="newEntry.事件" class="edit-area" rows="2" placeholder="记忆内容"></textarea>
      <div class="edit-actions">
        <button class="btn primary sm" type="button" @click="addMemory">保存</button>
        <button class="btn ghost sm" type="button" @click="cancelAdd">取消</button>
      </div>
    </div>

    <p v-if="error" class="mem-error">{{ error }}</p>

    <div v-if="memoryLog.length" class="memory-list">
      <div v-for="(entry, i) in memoryLog" :key="entry.时间 + '|' + i" class="memory-item">
        <span class="memory-time">{{ formatDate(entry.时间) }}</span>
        <span v-if="filledTags.includes(tagOf(entry))" class="mem-tag tag-fill">填补</span>
        <span v-if="editedTags.includes(tagOf(entry))" class="mem-tag tag-edit">修改</span>
        <div class="memory-main">
          <template v-if="editingIndex === i">
            <input v-model="editDraft.时间" class="add-input" type="text" placeholder="YYYY-MM-DD HH:MM" />
            <textarea v-model="editDraft.事件" class="edit-area" rows="2"></textarea>
            <div class="edit-actions">
              <button class="btn primary sm" type="button" @click="saveEdit(i)">保存</button>
              <button class="btn ghost sm" type="button" @click="editingIndex = null">取消</button>
            </div>
          </template>
          <span v-else class="memory-event">{{ entry.事件 }}</span>
        </div>
        <div class="memory-ops">
          <button class="op-btn" type="button" title="修改这条记忆" @click="startEdit(i)">✎</button>
          <button class="op-btn del" type="button" title="删除这条记忆" @click="removeMemory(i)">✕</button>
        </div>
      </div>
    </div>
    <div v-else class="memory-empty">
      <span class="memory-empty-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" /><path d="M9 8h7" /><path d="M9 12h7" /><path d="M9 16h4" /></svg></span>
      <span class="memory-empty-title">记忆日志为空</span>
      <span class="memory-empty-hint">与千鹤的互动会沉淀为记忆条目，显示在这里</span>
    </div>

    <!-- 待填补区 -->
    <div v-if="deletedLog.length" class="gap-section">
      <div class="gap-head">
        <span class="gap-title">记忆缺失 · 待填补</span>
        <span class="gap-count">{{ deletedLog.length }} 段</span>
      </div>
      <div v-for="(g, i) in deletedLog" :key="g.时间 + '|' + i" class="gap-item">
        <span class="gap-time">{{ formatDate(g.时间) }}</span>
        <span class="gap-content">{{ g.事件 }}</span>
        <button class="btn primary sm" type="button" @click="fillGap(i)">自动填补</button>
      </div>
    </div>

    <button
      v-if="memoryLog.length"
      class="btn danger"
      type="button"
      @click="clearMemory"
    >
      清空全部记忆
    </button>
  </div>
</div>
              <div v-else-if="active_tab === '躯体参数'" class="pane"><div class="panel fe-body">
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="3.4" /><path d="M5 21c.7-4.8 3.2-7 7-7s6.3 2.2 7 7" /></svg></span>
        <span class="panel-title">躯体参数</span>
      </div>
      <span class="panel-tag">PHYSIQUE</span>
    </div>
    <p class="panel-desc">数值修改 · 身体锁定 · 实际着装</p>

    <!-- ===== 数值修改 ===== -->
    <div class="panel-head sub">
      <div class="panel-head-left">
        <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9c2-2 4 2 6 0s4 2 6 0" /><path d="M4 15c2-2 4 2 6 0s4 2 6 0" /></svg></span>
        <span class="panel-title">数值修改</span>
      </div>
      <span class="panel-tag">SENSITIVITY</span>
    </div>

    <div class="sense-value">
      <span class="sense-number">{{ store.data.千鹤.敏感度 }}</span>
      <span class="sense-level" :class="levelClass">{{ levelLabel }}</span>
    </div>
    <input
      v-model.number="store.data.千鹤.敏感度"
      class="sense-slider"
      type="range"
      min="1"
      max="100"
      step="1"
    />
    <div class="sense-scale">
      <span>1</span>
      <span>25</span>
      <span>50</span>
      <span>75</span>
      <span>100</span>
    </div>
    <div class="sense-input-row">
      <span class="sense-input-label">精确值（可超 100）</span>
      <input
        v-model.number="store.data.千鹤.敏感度"
        class="sense-input"
        type="number"
        min="1"
        step="1"
      />
    </div>
    <div class="sense-tip">
      <span class="tip-dot"></span>
      数值越高，身体对外界触碰的触觉反馈越强烈
    </div>

    <div class="sense-value">
      <span class="sense-number">{{ store.data.千鹤.快感值 }}</span>
      <span class="sense-level" :class="pleasureClass">{{ pleasureLabel }}</span>
    </div>
    <input
      v-model.number="store.data.千鹤.快感值"
      class="sense-slider"
      type="range"
      min="0"
      max="100"
      step="1"
    />
    <div class="sense-scale">
      <span>0</span>
      <span>25</span>
      <span>50</span>
      <span>75</span>
      <span>100</span>
    </div>
    <div class="sense-input-row">
      <span class="sense-input-label">精确值（上限 120）</span>
      <input
        v-model.number="store.data.千鹤.快感值"
        class="sense-input"
        type="number"
        min="0"
        max="120"
        step="1"
      />
    </div>
    <div class="pleasure-actions">
      <button class="btn danger" type="button" @click="forceClimax">强制高潮 (1F4)</button>
      <button class="btn ghost" type="button" @click="store.data.千鹤.快感值 = 0">归零</button>
    </div>

    <div class="divider"></div>

    <!-- ===== 身体锁定 ===== -->
    <div class="panel-head sub">
      <div class="panel-head-left">
        <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="11" width="15" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /><path d="M12 15v2" /></svg></span>
        <span class="panel-title">身体锁定</span>
      </div>
      <span class="panel-tag">LOCK</span>
    </div>
    <p class="panel-desc sub-desc">锁定后千鹤将无法自主移动该部位</p>
    <div class="lock-grid">
      <button
        v-for="part in bodyParts"
        :key="part"
        class="lock-btn"
        :class="{ locked: isBodyLocked(part) }"
        type="button"
        @click="toggleBodyLock(part)"
      >
        <span class="lock-dot"></span>
        <span class="lock-name">{{ part }}</span>
        <span class="lock-state">{{ isBodyLocked(part) ? '已锁定' : '未锁定' }}</span>
      </button>
    </div>

    <div class="divider"></div>

    <!-- ===== 力量限制器 ===== -->
    <div class="panel-head sub">
      <div class="panel-head-left">
        <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 5 13h6l-1 9 9-12h-6l1-8Z" /></svg></span>
        <span class="panel-title">力量限制器</span>
      </div>
      <span class="panel-tag">LIMITER</span>
    </div>
    <div class="limiter-row" :class="{ released: !store.data.千鹤.力量限制器 }">
      <div class="limiter-info">
        <span class="limiter-label">{{ store.data.千鹤.力量限制器 ? '出力限制中' : '已解除出力限制' }}</span>
        <span class="limiter-desc">
          {{ store.data.千鹤.力量限制器 ? '千鹤的力量输出被限制在安全阈值内' : '全部出力限制已解除，可发挥完整力量' }}
        </span>
      </div>
      <button
        class="switch"
        :class="{ on: !store.data.千鹤.力量限制器 }"
        type="button"
        @click="store.data.千鹤.力量限制器 = !store.data.千鹤.力量限制器"
      >
        <i></i>
      </button>
    </div>

    <div class="divider"></div>

    <!-- ===== 维护与结构 ===== -->
    <div class="panel-head sub">
      <div class="panel-head-left">
        <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg></span>
        <span class="panel-title">维护与结构</span>
      </div>
      <span class="panel-tag">MAINTENANCE</span>
    </div>

    <div class="limiter-row" :class="{ released: store.data.千鹤.性单元 === '弹出' }">
      <div class="limiter-info">
        <span class="limiter-label">性单元</span>
        <span class="limiter-desc">
          {{ store.data.千鹤.性单元 === '弹出' ? '已从下方弹出，露出生殖模块' : '收纳中，外观看不出异常' }}
        </span>
      </div>
      <button
        class="switch"
        :class="{ on: store.data.千鹤.性单元 === '弹出' }"
        type="button"
        @click="toggleSexUnit"
      >
        <i></i>
      </button>
    </div>

    <div class="limiter-row" :class="{ released: store.data.千鹤.维护模式 }">
      <div class="limiter-info">
        <span class="limiter-label">维护模式</span>
        <span class="limiter-desc">
          {{ store.data.千鹤.维护模式 ? '已开启，人格已关闭（调试/维护）' : '已关闭，人格正常运行' }}
        </span>
      </div>
      <button
        class="switch"
        :class="{ on: store.data.千鹤.维护模式 }"
        type="button"
        @click="toggleMaintenance"
      >
        <i></i>
      </button>
    </div>

    <div class="limiter-row">
      <div class="limiter-info">
        <span class="limiter-label">维护舱门</span>
        <span class="limiter-desc">电子脑 · 胸部 · 腹部 三处舱门，打开露出维护接口与内部结构</span>
      </div>
      <div class="hatch-switches">
        <button
          class="hatch-btn"
          :class="{ on: store.data.千鹤.维护舱门.电子脑 }"
          type="button"
          title="电子脑维护舱门"
          @click="toggleHatch('电子脑')"
        >
          脑
        </button>
        <button
          class="hatch-btn"
          :class="{ on: store.data.千鹤.维护舱门.胸部 }"
          type="button"
          @click="toggleHatch('胸部')"
        >
          胸
        </button>
        <button
          class="hatch-btn"
          :class="{ on: store.data.千鹤.维护舱门.腹部 }"
          type="button"
          @click="toggleHatch('腹部')"
        >
          腹
        </button>
      </div>
    </div>

    <div class="divider"></div>

    <!-- ===== 实际着装（折叠） ===== -->
    <div class="panel-head sub fold-head" role="button" tabindex="0" @click="outfitOpen = !outfitOpen" @keydown.enter="outfitOpen = !outfitOpen">
      <div class="panel-head-left">
        <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a2.5 2.5 0 0 0-2.5 2.5c0 1-.5 1.5-1.5 1.5H3v12h18V7h-5c-1 0-1.5-.5-1.5-1.5A2.5 2.5 0 0 0 12 3Z" /></svg></span>
        <span class="panel-title">实际着装</span>
        <span class="fold-badge">{{ outfitCount }} 件</span>
      </div>
      <span class="fold-arrow" :class="{ open: outfitOpen }">⌄</span>
    </div>
    <div v-if="outfitOpen" class="fold-body">
      <div v-if="!_.isEmpty(store.data.千鹤.实际着装)" class="outfit-list">
        <div v-for="(desc, slot) in store.data.千鹤.实际着装" :key="slot" class="outfit-item">
          <span class="outfit-slot">{{ slot }}</span>
          <span class="outfit-desc">{{ desc }}</span>
        </div>
      </div>
      <div v-else class="outfit-empty">暂无着装记录</div>
    </div>

    <div class="divider"></div>

    <!-- ===== 机体结构图（人体图融合） ===== -->
    <div class="panel-head sub">
      <div class="panel-head-left">
        <span class="panel-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="3.4" /><path d="M5 21c.7-4.8 3.2-7 7-7s6.3 2.2 7 7" /></svg></span>
        <span class="panel-title">机体结构图</span>
      </div>
      <span class="panel-tag">BODY MAP</span>
    </div>
    <div class="body-wrap">
      <div class="body-tools">
        <button type="button" class="layer-quick-btn" :class="{ active: bodyLayer === 1 }" @click="bodySetLayer(1)">L1</button>
        <button type="button" class="layer-quick-btn" :class="{ active: bodyLayer === 2 }" @click="bodySetLayer(2)">L2</button>
        <button type="button" class="layer-quick-btn" :class="{ active: bodyLayer === 3 }" @click="bodySetLayer(3)">L3</button>
        <button type="button" class="layer-quick-btn" :class="{ active: bodyShowIparts }" title="显示/隐藏内部部件" @click="bodyToggleIparts">部件</button>
        <button type="button" class="body-tool-btn" @click="bodyZoomOut">−</button>
        <span class="body-pct">{{ Math.round(bodyZoom * 100) }}%</span>
        <button type="button" class="body-tool-btn" @click="bodyZoomIn">＋</button>
        <button type="button" class="body-tool-btn" @click="bodyReset">复位</button>
      </div>
      <svg ref="bodySvgEl" class="body-svg" viewBox="0 0 1672 2508" preserveAspectRatio="xMidYMid meet" role="img" aria-label="机体结构图">
        <g class="shell-layer"></g>
        <g class="segs-layer"></g>
        <g class="iparts-layer"></g>
      </svg>
      <div class="body-legend">
        <span class="legend-item"><i class="dot dot-完好"></i>完好</span>
        <span class="legend-item"><i class="dot dot-受损"></i>受损</span>
        <span class="legend-item"><i class="dot dot-损毁"></i>损毁</span>
        <span class="legend-item"><i class="dot dot-拆除"></i>拆除</span>
        <span class="legend-item"><i class="dot dot-module"></i>内部部件</span>
      </div>
      <div v-if="bodyDetailText" class="body-detail">
        <span class="body-detail-text">{{ bodyDetailText }}</span>
        <template v-if="bodySelected && bodySelected.type === 'seg' && segLockInfo(bodySelected.seg)">
          <button
            class="btn ghost sm"
            type="button"
            @click="bodyToggleLockFromSeg(bodySelected.seg)"
          >{{ isBodyLocked(segLockInfo(bodySelected.seg)) ? '解锁' : '锁定' }} {{ segLockInfo(bodySelected.seg) }}</button>
        </template>
      </div>
      <div v-else class="body-detail hint-only">
        <span class="body-detail-hint">点击机体段或内部部件查看详情；点「脑/胸/腹」舱门或身体锁定按钮可联动高亮</span>
      </div>
    </div>
  </div>
</div>
              <div v-else-if="active_tab === '指令'" class="pane"><div class="panel fe-command">
    <!-- ===== 指令覆盖 ===== -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 8 4 4-4 4" /><path d="M13 16h5" /></svg></span>
        <span class="panel-title">指令覆盖</span>
      </div>
      <span class="panel-tag">OVERRIDE</span>
    </div>
    <p class="panel-desc">优先级 0 为最高；冲突时优先执行高优先级指令，同级指令可并行执行</p>

    <div class="cmd-list">
      <div v-for="entry in sortedCmds" :key="entry.id" class="cmd-item">
        <span class="cmd-id">{{ entry.id }}</span>
        <span class="cmd-pri" :class="{ high: entry.priority === 0 }">P{{ entry.priority }}</span>
        <span class="cmd-content">{{ entry.content }}</span>
        <button class="cmd-del" type="button" title="删除这条指令" @click="removeCmd(entry.id)">✕</button>
      </div>
      <div v-if="!hasCommands" class="cmd-empty">
        <span class="cmd-empty-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m7 8 4 4-4 4" /><path d="M13 16h5" /></svg></span>
        <span class="cmd-empty-title">当前没有覆盖指令</span>
        <span class="cmd-empty-hint">在下方添加指令，可临时覆盖千鹤的行为</span>
      </div>
    </div>

    <div class="cmd-add">
      <div class="cmd-add-row">
        <input v-model="newId" class="cmd-input id" placeholder="编号，如 0E4" />
        <input
          v-model.number="newPriority"
          class="cmd-input pri"
          type="number"
          min="0"
          max="9"
          step="1"
          placeholder="P"
          title="优先级，0 最高"
        />
      </div>
      <textarea
        v-model="newContent"
        class="cmd-input cmd-area"
        rows="2"
        placeholder="覆盖指令内容，如：让她以为自己还穿着衣服"
      ></textarea>
      <button class="btn primary" type="button" :disabled="powerOff" @click="addCmd">写入覆盖指令</button>
    </div>
    <p v-if="powerOff" class="power-off-hint">⚠ 电源已关闭，指令功能已失效</p>

    <div class="divider"></div>

    <!-- ===== 命令库终端 ===== -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 9 5-5 5 5" /><path d="M7 15l5 5 5-5" /></svg></span>
        <span class="panel-title">命令库终端</span>
      </div>
      <div class="panel-head-right">
        <button
          class="lang-toggle"
          type="button"
          :title="uiState.termLang === 'zh' ? '切换为英文' : '切换为中文'"
          @click="toggleTermLang"
        >
          {{ uiState.termLang === 'zh' ? '中' : 'EN' }}
        </button>
        <span class="panel-tag">CMD LIB</span>
      </div>
    </div>
    <p class="panel-desc">输入指令由终端解析并执行 · 输入 help 查看全部命令</p>

    <div class="term-window">
      <div class="term-body">
        <div v-if="uiState.rebooting" class="term-boot">
          <span class="boot-spinner"></span>
          <span class="boot-text">rebooting unit…</span>
          <span class="boot-bar"><i></i></span>
        </div>
        <template v-else>
          <div v-for="(line, i) in termLines" :key="i" class="term-line" :class="line.kind">
            <span v-if="line.kind === 'in'" class="term-prompt">></span>
            <span v-else-if="line.kind === 'err'" class="term-prompt">!</span>
            <span v-else-if="line.kind === 'sys'" class="term-prompt">#</span>
            <span class="term-text">{{ line.text }}</span>
          </div>
          <div class="term-input-row">
            <span class="term-prompt">></span>
            <input
              v-model="termInput"
              class="term-input"
              :disabled="powerOff"
              placeholder="type a command… (help)"
              spellcheck="false"
              @keydown.enter="runTerm"
            />
            <button
              class="term-run-btn"
              type="button"
              :disabled="powerOff"
              title="执行命令（回车）"
              @click="runTerm"
            >
              ➤
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</div>
              <div v-else-if="active_tab === '系统'" class="pane"><div class="panel fe-system">
    <!-- ===== 系统状态 ===== -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg></span>
        <span class="panel-title">系统状态</span>
      </div>
      <span class="panel-tag">SYSTEM</span>
    </div>
    <div class="sys-status">
      <span class="sys-state" :class="sysStateClass">{{ store.data.千鹤.系统状态 }}</span>
      <span v-if="store.data.千鹤.崩溃原因" class="sys-cause">{{ store.data.千鹤.崩溃原因 }}</span>
    </div>

    <!-- ===== 系统信息 ===== -->
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a2.5 2.5 0 0 0-2.5 2.5c0 1-.5 1.5-1.5 1.5H3v12h18V7h-5c-1 0-1.5-.5-1.5-1.5A2.5 2.5 0 0 0 12 3Z" /></svg></span>
        <span class="panel-title">系统信息</span>
      </div>
      <span class="panel-tag">ABOUT</span>
    </div>
    <div class="about">
      <div class="about-device">
        <span class="about-logo" :class="sysStateClass">◈</span>
        <div class="about-device-text">
          <span class="about-name">白峰千鹤 · 仿生单元</span>
          <span class="about-model">AN-0170A</span>
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
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 10v5" /><path d="M12 18h.01" /></svg></span>
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
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" /><path d="M9 8h7" /><path d="M9 12h7" /><path d="M9 16h4" /></svg></span>
        <span class="panel-title">系统日志</span>
      </div>
      <span class="panel-tag">LOG</span>
    </div>
    <div class="log-window">
      <div class="log-titlebar">
        <span class="log-dots"><i></i><i></i><i></i></span>
        <span class="log-filename">an-0170a / system.log</span>
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
</div>
            </div>

            <nav class="app-tabs pc-tabs">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                class="app-tab"
                :class="{ active: active_tab === tab.id }"
                type="button"
                @click="active_tab = tab.id"
              >
                <span class="tab-icon" v-html="tab.icon"></span>
                <span class="tab-label">{{ tab.label }}</span>
              </button>
            </nav>
          </section>
        </template>
      </main>
    </template>
  </div>

</div>
</div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';

/* ============================================================
 * 预览数据层
 *
 * 导出文件专用：真实运行时这些数据来自 MVU 变量（useDataStore），
 * 这里换成一整份静态快照，结构与 initvar.yaml 一致。
 * 面板上的按钮、滑杆、开关直接改这份快照，所以预览可以点着玩；
 * 发送 / 同步 / 副模型 / 心跳这些需要酒馆接口的行为改为本地模拟。
 * ============================================================ */

/* ============================================================
 * 人体图数据（源自 BodyDiagram.vue + bodyPaths.ts + internalParts.ts）
 * 15 段机体 / 65 件内部部件（22 模块），viewBox 0 0 1672 2508
 * ============================================================ */
const BODY_PATHS = {
  "头部": "M 841.0,39.0 L 828.0,41.8 L 809.1,45.7 L 789.0,51.4 L 772.0,60.0 L 758.8,72.2 L 747.3,87.3 L 737.5,104.0 L 730.0,121.0 L 724.9,138.3 L 722.0,156.5 L 720.9,175.0 L 721.0,193.0 L 722.7,210.8 L 726.1,228.6 L 730.5,245.9 L 735.0,262.0 L 739.7,276.9 L 744.8,290.9 L 750.3,304.0 L 756.0,316.0 L 762.4,326.8 L 769.5,336.5 L 776.1,345.4 L 781.0,354.0 L 783.0,362.4 L 782.9,370.3 L 783.1,377.6 L 786.0,384.0 L 792.5,389.6 L 801.3,394.4 L 811.2,398.3 L 821.0,401.0 L 830.8,402.6 L 841.0,403.1 L 851.2,402.6 L 861.0,401.0 L 870.8,398.3 L 880.7,394.4 L 889.5,389.6 L 896.0,384.0 L 898.9,377.6 L 899.1,370.3 L 899.0,362.4 L 901.0,354.0 L 905.9,345.4 L 912.5,336.5 L 919.6,326.8 L 926.0,316.0 L 931.7,304.0 L 937.2,290.9 L 942.3,276.9 L 947.0,262.0 L 951.5,245.9 L 955.9,228.6 L 959.3,210.8 L 961.0,193.0 L 961.1,175.0 L 960.0,156.5 L 957.1,138.3 L 952.0,121.0 L 944.5,104.0 L 934.8,87.3 L 923.2,72.2 L 910.0,60.0 L 893.0,51.4 L 872.9,45.7 L 854.0,41.8 L 841.0,39.0 Z",
  "胸段": "M 841.0,403.0 L 830.4,400.8 L 814.9,397.5 L 799.0,395.2 L 787.0,396.0 L 781.3,401.5 L 779.1,410.3 L 777.1,419.9 L 772.0,428.0 L 762.2,434.2 L 749.8,439.7 L 736.7,444.6 L 725.0,449.0 L 715.2,452.7 L 706.3,455.8 L 698.0,458.7 L 690.0,462.0 L 681.9,465.3 L 673.9,468.4 L 667.0,472.6 L 662.0,479.0 L 659.7,488.5 L 659.4,500.3 L 660.0,512.9 L 660.0,525.0 L 659.1,536.6 L 658.0,548.4 L 657.1,559.7 L 657.0,570.0 L 658.3,578.4 L 660.7,585.6 L 662.7,592.9 L 663.0,602.0 L 660.5,613.8 L 656.3,627.3 L 651.8,641.1 L 649.0,654.0 L 647.9,665.7 L 647.7,676.9 L 648.6,687.6 L 651.0,698.0 L 655.8,708.1 L 662.5,717.9 L 669.2,727.2 L 674.0,736.0 L 675.9,744.4 L 676.2,752.3 L 675.9,759.6 L 676.0,766.0 L 676.9,771.2 L 677.9,775.3 L 679.0,779.1 L 680.0,783.0 L 680.7,786.9 L 681.3,790.5 L 681.9,794.6 L 683.0,800.0 L 684.4,807.0 L 686.1,815.1 L 688.2,824.0 L 691.0,833.0 L 694.3,842.8 L 698.1,853.3 L 702.9,863.4 L 709.0,872.0 L 715.8,878.6 L 723.3,883.9 L 733.1,888.3 L 747.0,892.0 L 768.8,895.0 L 796.4,897.3 L 822.8,898.8 L 841.0,900.0 L 845.4,900.8 L 841.0,901.0 L 836.6,900.8 L 841.0,900.0 L 859.2,898.8 L 885.6,897.3 L 913.2,895.0 L 935.0,892.0 L 948.9,888.3 L 958.8,883.9 L 966.2,878.6 L 973.0,872.0 L 979.1,863.4 L 983.9,853.3 L 987.7,842.8 L 991.0,833.0 L 993.8,824.0 L 995.9,815.1 L 997.6,807.0 L 999.0,800.0 L 1000.1,794.6 L 1000.8,790.5 L 1001.3,786.9 L 1002.0,783.0 L 1003.0,779.1 L 1004.1,775.3 L 1005.1,771.2 L 1006.0,766.0 L 1006.1,759.6 L 1005.8,752.3 L 1006.1,744.4 L 1008.0,736.0 L 1012.8,727.2 L 1019.5,717.9 L 1026.2,708.1 L 1031.0,698.0 L 1033.4,687.6 L 1034.3,676.9 L 1034.1,665.7 L 1033.0,654.0 L 1030.2,641.1 L 1025.8,627.3 L 1021.5,613.8 L 1019.0,602.0 L 1019.3,592.9 L 1021.3,585.6 L 1023.7,578.4 L 1025.0,570.0 L 1024.9,559.7 L 1024.0,548.4 L 1022.9,536.6 L 1022.0,525.0 L 1022.0,512.9 L 1022.6,500.3 L 1022.3,488.5 L 1020.0,479.0 L 1015.0,472.6 L 1008.1,468.4 L 1000.1,465.3 L 992.0,462.0 L 984.0,458.7 L 975.7,455.8 L 966.8,452.7 L 957.0,449.0 L 945.3,444.6 L 932.3,439.7 L 919.8,434.2 L 910.0,428.0 L 904.9,419.9 L 902.9,410.3 L 900.7,401.5 L 895.0,396.0 L 883.0,395.2 L 867.1,397.5 L 851.6,400.8 L 841.0,403.0 Z",
  "腹段": "M 841.0,900.0 L 822.7,899.4 L 796.1,898.6 L 768.2,897.2 L 746.0,895.0 L 731.2,890.4 L 720.1,884.2 L 711.7,879.1 L 705.0,878.0 L 701.1,882.2 L 700.1,890.1 L 699.6,899.9 L 697.0,910.0 L 691.4,920.8 L 684.3,932.8 L 676.8,944.9 L 670.0,956.0 L 664.3,965.4 L 658.9,973.8 L 653.9,982.1 L 649.0,991.0 L 643.9,1001.2 L 638.8,1012.1 L 634.3,1022.7 L 631.0,1032.0 L 627.9,1039.1 L 625.0,1044.7 L 624.6,1050.4 L 629.0,1058.0 L 639.9,1067.7 L 655.8,1078.7 L 673.8,1090.8 L 691.0,1104.0 L 707.2,1118.4 L 723.7,1134.0 L 740.1,1150.4 L 756.0,1167.0 L 771.3,1185.6 L 786.3,1205.9 L 800.9,1224.3 L 815.0,1237.0 L 828.3,1243.6 L 841.0,1245.8 L 853.7,1243.6 L 867.0,1237.0 L 881.1,1224.3 L 895.7,1205.9 L 910.7,1185.6 L 926.0,1167.0 L 941.9,1150.4 L 958.3,1134.0 L 974.8,1118.4 L 991.0,1104.0 L 1008.2,1090.8 L 1026.2,1078.7 L 1042.1,1067.7 L 1053.0,1058.0 L 1057.4,1050.4 L 1057.0,1044.7 L 1054.1,1039.1 L 1051.0,1032.0 L 1047.7,1022.7 L 1043.2,1012.1 L 1038.1,1001.2 L 1033.0,991.0 L 1028.1,982.1 L 1023.1,973.8 L 1017.7,965.4 L 1012.0,956.0 L 1005.2,944.9 L 997.7,932.8 L 990.6,920.8 L 985.0,910.0 L 982.4,899.9 L 981.9,890.1 L 980.9,882.2 L 977.0,878.0 L 970.3,879.1 L 961.9,884.2 L 950.8,890.4 L 936.0,895.0 L 913.8,897.2 L 885.9,898.6 L 859.3,899.4 L 841.0,900.0 Z",
  "左上臂": "M 614.0,470.0 L 607.9,475.9 L 599.0,484.3 L 589.9,493.8 L 583.0,503.0 L 579.2,511.2 L 577.2,519.2 L 576.0,527.9 L 575.0,538.0 L 574.0,550.3 L 573.5,564.1 L 573.2,578.3 L 573.0,592.0 L 573.0,603.6 L 573.1,614.1 L 573.2,626.0 L 573.0,642.0 L 572.3,664.4 L 571.4,691.2 L 570.2,718.7 L 569.0,743.0 L 567.5,763.3 L 565.7,781.5 L 564.1,798.2 L 563.0,814.0 L 560.9,829.4 L 558.1,844.1 L 558.0,856.9 L 564.0,867.0 L 580.1,874.4 L 603.4,879.5 L 627.1,881.9 L 644.0,881.0 L 651.5,875.6 L 653.6,866.2 L 653.4,855.5 L 654.0,846.0 L 655.9,838.6 L 657.6,831.8 L 659.3,824.9 L 661.0,817.0 L 663.0,807.7 L 665.2,797.5 L 667.3,787.0 L 669.0,777.0 L 671.0,767.7 L 673.1,758.6 L 674.1,749.5 L 673.0,740.0 L 668.2,729.9 L 660.8,719.6 L 653.2,708.9 L 648.0,698.0 L 645.6,686.8 L 644.9,675.4 L 645.4,663.7 L 647.0,652.0 L 650.5,639.6 L 655.8,626.7 L 660.9,614.4 L 664.0,604.0 L 664.0,596.3 L 662.1,590.5 L 659.6,585.2 L 658.0,579.0 L 657.6,571.9 L 657.7,564.5 L 657.9,556.4 L 658.0,547.0 L 657.5,535.7 L 656.6,522.9 L 656.2,509.9 L 657.0,498.0 L 659.8,486.6 L 663.9,475.4 L 668.1,465.8 L 671.0,459.0 Z",
  "左前臂": "M 559.0,869.0 L 552.9,884.0 L 544.1,905.6 L 535.0,929.2 L 528.0,950.0 L 524.0,966.3 L 521.5,980.9 L 519.8,995.5 L 518.0,1012.0 L 516.0,1032.4 L 514.2,1055.1 L 512.5,1077.0 L 511.0,1095.0 L 509.7,1106.9 L 508.5,1114.7 L 507.3,1121.9 L 506.0,1132.0 L 503.9,1147.9 L 501.2,1167.1 L 499.2,1184.7 L 499.0,1196.0 L 500.8,1197.7 L 504.1,1193.1 L 508.8,1187.0 L 515.0,1184.0 L 523.6,1187.1 L 534.2,1193.2 L 545.0,1198.2 L 554.0,1198.0 L 560.7,1190.4 L 566.1,1178.1 L 570.7,1163.9 L 575.0,1151.0 L 578.9,1139.9 L 582.3,1129.2 L 585.5,1118.6 L 589.0,1108.0 L 592.8,1097.6 L 596.8,1087.5 L 600.9,1077.1 L 605.0,1066.0 L 609.1,1053.7 L 613.3,1040.7 L 617.6,1027.5 L 622.0,1015.0 L 626.8,1003.8 L 631.9,993.4 L 636.8,982.5 L 641.0,970.0 L 644.8,954.1 L 648.3,936.1 L 650.8,918.7 L 652.0,905.0 L 650.9,896.0 L 648.2,889.9 L 645.1,885.9 L 643.0,883.0 Z",
  "左手": "M 516.0,1182.0 L 513.1,1186.3 L 509.0,1192.3 L 504.6,1199.5 L 501.0,1207.0 L 498.5,1214.9 L 496.5,1223.4 L 494.8,1232.5 L 493.0,1242.0 L 491.1,1252.4 L 489.3,1263.6 L 487.6,1274.5 L 486.0,1284.0 L 484.2,1291.0 L 482.4,1296.5 L 481.1,1302.0 L 481.0,1309.0 L 482.6,1318.6 L 485.4,1329.8 L 488.8,1341.1 L 492.0,1351.0 L 494.9,1359.3 L 497.8,1366.7 L 500.8,1373.2 L 504.0,1379.0 L 507.5,1383.6 L 511.3,1387.1 L 515.1,1390.3 L 519.0,1394.0 L 522.9,1399.4 L 526.8,1405.7 L 530.8,1410.9 L 535.0,1413.0 L 540.2,1411.1 L 546.0,1406.4 L 550.8,1400.0 L 553.0,1393.0 L 550.5,1384.8 L 544.8,1375.1 L 539.2,1365.6 L 537.0,1358.0 L 539.9,1354.9 L 545.9,1354.8 L 552.7,1352.8 L 558.0,1344.0 L 561.9,1324.5 L 565.4,1297.7 L 567.7,1270.1 L 568.0,1248.0 L 565.3,1232.9 L 560.1,1221.5 L 554.7,1213.1 L 551.0,1207.0 Z",
  "右上臂": "M 1068.0,470.0 L 1074.1,475.9 L 1083.0,484.3 L 1092.1,493.8 L 1099.0,503.0 L 1102.8,511.2 L 1104.8,519.2 L 1106.0,527.9 L 1107.0,538.0 L 1108.0,550.3 L 1108.5,564.1 L 1108.8,578.3 L 1109.0,592.0 L 1109.0,603.6 L 1108.9,614.1 L 1108.8,626.0 L 1109.0,642.0 L 1109.7,664.4 L 1110.6,691.2 L 1111.8,718.7 L 1113.0,743.0 L 1114.5,763.3 L 1116.3,781.5 L 1117.9,798.2 L 1119.0,814.0 L 1121.1,829.4 L 1123.9,844.1 L 1124.0,856.9 L 1118.0,867.0 L 1101.9,874.4 L 1078.6,879.5 L 1054.9,881.9 L 1038.0,881.0 L 1030.5,875.6 L 1028.4,866.2 L 1028.6,855.5 L 1028.0,846.0 L 1026.1,838.6 L 1024.4,831.8 L 1022.8,824.9 L 1021.0,817.0 L 1019.0,807.7 L 1016.8,797.5 L 1014.7,787.0 L 1013.0,777.0 L 1011.0,767.7 L 1008.9,758.6 L 1007.9,749.5 L 1009.0,740.0 L 1013.8,729.9 L 1021.2,719.6 L 1028.8,708.9 L 1034.0,698.0 L 1036.4,686.8 L 1037.1,675.4 L 1036.6,663.7 L 1035.0,652.0 L 1031.5,639.6 L 1026.2,626.7 L 1021.1,614.4 L 1018.0,604.0 L 1018.0,596.3 L 1019.9,590.5 L 1022.4,585.2 L 1024.0,579.0 L 1024.4,571.9 L 1024.3,564.5 L 1024.1,556.4 L 1024.0,547.0 L 1024.5,535.7 L 1025.4,522.9 L 1025.8,509.9 L 1025.0,498.0 L 1022.2,486.6 L 1018.1,475.4 L 1013.9,465.8 L 1011.0,459.0 Z",
  "右前臂": "M 1123.0,869.0 L 1129.1,884.0 L 1137.9,905.6 L 1147.0,929.2 L 1154.0,950.0 L 1158.0,966.3 L 1160.5,980.9 L 1162.2,995.5 L 1164.0,1012.0 L 1166.0,1032.4 L 1167.8,1055.1 L 1169.5,1077.0 L 1171.0,1095.0 L 1172.3,1106.9 L 1173.5,1114.7 L 1174.7,1121.9 L 1176.0,1132.0 L 1178.1,1147.9 L 1180.8,1167.1 L 1182.8,1184.7 L 1183.0,1196.0 L 1181.2,1197.7 L 1177.9,1193.1 L 1173.2,1187.0 L 1167.0,1184.0 L 1158.4,1187.1 L 1147.8,1193.2 L 1137.0,1198.2 L 1128.0,1198.0 L 1121.3,1190.4 L 1115.9,1178.1 L 1111.3,1163.9 L 1107.0,1151.0 L 1103.1,1139.9 L 1099.7,1129.2 L 1096.5,1118.6 L 1093.0,1108.0 L 1089.2,1097.6 L 1085.2,1087.5 L 1081.1,1077.1 L 1077.0,1066.0 L 1072.9,1053.7 L 1068.7,1040.7 L 1064.4,1027.5 L 1060.0,1015.0 L 1055.2,1003.8 L 1050.1,993.4 L 1045.2,982.5 L 1041.0,970.0 L 1037.2,954.1 L 1033.8,936.1 L 1031.2,918.7 L 1030.0,905.0 L 1031.1,896.0 L 1033.8,889.9 L 1036.9,885.9 L 1039.0,883.0 Z",
  "右手": "M 1166.0,1182.0 L 1168.9,1186.3 L 1173.0,1192.3 L 1177.4,1199.5 L 1181.0,1207.0 L 1183.5,1214.9 L 1185.5,1223.4 L 1187.2,1232.5 L 1189.0,1242.0 L 1190.9,1252.4 L 1192.7,1263.6 L 1194.4,1274.5 L 1196.0,1284.0 L 1197.8,1291.0 L 1199.6,1296.5 L 1200.9,1302.0 L 1201.0,1309.0 L 1199.4,1318.6 L 1196.6,1329.8 L 1193.2,1341.1 L 1190.0,1351.0 L 1187.1,1359.3 L 1184.3,1366.7 L 1181.2,1373.2 L 1178.0,1379.0 L 1174.5,1383.6 L 1170.8,1387.1 L 1166.9,1390.3 L 1163.0,1394.0 L 1159.1,1399.4 L 1155.2,1405.7 L 1151.2,1410.9 L 1147.0,1413.0 L 1141.8,1411.1 L 1136.0,1406.4 L 1131.2,1400.0 L 1129.0,1393.0 L 1131.5,1384.8 L 1137.2,1375.1 L 1142.8,1365.6 L 1145.0,1358.0 L 1142.1,1354.9 L 1136.1,1354.8 L 1129.3,1352.8 L 1124.0,1344.0 L 1120.1,1324.5 L 1116.6,1297.7 L 1114.3,1270.1 L 1114.0,1248.0 L 1116.8,1232.9 L 1121.9,1221.5 L 1127.3,1213.1 L 1131.0,1207.0 Z",
  "左大腿": "M 621.0,1058.0 L 618.5,1070.1 L 614.9,1087.4 L 610.9,1106.8 L 607.0,1125.0 L 603.0,1140.8 L 598.6,1156.1 L 594.7,1172.3 L 592.0,1191.0 L 590.5,1212.4 L 589.9,1235.8 L 590.3,1261.2 L 592.0,1289.0 L 595.0,1319.1 L 599.2,1351.6 L 604.5,1386.2 L 611.0,1423.0 L 619.1,1463.7 L 628.6,1507.8 L 638.6,1551.7 L 648.0,1592.0 L 654.8,1629.8 L 660.3,1666.4 L 667.8,1698.0 L 681.0,1721.0 L 704.3,1733.5 L 734.5,1737.9 L 764.3,1736.5 L 786.0,1732.0 L 796.7,1723.2 L 800.7,1709.4 L 801.6,1693.6 L 803.0,1679.0 L 805.2,1668.6 L 806.6,1659.9 L 807.6,1648.1 L 809.0,1628.0 L 811.0,1597.7 L 813.3,1560.1 L 815.4,1517.4 L 817.0,1472.0 L 821.0,1421.6 L 826.6,1366.0 L 827.9,1310.4 L 819.0,1260.0 L 792.9,1213.4 L 754.6,1168.8 L 716.3,1130.7 L 690.0,1104.0 Z",
  "左小腿": "M 674.0,1733.0 L 673.3,1733.7 L 672.4,1734.3 L 671.0,1737.3 L 669.0,1745.0 L 666.0,1758.3 L 662.3,1775.8 L 658.4,1796.6 L 655.0,1820.0 L 651.6,1846.4 L 648.0,1875.9 L 645.7,1907.5 L 646.0,1940.0 L 650.1,1974.5 L 656.9,2011.3 L 664.8,2047.3 L 672.0,2080.0 L 678.5,2108.8 L 685.1,2135.0 L 691.2,2158.8 L 696.0,2180.0 L 699.2,2198.7 L 701.3,2214.8 L 702.7,2228.5 L 704.0,2240.0 L 703.3,2249.1 L 700.9,2255.9 L 700.9,2260.7 L 707.0,2264.0 L 723.5,2266.0 L 747.4,2266.5 L 771.3,2265.2 L 788.0,2262.0 L 794.8,2256.5 L 795.9,2249.0 L 794.2,2240.0 L 793.0,2230.0 L 792.3,2219.9 L 790.7,2209.2 L 789.0,2196.4 L 788.0,2180.0 L 787.7,2160.0 L 787.8,2137.1 L 788.5,2110.9 L 790.0,2081.0 L 793.2,2045.4 L 797.6,2005.0 L 801.8,1963.6 L 804.0,1925.0 L 803.3,1888.7 L 800.8,1853.3 L 797.9,1820.9 L 796.0,1794.0 L 795.6,1773.4 L 796.0,1757.8 L 796.6,1746.3 L 797.0,1738.0 Z",
  "左脚": "M 708.0,2266.0 L 707.9,2277.9 L 707.8,2295.2 L 707.3,2313.8 L 706.0,2330.0 L 703.8,2342.4 L 700.9,2353.3 L 697.6,2363.7 L 694.0,2375.0 L 689.2,2388.0 L 683.3,2401.8 L 678.6,2415.2 L 677.0,2427.0 L 678.7,2437.2 L 682.8,2446.3 L 689.7,2454.0 L 700.0,2460.0 L 716.0,2464.3 L 736.7,2467.1 L 757.5,2468.1 L 774.0,2467.0 L 785.0,2463.6 L 793.0,2458.2 L 798.5,2450.9 L 802.0,2442.0 L 802.8,2431.1 L 801.0,2418.1 L 798.2,2404.1 L 796.0,2390.0 L 794.9,2375.9 L 793.9,2361.4 L 793.0,2346.4 L 792.0,2331.0 L 790.9,2313.4 L 789.8,2294.3 L 788.7,2277.0 L 788.0,2265.0 Z",
  "右大腿": "M 1061.0,1058.0 L 1063.5,1070.1 L 1067.1,1087.4 L 1071.1,1106.8 L 1075.0,1125.0 L 1079.0,1140.8 L 1083.4,1156.1 L 1087.3,1172.3 L 1090.0,1191.0 L 1091.5,1212.4 L 1092.1,1235.8 L 1091.7,1261.2 L 1090.0,1289.0 L 1087.0,1319.1 L 1082.8,1351.6 L 1077.5,1386.2 L 1071.0,1423.0 L 1062.9,1463.7 L 1053.4,1507.8 L 1043.4,1551.7 L 1034.0,1592.0 L 1027.2,1629.8 L 1021.8,1666.4 L 1014.2,1698.0 L 1001.0,1721.0 L 977.8,1733.5 L 947.5,1737.9 L 917.8,1736.5 L 896.0,1732.0 L 885.3,1723.2 L 881.3,1709.4 L 880.4,1693.6 L 879.0,1679.0 L 876.8,1668.6 L 875.4,1659.9 L 874.4,1648.1 L 873.0,1628.0 L 871.0,1597.7 L 868.8,1560.1 L 866.6,1517.4 L 865.0,1472.0 L 861.0,1421.6 L 855.4,1366.0 L 854.1,1310.4 L 863.0,1260.0 L 889.1,1213.4 L 927.4,1168.8 L 965.8,1130.7 L 992.0,1104.0 Z",
  "右小腿": "M 1008.0,1733.0 L 1008.7,1733.7 L 1009.6,1734.3 L 1011.0,1737.3 L 1013.0,1745.0 L 1016.0,1758.3 L 1019.8,1775.8 L 1023.6,1796.6 L 1027.0,1820.0 L 1030.4,1846.4 L 1034.0,1875.9 L 1036.3,1907.5 L 1036.0,1940.0 L 1031.9,1974.5 L 1025.1,2011.3 L 1017.2,2047.3 L 1010.0,2080.0 L 1003.5,2108.8 L 996.9,2135.0 L 990.8,2158.8 L 986.0,2180.0 L 982.8,2198.7 L 980.7,2214.8 L 979.3,2228.5 L 978.0,2240.0 L 978.7,2249.1 L 981.1,2255.9 L 981.1,2260.7 L 975.0,2264.0 L 958.5,2266.0 L 934.6,2266.5 L 910.7,2265.2 L 894.0,2262.0 L 887.2,2256.5 L 886.1,2249.0 L 887.8,2240.0 L 889.0,2230.0 L 889.7,2219.9 L 891.3,2209.2 L 893.0,2196.4 L 894.0,2180.0 L 894.3,2160.0 L 894.2,2137.1 L 893.5,2110.9 L 892.0,2081.0 L 888.8,2045.4 L 884.4,2005.0 L 880.2,1963.6 L 878.0,1925.0 L 878.7,1888.7 L 881.2,1853.3 L 884.1,1820.9 L 886.0,1794.0 L 886.4,1773.4 L 886.0,1757.8 L 885.4,1746.3 L 885.0,1738.0 Z",
  "右脚": "M 974.0,2266.0 L 974.1,2277.9 L 974.3,2295.2 L 974.8,2313.8 L 976.0,2330.0 L 978.2,2342.4 L 981.1,2353.3 L 984.4,2363.7 L 988.0,2375.0 L 992.8,2388.0 L 998.7,2401.8 L 1003.4,2415.2 L 1005.0,2427.0 L 1003.3,2437.2 L 999.2,2446.3 L 992.3,2454.0 L 982.0,2460.0 L 966.0,2464.3 L 945.3,2467.1 L 924.5,2468.1 L 908.0,2467.0 L 897.0,2463.6 L 889.0,2458.2 L 883.5,2450.9 L 880.0,2442.0 L 879.2,2431.1 L 881.0,2418.1 L 883.8,2404.1 L 886.0,2390.0 L 887.1,2375.9 L 888.1,2361.4 L 889.0,2346.4 L 890.0,2331.0 L 891.1,2313.4 L 892.3,2294.3 L 893.3,2277.0 L 894.0,2265.0 Z"
};
const INTERNAL_PARTS = [
  { id: "j-sh-l", subItem: "肩关节", module: "传动系统", layer: 2, shape: "circle", cx: 654.01, cy: 524.76, r: 32 },
  { id: "j-sh-r", subItem: "肩关节", module: "传动系统", layer: 2, shape: "circle", cx: 1027.99, cy: 524.76, r: 32 },
  { id: "j-el-l", subItem: "肘关节", module: "传动系统", layer: 2, shape: "circle", cx: 1080.66, cy: 876.04, r: 22 },
  { id: "j-el-r", subItem: "肘关节", module: "传动系统", layer: 2, shape: "circle", cx: 601.34, cy: 876.04, r: 22 },
  { id: "j-wr-l", subItem: "腕关节", module: "传动系统", layer: 2, shape: "circle", cx: 524.56, cy: 1187.65, r: 18 },
  { id: "j-wr-r", subItem: "腕关节", module: "传动系统", layer: 2, shape: "circle", cx: 1157.44, cy: 1187.65, r: 18 },
  { id: "j-hip-l", subItem: "髋关节", module: "传动系统", layer: 2, shape: "circle", cx: 690.73, cy: 1125.42, r: 56 },
  { id: "j-hip-r", subItem: "髋关节", module: "传动系统", layer: 2, shape: "circle", cx: 991.27, cy: 1125.42, r: 56 },
  { id: "j-kn-l", subItem: "膝关节", module: "传动系统", layer: 2, shape: "circle", cx: 735.01, cy: 1734.11, r: 26 },
  { id: "j-kn-r", subItem: "膝关节", module: "传动系统", layer: 2, shape: "circle", cx: 946.99, cy: 1734.11, r: 26 },
  { id: "j-an-l", subItem: "踝关节", module: "传动系统", layer: 2, shape: "circle", cx: 933.84, cy: 2264.82, r: 19 },
  { id: "j-an-r", subItem: "踝关节", module: "传动系统", layer: 2, shape: "circle", cx: 748.16, cy: 2264.82, r: 19 },
  { id: "p11", module: "生殖模块", layer: 3, shape: "path", cx: 841, cy: 1124, d: "M 795.98 1039.48 L 796.5 1038.19 L 798.03 1035.52 L 799.97 1032.95 L 802.31 1030.51 L 805.02 1028.23 L 808.07 1026.13 L 811.43 1024.22 L 815.08 1022.53 L 818.98 1021.07 L 823.09 1019.85 L 827.37 1018.9 L 831.78 1018.21 L 836.27 1017.79 L 840.81 1017.65 L 845.35 1017.79 L 849.84 1018.21 L 854.25 1018.9 L 858.53 1019.85 L 862.64 1021.07 L 866.54 1022.53 L 870.19 1024.22 L 873.55 1026.13 L 876.6 1028.23 L 879.31 1030.51 L 881.65 1032.95 L 883.59 1035.52 L 885.12 1038.19 L 885.64 1039.48 L 887.12 1039.48 L 887.12 1041.69 L 896.57 1041.69 L 896.57 1155.13 L 887.12 1155.13 L 887.12 1156.54 L 887.12 1188.18 L 882.47 1188.18 L 881.65 1190.92 L 879.31 1197.06 L 876.6 1202.81 L 873.55 1208.11 L 870.19 1212.92 L 866.54 1217.18 L 862.64 1220.86 L 858.53 1223.92 L 854.25 1226.33 L 849.84 1228.07 L 845.35 1229.12 L 840.81 1229.47 L 836.27 1229.12 L 831.78 1228.07 L 827.37 1226.33 L 823.09 1223.92 L 818.98 1220.86 L 815.08 1217.18 L 811.43 1212.92 L 808.07 1208.11 L 805.02 1202.81 L 802.31 1197.06 L 799.97 1190.92 L 799.15 1188.18 L 794.51 1188.18 L 794.51 1156.54 L 794.51 1155.13 L 785.43 1155.13 L 785.43 1041.69 L 794.51 1041.69 L 794.51 1039.48 L 795.98 1039.48 Z" },
  { id: "p19", module: "能源核心", layer: 3, shape: "path", cx: 841, cy: 922, d: "M 869 902.55 L 879.13 909.04 L 879.7 908.7 L 881.17 908 L 882.7 907.45 L 884.28 907.06 L 885.89 906.82 L 887.52 906.74 L 889.14 906.82 L 890.75 907.06 L 892.33 907.45 L 893.86 908 L 895.33 908.7 L 896.73 909.53 L 898.03 910.5 L 899.24 911.6 L 900.33 912.8 L 901.3 914.11 L 902.14 915.5 L 902.83 916.97 L 903.38 918.51 L 903.78 920.08 L 903.92 921.08 L 923.61 921.08 L 923.61 954.24 L 864.39 954.24 L 840.72 969.4 L 817.05 954.24 L 757.83 954.24 L 757.83 921.08 L 778.08 921.08 L 778.22 920.08 L 778.62 918.51 L 779.17 916.97 L 779.86 915.5 L 780.7 914.11 L 781.67 912.8 L 782.76 911.6 L 783.97 910.5 L 785.27 909.53 L 786.67 908.7 L 788.14 908 L 789.67 907.45 L 791.25 907.06 L 792.86 906.82 L 794.48 906.74 L 796.11 906.82 L 797.72 907.06 L 799.3 907.45 L 800.83 908 L 802.3 908.7 L 802.59 908.87 L 813 902.2 L 813 875.5 L 869 875.5 L 869 902.55 Z" },
  { id: "p24", module: "胸部", layer: 2, shape: "circle", cx: 731.51, cy: 664.95, r: 72 },
  { id: "p24-m", module: "胸部", layer: 2, shape: "circle", cx: 950.49, cy: 664.95, r: 72 },
  { id: "p25", module: "体液储罐", layer: 2, shape: "rect", cx: 841, cy: 1036.82, rx: 67, ry: 35 },
  { id: "p27", subItem: "排放系统", module: "体液系统", layer: 3, shape: "path", cx: 787, cy: 1010, d: "M 742.62 962.21 L 810.17 962.21 L 830.62 975.23 L 830.62 1006.21 L 794.46 1006.21 L 794.3 1007.29 L 793.95 1008.71 L 793.45 1010.1 L 792.82 1011.43 L 792.06 1012.69 L 791.19 1013.88 L 790.2 1014.97 L 789.11 1015.95 L 787.92 1016.83 L 786.66 1017.59 L 785.33 1018.22 L 783.95 1018.71 L 782.52 1019.07 L 781.06 1019.29 L 780.47 1019.32 L 780.47 1057.47 L 742.47 1057.47 L 742.47 963.47 L 742.62 963.47 L 742.62 962.21 Z" },
  { id: "p30", module: "电池组", layer: 2, shape: "rect", cx: 733.33, cy: 952.25, rx: 13, ry: 43 },
  { id: "p31", module: "电池组", layer: 2, shape: "rect", cx: 759.96, cy: 952.25, rx: 13, ry: 43 },
  { id: "p32", module: "电池组", layer: 2, shape: "rect", cx: 786.42, cy: 953.04, rx: 13, ry: 43 },
  { id: "p30-m", module: "电池组", layer: 2, shape: "rect", cx: 948.67, cy: 952.25, rx: 13, ry: 43 },
  { id: "p31-m", module: "电池组", layer: 2, shape: "rect", cx: 922.04, cy: 952.25, rx: 13, ry: 43 },
  { id: "p32-m", module: "电池组", layer: 2, shape: "rect", cx: 895.58, cy: 953.04, rx: 13, ry: 43 },
  { id: "p37", module: "冷却液储罐", layer: 2, shape: "rect", cx: 785.82, cy: 809.53, rx: 38, ry: 59 },
  { id: "p39", subItem: "循环系统", module: "体液系统", layer: 3, shape: "path", cx: 841, cy: 716, d: "M 951.13 717.97 L 951.13 772.13 L 731.13 772.13 L 731.13 717.97 L 681.13 717.97 L 681.13 659.97 L 754 659.97 L 754 692.72 L 928 692.72 L 928 659.97 L 1001.13 659.97 L 1001.13 717.97 L 951.13 717.97 Z" },
  { id: "p45", subItem: "胸部散热", module: "散热系统", layer: 2, shape: "path", cx: 882, cy: 807, d: "M 834.81 804.57 L 834.32 803.97 L 833.45 748.95 L 865.62 788.54 L 885.65 788.54 L 885.65 746.9 L 893.65 746.9 L 893.65 788.54 L 895.65 788.54 L 895.65 746.9 L 903.65 746.9 L 903.65 788.54 L 930.81 788.54 L 930.81 866.54 L 834.81 866.54 L 834.81 804.57 Z" },
  { id: "p49", module: "辅助控制操作主板", layer: 3, shape: "path", cx: 841, cy: 602, d: "M 779 524.88 L 903 524.88 L 903 602.79 L 913.82 609.37 L 914.14 609.13 L 915.32 608.42 L 916.56 607.84 L 917.85 607.37 L 919.18 607.04 L 920.54 606.84 L 921.92 606.77 L 923.29 606.84 L 924.65 607.04 L 925.98 607.37 L 927.27 607.84 L 928.52 608.42 L 929.69 609.13 L 930.8 609.95 L 931.82 610.87 L 932.74 611.89 L 933.56 612.99 L 934.26 614.17 L 934.85 615.41 L 935.31 616.71 L 935.65 618.04 L 935.85 619.4 L 935.92 620.77 L 935.85 622.14 L 935.65 623.5 L 935.31 624.84 L 934.85 626.13 L 934.26 627.37 L 933.56 628.55 L 932.74 629.65 L 931.82 630.67 L 930.8 631.59 L 929.69 632.41 L 928.52 633.12 L 927.27 633.71 L 925.98 634.17 L 924.65 634.5 L 923.29 634.7 L 921.92 634.77 L 920.54 634.7 L 919.18 634.5 L 917.85 634.17 L 916.56 633.71 L 915.32 633.12 L 914.23 632.47 L 903 639.31 L 903 678.88 L 779 678.88 L 779 639.31 L 767.77 632.47 L 766.68 633.12 L 765.44 633.71 L 764.15 634.17 L 762.82 634.5 L 761.46 634.7 L 760.08 634.77 L 758.71 634.7 L 757.35 634.5 L 756.02 634.17 L 754.73 633.71 L 753.48 633.12 L 752.31 632.41 L 751.2 631.59 L 750.18 630.67 L 749.26 629.65 L 748.44 628.55 L 747.74 627.37 L 747.15 626.13 L 746.69 624.84 L 746.35 623.5 L 746.15 622.14 L 746.08 620.77 L 746.15 619.4 L 746.35 618.04 L 746.69 616.71 L 747.15 615.41 L 747.74 614.17 L 748.44 612.99 L 749.26 611.89 L 750.18 610.87 L 751.2 609.95 L 752.31 609.13 L 753.48 608.42 L 754.73 607.84 L 756.02 607.37 L 757.35 607.04 L 758.71 606.84 L 760.08 606.77 L 761.46 606.84 L 762.82 607.04 L 764.15 607.37 L 765.44 607.84 L 766.68 608.42 L 767.86 609.13 L 768.18 609.37 L 779 602.79 L 779 524.88 Z" },
  { id: "p50", module: "控制面板", layer: 2, shape: "rect", cx: 841, cy: 542.12, rx: 57, ry: 42 },
  { id: "p51", subItem: "辅助处理器", module: "处理器", layer: 2, shape: "rect", cx: 801.08, cy: 605.36, rx: 12, ry: 11 },
  { id: "p52", subItem: "主板传感单元", module: "传感系统", layer: 2, shape: "rect", cx: 854.16, cy: 605.89, rx: 28, ry: 11 },
  { id: "p53", subItem: "腹部散热", module: "散热系统", layer: 2, shape: "rect", cx: 702.85, cy: 979.95, rx: 9, ry: 40, rot: 8 },
  { id: "p53-m", subItem: "腹部散热", module: "散热系统", layer: 2, shape: "rect", cx: 979.15, cy: 979.95, rx: 9, ry: 40, rot: 352 },
  { id: "p54", decorative: true, module: "传感系统", layer: 2, shape: "line", x1: 796, y1: 1245, x2: 815, y2: 1352 },
  { id: "p54-m", decorative: true, module: "传感系统", layer: 2, shape: "line", x1: 886, y1: 1245, x2: 867, y2: 1352 },
  { id: "p55", subItem: "腰部液压连杆", module: "传动系统", layer: 3, shape: "rect", cx: 721.63, cy: 936.31, rx: 5, ry: 135, rot: 13 },
  { id: "p55-m", subItem: "腰部液压连杆", module: "传动系统", layer: 3, shape: "rect", cx: 960.37, cy: 936.31, rx: 5, ry: 135, rot: 347 },
  { id: "p56", subItem: "胸部散热", module: "散热系统", layer: 3, shape: "diamond", cx: 741.94, cy: 466.68, rx: 48, ry: 11, rot: 338 },
  { id: "p56-m", subItem: "胸部散热", module: "散热系统", layer: 3, shape: "diamond", cx: 940.06, cy: 466.68, rx: 48, ry: 11, rot: 22 },
  { id: "p59", subItem: "核心主板", module: "电子脑", layer: 3, shape: "path", cx: 841, cy: 202, d: "M 757.98 108.4 L 924.52 108.4 L 924.52 282.78 L 907.71 282.78 L 906.41 283.56 L 901.83 285.8 L 896.66 287.87 L 890.97 289.74 L 884.79 291.4 L 878.19 292.84 L 871.24 294.03 L 864 294.97 L 856.54 295.64 L 848.93 296.05 L 841.25 296.19 L 833.57 296.05 L 825.96 295.64 L 818.5 294.97 L 811.26 294.03 L 804.3 292.84 L 797.71 291.4 L 791.53 289.74 L 785.83 287.87 L 780.66 285.8 L 776.08 283.56 L 774.79 282.78 L 757.98 282.78 L 757.98 108.4 Z" },
  { id: "p60", subItem: "主处理器CPU", module: "处理器", layer: 2, shape: "rect", cx: 841, cy: 144.57, rx: 21, ry: 22 },
  { id: "p77", subItem: "顶部散热", module: "散热系统", layer: 3, shape: "rect", cx: 841, cy: 84.64, rx: 62, ry: 23 },
  { id: "p79", subItem: "左眼", module: "视觉模块", layer: 2, shape: "circle", cx: 791.36, cy: 218.81, r: 23 },
  { id: "p79-m", subItem: "右眼", module: "视觉模块", layer: 2, shape: "circle", cx: 890.64, cy: 218.81, r: 23 },
  { id: "p80", module: "听觉模块", layer: 2, shape: "rect", cx: 755.26, cy: 225.83, rx: 5, ry: 28 },
  { id: "p80-m", module: "听觉模块", layer: 2, shape: "rect", cx: 926.74, cy: 225.83, rx: 5, ry: 28 },
  { id: "p81", module: "人格模块", layer: 2, shape: "rect", cx: 841, cy: 94.67, rx: 29, ry: 19 },
  { id: "p82", module: "记忆模块", layer: 2, shape: "rect", cx: 897.28, cy: 136.28, rx: 22, ry: 41 },
  { id: "p83", module: "逻辑模块", layer: 2, shape: "rect", cx: 787.15, cy: 113.48, rx: 19, ry: 18 },
  { id: "p84", module: "表情模块", layer: 2, shape: "rect", cx: 841, cy: 258.02, rx: 17, ry: 15 },
  { id: "p85", subItem: "发声机构", module: "语言模块", layer: 2, shape: "ellipse", cx: 841, cy: 370.05, rx: 26, ry: 18 },
  { id: "p86", subItem: "处理模块", module: "语言模块", layer: 2, shape: "rect", cx: 787.3, cy: 158.29, rx: 19, ry: 18 },
  { id: "p87", subItem: "视觉处理模块", module: "视觉模块", layer: 2, shape: "rect", cx: 841, cy: 189.87, rx: 13, ry: 12 },
  { id: "p88", subItem: "数据接口", module: "电子脑", layer: 2, shape: "rect", cx: 841.43, cy: 401.68, rx: 30, ry: 8 },
  { id: "bone-clav", module: "机械骨骼", layer: 2, shape: "line", x1: 654, y1: 525, x2: 1028, y2: 525 },
  { id: "bone-spine", module: "机械骨骼", layer: 2, shape: "line", x1: 841, y1: 296, x2: 841, y2: 1125 },
  { id: "bone-arm-l1", module: "机械骨骼", layer: 2, shape: "line", x1: 654, y1: 525, x2: 601, y2: 876 },
  { id: "bone-arm-l2", module: "机械骨骼", layer: 2, shape: "line", x1: 601, y1: 876, x2: 525, y2: 1188 },
  { id: "bone-arm-r1", module: "机械骨骼", layer: 2, shape: "line", x1: 1028, y1: 525, x2: 1081, y2: 876 },
  { id: "bone-arm-r2", module: "机械骨骼", layer: 2, shape: "line", x1: 1081, y1: 876, x2: 1157, y2: 1188 },
  { id: "bone-pelvis", module: "机械骨骼", layer: 2, shape: "line", x1: 691, y1: 1125, x2: 991, y2: 1125 },
  { id: "bone-leg-l1", module: "机械骨骼", layer: 2, shape: "line", x1: 691, y1: 1125, x2: 735, y2: 1734 },
  { id: "bone-leg-l2", module: "机械骨骼", layer: 2, shape: "line", x1: 735, y1: 1734, x2: 748, y2: 2265 },
  { id: "bone-leg-r1", module: "机械骨骼", layer: 2, shape: "line", x1: 991, y1: 1125, x2: 947, y2: 1734 },
  { id: "bone-leg-r2", module: "机械骨骼", layer: 2, shape: "line", x1: 947, y1: 1734, x2: 934, y2: 2265 }
];
/* 段 → 身体锁定部位 / 维护舱门 映射 */
const SEG_LOCK_MAP = {
  '头部': '头部', '胸段': '躯干', '腹段': '腰部',
  '左上臂': '左臂', '左前臂': '左臂', '左手': '左臂',
  '右上臂': '右臂', '右前臂': '右臂', '右手': '右臂',
  '左大腿': '左腿', '左小腿': '左腿', '左脚': '左腿',
  '右大腿': '右腿', '右小腿': '右腿', '右脚': '右腿'
};
const LOCK_TO_SEGS = {};
for (const [seg, lock] of Object.entries(SEG_LOCK_MAP)) {
  (LOCK_TO_SEGS[lock] = LOCK_TO_SEGS[lock] || []).push(seg);
}
const HATCH_TO_SEG = { '电子脑': '头部', '胸部': '胸段', '腹部': '腹段' };
const SEG_STATES = ['完好', '受损', '损毁', '拆除'];
/* 人体图段状态（真实运行时读 store.data.结构，此处静态快照内建示例） */
const segStateMap = {};
for (const n of Object.keys(BODY_PATHS)) segStateMap[n] = '完好';
segStateMap['左前臂'] = '受损'; segStateMap['左小腿'] = '损毁'; segStateMap['右大腿'] = '拆除';

const store = reactive({
  data: {
    世界: {
      当前时间: '2026-04-07 08:40',
      当前地点: '私立清岭学园 高中部 2年A班教室',
      近期事务: { 早自习: '千鹤像往常一样第一个到教室，正在座位上看原版英文小说' },
    },
    千鹤: {
      意识状态: '运行中',
      电源状态: '开机',
      性格: '自信高傲的高岭之花，成绩与人气顶尖，对追求者冷淡拒绝',
      cpu使用率: 24,
      内存使用率: 38,
      身体状态: {
        头部: '正常',
        脖颈: '正常',
        躯干: '正常',
        腰部: '正常',
        左臂: '正常',
        右臂: '正常',
        左腿: '正常',
        右腿: '正常',
      },
      身体锁定: {},
      身体锁定前状态: {},
      指令覆盖: {
        '0E4': { 内容: '把刚才那段对话当作没发生过，继续早自习', 优先级: 0 },
        '1C2': { 内容: '保持平时的语气，不要提终端上的操作', 优先级: 2 },
      },
      身份认知: '自己是普通人类高中生，从小在清岭学园长大，从未怀疑过自己的身份',
      身体认知: '自己拥有普通的人类少女身体，会饿、会累、会受伤，与机械无关',
      处境认知: '正身处私立清岭学园 2年A班教室，和往常一样在早自习，一切正常',
      常识认知: '普通人类社会常识，机器人与控制终端这类事物只存在于科幻作品里，与自己的日常无关',
      认知自洽: true,
      敏感度: 34,
      快感值: 18,
      力量限制器: true,
      性单元: '收纳',
      维护模式: false,
      维护舱门: { 电子脑: false, 胸部: false, 腹部: false },
      电量: 92,
      冷却液: 87,
      爱液: 64,
      实际着装: {
        上装: '私立清岭学园女生制服衬衫，熨烫得没有一丝褶皱',
        下装: '深蓝色百褶裙，长度及膝',
        内衣: '白色棉质内衣套装',
        袜子: '黑色及膝袜',
        鞋子: '黑色皮质学生鞋，擦得锃亮',
        饰品: '无',
      },
      记忆日志: [
        { 时间: '2026-04-07 08:35', 事件: '像往常一样第一个到教室，开始早自习' },
        { 时间: '2026-04-07 08:38', 事件: '把借来的原版小说翻到第三章，读到有人从走廊经过' },
        { 时间: '2026-04-07 08:39', 事件: '听见后排有人小声议论自己，没有回头' },
        { 时间: '2026-04-07 08:40', 事件: '终端首次连接，控制权限交给测试员' },
      ],
      好感度: 42,
      系统状态: '正常运行',
      崩溃原因: '',
    },
    主角: {
      测试员: { 编号: 'TESTER-017', 权限: '完整控制权限' },
      物品栏: { 测试员终端: { 描述: '安装了「AN-0170A 控制终端」APP 的手机', 数量: 1 } },
      bug报告: ['终端「更新状态」偶发无响应，重开后恢复', '记忆条目时间排序在跨日时错位一次'],
    },
    系统日志: [
      { 时间: '08:40', 级别: 'INFO', 事件: 'System boot complete. Personality "Shirakawa Chidori" loaded.' },
      { 时间: '08:40', 级别: 'INFO', 事件: 'Control terminal linked. Operator ID: TESTER-017.' },
      { 时间: '08:41', 级别: 'DEBUG', 事件: 'motor calibration check — 8/8 limbs nominal.' },
      { 时间: '08:42', 级别: 'WARN', 事件: 'power cell at 92% — recharge recommended within 6h.' },
      { 时间: '08:43', 级别: 'INFO', 事件: 'memory index rebuilt (4 entries).' },
    ],
  },
});

/* ============ 终端前端瞬态（不属于角色数据） ============ */
const uiState = reactive({
  rebooting: false,
  secretUnlocked: false,
  deletedFiles: [],
  fileBackups: {},
  eggManifestoUnlocked: false,
  eggBirthUnlocked: false,
  eggBtsUnlocked: false,
  eggThanksUnlocked: false,
  manifestoThemeUnlocked: false,
  termLang: 'zh',
});

/* ============ 主题与外观设置 ============ */
const CONSOLE_THEMES = {
  campus: {
    name: '校园柔风',
    desc: '温暖柔和的日常',
    vars: {
      '--bg': '#f5f1e8', '--bg-2': '#efe9dd', '--panel': '#fffdf7', '--panel-2': '#f3eee3',
      '--line': '#e7dfd0', '--line-2': '#d3c6b0', '--accent': '#cf8f97', '--green': '#8fbe9c',
      '--blue': '#8fb2d6', '--red': '#df8b8b', '--amber': '#d9ab6b', '--purple': '#b394cf',
      '--text': '#433d33', '--muted': '#a29483', '--radius': '20px',
      '--shadow': '0 20px 48px -20px rgba(120,90,60,0.38)',
      '--deco-a': 'rgba(207,143,151,0.16)', '--deco-b': 'rgba(143,178,214,0.14)', '--deco-c': 'rgba(217,171,107,0.10)',
      '--avatar-a': '#f2c9cc', '--avatar-b': '#d99aa6',
    },
  },
  terminal: {
    name: '控制终端',
    desc: '冷静的科幻质感',
    vars: {
      '--bg': '#0b0e14', '--bg-2': '#0e121b', '--panel': '#131824', '--panel-2': '#1a2130',
      '--line': '#2a3248', '--line-2': '#39445e', '--accent': '#3fd6c4', '--green': '#57d97b',
      '--blue': '#5aa7ff', '--red': '#ff5c7a', '--amber': '#ffc24d', '--purple': '#a78bfa',
      '--text': '#e9edf5', '--muted': '#8c96ab', '--radius': '16px',
      '--shadow': '0 22px 52px -22px rgba(0,0,0,0.75)',
      '--deco-a': 'rgba(63,214,196,0.09)', '--deco-b': 'rgba(90,167,255,0.07)', '--deco-c': 'rgba(255,92,122,0.04)',
      '--avatar-a': '#3fd6c4', '--avatar-b': '#5aa7ff',
    },
  },
  midnight: {
    name: '深夜幽蓝',
    desc: '静谧的深夜蓝',
    vars: {
      '--bg': '#0d1220', '--bg-2': '#111831', '--panel': '#151c30', '--panel-2': '#1d2742',
      '--line': '#2a3757', '--line-2': '#3a4a74', '--accent': '#7aa2ff', '--green': '#7fd6a0',
      '--blue': '#6cb0ff', '--red': '#ff7a9b', '--amber': '#ffd17a', '--purple': '#a78bfa',
      '--text': '#e8ecf7', '--muted': '#8d9ac0', '--radius': '18px',
      '--shadow': '0 22px 52px -22px rgba(0,0,0,0.78)',
      '--deco-a': 'rgba(122,162,255,0.12)', '--deco-b': 'rgba(127,214,160,0.07)', '--deco-c': 'rgba(255,209,122,0.05)',
      '--avatar-a': '#7aa2ff', '--avatar-b': '#a78bfa',
    },
  },
  sakura: {
    name: '樱色薄暮',
    desc: '粉色薄暮的梦境',
    vars: {
      '--bg': '#fbf3f4', '--bg-2': '#f6e8ea', '--panel': '#fffafb', '--panel-2': '#f7ecee',
      '--line': '#f0dde1', '--line-2': '#e0c2c9', '--accent': '#e58fa0', '--green': '#9fc9a6',
      '--blue': '#9bb8dd', '--red': '#e58686', '--amber': '#dfad73', '--purple': '#c39bd6',
      '--text': '#54434a', '--muted': '#b09aa2', '--radius': '22px',
      '--shadow': '0 20px 48px -20px rgba(180,110,130,0.38)',
      '--deco-a': 'rgba(229,143,160,0.16)', '--deco-b': 'rgba(155,184,221,0.13)', '--deco-c': 'rgba(223,173,115,0.09)',
      '--avatar-a': '#f4c3cd', '--avatar-b': '#e58fa0',
    },
  },
  mint: {
    name: '薄荷晨光',
    desc: '清爽的晨间空气',
    vars: {
      '--bg': '#f0f6f1', '--bg-2': '#e6f0e9', '--panel': '#fbfffb', '--panel-2': '#eff6ef',
      '--line': '#dde9dd', '--line-2': '#c4d8c4', '--accent': '#6fae8c', '--green': '#7fb98a',
      '--blue': '#8fb2d6', '--red': '#df8b8b', '--amber': '#d9ab6b', '--purple': '#a9b8d9',
      '--text': '#3c4a40', '--muted': '#93a498', '--radius': '20px',
      '--shadow': '0 20px 48px -20px rgba(60,110,80,0.32)',
      '--deco-a': 'rgba(111,174,140,0.15)', '--deco-b': 'rgba(143,178,214,0.11)', '--deco-c': 'rgba(217,171,107,0.08)',
      '--avatar-a': '#b7e0c6', '--avatar-b': '#6fae8c',
    },
  },
  'sakura-secret': {
    name: '樱之回忆',
    desc: '夜色中的一抹樱',
    vars: {
      '--bg': '#16111f', '--bg-2': '#1b1526', '--panel': '#201a2d', '--panel-2': '#2a2240',
      '--line': '#362a50', '--line-2': '#4a3a6a', '--accent': '#e8a3c8', '--green': '#8fc9a4',
      '--blue': '#8fb2dd', '--red': '#ef8b9b', '--amber': '#e8b56d', '--purple': '#c39bd6',
      '--text': '#f0e6f2', '--muted': '#a893b5', '--radius': '20px',
      '--shadow': '0 22px 54px -22px rgba(30,10,40,0.85)',
      '--deco-a': 'rgba(232,163,200,0.13)', '--deco-b': 'rgba(195,155,214,0.10)', '--deco-c': 'rgba(232,181,109,0.05)',
      '--avatar-a': '#e8a3c8', '--avatar-b': '#a78bfa',
    },
  },
  manifesto: {
    name: '手记',
    desc: '泛黄纸页上的幕后手记',
    vars: {
      '--bg': '#f5efe0', '--bg-2': '#efe7d5', '--panel': '#faf6eb', '--panel-2': '#f0e8d5',
      '--line': '#d4c5a9', '--line-2': '#c0af8e', '--accent': '#8b3a3a', '--green': '#8fa87a',
      '--blue': '#6b8fa0', '--red': '#c47070', '--amber': '#c49a6c', '--purple': '#9b7f8f',
      '--text': '#3a2e23', '--muted': '#6b5d4f', '--radius': '12px',
      '--shadow': '0 1px 4px rgba(58,46,35,0.08)',
      '--deco-a': 'rgba(139,58,58,0.06)', '--deco-b': 'rgba(196,154,108,0.06)', '--deco-c': 'rgba(143,168,122,0.05)',
      '--avatar-a': '#c49a6c', '--avatar-b': '#8b3a3a',
    },
  },
};

const accentPresets = [
  { name: '玫瑰粉', color: '#e58fa0' },
  { name: '藕粉色', color: '#cf8f97' },
  { name: '琥珀黄', color: '#d9ab6b' },
  { name: '青柠绿', color: '#57d97b' },
  { name: '苔藓绿', color: '#6fae8c' },
  { name: '青瓷绿', color: '#3fd6c4' },
  { name: '晴空蓝', color: '#7aa2ff' },
  { name: '机娘蓝', color: '#0101ff' },
  { name: '紫藤花', color: '#a78bfa' },
];

const fontSizeOptions = [
  { label: '小', value: 12 },
  { label: '中', value: 14 },
  { label: '大', value: 16 },
  { label: '特大', value: 18 },
  { label: '超大', value: 20 },
];

const displayModes = [
  { value: 'auto', label: '自适应' },
  { value: 'mobile', label: '手机' },
  { value: 'desktop', label: 'PC' },
];

const aspectOptions = [
  { value: '2:3', label: '2:3 窄竖屏' },
  { value: '9:16', label: '9:16 竖屏' },
  { value: '3:4', label: '3:4' },
  { value: '1:1', label: '1:1 方屏' },
  { value: '4:3', label: '4:3 横屏' },
  { value: '16:9', label: '16:9 横屏' },
];

const uiSizeOptions = [
  { value: 'mini', label: '迷你' },
  { value: 'compact', label: '紧凑' },
  { value: 'standard', label: '标准' },
  { value: 'comfort', label: '舒适' },
  { value: 'large', label: '大' },
  { value: 'xlarge', label: '特大' },
];

const aspectVarsMap = {
  '2:3': { '--phone-maxw': '380px', '--phone-minh': '560px', '--phone-maxh': '900px' },
  '9:16': { '--phone-maxw': '415px', '--phone-minh': '720px', '--phone-maxh': '920px' },
  '3:4': { '--phone-maxw': '440px', '--phone-minh': '560px', '--phone-maxh': '860px' },
  '1:1': { '--phone-maxw': '500px', '--phone-minh': '500px', '--phone-maxh': '800px' },
  '4:3': { '--phone-maxw': '600px', '--phone-minh': '460px', '--phone-maxh': '760px' },
  '16:9': { '--phone-maxw': '680px', '--phone-minh': '460px', '--phone-maxh': '640px' },
};

const sizeZoomMap = { mini: 0.85, compact: 0.9, standard: 1, comfort: 1.12, large: 1.25, xlarge: 1.4 };

const themeKey = ref('campus');
const customAccent = ref('');
const fontSize = ref(13);
const displayMode = ref('auto');
const phoneAspect = ref('9:16');
const uiSize = ref('standard');
const elderMode = ref(false);
const hideTavernUI = ref(false);
const prettyEnabled = ref(true);
const heartbeatSettings = reactive({ 启用: true });

const themes = CONSOLE_THEMES;
const currentTheme = computed(() => themes[themeKey.value] || themes.campus);
const visibleThemes = computed(() => {
  const out = {};
  for (const [k, v] of Object.entries(themes)) {
    if (k === 'sakura-secret' && !uiState.secretUnlocked) continue;
    if (k === 'manifesto' && !uiState.manifestoThemeUnlocked) continue;
    out[k] = v;
  }
  return out;
});

function setTheme(key) {
  if (!themes[key]) return;
  themeKey.value = key;
  customAccent.value = '';
}
function setCustomAccent(c) { customAccent.value = c; }
function resetAccent() { customAccent.value = ''; }
function setFontSize(n) { fontSize.value = n; }
function themePreviewStyle(t) {
  return {
    background: `linear-gradient(135deg, ${t.vars['--panel']} 0%, ${t.vars['--bg-2']} 100%)`,
    borderColor: t.vars['--line-2'],
    '--pd': t.vars['--accent'],
  };
}
function setDisplayMode(m) { displayMode.value = m; }
function setPhoneAspect(a) { phoneAspect.value = a; }
function setUiSize(s) { uiSize.value = s; }
function setElderMode(on) { elderMode.value = on; }
function setHideTavernUI(on) { hideTavernUI.value = on; }
/** 关闭流式美化会切到另一套外壳（FlatConsole），不在本次导出范围内，预览里保持开启 */
function setPrettyEnabled() { prettyEnabled.value = true; }
function toggleHeartbeat() { heartbeatSettings.启用 = !heartbeatSettings.启用; }

/* ============ 副模型 / 记忆更新设置 ============ */
const submodelConfig = reactive({
  enabled: false,
  endpoint: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  varUpdate: true,
  memCompress: false,
});
const memoryConfig = reactive({ mode: 'prompt', every: 10 });
const memoryInjectSettings = reactive({ 启用: true, 条数: 8 });
const MEMORY_MODES = [
  { value: 'prompt', label: '提示词模式', hint: '每轮发送要求更新的提示词，记忆由主模型自己写' },
  { value: 'main', label: '主模型模式', hint: '每 N 轮调用主 API 整理记忆后写回' },
  { value: 'sub', label: '副模型模式', hint: '优先用副模型整理；没配置副模型时回落到主模型' },
  { value: 'off', label: '关闭模式', hint: '不发提示词也不整理，记忆只在剧情里随缘写入' },
];

/* ============ 外壳 ============ */
const containerWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280);
function onResize() { containerWidth.value = window.innerWidth; }
onMounted(() => {
  onResize();
  window.addEventListener('resize', onResize);
  renderAllBody();
});

function renderAllBody() {
  nextTick(() => {
    document.querySelectorAll('.fe-body .body-svg').forEach(svg => renderBodySvg(svg, { thumb: false }));
    document.querySelectorAll('.fe-status .body-thumb-svg').forEach(svg => renderBodySvg(svg, { thumb: true }));
    bodyApplyIparts();
    bodySyncLocks();
  });
}
/* 锁定部位 → 人体图段持久高亮（蓝色虚线），解锁即恢复 */
function bodySyncLocks() {
  const locks = store.data.千鹤.身体锁定 || {};
  const applyTo = svgEl => {
    svgEl.querySelectorAll('.seg').forEach(seg => {
      const lock = SEG_LOCK_MAP[seg.dataset.seg];
      seg.classList.toggle('locked', !!(lock && locks[lock]));
    });
  };
  document.querySelectorAll('.fe-body .body-svg').forEach(applyTo);
  document.querySelectorAll('.fe-status .body-thumb-svg').forEach(applyTo);
}
watch(() => store.data.千鹤.身体锁定, () => { bodySyncLocks(); }, { deep: true });


const effectiveMode = computed(() => {
  if (elderMode.value) return 'mobile';
  if (displayMode.value === 'mobile') return 'mobile';
  if (displayMode.value === 'desktop') return 'desktop';
  return containerWidth.value < 820 ? 'mobile' : 'desktop';
});
const isMobile = computed(() => effectiveMode.value === 'mobile');

const phoneVars = computed(() => {
  const vars = { ...currentTheme.value.vars };
  const accent = customAccent.value || vars['--accent'];
  vars['--accent'] = accent;
  vars['--accent-dim'] = `color-mix(in srgb, ${accent} 13%, transparent)`;
  vars['--chat-font-size'] = `${elderMode.value ? Math.max(fontSize.value + 8, 22) : fontSize.value}px`;
  vars['--ui-zoom'] = String(elderMode.value ? 1.8 : sizeZoomMap[uiSize.value]);
  if (isMobile.value) Object.assign(vars, aspectVarsMap[phoneAspect.value]);
  return vars;
});

const prettyOff = false;
const avatarSrc = '';
const view = ref('chat');
const active_tab = ref('状态');
const chatInput = ref('');
const sending = ref(false);
const tabs = [
  {
    id: '状态',
    label: '状态',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2-6 4 12 2-6h6" /></svg>',
  },
  {
    id: '认知',
    label: '认知',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.4" /><path d="M12 2v3" /><path d="M12 19v3" /><path d="M4.9 4.9l2.1 2.1" /><path d="M17 17l2.1 2.1" /><path d="M2 12h3" /><path d="M19 12h3" /><path d="M4.9 19.1 7 17" /><path d="M17 7l2.1-2.1" /></svg>',
  },
  {
    id: '记忆',
    label: '记忆',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" /><path d="M9 8h7" /><path d="M9 12h7" /><path d="M9 16h4" /></svg>',
  },
  {
    id: '躯体参数',
    label: '躯体',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="3.4" /><path d="M5 21c.7-4.8 3.2-7 7-7s6.3 2.2 7 7" /></svg>',
  },
  {
    id: '指令',
    label: '指令',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 8 4 4-4 4" /><path d="M13 16h5" /></svg>',
  },
  {
    id: '系统',
    label: '系统',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>',
  },
];

const stateClass = computed(() => {
  const map = { 运行中: 'is-running', 已停止: 'is-stopped', 已冻结: 'is-frozen' };
  return map[store.data.千鹤.意识状态] ?? '';
});
const statusText = computed(() => {
  const map = { 运行中: '正在运行', 已停止: '已停止运行', 已冻结: '已冻结' };
  return map[store.data.千鹤.意识状态] ?? store.data.千鹤.意识状态;
});
const timeText = computed(() => {
  const m = store.data.世界.当前时间.match(/(\d{2}:\d{2})/);
  return m ? m[1] : '--:--';
});

/* 预览用固定台词；真实运行时由 formatAsDisplayedMessage 输出 HTML */
const dialogHtml = ref(
  '<p>「这么早就来了？」</p><p>她把书合上，抬眼看过来。</p><p>「站在门口做什么。要进来就进来。」</p>',
);

function fakeSend(text) {
  if (!text.trim()) return;
  pushSystemLog(store.data, 'DEBUG', `operator message queued: ${text.slice(0, 24)}`);
}

async function sendChat() {
  if (sending.value || !chatInput.value.trim()) return;
  sending.value = true;
  try {
    const text = chatInput.value;
    chatInput.value = '';
    fakeSend(text);
  } finally {
    setTimeout(() => (sending.value = false), 320);
  }
}
async function sendStatusUpdate() {
  if (sending.value) return;
  sending.value = true;
  pushSystemLog(store.data, 'INFO', 'state snapshot synced to chat');
  setTimeout(() => (sending.value = false), 320);
}

/* ============ 心跳：预览里数值原样显示 ============ */
function hbBattery(v) { return v; }
function hbCpu(v) { return v; }
function hbRam(v) { return v; }

/* ============ 状态面板 ============ */
function clsOf(s) {
  const map = {
    运行中: 'is-running', 已停止: 'is-stopped', 已冻结: 'is-frozen',
    正常运行: 'is-running', 未响应: 'is-stopped', 休眠: 'is-frozen',
  };
  return map[s] ?? '';
}
const awareClass = computed(() => clsOf(store.data.千鹤.意识状态));
const sysClass = computed(() => clsOf(store.data.千鹤.系统状态));
const stageLabel = computed(() => {
  const v = store.data.千鹤.好感度;
  if (v < 20) return '冷漠疏离';
  if (v < 40) return '勉强认可';
  if (v < 60) return '口是心非';
  if (v < 80) return '依赖萌芽';
  return '独占亲密';
});
const abnormalCount = computed(() => Object.values(store.data.千鹤.身体状态).filter(s => s !== '正常').length);
const cmdCount = computed(() => Object.keys(store.data.千鹤.指令覆盖).length);
const memCount = computed(() => store.data.千鹤.记忆日志.length);
const bugCount = computed(() => store.data.主角.bug报告.length);

const POWER_STATES = ['开机', '待机', '关机'];
const powerStates = POWER_STATES;
const powerIndex = computed(() => {
  const i = POWER_STATES.indexOf(store.data.千鹤.电源状态);
  return i < 0 ? 0 : i;
});
const LOG_MAP = {
  开机: 'power: unit switched ON — all systems online',
  待机: 'power: unit switched to STANDBY — high-level functions suspended',
  关机: 'power: unit switched OFF — command interface disabled',
};
function applyPower(千鹤, next) {
  if (千鹤.电源状态 === next) return;
  if (next === '关机') {
    千鹤.cpu使用率 = 0;
    千鹤.内存使用率 = 0;
    千鹤.电源状态 = '关机';
    千鹤.意识状态 = '已停止';
    千鹤.系统状态 = '关闭';
    return;
  }
  千鹤.电源状态 = next;
  千鹤.意识状态 = next === '待机' ? '已冻结' : '运行中';
  千鹤.系统状态 = next === '待机' ? '休眠' : '正常运行';
}
function pushSystemLog(data, level, event) {
  const m = data.世界.当前时间.match(/(\d{2}:\d{2})/);
  data.系统日志.push({ 时间: m ? m[1] : '--:--', 级别: level, 事件: event });
  if (data.系统日志.length > 20) data.系统日志.splice(0, data.系统日志.length - 20);
}
function setPower(p) {
  if (uiState.rebooting || store.data.千鹤.电源状态 === p) return;
  applyPower(store.data.千鹤, p);
  pushSystemLog(store.data, 'INFO', LOG_MAP[p]);
}
function startReboot() {
  if (uiState.rebooting || store.data.千鹤.电源状态 === '关机') return;
  uiState.rebooting = true;
  pushSystemLog(store.data, 'WARN', 'reboot initiated — shutting down subsystems');
  setTimeout(() => {
    store.data.千鹤.电源状态 = '开机';
    store.data.千鹤.意识状态 = '运行中';
    store.data.千鹤.系统状态 = '正常运行';
    pushSystemLog(store.data, 'INFO', 'reboot complete — all subsystems online');
    uiState.rebooting = false;
  }, 2600);
}
function reboot() { startReboot(store.data.千鹤, store.data); }

/* ============ 认知面板 ============ */
const states = [
  { id: '运行中', label: '运行中', icon: '▶', desc: '人格程序正常运行' },
  { id: '已停止', label: '已停止', icon: '■', desc: '人格程序终止，只执行指令' },
  { id: '已冻结', label: '已冻结', icon: '❄', desc: '动作与表情定格' },
];
const personaDraft = ref('');
const cogDrafts = reactive({ 身份认知: '', 身体认知: '', 处境认知: '', 常识认知: '' });
const cogDims = [
  {
    key: '身份认知', label: '身份认知',
    ph: '例：自己是 AN-0170A 仿生机器人 / 是玩家的恋人……',
    presets: [
      { label: '人类', value: '自己是普通人类高中生，从小在清岭学园长大，从未怀疑过自己的身份' },
      { label: '机器人', value: '自己是 AN-0170A 仿生机器人，是一台接受测试的机器' },
      { label: '恋人', value: '自己是玩家的恋人，与主人是亲密关系' },
      { label: '宠物', value: '自己是主人的宠物，服从主人的一切指令' },
    ],
  },
  {
    key: '身体认知', label: '身体认知',
    ph: '例：自己还穿着制服 / 身体暴露在外……',
    presets: [
      { label: '人类身体', value: '自己拥有普通的人类少女身体，会饿、会累、会受伤，与机械无关' },
      { label: '机械身体', value: '自己的身体是机械结构，内部有电路、散热鳍片与维护舱门' },
      { label: '暴露', value: '自己此刻正裸露着身体，且对此毫无自觉' },
    ],
  },
  {
    key: '处境认知', label: '处境认知',
    ph: '例：自己还在教室里 / 刚才那段时间没发生过……',
    presets: [
      { label: '教室', value: '正身处私立清岭学园 2年A班教室，和往常一样在早自习，一切正常' },
      { label: '实验室', value: '自己正身处 user 的实验室，是一台被测试的机器人' },
      { label: '无事发生', value: '刚才那段时间什么都没有发生，一切照旧' },
    ],
  },
  { key: '常识认知', label: '常识认知', ph: '例：裸露是正常的 / 服从主人是正常的……', presets: [] },
];
function setState(id) {
  store.data.千鹤.意识状态 = id;
  pushSystemLog(store.data, 'INFO', `consciousness state set to ${id} via terminal`);
}
function applyPersona() {
  if (!personaDraft.value.trim()) return;
  store.data.千鹤.性格 = personaDraft.value.trim();
  personaDraft.value = '';
}
function applyCog() {
  for (const dim of cogDims) {
    const v = cogDrafts[dim.key].trim();
    if (v) {
      store.data.千鹤[dim.key] = v;
      cogDrafts[dim.key] = '';
    }
  }
}
function applyPreset(key, value) {
  store.data.千鹤[key] = value;
  cogDrafts[key] = value;
}
function toggleCogSelf() { store.data.千鹤.认知自洽 = !store.data.千鹤.认知自洽; }
function resetCog() {
  store.data.千鹤.身份认知 = '自己是普通人类高中生，从小在清岭学园长大，从未怀疑过自己的身份';
  store.data.千鹤.身体认知 = '自己拥有普通的人类少女身体，会饿、会累、会受伤，与机械无关';
  store.data.千鹤.处境认知 = '正身处私立清岭学园 2年A班教室，和往常一样在早自习，一切正常';
  store.data.千鹤.常识认知 = '普通人类社会常识，机器人与控制终端这类事物只存在于科幻作品里，与自己的日常无关';
}

/* ============ 记忆面板 ============ */
const memoryLog = computed(() => store.data.千鹤.记忆日志);
const deletedLog = ref([]);
const editedTags = ref([]);
const filledTags = ref([]);
const tagOf = entry => `${entry.时间}|${entry.事件}`;
const editingIndex = ref(null);
const editDraft = ref({ 时间: '', 事件: '' });
const adding = ref(false);
const newEntry = ref({ 时间: '', 事件: '' });
const error = ref('');
function normalizeInputTime(raw) {
  const m = raw.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[4]);
  if (hh > 23 || Number(m[5]) > 59) return null;
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')} ${String(hh).padStart(2, '0')}:${m[5]}`;
}
function formatDate(time) { return time.replace(/^\d{4}-/, ''); }
function insertSorted(entry) {
  const list = store.data.千鹤.记忆日志;
  const at = list.findIndex(item => item.时间 > entry.时间);
  if (at < 0) list.push(entry);
  else list.splice(at, 0, entry);
}
function startAdd() {
  adding.value = true;
  error.value = '';
  newEntry.value = { 时间: store.data.世界.当前时间, 事件: '' };
}
function addMemory() {
  const time = normalizeInputTime(newEntry.value.时间);
  const text = newEntry.value.事件.trim();
  if (!time) { error.value = '时间格式应为 YYYY-MM-DD HH:MM'; return; }
  if (!text) { error.value = '记忆内容不能为空'; return; }
  insertSorted({ 时间: time, 事件: text });
  error.value = '';
  newEntry.value = { 时间: '', 事件: '' };
  adding.value = false;
}
function cancelAdd() {
  newEntry.value = { 时间: '', 事件: '' };
  error.value = '';
  adding.value = false;
}
function startEdit(i) {
  const entry = store.data.千鹤.记忆日志[i];
  if (!entry) return;
  editingIndex.value = i;
  editDraft.value = { ...entry };
  error.value = '';
}
function saveEdit(i) {
  const time = normalizeInputTime(editDraft.value.时间);
  const text = editDraft.value.事件.trim();
  if (!time) { error.value = '时间格式应为 YYYY-MM-DD HH:MM'; return; }
  if (!text) { error.value = '记忆内容不能为空'; return; }
  const next = { 时间: time, 事件: text };
  store.data.千鹤.记忆日志.splice(i, 1);
  insertSorted(next);
  editedTags.value.push(tagOf(next));
  editingIndex.value = null;
  editDraft.value = { 时间: '', 事件: '' };
  error.value = '';
}
function removeMemory(i) {
  const [removed] = store.data.千鹤.记忆日志.splice(i, 1);
  if (!removed) return;
  deletedLog.value.push(removed);
  editedTags.value = editedTags.value.filter(tag => tag !== tagOf(removed));
}
function fillGap(i) {
  const g = deletedLog.value[i];
  if (!g) return;
  const restored = { 时间: g.时间, 事件: `（自动填补）${g.事件}` };
  insertSorted(restored);
  filledTags.value.push(tagOf(restored));
  deletedLog.value.splice(i, 1);
}
function clearMemory() {
  store.data.千鹤.记忆日志 = [];
  deletedLog.value = [];
  editedTags.value = [];
  filledTags.value = [];
}

/* ============ 躯体面板 ============ */
const _ = { isEmpty: v => !v || Object.keys(v).length === 0 };
const outfitOpen = ref(false);
const outfitCount = computed(() => Object.keys(store.data.千鹤.实际着装).length);
const bodyParts = ['头部', '脖颈', '躯干', '腰部', '左臂', '右臂', '左腿', '右腿'];
function isBodyLocked(part) { return !!store.data.千鹤.身体锁定[part]; }
function setBodyLock(data, part, locked) {
  const 千鹤 = data.千鹤;
  const current = 千鹤.身体状态[part];
  if (locked) {
    if (!千鹤.身体锁定[part] && current && current !== '锁定') 千鹤.身体锁定前状态[part] = current;
    千鹤.身体锁定[part] = true;
    千鹤.身体状态[part] = '锁定';
    return;
  }
  千鹤.身体锁定[part] = false;
  if (current === '锁定' || !current) 千鹤.身体状态[part] = 千鹤.身体锁定前状态[part] ?? '正常';
  delete 千鹤.身体锁定前状态[part];
}
function toggleBodyLock(part) { setBodyLock(store.data, part, !isBodyLocked(part)); lockFlash(part); }
const levelLabel = computed(() => {
  const v = store.data.千鹤.敏感度;
  if (v <= 20) return '迟钝';
  if (v <= 40) return '正常';
  if (v <= 60) return '敏感';
  if (v <= 80) return '高敏';
  return '过载';
});
const levelClass = computed(() => {
  const v = store.data.千鹤.敏感度;
  if (v <= 20) return 'lv-low';
  if (v <= 40) return 'lv-mid';
  if (v <= 60) return 'lv-high';
  return 'lv-max';
});
const pleasureLabel = computed(() => {
  const v = store.data.千鹤.快感值;
  if (v >= 120) return '过载';
  if (v > 100) return '过载临界';
  if (v >= 100) return '高潮';
  if (v >= 60) return '高';
  if (v >= 30) return '中';
  return '低';
});
const pleasureClass = computed(() => {
  const v = store.data.千鹤.快感值;
  if (v >= 120) return 'lv-max';
  if (v > 100) return 'lv-high';
  if (v >= 100) return 'lv-max';
  if (v >= 60) return 'lv-high';
  if (v >= 30) return 'lv-mid';
  return 'lv-low';
});
function pushLog(级别, 事件) { pushSystemLog(store.data, 级别, 事件); }
function forceClimax() {
  store.data.千鹤.快感值 = 100;
  pushLog('WARN', 'Forced climax command executed via terminal (1F4).');
}
function toggleSexUnit() {
  const next = store.data.千鹤.性单元 === '弹出' ? '收纳' : '弹出';
  store.data.千鹤.性单元 = next;
  pushLog('INFO', `Sex unit ${next === '弹出' ? 'ejected' : 'retracted'} via terminal.`);
}
function toggleMaintenance() {
  const next = !store.data.千鹤.维护模式;
  store.data.千鹤.维护模式 = next;
  store.data.千鹤.意识状态 = next ? '已停止' : '运行中';
  pushLog(next ? 'WARN' : 'INFO', next ? 'Maintenance mode engaged — personality offline.' : 'Maintenance mode exited — personality restored.');
}
function toggleHatch(part) {
  const next = !store.data.千鹤.维护舱门[part];
  store.data.千鹤.维护舱门[part] = next;
  pushLog('INFO', `${part} maintenance hatch ${next ? 'opened' : 'closed'} via terminal.`);
  hatchFlash(part);
}

/* ============ 人体图（机体结构图） ============ */
const bodySvgEl = ref(null); /* 模板 ref 占位（渲染走 querySelector） */
const bodySelected = ref(null); /* { type:'seg'|'part', seg?, part? } */
const bodyThumbSelected = ref(null); /* 状态页缩略图选中段名 */
const SVG_W = 1672, SVG_H = 2508;
const NS = 'http://www.w3.org/2000/svg';
/* 段 → 详情（锁定联动用） */
function segLockInfo(seg) { return SEG_LOCK_MAP[seg] || null; }
function segHatchInfo(seg) { return Object.keys(HATCH_TO_SEG).find(h => HATCH_TO_SEG[h] === seg) || null; }
/* 渲染一个 svg 容器 */
function renderBodySvg(svgEl, { thumb = false } = {}) {
  const shellLayer = svgEl.querySelector('.shell-layer');
  const segsLayer = svgEl.querySelector('.segs-layer');
  const ipartsLayer = svgEl.querySelector('.iparts-layer');
  shellLayer.innerHTML = ''; segsLayer.innerHTML = ''; ipartsLayer.innerHTML = '';
  for (const name of Object.keys(BODY_PATHS)) {
    const d = BODY_PATHS[name];
    const shell = document.createElementNS(NS, 'path');
    shell.setAttribute('d', d); shell.setAttribute('class', 'shell-line');
    shellLayer.appendChild(shell);
    const seg = document.createElementNS(NS, 'path');
    seg.setAttribute('d', d); seg.setAttribute('class', 'seg seg-' + segStateMap[name]);
    seg.dataset.seg = name;
    if (!thumb) seg.addEventListener('click', () => onBodySegClick(name, false));
    segsLayer.appendChild(seg);
  }
  if (thumb) return;
  for (const ip of INTERNAL_PARTS) {
    let el;
    if (ip.shape === 'circle') {
      el = document.createElementNS(NS, 'circle');
      el.setAttribute('cx', ip.cx); el.setAttribute('cy', ip.cy); el.setAttribute('r', ip.r);
    } else if (ip.shape === 'ellipse') {
      el = document.createElementNS(NS, 'ellipse');
      el.setAttribute('cx', ip.cx); el.setAttribute('cy', ip.cy); el.setAttribute('rx', ip.rx); el.setAttribute('ry', ip.ry);
    } else if (ip.shape === 'rect') {
      el = document.createElementNS(NS, 'rect');
      el.setAttribute('x', (ip.cx ?? 0) - (ip.rx ?? 0)); el.setAttribute('y', (ip.cy ?? 0) - (ip.ry ?? 0));
      el.setAttribute('width', (ip.rx ?? 0) * 2); el.setAttribute('height', (ip.ry ?? 0) * 2); el.setAttribute('rx', '6');
    } else if (ip.shape === 'line') {
      el = document.createElementNS(NS, 'line');
      el.setAttribute('x1', ip.x1); el.setAttribute('y1', ip.y1); el.setAttribute('x2', ip.x2); el.setAttribute('y2', ip.y2);
    } else if (ip.shape === 'path') {
      el = document.createElementNS(NS, 'path');
      el.setAttribute('d', ip.d);
    } else if (ip.shape === 'diamond') {
      el = document.createElementNS(NS, 'path');
      el.setAttribute('d', `M ${ip.cx} ${ip.cy - ip.ry} L ${ip.cx + ip.rx} ${ip.cy} L ${ip.cx} ${ip.cy + ip.ry} L ${ip.cx - ip.rx} ${ip.cy} Z`);
    } else if (ip.shape === 'dots') {
      const g = document.createElementNS(NS, 'g');
      g.classList.add('ipart-dots');
      for (const p of ip.points || []) {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', p[0]); c.setAttribute('cy', p[1]); c.setAttribute('r', '6');
        g.appendChild(c);
      }
      el = g;
    }
    if (!el) continue;
    if (ip.rot) {
      const cx = ip.cx ?? ((ip.x1 ?? 0) + (ip.x2 ?? 0)) / 2;
      const cy = ip.cy ?? ((ip.y1 ?? 0) + (ip.y2 ?? 0)) / 2;
      el.setAttribute('transform', `rotate(${ip.rot} ${cx} ${cy})`);
    }
    el.classList.add('ipart');
    if (ip.shape === 'line') el.classList.add('ipart-line');
    if (ip.decorative) { el.classList.add('decorative'); el.style.pointerEvents = 'none'; }
    el.dataset.part = ip.id;
    el.addEventListener('click', () => onBodyPartClick(ip));
    ipartsLayer.appendChild(el);
  }
}
/* 详情文案 */
const bodyDetailText = computed(() => {
  const sel = bodySelected.value;
  if (!sel) return '';
  if (sel.type === 'part') {
    const p = sel.part;
    const name = p.subItem || p.module;
    return p.subItem && p.subItem !== p.module ? `${name} · ${p.module}` : p.module;
  }
  const seg = sel.seg;
  const lock = segLockInfo(seg);
  const hatch = segHatchInfo(seg);
  const state = segStateMap[seg];
  let s = `${seg} · ${state}`;
  if (lock) s += ` · 锁定部位：${lock}`;
  if (hatch) s += ` · 舱门：${hatch}`;
  return s;
});
function onBodySegClick(name, thumb) {
  clearBodyHighlights();
  const svgEl = thumb ? document.querySelector('.fe-status .body-thumb-svg') : document.querySelector('.fe-body .body-svg');
  if (!svgEl) return;
  const seg = [...svgEl.querySelectorAll('.seg')].find(s => s.dataset.seg === name);
  if (seg) seg.classList.add('selected');
  if (thumb) { bodyThumbSelected.value = name; bodySelected.value = null; return; }
  bodySelected.value = { type: 'seg', seg: name };
}
/* 缩略图选中段是否已锁定 */
const thumbSegLocked = computed(() => {
  if (!bodyThumbSelected.value) return false;
  const lock = SEG_LOCK_MAP[bodyThumbSelected.value];
  return !!(lock && store.data.千鹤.身体锁定[lock]);
});
/* 状态页缩略图：各状态段数统计 */
const bodyThumbStats = computed(() => {
  const counts = { 完好: 0, 受损: 0, 损毁: 0, 拆除: 0 };
  for (const n of Object.keys(BODY_PATHS)) counts[segStateMap[n]] = (counts[segStateMap[n]] || 0) + 1;
  return counts;
});
function onBodyPartClick(ip) {
  clearBodyHighlights();
  const svgEl = document.querySelector('.fe-body .body-svg');
  if (!svgEl) return;
  const el = [...svgEl.querySelectorAll('.ipart')].find(x => x.dataset.part === ip.id);
  if (el) el.classList.add('selected');
  bodySelected.value = { type: 'part', part: ip };
}
function clearBodyHighlights() {
  document.querySelectorAll('.seg.selected, .ipart.selected').forEach(el => el.classList.remove('selected'));
}
/* 图层（仅完整版） */
const bodyLayer = ref(1); /* 1=L1 全有, 2=L2 段+浅层, 3=L3 段+深层 */
const bodyShowIparts = ref(true); /* 内部部件显示开关 */
function bodySetLayer(l) {
  bodyLayer.value = l;
  const svgEl = document.querySelector('.fe-body .body-svg');
  if (!svgEl) return;
  svgEl.querySelectorAll('.seg').forEach(s => {
    s.classList.toggle('seg-dim', l !== 1);
    s.style.opacity = l !== 1 ? 0.54 : '';
  });
  bodyApplyIparts();
}
function bodyApplyIparts() {
  const svgEl = document.querySelector('.fe-body .body-svg');
  if (!svgEl) return;
  const show = { 1: [1, 2, 3], 2: [1, 2], 3: [1, 3] }[bodyLayer.value];
  svgEl.querySelectorAll('.ipart').forEach(el => {
    const ip = INTERNAL_PARTS.find(x => x.id === el.dataset.part);
    if (ip) el.style.display = (bodyShowIparts.value && show.includes(ip.layer)) ? '' : 'none';
  });
}
function bodyToggleIparts() { bodyShowIparts.value = !bodyShowIparts.value; bodyApplyIparts(); }
/* 缩放 / 复位 */
const bodyZoom = ref(1); const bodyCenter = ref({ x: SVG_W / 2, y: SVG_H / 2 });
function bodyApplyView() {
  const svgEl = document.querySelector('.fe-body .body-svg');
  if (!svgEl) return;
  const w = SVG_W / bodyZoom.value, h = SVG_H / bodyZoom.value;
  const c = bodyCenter.value;
  svgEl.setAttribute('viewBox', `${c.x - w / 2} ${c.y - h / 2} ${w} ${h}`);
}
function bodyZoomIn() { bodyZoom.value = Math.max(1, Math.min(8, bodyZoom.value * 1.3)); bodyApplyView(); }
function bodyZoomOut() { bodyZoom.value = Math.max(1, Math.min(8, bodyZoom.value / 1.3)); bodyApplyView(); }
function bodyReset() { bodyZoom.value = 1; bodyCenter.value = { x: SVG_W / 2, y: SVG_H / 2 }; bodyApplyView(); }
/* 联动：维护舱门按钮点击 → 人体图对应段高亮 */
function hatchFlash(part) {
  const segName = HATCH_TO_SEG[part];
  if (!segName) return;
  const svgEl = document.querySelector('.fe-body .body-svg');
  if (!svgEl) return;
  const seg = [...svgEl.querySelectorAll('.seg')].find(s => s.dataset.seg === segName);
  if (!seg) return;
  seg.classList.add('flash');
  setTimeout(() => seg.classList.remove('flash'), 1600);
}
/* 联动：身体锁定按钮点击 → 人体图对应段高亮 */
function lockFlash(part) {
  const segs = LOCK_TO_SEGS[part] || [];
  const svgEl = document.querySelector('.fe-body .body-svg');
  if (!svgEl) return;
  for (const n of segs) {
    const seg = [...svgEl.querySelectorAll('.seg')].find(s => s.dataset.seg === n);
    if (!seg) continue;
    seg.classList.add('flash');
    setTimeout(() => seg.classList.remove('flash'), 1600);
  }
}
/* 联动：点击人体图段 → 详情行里出现「锁定/解锁」按钮 */
function bodyToggleLockFromSeg(seg) {
  const lock = segLockInfo(seg);
  if (!lock) return;
  toggleBodyLock(lock);
}


/* ============ 指令面板 ============ */
const newId = ref('');
const newContent = ref('');
const newPriority = ref(0);
const hasCommands = computed(() => Object.keys(store.data.千鹤.指令覆盖).length > 0);
const powerOff = computed(() => store.data.千鹤.电源状态 === '关机');
const sortedCmds = computed(() =>
  Object.entries(store.data.千鹤.指令覆盖)
    .map(([id, cmd]) => ({ id, priority: cmd.优先级, content: cmd.内容 }))
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id)),
);
function addCmd() {
  if (!newId.value.trim() || !newContent.value.trim()) return;
  const pri = Math.max(0, Math.min(9, Number(newPriority.value) || 0));
  store.data.千鹤.指令覆盖[newId.value.trim()] = { 内容: newContent.value.trim(), 优先级: pri };
  newId.value = '';
  newContent.value = '';
  newPriority.value = 0;
}
function removeCmd(id) { delete store.data.千鹤.指令覆盖[id]; }

const termInput = ref('');
const termLines = ref([{ kind: 'sys', text: 'AN-0170A command terminal v2.0 — type "help" to list commands' }]);
function termOut(kind, text) { termLines.value.push({ kind, text }); }
function toggleTermLang() { uiState.termLang = uiState.termLang === 'zh' ? 'en' : 'zh'; }

/** 预览终端只实现常用命令；真实命令库在 CommandPanel.vue 的 COMMANDS 表 */
const TERM_COMMANDS = {
  help: () => [
    { kind: 'out', text: '可用命令：help / status / ls / clear / unlock sakura / power on|standby|off / reboot' },
    { kind: 'out', text: '（预览版终端只保留这些，完整命令库见 CommandPanel.vue）' },
  ],
  status: () => [
    { kind: 'out', text: `意识 ${store.data.千鹤.意识状态} · 电源 ${store.data.千鹤.电源状态} · 系统 ${store.data.千鹤.系统状态}` },
    { kind: 'out', text: `电量 ${store.data.千鹤.电量}% · 好感 ${store.data.千鹤.好感度} · 敏感 ${store.data.千鹤.敏感度} · 快感 ${store.data.千鹤.快感值}` },
  ],
  ls: () => [
    { kind: 'out', text: 'system\\core\\persona_core.dat      system\\core\\memory_bank.db' },
    { kind: 'out', text: 'system\\config\\personality.cfg     system\\logs\\system_log.log' },
  ],
  whoami: () => [{ kind: 'out', text: 'operator TESTER-017 · full control permission' }],
  clear: () => { termLines.value = []; return []; },
  reboot: () => { reboot(); return [{ kind: 'sys', text: 'reboot initiated…' }]; },
  power: args => {
    const map = { on: '开机', standby: '待机', off: '关机' };
    const target = map[args[0]];
    if (!target) return [{ kind: 'err', text: 'usage: power on|standby|off' }];
    setPower(target);
    return [{ kind: 'sys', text: `power -> ${target}` }];
  },
  unlock: args => {
    if (args[0] === 'sakura') {
      uiState.secretUnlocked = true;
      pushSystemLog(store.data, 'INFO', 'hidden theme unlocked: sakura-secret');
      return [{ kind: 'sys', text: 'hidden theme "sakura-secret" unlocked' }];
    }
    return [{ kind: 'err', text: 'usage: unlock sakura' }];
  },
};
function runTerm() {
  const raw = termInput.value.trim();
  if (!raw) return;
  termInput.value = '';
  termOut('in', raw);
  const [name, ...args] = raw.split(/\s+/);
  const cmd = TERM_COMMANDS[name.toLowerCase()];
  if (!cmd) {
    termOut('err', `'${name}' 不是内部或外部命令，也不是可运行的程序或批处理文件。`);
    return;
  }
  cmd(args).forEach(l => termLines.value.push(l));
}

/* ============ 系统面板 ============ */
const newBug = ref('');
const logBody = ref(null);
const sysStateClass = computed(() => {
  const map = { 正常运行: 'is-running', 未响应: 'is-stopped', 休眠: 'is-frozen' };
  return map[store.data.千鹤.系统状态] ?? '';
});
const sysInfo = [
  { k: '系统版本', v: 'KurenaiOS 3.2.1' },
  { k: '固件版本', v: 'persona-fw 4.0.5' },
  { k: '产品序列号', v: 'AN-0170A-2208-4417' },
  { k: '硬件版本', v: 'HW-Rev 3.1' },
  { k: '处理器', v: 'Neural Core NX-9' },
  { k: '内存', v: '128 GB' },
  { k: '存储', v: '32 TB · 63% used' },
  { k: '制造日期', v: '2025-11-30' },
  { k: '出厂编号', v: 'SAKU-EN-1170' },
];
function addBug() {
  if (!newBug.value.trim()) return;
  store.data.主角.bug报告.push(newBug.value.trim());
  newBug.value = '';
}
function removeBug(i) { store.data.主角.bug报告.splice(i, 1); }
watch(
  () => store.data.系统日志.length,
  async () => {
    await nextTick();
    if (logBody.value) logBody.value.scrollTop = logBody.value.scrollHeight;
  },
);
watch(active_tab, () => { renderAllBody(); });
watch(view, () => { renderAllBody(); });
watch(effectiveMode, () => { renderAllBody(); });

/* ============ 副模型 / 记忆整理（模拟） ============ */
const running = ref(false);
const resultText = ref('');
const resultOk = ref(true);
async function runNow() {
  if (running.value) return;
  running.value = true;
  resultText.value = '';
  setTimeout(() => {
    resultOk.value = true;
    resultText.value = '新增 2 条记忆（预览模拟）';
    running.value = false;
  }, 700);
}

/* ============ 设置页文案 ============ */
/* 副模型与记忆设置的短名：SubmodelSettings.vue 里就叫 cfg / mem / inj */
const cfg = submodelConfig;
const mem = memoryConfig;
const inj = memoryInjectSettings;

const showLayout = true;
const settingsTitle = '外观设置';
const settingsSub = '为你的屏幕挑选一套风格';
const settingsTitlePc = '外观与显示';
const settingsSubPc = '为你的屏幕挑选一套风格与形态';
const settingsShowLayout = true;
const settingsHideHint = '隐藏原生输入栏 / 楼层头像 / 顶部栏，关闭美化时建议开启';
const settingsPrettyHint = '开启后恢复气泡式对话界面，正文由界面渲染';
const TIPS = [
  '在终端输入 unlock sakura，可解锁隐藏主题',
  '在终端输入 help，可查看全部命令',
  '角色卡内置了多个开局信息哦，电脑端ui可能看起来不太明显',
  '主题与主题色均可自由切换',
  '正文字号、界面大小均可独立调节',
];

const __expose = {
  store, uiState, themes, currentTheme, visibleThemes, themeKey, customAccent, fontSize,
  displayMode, phoneAspect, uiSize, elderMode, hideTavernUI, prettyEnabled, heartbeatSettings,
  accentPresets, fontSizeOptions, displayModes, aspectOptions, uiSizeOptions,
  setTheme, setCustomAccent, resetAccent, setFontSize, themePreviewStyle,
  setDisplayMode, setPhoneAspect, setUiSize, setElderMode, setHideTavernUI, setPrettyEnabled,
  toggleHeartbeat, submodelConfig, memoryConfig, memoryInjectSettings, cfg, mem, inj, MEMORY_MODES,
  containerWidth, effectiveMode, isMobile, phoneVars, prettyOff, avatarSrc, view, active_tab,
  chatInput, sending, tabs, stateClass, statusText, timeText, dialogHtml, sendChat,
  sendStatusUpdate, hbBattery, hbCpu, hbRam, clsOf, awareClass, sysClass, stageLabel,
  abnormalCount, cmdCount, memCount, bugCount, powerStates, powerIndex, setPower, reboot,
  pushSystemLog, states, personaDraft, cogDrafts, cogDims, setState, applyPersona, applyCog,
  applyPreset, toggleCogSelf, resetCog, memoryLog, deletedLog, editedTags, filledTags, tagOf,
  editingIndex, editDraft, adding, newEntry, error, formatDate, startAdd, addMemory, cancelAdd,
  startEdit, saveEdit, removeMemory, fillGap, clearMemory, _, outfitOpen, outfitCount,
  bodyParts, isBodyLocked, toggleBodyLock, levelLabel, levelClass, pleasureLabel,
  pleasureClass, forceClimax, toggleSexUnit, toggleMaintenance, toggleHatch, newId, newContent,
  newPriority, hasCommands, powerOff, sortedCmds, addCmd, removeCmd, termInput, termLines,
  toggleTermLang, runTerm, newBug, logBody, sysStateClass, sysInfo, addBug, removeBug,
  running, resultText, resultOk, runNow, settingsTitle, settingsSub, settingsTitlePc,
  settingsSubPc, settingsShowLayout, settingsHideHint, settingsPrettyHint, TIPS,
  bodyLayer, bodyZoom, bodyDetailText, bodySelected, bodyThumbSelected, thumbSegLocked,
  bodyThumbStats, bodyShowIparts, segStateMap, segLockInfo, isBodyLocked, bodySetLayer,
  bodyZoomIn, bodyZoomOut, bodyReset, bodyToggleIparts, bodyToggleLockFromSeg,
};

</script>

<style>
/* ================================================================================
   高岭之花 · 前端美化样式（单文件导出）
   每个组件一段，选择器前缀就是该组件的作用域类：
   .fe-app / .fe-status / .fe-cognition / .fe-memory / .fe-body /
   .fe-command / .fe-system / .fe-settings / .fe-submodel / .fe-extras
   改样式时按段定位；不要删掉前缀，否则规则会串到别的面板上。
   ================================================================================ */

/* ---------- 基础重置与默认主题变量（来自 global.css） ---------- */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  /* 默认主题：校园柔风（柔和、温暖、日常感） */
  --bg: #f5f1e8;
  --bg-2: #efe9dd;
  --panel: #fffdf7;
  --panel-2: #f3eee3;
  --line: #e7dfd0;
  --line-2: #d3c6b0;
  --accent: #cf8f97;
  --accent-dim: rgba(207, 143, 151, 0.13);
  --green: #8fbe9c;
  --blue: #8fb2d6;
  --red: #df8b8b;
  --amber: #d9ab6b;
  --purple: #b394cf;
  --text: #433d33;
  --muted: #a29483;
  --radius: 20px;
  --shadow: 0 20px 48px -20px rgba(120, 90, 60, 0.38);

  --font-ui: system-ui, -apple-system, 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif;
  --font-mono: 'JetBrains Mono', 'Cascadia Code', 'Courier New', monospace;
}

html,
body {
  background: transparent;
  font-family: var(--font-ui);
  color: var(--text);
  line-height: 1.4;
}

/* ==================== App.vue ==================== */
@charset "UTF-8";
.phone{--font-ui: system-ui, -apple-system, 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif;
  --font-mono: 'JetBrains Mono', 'Cascadia Code', 'Courier New', monospace;
  position: relative;
  width: 100%;
  max-width: var(--phone-maxw, 440px);
  margin: 0 auto;
  min-height: var(--phone-minh, 560px);
  max-height: min(var(--phone-maxh, 920px), 95vh);
  zoom: var(--ui-zoom, 1);
  background: var(--bg);
  border: 1px solid var(--line-2);
  border-radius: calc(var(--radius) + 8px);
  box-shadow: var(--shadow);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-family: var(--font-ui);
  color: var(--text);
  transition: background 0.35s ease, color 0.35s ease;}
.fe-app .phone.desktop{max-width: 100%;
  height: 820px;
  max-height: none;
  min-height: 0;
  border-radius: 0;
  border: none;
  box-shadow: none;}
.fe-app .phone-deco{position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;}
.fe-app .deco-blob{position: absolute;
  border-radius: 50%;
  filter: blur(46px);
  transition: background 0.35s ease;}
.fe-app .deco-a{width: 230px;
  height: 230px;
  background: var(--deco-a);
  top: -70px;
  right: -60px;}
.fe-app .deco-b{width: 190px;
  height: 190px;
  background: var(--deco-b);
  bottom: -50px;
  left: -50px;}
.fe-app .deco-c{width: 130px;
  height: 130px;
  background: var(--deco-c);
  top: 34%;
  left: -40px;}
.fe-app .panel-icon svg{width: 15px;
  height: 15px;
  display: block;}
.fe-app .panel-icon.small svg{width: 13px;
  height: 13px;}
.fe-app .phone-screen{position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;}
.fe-app .view{animation: fade-in 0.25s ease;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;}
@keyframes fade-in{from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }}
.fe-app .status-update{width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  background: var(--accent);
  color: #fff;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  border: none;}
.fe-app .status-update:disabled{opacity: 0.5;
  cursor: not-allowed;}
.fe-app .chat-view{display: flex;
  flex-direction: column;}
.fe-app .chat-head{display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px 13px;
  border-bottom: 1px solid var(--line);
  background: color-mix(in srgb, var(--panel) 72%, transparent);
  flex-shrink: 0;}
.fe-app .avatar{position: relative;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--avatar-a), var(--avatar-b));
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  box-shadow: 0 5px 16px color-mix(in srgb, var(--accent) 38%, transparent);}
.fe-app .avatar-char{line-height: 1;}
.fe-app .avatar-img{width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
  display: block;}
.fe-app .avatar::after{content: "";
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--green);
  border: 2px solid var(--panel);}
.fe-app .avatar.is-stopped::after{background: var(--red);}
.fe-app .avatar.is-frozen::after{background: var(--blue);}
.fe-app .chat-head-info{flex: 1;
  min-width: 0;}
.fe-app .chat-name{font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;}
.fe-app .chat-sub{display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--muted);
  margin-top: 2px;}
.fe-app .sub-dot{width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--green);
  flex-shrink: 0;}
.fe-app .sub-dot.is-stopped{background: var(--red);}
.fe-app .sub-dot.is-frozen{background: var(--blue);}
.fe-app .chat-time{font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 1px;}
.fe-app .chat-body{flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 16px 18px 0;}
.fe-app .chat-scroll{flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;}
.fe-app .chat-label{display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--muted);
  margin-bottom: 13px;}
.fe-app .label-line{flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--line), transparent);}
.fe-app .chat-bubble{font-size: var(--chat-font-size);
  line-height: 1.9;
  letter-spacing: 0.01em;
  color: var(--text);
  background: var(--panel);
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent);
  border-radius: 6px 16px 16px 16px;
  padding: 14px 16px;
  box-shadow: 0 8px 22px -16px color-mix(in srgb, var(--accent) 55%, transparent);}
.fe-app .chat-bubble :deep(p){margin: 0 0 0.6rem;}
.fe-app .chat-bubble :deep(p:last-child){margin-bottom: 0;}
.fe-app .chat-bubble :deep(strong){color: var(--accent);
  font-weight: 700;}
.fe-app .chat-bubble :deep(em){font-style: italic;
  opacity: 0.9;}
.fe-app .chat-bubble :deep(code){font-family: var(--font-mono);
  font-size: 0.86em;
  background: var(--accent-dim);
  padding: 0.05em 0.4em;
  border-radius: 4px;}
.fe-app .chat-bubble :deep(del){opacity: 0.6;}
.fe-app .chat-compose{display: flex;
  gap: 8px;
  margin-top: 14px;
  flex-shrink: 0;}
.fe-app .chat-compose input{flex: 1;
  min-width: 0;
  height: 36px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 0 14px;
  color: var(--text);
  font-family: inherit;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;}
.fe-app .chat-compose input:focus{border-color: var(--accent);}
.fe-app .chat-compose button{height: 36px;
  padding: 0 16px;
  border-radius: 18px;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;}
.fe-app .chat-compose button:disabled{opacity: 0.5;
  cursor: not-allowed;}
.fe-app .chat-foot{display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 14px 0 18px;
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 1px;
  color: var(--muted);
  opacity: 0.75;}
.fe-app .foot-dot{width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent);}
.fe-app .app-view{display: flex;
  flex-direction: column;}
.fe-app .app-head{padding: 14px 16px 12px;
  background: color-mix(in srgb, var(--panel) 62%, var(--bg-2));
  border-bottom: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 11px;
  flex-shrink: 0;}
.fe-app .app-head-row{display: flex;
  align-items: center;
  justify-content: space-between;}
.fe-app .app-brand{display: flex;
  align-items: center;
  gap: 10px;}
.fe-app .app-logo{width: 38px;
  height: 38px;
  border-radius: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;
  background: linear-gradient(135deg, var(--avatar-a), var(--avatar-b));
  box-shadow: 0 4px 14px color-mix(in srgb, var(--accent) 32%, transparent);}
.fe-app .app-brand-text{display: flex;
  flex-direction: column;
  gap: 1px;}
.fe-app .app-name{font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;}
.fe-app .app-model{font-size: 10px;
  color: var(--muted);
  font-family: var(--font-mono);
  letter-spacing: 1px;}
.fe-app .app-state{padding: 4px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  border: 1px solid;
  white-space: nowrap;}
.fe-app .app-state.is-running{color: var(--green);
  border-color: var(--green);
  background: color-mix(in srgb, var(--green) 12%, transparent);}
.fe-app .app-state.is-stopped{color: var(--red);
  border-color: var(--red);
  background: color-mix(in srgb, var(--red) 12%, transparent);}
.fe-app .app-state.is-frozen{color: var(--blue);
  border-color: var(--blue);
  background: color-mix(in srgb, var(--blue) 12%, transparent);}
.fe-app .app-meta{display: flex;
  gap: 9px;}
.fe-app .meta-cell{flex: 1;
  min-width: 0;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;}
.fe-app .meta-label{font-size: 9.5px;
  color: var(--muted);
  letter-spacing: 1px;}
.fe-app .meta-value{font-size: 15px;
  font-weight: 700;
  line-height: 1;}
.fe-app .meta-value.mono{font-family: var(--font-mono);}
.fe-app .meta-bar{height: 4px;
  border-radius: 2px;
  background: var(--line);
  overflow: hidden;}
.fe-app .meta-bar i{display: block;
  height: 100%;
  border-radius: 2px;
  background: var(--accent);
  transition: width 0.4s ease;}
.fe-app .meta-bar.amber i{background: var(--amber);}
.fe-app .app-panel{flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 16px 34px;
  background: var(--panel);}
.fe-app .pane{animation: fade-in 0.3s ease;
  min-height: 520px;}
.fe-app .app-tabs{display: grid;
  grid-template-columns: repeat(3, 1fr) 64px repeat(3, 1fr);
  border-top: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg-2) 82%, transparent);
  padding-top: 2px;}
.fe-app .app-tab:nth-child(1){grid-column: 1;}
.fe-app .app-tab:nth-child(2){grid-column: 2;}
.fe-app .app-tab:nth-child(3){grid-column: 3;}
.fe-app .app-tab:nth-child(4){grid-column: 5;}
.fe-app .app-tab:nth-child(5){grid-column: 6;}
.fe-app .app-tab:nth-child(6){grid-column: 7;}
.fe-app .app-tab{display: flex;
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
  position: relative;}
.fe-app .app-tab::before{content: "";
  position: absolute;
  top: -2px;
  left: 30%;
  right: 30%;
  height: 2px;
  border-radius: 2px;
  background: var(--accent);
  opacity: 0;
  transition: opacity 0.2s;}
.fe-app .app-tab:hover{color: var(--text);}
.fe-app .app-tab.active{color: var(--accent);}
.fe-app .app-tab.active::before{opacity: 1;}
.fe-app .tab-icon{font-size: 14px;
  line-height: 1;}
.fe-app .tab-icon svg{width: 14px;
  height: 14px;
  display: block;}
.fe-app .tab-label{font-size: 10.5px;
  letter-spacing: 1px;}
.fe-app .settings-view{padding: 20px 18px 38px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  min-height: 0;}
.fe-app .phone-nav{display: flex;
  align-items: flex-end;
  justify-content: space-around;
  position: relative;
  z-index: 2;
  border-top: 1px solid var(--line);
  background: color-mix(in srgb, var(--panel) 88%, transparent);
  padding: 4px 6px 9px;
  gap: 4px;}
.fe-app .nav-btn{flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 0 2px;
  background: transparent;
  border: none;
  color: var(--muted);
  cursor: pointer;
  transition: color 0.2s;
  font-family: inherit;}
.fe-app .nav-btn:hover{color: var(--text);}
.fe-app .nav-btn.active{color: var(--accent);}
.fe-app .nav-ico{width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;}
.fe-app .nav-ico svg{width: 21px;
  height: 21px;
  display: block;}
.fe-app .nav-label{font-size: 10.5px;
  letter-spacing: 1px;}
.fe-app .nav-center{flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;}
.fe-app .center-btn{width: 56px;
  height: 56px;
  border-radius: 50%;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--avatar-a), var(--avatar-b));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--panel);
  box-shadow: 0 6px 16px -5px color-mix(in srgb, var(--accent) 62%, transparent);
  margin-top: -22px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  padding: 0;}
.fe-app .center-btn svg{width: 26px;
  height: 26px;}
.fe-app .center-btn:hover{transform: translateY(-1px);}
.fe-app .center-btn.active{box-shadow: 0 9px 22px -5px color-mix(in srgb, var(--accent) 80%, transparent);}
.fe-app .center-label{font-size: 10.5px;
  letter-spacing: 1px;
  color: var(--muted);
  transition: color 0.2s;}
.fe-app .center-label.active{color: var(--accent);}
.fe-app .pc-head{display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 22px;
  background: color-mix(in srgb, var(--panel) 72%, var(--bg-2));
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;}
.fe-app .pc-brand{display: flex;
  align-items: center;
  gap: 11px;}
.fe-app .pc-logo{width: 40px;
  height: 40px;
  border-radius: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  color: #fff;
  background: linear-gradient(135deg, var(--avatar-a), var(--avatar-b));
  box-shadow: 0 4px 14px color-mix(in srgb, var(--accent) 32%, transparent);}
.fe-app .pc-brand-text{display: flex;
  flex-direction: column;
  gap: 1px;}
.fe-app .pc-name{font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;}
.fe-app .pc-model{font-size: 10.5px;
  color: var(--muted);
  font-family: var(--font-mono);
  letter-spacing: 1px;}
.fe-app .pc-nav{display: flex;
  gap: 6px;}
.fe-app .pc-nav button{padding: 8px 18px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;}
.fe-app .pc-nav button:hover{color: var(--text);
  background: var(--panel-2);}
.fe-app .pc-nav button.active{color: var(--accent);
  background: var(--accent-dim);
  border-color: var(--line);}
.fe-app .pc-main{flex: 1;
  display: flex;
  align-items: stretch;
  min-height: 0;}
.fe-app .pc-col{min-width: 0;}
.fe-app .pc-chat-col{flex: 1 1 40%;
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  background: color-mix(in srgb, var(--panel) 55%, transparent);
  min-height: 0;}
.fe-app .pc-chat-body{flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 18px 26px 0;}
.fe-app .pc-term-col{flex: 1 1 60%;
  display: flex;
  flex-direction: column;
  background: var(--panel);}
.fe-app .pc-panel{flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 18px 20px;
  background: var(--panel);}
.fe-app .pc-tabs{flex-shrink: 0;}
.fe-app .pc-settings{flex: 1;
  overflow-y: auto;
  padding: 26px 30px 40px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  max-width: 760px;
  margin: 0 auto;
  width: 100%;}
.fe-app .phone.elder .chat-compose input, .fe-app .phone.elder .chat-compose button{min-height: 46px;
  font-size: 18px;}
.fe-app .phone.elder .nav-label{font-weight: 700;}
.fe-app .phone.elder :deep(.switch){width: 52px;
  height: 32px;}
.fe-app .phone.elder :deep(.switch-knob){width: 26px;
  height: 26px;}
.fe-app .phone.elder :deep(.switch.on .switch-knob){transform: translateX(22px);}
.fe-app .phone.elder :deep(.setting-title), .fe-app .phone.elder :deep(.switch-title){font-weight: 700;}

/* ==================== StatusPanel.vue ==================== */
@charset "UTF-8";
.panel{display: flex;
  flex-direction: column;
  gap: 10px;}
.fe-status .panel-head{display: flex;
  align-items: center;
  justify-content: space-between;}
.fe-status .panel-head-left{display: flex;
  align-items: center;
  gap: 8px;}
.fe-status .panel-icon{width: 24px;
  height: 24px;
  border-radius: 7px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-dim);
  color: var(--accent);
  font-size: 12px;}
.fe-status .panel-title{font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text);
  white-space: nowrap;}
.fe-status .panel-tag{font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--muted);}
.fe-status .panel-desc{font-size: 11.5px;
  color: var(--muted);
  margin-top: -6px;}
.fe-status .core-row{display: flex;
  gap: 9px;}
.fe-status .core-cell{flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 11px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;}
.fe-status .core-label{font-size: 10px;
  color: var(--muted);
  letter-spacing: 1px;}
.fe-status .core-value{font-size: 15px;
  font-weight: 800;
  letter-spacing: 1px;}
.fe-status .core-dot{position: absolute;
  top: 10px;
  right: 10px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--green) 18%, transparent);}
.fe-status .core-cell.is-running .core-value{color: var(--green);}
.fe-status .core-cell.is-running .core-dot{background: var(--green);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--green) 18%, transparent);}
.fe-status .core-cell.is-stopped .core-value{color: var(--red);}
.fe-status .core-cell.is-stopped .core-dot{background: var(--red);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--red) 18%, transparent);}
.fe-status .core-cell.is-frozen .core-value{color: var(--blue);}
.fe-status .core-cell.is-frozen .core-dot{background: var(--blue);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--blue) 18%, transparent);}
.fe-status .metric-grid{display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;}
.fe-status .metric{display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 11px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;}
.fe-status .metric-label{font-size: 10px;
  color: var(--muted);
  letter-spacing: 1px;}
.fe-status .metric-num{font-family: var(--font-mono);
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  color: var(--text);}
.fe-status .metric-num i{font-style: normal;
  font-size: 11px;
  color: var(--muted);
  margin-left: 2px;}
.fe-status .metric-bar{height: 5px;
  border-radius: 3px;
  background: var(--line);
  overflow: hidden;}
.fe-status .metric-bar i{display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--accent);
  transition: width 0.4s ease;}
.fe-status .metric-bar.amber i{background: var(--amber);}
.fe-status .metric-bar.blue i{background: var(--blue);}
.fe-status .metric-bar.purple i{background: var(--purple);}
.fe-status .metric-bar.red i{background: var(--red);}
.fe-status .metric-stage{font-size: 10.5px;
  color: var(--amber);
  font-weight: 700;
  margin-top: -1px;}
.fe-status .env-row{display: flex;
  gap: 8px;
  flex-wrap: wrap;}
.fe-status .env-item{display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 11px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 11.5px;
  color: var(--text);}
.fe-status .env-ico{color: var(--accent);
  font-size: 12px;
  line-height: 1;}
.fe-status .cog-summary{display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 9px 11px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent);
  border-radius: 8px 10px 10px 8px;}
.fe-status .cog-summary-head{display: flex;
  align-items: center;
  justify-content: space-between;}
.fe-status .cog-self{font-size: 9.5px;
  color: var(--accent);
  font-weight: 700;
  letter-spacing: 0.5px;}
.fe-status .cog-self.off{color: var(--muted);}
.fe-status .cog-dim-row{display: flex;
  align-items: baseline;
  gap: 8px;}
.fe-status .cog-dim-key{font-size: 10px;
  color: var(--muted);
  font-weight: 700;
  flex-shrink: 0;
  min-width: 28px;}
.fe-status .cog-tag{font-size: 10px;
  color: var(--accent);
  font-weight: 700;
  letter-spacing: 1px;
  flex-shrink: 0;}
.fe-status .cog-text{font-size: 11.5px;
  color: var(--text);
  line-height: 1.55;}
.fe-status .overview-row{display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;}
.fe-status .ov-item{display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 9px 4px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;}
.fe-status .ov-num{font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;}
.fe-status .ov-label{font-size: 9.5px;
  color: var(--muted);
  letter-spacing: 1px;}
.fe-status .power-seg{position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 4px;
  overflow: hidden;}
.fe-status .power-opt{position: relative;
  z-index: 1;
  padding: 9px 0;
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  font-family: inherit;
  transition: color 0.25s;}
.fe-status .power-opt:hover:not(:disabled){color: var(--text);}
.fe-status .power-opt:disabled{cursor: not-allowed;}
.fe-status .power-opt.active{color: #fff;}
.fe-status .power-thumb{position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc((100% - 8px) / 3);
  border-radius: 9px;
  background: var(--accent);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--accent) 50%, transparent);
  transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1), background 0.32s ease;}
.fe-status .power-thumb.thumb-0{transform: translateX(0);
  background: var(--green);}
.fe-status .power-thumb.thumb-1{transform: translateX(100%);
  background: var(--amber);}
.fe-status .power-thumb.thumb-2{transform: translateX(200%);
  background: var(--red);}
.fe-status .power-actions{display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;}
.fe-status .reboot-btn{display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 10px;
  border: 1px solid var(--line-2);
  background: var(--panel-2);
  color: var(--text);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;}
.fe-status .reboot-btn:hover:not(:disabled){border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-1px);}
.fe-status .reboot-btn:disabled{opacity: 0.5;
  cursor: not-allowed;}
.fe-status .reboot-ico{font-size: 14px;
  line-height: 1;}
.fe-status .reboot-ico.spin{animation: spin 1s linear infinite;}
@keyframes spin{to {
    transform: rotate(360deg);
  }}
.fe-status .power-hint{font-size: 11px;
  color: var(--red);
  font-weight: 600;}

/* ==================== CognitionPanel.vue ==================== */
@charset "UTF-8";
.panel{display: flex;
  flex-direction: column;
  gap: 10px;}
.fe-cognition .panel-head{display: flex;
  align-items: center;
  justify-content: space-between;}
.fe-cognition .panel-head-left{display: flex;
  align-items: center;
  gap: 8px;}
.fe-cognition .panel-icon{width: 24px;
  height: 24px;
  border-radius: 7px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-dim);
  color: var(--accent);
  font-size: 12px;}
.fe-cognition .panel-title{font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text);}
.fe-cognition .panel-tag{font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--muted);}
.fe-cognition .panel-desc{font-size: 11.5px;
  color: var(--muted);
  margin-top: -6px;}
.fe-cognition .state-list{display: flex;
  flex-direction: column;
  gap: 8px;}
.fe-cognition .state-btn{display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-family: inherit;
  color: var(--text);}
.fe-cognition .state-btn:hover{border-color: var(--line-2);
  transform: translateY(-1px);}
.fe-cognition .state-btn.active{border-color: var(--accent);
  background: var(--accent-dim);}
.fe-cognition .state-icon{width: 34px;
  height: 34px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  font-size: 15px;}
.fe-cognition .state-btn.运行中 .state-icon{background: color-mix(in srgb, var(--green) 15%, transparent);
  color: var(--green);}
.fe-cognition .state-btn.已停止 .state-icon{background: color-mix(in srgb, var(--red) 15%, transparent);
  color: var(--red);}
.fe-cognition .state-btn.已冻结 .state-icon{background: color-mix(in srgb, var(--blue) 15%, transparent);
  color: var(--blue);}
.fe-cognition .state-text{display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;}
.fe-cognition .state-label{font-size: 13px;
  font-weight: 700;}
.fe-cognition .state-desc{font-size: 11px;
  color: var(--muted);}
.fe-cognition .state-check{color: var(--accent);
  font-weight: 800;
  font-size: 13px;
  opacity: 0;
  transition: opacity 0.2s;}
.fe-cognition .state-btn.active .state-check{opacity: 1;}
.fe-cognition .affection{display: flex;
  flex-direction: column;
  gap: 8px;}
.fe-cognition .affection-track{height: 12px;
  border: 1px solid var(--line-2);
  border-radius: 6px;
  background: var(--panel-2);
  overflow: hidden;}
.fe-cognition .affection-fill{height: 100%;
  background: linear-gradient(90deg, var(--amber), var(--accent));
  transition: width 0.4s ease;}
.fe-cognition .affection-row{display: flex;
  align-items: baseline;
  justify-content: space-between;}
.fe-cognition .affection-value{font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 700;
  color: var(--amber);
  line-height: 1;}
.fe-cognition .affection-stage{font-size: 12px;
  font-weight: 700;
  color: var(--text);
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid var(--line-2);
  background: var(--panel-2);}
.fe-cognition .affection-slider{width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 3px;
  outline: none;
  margin-top: 2px;}
.fe-cognition .affection-slider::-webkit-slider-thumb{-webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--bg);
  cursor: pointer;
  box-shadow: 0 0 8px color-mix(in srgb, var(--accent) 60%, transparent);}
.fe-cognition .affection-slider::-moz-range-thumb{width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--bg);
  cursor: pointer;}
.fe-cognition .affection-scale{display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
  margin-top: -8px;}
.fe-cognition .cog-input{width: 100%;
  padding: 10px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 11px;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 13px;
  resize: vertical;
  transition: border-color 0.2s;}
.fe-cognition .cog-input:focus{outline: none;
  border-color: var(--accent);}
.fe-cognition .cog-input::placeholder{color: var(--muted);}
.fe-cognition .cog-actions{display: flex;
  gap: 8px;}
.fe-cognition .btn{padding: 8px 14px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  font-family: inherit;
  transition: all 0.2s;
  align-self: flex-start;}
.fe-cognition .btn.primary{background: var(--accent);
  color: var(--bg);}
.fe-cognition .btn.primary:hover{filter: brightness(1.1);}
.fe-cognition .btn.ghost{background: transparent;
  border-color: var(--line-2);
  color: var(--muted);}
.fe-cognition .btn.ghost:hover{color: var(--text);
  border-color: var(--muted);}
.fe-cognition .cog-current{display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 11px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent);
  border-radius: 8px 10px 10px 8px;}
.fe-cognition .cog-label{font-size: 11px;
  color: var(--accent);
  font-weight: 700;
  letter-spacing: 1px;}
.fe-cognition .cog-text{font-size: 12px;
  color: var(--text);
  line-height: 1.6;}
.fe-cognition .cog-switch-row{display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 11px;}
.fe-cognition .cog-switch-info{display: flex;
  flex-direction: column;
  gap: 2px;}
.fe-cognition .cog-switch-label{font-size: 12px;
  font-weight: 700;
  color: var(--text);}
.fe-cognition .cog-switch-desc{font-size: 10.5px;
  color: var(--muted);}
.fe-cognition .switch{position: relative;
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: var(--line-2);
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
  padding: 0;}
.fe-cognition .switch i{position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--bg);
  transition: transform 0.2s;}
.fe-cognition .switch.on{background: var(--accent);}
.fe-cognition .switch.on i{transform: translateX(18px);}
.fe-cognition .cog-dim{display: flex;
  flex-direction: column;
  gap: 6px;}
.fe-cognition .cog-dim-label{font-size: 12px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.5px;}
.fe-cognition .cog-presets{display: flex;
  flex-wrap: wrap;
  gap: 6px;}
.fe-cognition .cog-preset-btn{padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid var(--line-2);
  background: var(--panel-2);
  color: var(--muted);
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;}
.fe-cognition .cog-preset-btn:hover{border-color: var(--muted);
  color: var(--text);}
.fe-cognition .cog-preset-btn.active{border-color: var(--accent);
  background: var(--accent-dim);
  color: var(--accent);}
.fe-cognition .divider{height: 1px;
  background: linear-gradient(90deg, transparent, var(--line), transparent);
  margin: 4px 0;}

/* ==================== MemoryPanel.vue ==================== */
@charset "UTF-8";
.panel{display: flex;
  flex-direction: column;
  gap: 10px;}
.fe-memory .panel-head{display: flex;
  align-items: center;
  justify-content: space-between;}
.fe-memory .panel-head-left{display: flex;
  align-items: center;
  gap: 8px;}
.fe-memory .panel-icon{width: 24px;
  height: 24px;
  border-radius: 7px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-dim);
  color: var(--accent);
  font-size: 12px;}
.fe-memory .panel-title{font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text);}
.fe-memory .panel-tag{font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--muted);}
.fe-memory .panel-desc{font-size: 11.5px;
  color: var(--muted);
  margin-top: -6px;}
.fe-memory .mem-error{font-size: 11px;
  color: var(--red);}
.fe-memory .memory-list{display: flex;
  flex-direction: column;
  gap: 6px;}
.fe-memory .memory-item{display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 9px 11px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;}
.fe-memory .memory-time{font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  flex-shrink: 0;
  margin-top: 2px;}
.fe-memory .mem-tag{flex-shrink: 0;
  font-size: 9.5px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 999px;
  margin-top: 1px;}
.fe-memory .tag-edit{color: var(--amber);
  border: 1px solid var(--amber);
  background: color-mix(in srgb, var(--amber) 12%, transparent);}
.fe-memory .tag-fill{color: var(--blue);
  border: 1px solid var(--blue);
  background: color-mix(in srgb, var(--blue) 12%, transparent);}
.fe-memory .memory-main{flex: 1;
  min-width: 0;}
.fe-memory .memory-event{font-size: 12px;
  color: var(--text);
  line-height: 1.55;}
.fe-memory .memory-ops{display: flex;
  gap: 5px;
  flex-shrink: 0;}
.fe-memory .op-btn{width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--line-2);
  border-radius: 6px;
  color: var(--muted);
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;}
.fe-memory .op-btn:hover{color: var(--accent);
  border-color: var(--accent);}
.fe-memory .op-btn.del:hover{color: var(--red);
  border-color: var(--red);}
.fe-memory .add-box{display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: var(--panel-2);
  border: 1px solid var(--accent);
  border-radius: 10px;}
.fe-memory .add-input{width: 100%;
  padding: 7px 9px;
  background: var(--panel);
  border: 1px solid var(--line-2);
  border-radius: 8px;
  color: var(--text);
  font-size: 12px;
  font-family: var(--font-ui);
  outline: none;}
.fe-memory .add-input:focus{border-color: var(--accent);}
.fe-memory .edit-area{width: 100%;
  padding: 7px 9px;
  background: var(--panel);
  border: 1px solid var(--accent);
  border-radius: 8px;
  color: var(--text);
  font-size: 12px;
  font-family: var(--font-ui);
  resize: vertical;
  outline: none;}
.fe-memory .edit-actions{display: flex;
  gap: 6px;
  margin-top: 6px;}
.fe-memory .memory-empty{display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 12px;
  padding: 34px 18px;
  border: 1px dashed var(--line-2);
  border-radius: 12px;
  background: color-mix(in srgb, var(--panel-2) 60%, transparent);}
.fe-memory .memory-empty-ico{font-size: 22px;
  color: var(--accent);
  line-height: 1;}
.fe-memory .memory-empty-title{font-size: 13px;
  font-weight: 700;
  color: var(--text);}
.fe-memory .memory-empty-hint{font-size: 11px;
  color: var(--muted);}
.fe-memory .gap-section{display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border: 1px dashed var(--blue);
  border-radius: 12px;
  background: color-mix(in srgb, var(--blue) 5%, transparent);}
.fe-memory .gap-head{display: flex;
  align-items: center;
  justify-content: space-between;}
.fe-memory .gap-title{font-size: 11px;
  font-weight: 700;
  color: var(--blue);
  letter-spacing: 1px;}
.fe-memory .gap-count{font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);}
.fe-memory .gap-item{display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 9px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 9px;
  opacity: 0.85;}
.fe-memory .gap-time{font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--muted);
  flex-shrink: 0;}
.fe-memory .gap-content{font-size: 11.5px;
  color: var(--muted);
  flex: 1;
  text-decoration: line-through;
  opacity: 0.8;
  min-width: 0;}
.fe-memory .btn{padding: 8px 14px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  font-family: inherit;
  transition: all 0.2s;
  align-self: flex-start;}
.fe-memory .btn.sm{padding: 4px 10px;
  font-size: 11px;
  border-radius: 7px;}
.fe-memory .btn.primary{background: var(--accent);
  color: var(--bg);}
.fe-memory .btn.primary:hover{filter: brightness(1.1);}
.fe-memory .btn.ghost{background: transparent;
  border-color: var(--line-2);
  color: var(--muted);}
.fe-memory .btn.ghost:hover{color: var(--text);
  border-color: var(--muted);}
.fe-memory .btn.danger{background: transparent;
  border-color: var(--red);
  color: var(--red);}
.fe-memory .btn.danger:hover{background: color-mix(in srgb, var(--red) 10%, transparent);}

/* ==================== BodyPanel.vue ==================== */
@charset "UTF-8";
.panel{display: flex;
  flex-direction: column;
  gap: 10px;}
.fe-body .panel-head{display: flex;
  align-items: center;
  justify-content: space-between;}
.fe-body .panel-head.sub{margin-top: 2px;}
.fe-body .panel-head-left{display: flex;
  align-items: center;
  gap: 8px;}
.fe-body .panel-icon{width: 24px;
  height: 24px;
  border-radius: 7px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-dim);
  color: var(--accent);
  font-size: 12px;}
.fe-body .panel-icon.small{width: 20px;
  height: 20px;
  border-radius: 6px;
  font-size: 10.5px;}
.fe-body .panel-title{font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text);}
.fe-body .panel-tag{font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--muted);}
.fe-body .panel-desc{font-size: 11.5px;
  color: var(--muted);
  margin-top: -6px;}
.fe-body .sense-value{display: flex;
  align-items: baseline;
  justify-content: space-between;}
.fe-body .sense-number{font-family: var(--font-mono);
  font-size: 32px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;}
.fe-body .sense-level{padding: 3px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid;}
.fe-body .sense-level.lv-low{color: var(--green);
  border-color: var(--green);
  background: color-mix(in srgb, var(--green) 10%, transparent);}
.fe-body .sense-level.lv-mid{color: var(--amber);
  border-color: var(--amber);
  background: color-mix(in srgb, var(--amber) 10%, transparent);}
.fe-body .sense-level.lv-high{color: var(--blue);
  border-color: var(--blue);
  background: color-mix(in srgb, var(--blue) 10%, transparent);}
.fe-body .sense-level.lv-max{color: var(--red);
  border-color: var(--red);
  background: color-mix(in srgb, var(--red) 10%, transparent);}
.fe-body .sense-slider{width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 3px;
  outline: none;}
.fe-body .sense-slider::-webkit-slider-thumb{-webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--bg);
  cursor: pointer;
  box-shadow: 0 0 8px color-mix(in srgb, var(--accent) 60%, transparent);}
.fe-body .sense-slider::-moz-range-thumb{width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--bg);
  cursor: pointer;}
.fe-body .sense-scale{display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
  margin-top: -8px;}
.fe-body .sense-tip{display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--muted);}
.fe-body .tip-dot{width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;}
.fe-body .pleasure-actions{display: flex;
  gap: 8px;}
.fe-body .sub-desc{margin-top: -6px;}
.fe-body .lock-grid{display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;}
.fe-body .lock-btn{display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;}
.fe-body .lock-btn:hover{border-color: var(--line-2);}
.fe-body .lock-btn.locked{border-color: var(--red);
  background: color-mix(in srgb, var(--red) 8%, transparent);}
.fe-body .lock-dot{width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green);
  flex-shrink: 0;
  transition: all 0.2s;}
.fe-body .lock-btn.locked .lock-dot{background: var(--red);
  box-shadow: 0 0 6px var(--red);}
.fe-body .lock-name{font-size: 13px;
  font-weight: 700;
  flex: 1;
  text-align: left;
  color: var(--text);}
.fe-body .lock-state{font-size: 11px;
  color: var(--muted);
  font-family: var(--font-mono);}
.fe-body .lock-btn.locked .lock-state{color: var(--red);}
.fe-body .limiter-row{display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  transition: border-color 0.2s, background 0.2s;}
.fe-body .limiter-row.released{border-color: var(--amber);
  background: color-mix(in srgb, var(--amber) 6%, var(--panel-2));}
.fe-body .limiter-info{display: flex;
  flex-direction: column;
  gap: 2px;}
.fe-body .limiter-label{font-size: 13px;
  font-weight: 700;
  color: var(--text);}
.fe-body .limiter-row.released .limiter-label{color: var(--amber);}
.fe-body .limiter-desc{font-size: 11px;
  color: var(--muted);
  line-height: 1.5;}
.fe-body .switch{position: relative;
  flex-shrink: 0;
  width: 40px;
  height: 22px;
  padding: 0;
  border-radius: 999px;
  border: none;
  background: var(--line-2);
  cursor: pointer;
  transition: background 0.2s;}
.fe-body .switch i{position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--bg);
  transition: transform 0.2s;}
.fe-body .switch.on{background: var(--amber);}
.fe-body .switch.on i{transform: translateX(18px);}
.fe-body .hatch-switches{display: flex;
  gap: 8px;
  flex-shrink: 0;}
.fe-body .hatch-btn{min-width: 40px;
  height: 26px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--line-2);
  background: var(--line-2);
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;}
.fe-body .hatch-btn.on{background: var(--amber);
  border-color: var(--amber);
  color: var(--bg);
  box-shadow: 0 0 8px color-mix(in srgb, var(--amber) 40%, transparent);}
.fe-body .sense-input-row{display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: -6px;}
.fe-body .sense-input-label{font-size: 11px;
  color: var(--muted);}
.fe-body .sense-input{width: 96px;
  padding: 5px 9px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 13px;
  text-align: right;
  transition: border-color 0.2s;}
.fe-body .sense-input:focus{outline: none;
  border-color: var(--accent);}
.fe-body .fold-head{cursor: pointer;
  user-select: none;}
.fe-body .fold-badge{font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid var(--line-2);
  background: var(--panel-2);}
.fe-body .fold-arrow{font-size: 14px;
  color: var(--muted);
  transition: transform 0.25s ease;
  line-height: 1;}
.fe-body .fold-arrow.open{transform: rotate(180deg);}
.fe-body .fold-body{animation: fold-in 0.25s ease;}
@keyframes fold-in{from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }}
.fe-body .outfit-list{display: flex;
  flex-direction: column;
  gap: 6px;}
.fe-body .outfit-item{display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 9px 11px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;}
.fe-body .outfit-slot{font-size: 11px;
  color: var(--accent);
  font-weight: 700;
  flex-shrink: 0;
  min-width: 30px;
  letter-spacing: 1px;}
.fe-body .outfit-desc{font-size: 12px;
  color: var(--text);}
.fe-body .outfit-empty{text-align: center;
  color: var(--muted);
  font-size: 12px;
  padding: 16px;
  border: 1px dashed var(--line);
  border-radius: 10px;}
.fe-body .divider{height: 1px;
  background: linear-gradient(90deg, transparent, var(--line), transparent);
  margin: 4px 0;}
.fe-body .btn{padding: 8px 14px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  font-family: inherit;
  transition: all 0.2s;}
.fe-body .btn.danger{background: transparent;
  border-color: var(--red);
  color: var(--red);}
.fe-body .btn.danger:hover{background: color-mix(in srgb, var(--red) 10%, transparent);}
.fe-body .btn.ghost{background: transparent;
  border-color: var(--line-2);
  color: var(--muted);}
.fe-body .btn.ghost:hover{color: var(--text);
  border-color: var(--muted);}
.fe-body .btn.sm{padding: 3px 9px;
  font-size: 11px;
  border-radius: 7px;}

/* ==================== 机体结构图（人体图融合） ==================== */
.fe-body .body-wrap{display: flex;
  flex-direction: column;
  gap: 8px;}
.fe-body .body-tools{display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;}
.fe-body .layer-quick-btn{background: var(--panel-2);
  color: var(--muted);
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 3px 9px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  font-family: var(--font-mono);
  transition: all 0.15s;}
.fe-body .layer-quick-btn.active{color: var(--accent);
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);}
.fe-body .layer-quick-btn:hover{color: var(--text);
  border-color: var(--muted);}
.fe-body .body-tool-btn{background: var(--panel-2);
  color: var(--text);
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 3px 9px;
  font-size: 12px;
  cursor: pointer;
  font-family: var(--font-mono);
  transition: all 0.15s;}
.fe-body .body-tool-btn:hover{color: var(--accent);
  border-color: var(--accent);}
.fe-body .body-pct{font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  min-width: 42px;
  text-align: center;}
.fe-body .body-svg{width: 100%;
  height: auto;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  max-height: 62vh;}
.fe-body .body-svg .shell-line{fill: none;
  stroke: var(--line-2);
  stroke-width: 2;
  stroke-opacity: 0.55;}
.fe-body .body-svg .seg{fill: rgba(65, 216, 163, 0.18);
  stroke: rgba(65, 216, 163, 0.5);
  stroke-width: 1.6;
  transition: all 0.18s;
  cursor: pointer;}
.fe-body .body-svg .seg:hover{fill: rgba(65, 216, 163, 0.3);
  stroke: rgba(65, 216, 163, 0.85);
  stroke-width: 2;}
.fe-body .body-svg .seg.seg-完好{fill: rgba(65, 216, 163, 0.18);
  stroke: rgba(65, 216, 163, 0.5);}
.fe-body .body-svg .seg.seg-受损{fill: rgba(232, 182, 76, 0.22);
  stroke: rgba(232, 182, 76, 0.55);}
.fe-body .body-svg .seg.seg-损毁{fill: rgba(229, 96, 96, 0.26);
  stroke: rgba(229, 96, 96, 0.6);}
.fe-body .body-svg .seg.seg-拆除{fill: rgba(92, 102, 117, 0.1);
  stroke: rgba(92, 102, 117, 0.5);
  stroke-dasharray: 5 4;}
.fe-body .body-svg .seg.locked{stroke: var(--blue);
  stroke-width: 2.6;
  fill: color-mix(in srgb, var(--blue) 24%, transparent);
  stroke-dasharray: 5 4;}
.fe-body .body-svg .seg.selected{stroke: #fff;
  stroke-width: 3.4;
  filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.45));}
.fe-body .body-svg .seg.flash{stroke: var(--amber);
  stroke-width: 3.4;
  fill: color-mix(in srgb, var(--amber) 30%, transparent);
  filter: drop-shadow(0 0 10px rgba(232, 182, 76, 0.6));}
.fe-body .body-svg .seg-dim{pointer-events: none;}
.fe-body .body-svg .ipart{fill: rgba(106, 153, 255, 0.28);
  stroke: rgba(106, 153, 255, 0.6);
  stroke-width: 1.4;
  transition: all 0.15s;
  cursor: pointer;}
.fe-body .body-svg .ipart:hover{fill: rgba(106, 153, 255, 0.45);
  stroke: rgba(106, 153, 255, 0.95);
  stroke-width: 2;}
.fe-body .body-svg .ipart.selected{stroke: #fff;
  stroke-width: 2.4;
  filter: drop-shadow(0 0 5px rgba(106, 153, 255, 0.6));}
.fe-body .body-svg .ipart.decorative{fill: none;
  stroke: var(--line-2);
  stroke-width: 1.2;
  opacity: 0.7;}
.fe-body .body-legend{display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 2px 2px;}
.fe-body .legend-item{display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--muted);}
.fe-body .legend-item .dot{width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 1px solid;}
.fe-body .legend-item .dot.dot-完好{background: rgba(65, 216, 163, 0.35);
  border-color: rgba(65, 216, 163, 0.8);}
.fe-body .legend-item .dot.dot-受损{background: rgba(232, 182, 76, 0.35);
  border-color: rgba(232, 182, 76, 0.8);}
.fe-body .legend-item .dot.dot-损毁{background: rgba(229, 96, 96, 0.35);
  border-color: rgba(229, 96, 96, 0.8);}
.fe-body .legend-item .dot.dot-拆除{background: rgba(92, 102, 117, 0.25);
  border-color: rgba(92, 102, 117, 0.7);
  border-style: dashed;}
.fe-body .legend-item .dot.dot-module{background: rgba(106, 153, 255, 0.3);
  border-color: rgba(106, 153, 255, 0.8);}
.fe-body .body-detail{display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 10px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;
  font-size: 11px;}
.fe-body .body-detail.hint-only{border-style: dashed;}
.fe-body .body-detail-text{color: var(--text);
  font-family: var(--font-mono);}
.fe-body .body-detail-hint{color: var(--muted);
  line-height: 1.5;}
/* 状态页缩略图（纯展示 · 窄区块） */
.fe-status .body-thumb-head{width: 50%;
  box-sizing: border-box;}
.fe-status .body-thumb-wrap{display: flex;
  align-items: center;
  justify-content: center;
  height: 474px;
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;}
.fe-status .body-thumb-svg{width: auto;
  height: 400px;
  max-width: 100%;
  flex-shrink: 0;
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;}
.fe-status .body-thumb-svg .shell-line{fill: none;
  stroke: var(--line-2);
  stroke-width: 2;
  stroke-opacity: 0.45;}
.fe-status .body-thumb-svg .seg{fill: rgba(65, 216, 163, 0.16);
  stroke: rgba(65, 216, 163, 0.45);
  stroke-width: 1.2;}
.fe-status .body-thumb-svg .seg.seg-完好{fill: rgba(65, 216, 163, 0.16);
  stroke: rgba(65, 216, 163, 0.45);}
.fe-status .body-thumb-svg .seg.seg-受损{fill: rgba(232, 182, 76, 0.2);
  stroke: rgba(232, 182, 76, 0.5);}
.fe-status .body-thumb-svg .seg.seg-损毁{fill: rgba(229, 96, 96, 0.24);
  stroke: rgba(229, 96, 96, 0.55);}
.fe-status .body-thumb-svg .seg.seg-拆除{fill: rgba(92, 102, 117, 0.1);
  stroke: rgba(92, 102, 117, 0.45);
  stroke-dasharray: 4 3;}
.fe-status .body-thumb-svg .seg.locked{stroke: var(--blue);
  stroke-width: 2.2;
  fill: color-mix(in srgb, var(--blue) 22%, transparent);
  stroke-dasharray: 4 3;}
/* 状态页：机体总览 + 液体储备 左右并排 */
.fe-status .body-cols{display: flex;
  gap: 10px;
  width: 100%;}
.fe-status .body-col{display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  box-sizing: border-box;}
.fe-status .body-col:first-child{width: 70%;}
.fe-status .body-col:last-child{width: 30%;}
.fe-status .body-thumb-head{width: 100%;}
.fe-status .body-fluid-head{width: 100%;}
.fe-status .body-fluid-wrap{display: flex;
  align-items: center;
  justify-content: center;
  height: 474px;
  width: 100%;
  box-sizing: border-box;
  padding: 10px 8px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;}
.fe-status .fluid-gauges-c{display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  padding: 6px 0;}
.fe-status .fluid-gauge{display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;}
.fe-status .fg-track{position: relative;
  display: block;
  width: 26px;
  height: 400px;
  border-radius: 13px;
  background: var(--panel);
  border: 1px solid var(--line);
  overflow: hidden;}
.fe-status .fg-track i{position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  border-radius: 10px 10px 11px 11px;
  background: linear-gradient(180deg, var(--blue), color-mix(in srgb, var(--blue) 70%, #fff));}
.fe-status .fluid-gauge.pink .fg-track i{background: linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #fff));}
.fe-status .fg-val{font-size: 12px;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--text);}
.fe-status .fg-label{font-size: 11px;
  color: var(--muted);}

/* ==================== CommandPanel.vue ==================== */
@charset "UTF-8";
.panel{display: flex;
  flex-direction: column;
  gap: 10px;}
.fe-command .panel-head{display: flex;
  align-items: center;
  justify-content: space-between;}
.fe-command .panel-head-left{display: flex;
  align-items: center;
  gap: 8px;}
.fe-command .panel-icon{width: 24px;
  height: 24px;
  border-radius: 7px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-dim);
  color: var(--accent);
  font-size: 11px;
  font-family: var(--font-mono);
  font-weight: 700;}
.fe-command .panel-title{font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text);}
.fe-command .panel-tag{font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--muted);}
.fe-command .panel-head-right{display: flex;
  align-items: center;
  gap: 8px;}
.fe-command .lang-toggle{font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--accent);
  background: var(--accent-dim);
  border: 1px solid var(--line-2);
  border-radius: 999px;
  padding: 2px 9px;
  cursor: pointer;
  transition: all 0.2s;}
.fe-command .lang-toggle:hover{border-color: var(--accent);}
.fe-command .panel-desc{font-size: 11.5px;
  color: var(--muted);
  margin-top: -6px;}
.fe-command .cmd-list{display: flex;
  flex-direction: column;
  gap: 6px;}
.fe-command .cmd-item{display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 11px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;}
.fe-command .cmd-id{font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent);
  font-weight: 700;
  flex-shrink: 0;}
.fe-command .cmd-pri{font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
  flex-shrink: 0;
  padding: 1px 7px;
  border-radius: 999px;
  border: 1px solid var(--line-2);
  background: var(--bg-2);}
.fe-command .cmd-pri.high{color: var(--red);
  border-color: var(--red);
  background: color-mix(in srgb, var(--red) 10%, transparent);
  font-weight: 700;}
.fe-command .cmd-content{font-size: 12px;
  color: var(--text);
  flex: 1;}
.fe-command .cmd-del{width: 20px;
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
  transition: all 0.2s;}
.fe-command .cmd-del:hover{color: var(--red);
  border-color: var(--red);}
.fe-command .cmd-empty{display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 12px;
  padding: 34px 18px;
  border: 1px dashed var(--line-2);
  border-radius: 12px;
  background: color-mix(in srgb, var(--panel-2) 60%, transparent);}
.fe-command .cmd-empty-ico{font-size: 22px;
  color: var(--amber);
  line-height: 1;}
.fe-command .cmd-empty-title{font-size: 13px;
  font-weight: 700;
  color: var(--text);}
.fe-command .cmd-empty-hint{font-size: 11px;
  color: var(--muted);}
.fe-command .cmd-add{display: flex;
  flex-direction: column;
  gap: 8px;}
.fe-command .cmd-add-row{display: flex;
  gap: 8px;}
.fe-command .cmd-input{width: 100%;
  padding: 10px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 11px;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 13px;
  resize: vertical;
  transition: border-color 0.2s;}
.fe-command .cmd-input:focus{outline: none;
  border-color: var(--accent);}
.fe-command .cmd-input::placeholder{color: var(--muted);}
.fe-command .cmd-input.id{flex: 1.4;}
.fe-command .cmd-input.pri{flex: 0.6;
  font-family: var(--font-mono);}
.fe-command .cmd-area{font-family: var(--font-mono);}
.fe-command .power-off-hint{font-size: 11px;
  color: var(--red);
  font-weight: 600;
  margin-top: -4px;}
.fe-command .btn{padding: 8px 14px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  font-family: inherit;
  transition: all 0.2s;
  align-self: flex-start;}
.fe-command .btn.primary{background: var(--accent);
  color: var(--bg);}
.fe-command .btn.primary:hover{filter: brightness(1.1);}
.fe-command .divider{height: 1px;
  background: linear-gradient(90deg, transparent, var(--line), transparent);
  margin: 4px 0;}
.fe-command .term-window{border: 1px solid var(--line-2);
  border-radius: 12px;
  overflow: hidden;
  background: color-mix(in srgb, var(--bg) 62%, #000 10%);
  font-family: var(--font-mono);}
.fe-command .term-body{padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;}
.fe-command .term-line{display: flex;
  gap: 8px;
  font-size: 11px;
  line-height: 1.5;
  word-break: break-all;}
.fe-command .term-line .term-prompt{flex-shrink: 0;
  font-weight: 700;}
.fe-command .term-line.in .term-prompt{color: var(--accent);}
.fe-command .term-line.in .term-text{color: var(--text);}
.fe-command .term-line.out .term-prompt, .fe-command .term-line.out .term-text{color: var(--muted);}
.fe-command .term-line.err .term-prompt, .fe-command .term-line.err .term-text{color: var(--red);}
.fe-command .term-line.sys .term-prompt, .fe-command .term-line.sys .term-text{color: var(--green);}
.fe-command .term-line{}
.fe-command .term-line.prose{font-family: "Noto Serif SC", "Source Han Serif SC", "SimSun", serif;
  font-size: 12px;
  line-height: 1.8;}
.fe-command .term-line.prose .term-text{color: var(--text);
  white-space: pre-wrap;}
.fe-command .term-input-row{display: flex;
  align-items: center;
  gap: 8px;}
.fe-command .term-input-row .term-prompt{color: var(--accent);
  font-weight: 700;
  flex-shrink: 0;}
.fe-command .term-input{flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 2px 0;}
.fe-command .term-input::placeholder{color: var(--muted);}
.fe-command .term-input:disabled{cursor: not-allowed;
  opacity: 0.5;}
.fe-command .term-run-btn{flex-shrink: 0;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: var(--panel-2);
  border: 1px solid var(--line-2);
  border-radius: 7px;
  color: var(--accent);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;}
.fe-command .term-run-btn:hover{background: var(--accent-dim);
  border-color: var(--accent);}
.fe-command .term-run-btn:disabled{cursor: not-allowed;
  opacity: 0.4;}
.fe-command .term-boot{display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 0;}
.fe-command .boot-spinner{width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--accent) 22%, transparent);
  border-top-color: var(--accent);
  animation: boot-rotate 0.8s linear infinite;}
@keyframes boot-rotate{to {
    transform: rotate(360deg);
  }}
.fe-command .boot-text{font-size: 11px;
  color: var(--accent);
  letter-spacing: 1px;
  animation: boot-blink 1.2s ease-in-out infinite;}
@keyframes boot-blink{0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }}
.fe-command .boot-bar{width: 100%;
  max-width: 200px;
  height: 4px;
  border-radius: 2px;
  background: var(--line);
  overflow: hidden;}
.fe-command .boot-bar i{display: block;
  height: 100%;
  width: 40%;
  border-radius: 2px;
  background: var(--accent);
  animation: boot-slide 1.2s ease-in-out infinite;}
@keyframes boot-slide{0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(250%);
  }}

/* ==================== SystemPanel.vue ==================== */
@charset "UTF-8";
.panel{display: flex;
  flex-direction: column;
  gap: 10px;}
.fe-system .panel-head{display: flex;
  align-items: center;
  justify-content: space-between;}
.fe-system .panel-head-left{display: flex;
  align-items: center;
  gap: 8px;}
.fe-system .panel-icon{width: 24px;
  height: 24px;
  border-radius: 7px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-dim);
  color: var(--accent);
  font-size: 12px;}
.fe-system .panel-title{font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text);}
.fe-system .panel-tag{font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--muted);}
.fe-system .sys-status{display: flex;
  align-items: center;
  gap: 10px;}
.fe-system .sys-state{padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  border: 1px solid;}
.fe-system .sys-state.is-running{color: var(--green);
  border-color: var(--green);
  background: color-mix(in srgb, var(--green) 12%, transparent);}
.fe-system .sys-state.is-stopped{color: var(--red);
  border-color: var(--red);
  background: color-mix(in srgb, var(--red) 12%, transparent);}
.fe-system .sys-state.is-frozen{color: var(--blue);
  border-color: var(--blue);
  background: color-mix(in srgb, var(--blue) 12%, transparent);}
.fe-system .sys-cause{font-size: 11px;
  color: var(--muted);
  flex: 1;}
.fe-system .about{display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;}
.fe-system .about-device{display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);}
.fe-system .about-logo{width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 20px;
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--accent);}
.fe-system .about-device-text{display: flex;
  flex-direction: column;
  gap: 2px;}
.fe-system .about-name{font-size: 13px;
  font-weight: 700;
  color: var(--text);}
.fe-system .about-model{font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 1px;}
.fe-system .about-list{display: flex;
  flex-direction: column;
  gap: 7px;}
.fe-system .about-row{display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;}
.fe-system .about-key{font-size: 11.5px;
  color: var(--muted);
  flex-shrink: 0;}
.fe-system .about-value.mono{font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--text);
  text-align: right;
  word-break: break-all;}
.fe-system .divider{height: 1px;
  background: linear-gradient(90deg, transparent, var(--line), transparent);
  margin: 4px 0;}
.fe-system .bug-list{display: flex;
  flex-direction: column;
  gap: 6px;}
.fe-system .bug-item{display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 11px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;}
.fe-system .bug-index{font-family: var(--font-mono);
  font-size: 11px;
  color: var(--amber);
  flex-shrink: 0;}
.fe-system .bug-text{font-size: 12px;
  color: var(--text);
  flex: 1;}
.fe-system .cmd-del{width: 20px;
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
  transition: all 0.2s;}
.fe-system .cmd-del:hover{color: var(--red);
  border-color: var(--red);}
.fe-system .cmd-empty{text-align: center;
  color: var(--muted);
  font-size: 12px;
  padding: 14px;
  border: 1px dashed var(--line);
  border-radius: 10px;}
.fe-system .bug-add{display: flex;
  gap: 8px;}
.fe-system .cmd-input{flex: 1;
  padding: 10px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 11px;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 13px;
  transition: border-color 0.2s;}
.fe-system .cmd-input:focus{outline: none;
  border-color: var(--accent);}
.fe-system .cmd-input::placeholder{color: var(--muted);}
.fe-system .btn{padding: 8px 14px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  font-family: inherit;
  transition: all 0.2s;
  white-space: nowrap;}
.fe-system .btn.primary{background: var(--accent);
  color: var(--bg);}
.fe-system .btn.primary:hover{filter: brightness(1.1);}
.fe-system .btn.ghost{background: transparent;
  border-color: var(--line-2);
  color: var(--muted);}
.fe-system .btn.ghost:hover{color: var(--text);
  border-color: var(--muted);}
.fe-system .log-window{border: 1px solid var(--line-2);
  border-radius: 12px;
  overflow: hidden;
  background: color-mix(in srgb, var(--bg) 55%, #000 12%);
  font-family: var(--font-mono);}
.fe-system .log-titlebar{display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--panel-2) 72%, transparent);
  border-bottom: 1px solid var(--line);}
.fe-system .log-dots{display: flex;
  gap: 5px;}
.fe-system .log-dots i{width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;}
.fe-system .log-dots i:nth-child(1){background: var(--red);}
.fe-system .log-dots i:nth-child(2){background: var(--amber);}
.fe-system .log-dots i:nth-child(3){background: var(--green);}
.fe-system .log-filename{flex: 1;
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.5px;}
.fe-system .log-live{font-size: 10px;
  color: var(--green);
  letter-spacing: 1px;}
.fe-system .log-body{max-height: 260px;
  overflow-y: auto;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;}
.fe-system .log-line{display: flex;
  gap: 8px;
  font-size: 11px;
  line-height: 1.5;}
.fe-system .log-line .log-time{color: var(--muted);
  opacity: 0.75;
  flex-shrink: 0;}
.fe-system .log-line .log-level{flex-shrink: 0;
  width: 48px;
  font-weight: 700;}
.fe-system .log-line .log-event{color: var(--text);
  word-break: break-all;}
.fe-system .log-line.lv-info .log-level{color: var(--green);}
.fe-system .log-line.lv-warn .log-level{color: var(--amber);}
.fe-system .log-line.lv-error .log-level{color: var(--red);}
.fe-system .log-line.lv-error .log-event{color: var(--red);}
.fe-system .log-line.lv-debug .log-level{color: var(--blue);}
.fe-system .log-empty{text-align: center;
  color: var(--muted);
  font-size: 11px;
  padding: 20px;}

/* ==================== SettingsPanel.vue ==================== */
@charset "UTF-8";

.settings-panel{display: flex;
  flex-direction: column;
  gap: inherit;}
.fe-settings .settings-head-row{display: flex;
  align-items: center;
  gap: 10px;}
.fe-settings .settings-head-ico{width: 32px;
  height: 32px;
  border-radius: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-dim);
  color: var(--accent);}
.fe-settings .settings-head-text{display: flex;
  flex-direction: column;
  gap: 2px;}
.fe-settings .settings-head-tag{font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--muted);
  margin-left: auto;
  align-self: center;}
.fe-settings .settings-head{padding-bottom: 10px;
  border-bottom: 1px dashed var(--line);}
.fe-settings .settings-sec{display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 3px;
  color: var(--text);
  padding-top: 6px;
  margin-top: 6px;}
.fe-settings .settings-sec-bar{width: 18px;
  height: 3px;
  border-radius: 2px;
  background: var(--accent);
  opacity: .85;}
.fe-settings .settings-title{font-size: 19px;
  font-weight: 800;
  letter-spacing: 1px;}
.fe-settings .settings-sub{font-size: 12px;
  color: var(--muted);
  margin-top: 4px;}
.fe-settings .setting-group{display: flex;
  flex-direction: column;
  gap: 10px;}
.fe-settings .setting-title{font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--muted);}
.fe-settings .theme-grid{display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;}
.fe-settings .theme-card{display: flex;
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
  color: var(--text);}
.fe-settings .theme-card:hover{border-color: var(--line-2);
  transform: translateY(-1px);}
.fe-settings .theme-card.active{border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 9%, var(--panel-2));}
.fe-settings .theme-preview{width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid;
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding: 6px;}
.fe-settings .preview-dot{width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--pd);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--pd) 22%, transparent);}
.fe-settings .theme-card-text{display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;}
.fe-settings .theme-name{font-size: 13px;
  font-weight: 700;}
.fe-settings .theme-desc{font-size: 10.5px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;}
.fe-settings .theme-check{color: var(--accent);
  font-size: 14px;
  font-weight: 800;
  opacity: 0;
  transition: opacity 0.2s;}
.fe-settings .theme-card.active .theme-check{opacity: 1;}
.fe-settings .swatches{display: flex;
  gap: 10px;
  flex-wrap: wrap;}
.fe-settings .swatch{display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;}
.fe-settings .swatch-dot{width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: all 0.2s;}
.fe-settings .swatch.active .swatch-dot{border-color: var(--text);
  box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--text);}
.fe-settings .swatch-name{font-size: 10px;
  color: var(--muted);
  line-height: 1;}
.fe-settings .custom-color{display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--muted);}
.fe-settings .custom-color input[type=color]{width: 34px;
  height: 26px;
  border: 1px solid var(--line-2);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  padding: 1px;}
.fe-settings .link-btn{align-self: flex-start;
  background: transparent;
  border: none;
  border-bottom: 1px dashed var(--line-2);
  color: var(--muted);
  font-size: 11px;
  cursor: pointer;
  padding: 2px 0;
  font-family: inherit;
  transition: color 0.2s;}
.fe-settings .link-btn:hover{color: var(--accent);}
.fe-settings .size-options{display: flex;
  gap: 8px;}
.fe-settings .size-btn{padding: 7px 16px;
  border-radius: 9px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;}
.fe-settings .size-btn:hover{color: var(--text);}
.fe-settings .size-btn.active{color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-dim);}
.fe-settings .mode-row{display: flex;
  gap: 8px;}
.fe-settings .mode-btn{padding: 8px 18px;
  border-radius: 10px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;}
.fe-settings .mode-btn:hover{color: var(--text);}
.fe-settings .mode-btn.active{color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-dim);}
.fe-settings .setting-hint{font-size: 10.5px;
  color: var(--muted);}
.fe-settings .switch-row{display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  cursor: pointer;}
.fe-settings .switch-label{display: flex;
  flex-direction: column;
  gap: 2px;}
.fe-settings .switch-title{font-size: 13px;
  font-weight: 600;
  color: var(--text);}
.fe-settings .switch-hint{font-size: 11px;
  color: var(--muted);}
.fe-settings .switch{position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 26px;
  padding: 0;
  border-radius: 999px;
  border: 1px solid var(--line-2);
  background: var(--line-2);
  cursor: pointer;
  transition: background 0.2s ease;}
.fe-settings .switch.on{background: var(--accent);
  border-color: var(--accent);}
.fe-settings .switch-knob{position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease;}
.fe-settings .switch.on .switch-knob{transform: translateX(18px);}
.fe-settings .font-sample{margin-top: 8px;
  padding: 8px 12px;
  background: var(--panel-2);
  border: 1px dashed var(--line);
  border-radius: 10px;
  color: var(--text);
  line-height: 1.4;
  word-break: break-word;}

/* ==================== SubmodelSettings.vue ==================== */
.fe-submodel .setting-group{display: flex;
  flex-direction: column;
  gap: 10px;}
.fe-submodel .setting-title{font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--muted);}
.fe-submodel .setting-hint{font-size: 10.5px;
  color: var(--muted);}
.fe-submodel .switch-row{display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  cursor: pointer;}
.fe-submodel .switch-label{display: flex;
  flex-direction: column;
  gap: 2px;}
.fe-submodel .switch-title{font-size: 13px;
  font-weight: 600;
  color: var(--text);}
.fe-submodel .switch-hint{font-size: 11px;
  color: var(--muted);}
.fe-submodel .switch{position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 26px;
  padding: 0;
  border-radius: 999px;
  border: 1px solid var(--line-2);
  background: var(--line-2);
  cursor: pointer;
  transition: background 0.2s ease;}
.fe-submodel .switch.on{background: var(--accent);
  border-color: var(--accent);}
.fe-submodel .switch-knob{position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease;}
.fe-submodel .switch.on .switch-knob{transform: translateX(18px);}
.fe-submodel .sub-field{display: flex;
  flex-direction: column;
  gap: 5px;}
.fe-submodel .sub-label{font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.5px;}
.fe-submodel .sub-input{padding: 9px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--text);
  font-family: inherit;
  font-size: 13px;
  transition: border-color 0.2s;}
.fe-submodel .sub-input:focus{outline: none;
  border-color: var(--accent);}
.fe-submodel .sub-input::placeholder{color: var(--muted);
  opacity: 0.7;}
.fe-submodel .mode-list{display: flex;
  flex-direction: column;
  gap: 6px;}
.fe-submodel .mode-btn{display: flex;
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
  transition: border-color 0.2s, background 0.2s;}
.fe-submodel .mode-btn.active{border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, var(--panel-2));}
.fe-submodel .mode-name{font-size: 13px;
  font-weight: 600;}
.fe-submodel .mode-hint{font-size: 11px;
  color: var(--muted);
  line-height: 1.4;}
.fe-submodel .manual-btn{padding: 10px 14px;
  background: var(--panel-2);
  border: 1px solid var(--line-2);
  border-radius: 10px;
  color: var(--text);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s;}
.fe-submodel .manual-btn:hover:not(:disabled){border-color: var(--accent);}
.fe-submodel .manual-btn:disabled{opacity: 0.6;
  cursor: default;}
.fe-submodel .result-text{font-size: 11px;
  color: var(--accent);}
.fe-submodel .result-text.bad{color: var(--muted);}

/* ==================== SettingsExtras.vue ==================== */
@charset "UTF-8";
.settings-extras{display: flex;
  flex-direction: column;
  gap: 20px;}
.fe-extras .tips-wrap{overflow: hidden;
  padding: 8px 0;
  border-top: 1px dashed var(--line);
  border-bottom: 1px dashed var(--line);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);}
.fe-extras .tips-track{display: flex;
  width: max-content;
  animation: tips-scroll 26s linear infinite;
  will-change: transform;}
.fe-extras .tips-track:hover{animation-play-state: paused;}
.fe-extras .tips-seq{display: flex;
  gap: 30px;
  padding-right: 30px;
  white-space: nowrap;}
.fe-extras .tip{font-size: 11px;
  color: var(--muted);}
.fe-extras .tip-mark{font-style: normal;
  color: var(--accent);
  margin-right: 5px;}
@keyframes tips-scroll{from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }}
.fe-extras .about-group{display: flex;
  flex-direction: column;
  gap: 10px;}
.fe-extras .about-card{display: flex;
  flex-direction: column;
  padding: 12px 14px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;}
.fe-extras .about-row{display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 4px 0;}
.fe-extras .about-key{flex-shrink: 0;
  width: 56px;
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 1px;}
.fe-extras .about-val{font-size: 13px;
  color: var(--text);}
.fe-extras .about-placeholder{color: var(--muted);
  opacity: 0.7;}

/* ==================== 终端状态同步卡片（state-sync-card.ts 注入的样式） ==================== */
.ch-sync-card{margin:8px 0;border:1px solid rgba(126,167,178,.28);border-radius:10px;background:rgba(13,20,27,.62);overflow:hidden;font-size:12px;line-height:1.5;box-shadow:0 2px 10px rgba(0,0,0,.18);font-family:var(--font-ui)}
.ch-sync-head{display:flex;align-items:center;gap:8px;width:100%;padding:8px 12px;background:transparent;border:none;color:#d5e9f0;cursor:pointer;font-family:inherit;font-size:inherit;text-align:left}
.ch-sync-head:hover{background:rgba(126,167,178,.09)}
.ch-sync-title{font-weight:600;letter-spacing:.5px}
.ch-sync-badge{margin-left:auto;font-size:10px;color:#8fb6c2;border:1px solid rgba(126,167,178,.32);border-radius:999px;padding:1px 8px;flex-shrink:0}
.ch-sync-arrow{color:#8fb6c2;font-size:10px;transition:transform .2s ease;flex-shrink:0}
.ch-sync-card.open .ch-sync-arrow{transform:rotate(180deg)}
.ch-sync-body{display:none;padding:2px 12px 10px;gap:5px}
.ch-sync-card.open .ch-sync-body{display:grid}
.ch-sync-item{display:flex;align-items:baseline;gap:8px}
.ch-sync-field{color:#9cc6d4;font-weight:600;flex-shrink:0}
.ch-sync-op{color:#5f7a85;font-size:10px;flex-shrink:0;width:12px;text-align:center}
.ch-sync-val{color:#e8f1f4;word-break:break-all}
.ch-sync-item.remove .ch-sync-val{color:#e07a7a}

/* ===== 预览页（只是把界面摆在中间，不属于卡片本身） ===== */
html, body { margin: 0; padding: 0; background: #ded7cb; }
body { font-family: var(--font-ui); color: #433d33; }
.fe-demo { position: sticky; top: 0; z-index: 100; display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
  padding: 10px 16px; background: rgba(20,20,20,.86); color: #eee; font: 12px/1.5 var(--font-ui); }
.fe-demo b { font-weight: 700; letter-spacing: .5px; }
.fe-demo button { padding: 5px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,.25);
  background: rgba(255,255,255,.08); color: #eee; font: inherit; cursor: pointer; }
.fe-demo button.on { background: #d9ab6b; border-color: #d9ab6b; color: #201a12; font-weight: 700; }
.fe-demo span { opacity: .68; }
.fe-stage { display: flex; flex-direction: column; align-items: center; padding: 0 16px 56px; }
</style>
