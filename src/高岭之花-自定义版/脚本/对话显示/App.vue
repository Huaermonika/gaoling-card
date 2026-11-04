<template>
  <!-- 关闭美化时只挂操作台，正文由酒馆原生楼层显示 -->
  <FlatConsole v-if="prettyOff" />
  <div v-else class="phone" :class="{ mobile: isMobile, desktop: !isMobile, elder: elderMode }" :style="phoneVars">
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
            <span v-else class="avatar-char">{{ roleInitial }}</span>
          </div>
          <div class="chat-head-info">
            <div class="chat-name">{{ roleName }}</div>
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
              <span>来自{{ roleName }} · 新消息</span>
              <span class="label-line"></span>
            </div>
            <div class="chat-bubble" v-html="dialogHtml"></div>
          </div>
          <form class="chat-compose" @submit.prevent="sendChat">
            <input v-model="chatInput" type="text" placeholder="输入要发送的话…" autocomplete="off" />
            <button type="submit" :disabled="sending || !chatInput.trim()">发送</button>
          </form>
          <div class="chat-foot">
            <span class="foot-dot"></span>
            <span>message encrypted · {{ roleModel }}</span>
          </div>
        </div>
      </div>

      <!-- ========== APP 控制终端视图 ========== -->
      <div v-else-if="view === 'app'" class="view app-view">
        <header class="app-head">
          <div class="app-head-row">
            <div class="app-brand" role="button" tabindex="0" @click="roleDrawerOpen = true">
              <span
                class="app-logo"
                :class="stateClass"
                :style="roleArtStyleOf()"
                >{{ roleArtOf() ? '' : '◈' }}</span
              >
              <div class="app-brand-text">
                <div class="app-name">{{ roleName }}</div>
                <div class="app-model">{{ roleModel }} · 控制终端 <i class="brand-caret">▾</i></div>
              </div>
            </div>
            <span class="app-state" :class="stateClass">{{ store.data.千鹤.意识状态 }}</span>
          </div>
          <div v-if="showSwitchHint" class="switch-hint" @click="dismissSwitchHint">
            <span>点顶部角色名可切换 / 管理角色</span>
            <b>知道了</b>
          </div>
          <div class="app-roles">
            <button
              v-for="[id, role] in roles"
              :key="id"
              class="app-role"
              :class="{ active: id === store.data.当前角色 }"
              type="button"
              @click="switchTo(id)"
            >
              {{ role.档案.姓名 || id }}
            </button>
            <button class="app-role add" type="button" @click="openRoleManager()">＋ 角色</button>
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
          <div v-if="active_tab === '状态'" class="pane"><StatusPanel /></div>
          <div v-else-if="active_tab === '认知'" class="pane"><CognitionPanel /></div>
          <div v-else-if="active_tab === '记忆'" class="pane"><MemoryPanel /></div>
          <div v-else-if="active_tab === '躯体参数'" class="pane"><BodyPanel /></div>
          <div v-else-if="active_tab === '指令'" class="pane"><CommandPanel /></div>
          <div v-else-if="active_tab === '系统'" class="pane"><SystemPanel /></div>
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
        <SettingsPanel :show-layout="true" title="外观设置" sub="为你的屏幕挑选一套风格" @open-library="libraryOpen = true" @open-gallery="galleryOpen = true" />
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
            <div class="pc-name">{{ roleName }}</div>
            <div class="pc-model">{{ roleModel }} · 控制终端 · {{ store.data.千鹤.意识状态 }}</div>
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
            <SettingsPanel :show-layout="true" title="外观与显示" sub="为你的屏幕挑选一套风格与形态" @open-library="libraryOpen = true" @open-gallery="galleryOpen = true" />
          </div>
        </template>

        <!-- PC 对话 + 终端 双栏 -->
        <template v-else>
          <section class="pc-col pc-chat-col">
            <div class="chat-head">
              <div class="avatar" :class="stateClass">
                <img v-if="avatarSrc" class="avatar-img" :src="avatarSrc" alt="" />
                <span v-else class="avatar-char">{{ roleInitial }}</span>
              </div>
              <div class="chat-head-info">
                <div class="chat-name">{{ roleName }}</div>
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
                  <span>来自{{ roleName }} · 新消息</span>
                  <span class="label-line"></span>
                </div>
                <div class="chat-bubble" v-html="dialogHtml"></div>
              </div>
              <form class="chat-compose" @submit.prevent="sendChat">
                <input v-model="chatInput" type="text" placeholder="输入要发送的话…" autocomplete="off" />
                <button type="submit" :disabled="sending || !chatInput.trim()">发送</button>
              </form>
              <div class="chat-foot">
                <span class="foot-dot"></span>
                <span>message encrypted · {{ roleModel }}</span>
              </div>
            </div>
          </section>

          <section class="pc-col pc-term-col">
            <header class="app-head">
              <div class="app-head-row">
                <div class="app-brand" role="button" tabindex="0" @click="roleDrawerOpen = true">
                  <span
                    class="app-logo"
                    :class="stateClass"
                    :style="roleArtStyleOf()"
                    >{{ roleArtOf() ? '' : '◈' }}</span
                  >
                  <div class="app-brand-text">
                    <div class="app-name">{{ roleName }}</div>
                    <div class="app-model">{{ roleModel }} · 控制终端 <i class="brand-caret">▾</i></div>
                  </div>
                </div>
                <span class="app-state" :class="stateClass">{{ store.data.千鹤.意识状态 }}</span>
              </div>
              <div v-if="showSwitchHint" class="switch-hint" @click="dismissSwitchHint">
            <span>点顶部角色名可切换 / 管理角色</span>
            <b>知道了</b>
          </div>
          <div class="app-roles">
            <button
              v-for="[id, role] in roles"
              :key="id"
              class="app-role"
              :class="{ active: id === store.data.当前角色 }"
              type="button"
              @click="switchTo(id)"
            >
              {{ role.档案.姓名 || id }}
            </button>
            <button class="app-role add" type="button" @click="openRoleManager()">＋ 角色</button>
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
              <div v-if="active_tab === '状态'" class="pane"><StatusPanel /></div>
              <div v-else-if="active_tab === '认知'" class="pane"><CognitionPanel /></div>
              <div v-else-if="active_tab === '记忆'" class="pane"><MemoryPanel /></div>
              <div v-else-if="active_tab === '躯体参数'" class="pane"><BodyPanel /></div>
              <div v-else-if="active_tab === '指令'" class="pane"><CommandPanel /></div>
              <div v-else-if="active_tab === '系统'" class="pane"><SystemPanel /></div>
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

    <OpeningHome v-if="openingPending" :message-id="0" :desktop="!isMobile" @done="openingPending = false" />
    <OpeningHome
      v-if="libraryOpen"
      :message-id="0"
      :desktop="!isMobile"
      mode="library"
      @close="libraryOpen = false"
    />
    <GalleryPanel v-if="galleryOpen" @close="galleryOpen = false" />
    <RoleDrawer
      v-if="roleDrawerOpen"
      @close="roleDrawerOpen = false"
      @manage="manageFromDrawer"
      @create="createFromDrawer"
    />
    <RoleManager v-if="roleManagerOpen" :start-create="roleManagerCreate" @close="closeRoleManager" />
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../../界面/控制终端/store';
import { currentInitial, currentModel, currentName, controllableRoles, switchRole } from '../../界面/控制终端/role-info';
import { refreshCharacterProfile, refreshInjectedMemory, refreshVariableSnapshot } from './prompt-inject';
import { injectStreamingMessageContext } from '@util/streaming';
import { sendControlUpdate, trackControlState } from '../../界面/控制终端/ui-state';
import { hbBattery } from '../../界面/控制终端/heartbeat';
import StatusPanel from '../../界面/控制终端/components/StatusPanel.vue';
import CognitionPanel from '../../界面/控制终端/components/CognitionPanel.vue';
import MemoryPanel from '../../界面/控制终端/components/MemoryPanel.vue';
import BodyPanel from '../../界面/控制终端/components/BodyPanel.vue';
import CommandPanel from '../../界面/控制终端/components/CommandPanel.vue';
import SystemPanel from '../../界面/控制终端/components/SystemPanel.vue';
import SettingsPanel from './SettingsPanel.vue';
import RoleManager from '../../界面/控制终端/components/RoleManager.vue';
import RoleDrawer from '../../界面/控制终端/components/RoleDrawer.vue';
import OpeningHome from '../../开场/OpeningHome.vue';
import GalleryPanel from '../../画廊/GalleryPanel.vue';
import { isOpeningPending } from '../../开场/apply';
import { getRoleArt } from '../../界面/控制终端/role-art';
import { ensurePresetArt, getCardImage } from '../../界面/控制终端/role-art';
import FlatConsole from './FlatConsole.vue';
import { panelTabs } from './panel-tabs';
/** 外观设置的状态与 setter 统一放在 settings.ts，外壳与操作台共用一份 */
import {
  aspectVarsMap,
  currentTheme,
  customAccent,
  displayMode,
  elderMode,
  fontSize,
  phoneAspect,
  prettyOff,
  sizeZoomMap,
  uiSize,
  type DisplayMode,
  type PhoneAspect,
  type UiSize,
} from './settings';

type ThemeVars = Record<string, string>;

const context = injectStreamingMessageContext();
const store = useDataStore();
trackControlState(store.data as unknown as Record<string, unknown>);

/* 角色卡头像：从酒馆当前角色读取，与对话头像一致；读不到时回退「千」字 */
const avatarSrc = computed(() => {
  try {
    const char = SillyTavern.characters?.[Number(SillyTavern.characterId)];
    if (!char?.avatar || char.avatar === 'none') return '';
    return SillyTavern.getThumbnailUrl('avatar', char.avatar) || '';
  } catch {
    return '';
  }
});

/** 当前终端角色：名称 / 型号 / 头像缺省字 */
const roleName = computed(() => currentName(store.data));
const roleModel = computed(() => currentModel(store.data));
const roleInitial = computed(() => currentInitial(store.data));
const roles = computed(() => controllableRoles(store.data));
const roleManagerOpen = ref(false);
const roleManagerCreate = ref(false);
const roleDrawerOpen = ref(false);
const libraryOpen = ref(false);
const galleryOpen = ref(false);
const openingPending = ref(isOpeningPending(0));
const showSwitchHint = ref(false);
let switchHintTimer: number | undefined;

function dismissSwitchHint() {
  showSwitchHint.value = false;
  if (switchHintTimer) {
    clearTimeout(switchHintTimer);
    switchHintTimer = undefined;
  }
  try {
    localStorage.setItem('ch:role-switch-hint', '1');
  } catch {
    /* ignore */
  }
}

onMounted(() => {
  // 首楼且仍是占位消息：接管首楼，显示开场设置
  const opening = isOpeningPending(0);
  if (opening) openingPending.value = true;

  // 排查开场页不出现时，把这一行发给作者
  console.info('[开场检测]', {
    current: getCurrentMessageId(),
    last: getLastMessageId(),
    first: String(getChatMessages(0)?.[0]?.message ?? '').slice(0, 80),
    opening,
  });

  // 千鹤的预设头像 = 当前角色卡卡图，只播种一次；玩家删掉后不再补
  if (store.data.角色['千鹤']) ensurePresetArt('千鹤', getCardImage());

  try {
    if (localStorage.getItem('ch:role-switch-hint') === '1') return;
  } catch {
    /* ignore */
  }
  showSwitchHint.value = true;
  switchHintTimer = window.setTimeout(dismissSwitchHint, 6500);
});

/** 当前角色头像 / 立绘（localStorage，仅展示） */
function roleArtOf(): string {
  return getRoleArt(store.data.当前角色);
}

function roleArtStyleOf(): Record<string, string> {
  const art = roleArtOf();
  return art ? { backgroundImage: `url("${art}")` } : {};
}

function openRoleManager(create = false) {
  roleManagerCreate.value = create;
  roleManagerOpen.value = true;
}

function closeRoleManager() {
  roleManagerOpen.value = false;
  roleManagerCreate.value = false;
}

function manageFromDrawer() {
  roleDrawerOpen.value = false;
  openRoleManager(false);
}

function createFromDrawer() {
  roleDrawerOpen.value = false;
  openRoleManager(true);
}

function switchTo(id: string) {
  switchRole(store.data, id);
}

/** 档案指纹：档案增删改时重建注入，状态心跳不触发 */
const profileSignature = computed(() =>
  JSON.stringify(
    Object.entries(store.data.角色).map(([id, role]) => [id, role.类型, role.档案]),
  ),
);

/** 切换当前角色或修改档案后，重建变量快照、档案块与记忆注入 */
watch(
  [() => store.data.当前角色, profileSignature],
  () => {
    refreshVariableSnapshot();
    refreshCharacterProfile();
    refreshInjectedMemory();
  },
);

const chatInput = ref('');
const sending = ref(false);

async function sendChat() {
  if (sending.value || !chatInput.value.trim()) return;
  sending.value = true;
  try {
    const text = chatInput.value;
    chatInput.value = '';
    await sendControlUpdate(store.data as unknown as Record<string, unknown>, text);
  } finally {
    sending.value = false;
  }
}

async function sendStatusUpdate() {
  if (sending.value) return;
  sending.value = true;
  try {
    await sendControlUpdate(store.data as unknown as Record<string, unknown>, '');
  } finally {
    sending.value = false;
  }
}

/* 每条消息手机独立的浏览状态：默认对话，APP 内部默认「状态」 */
const view = ref<'chat' | 'app' | 'settings'>('chat');
const active_tab = ref('状态');

/* ============ 显示形态：设备模式 / 屏幕比例 / 界面大小 ============ */
const containerWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280);
function onResize() {
  containerWidth.value = window.innerWidth;
}
onMounted(() => {
  onResize();
  window.addEventListener('resize', onResize);
});
onBeforeUnmount(() => window.removeEventListener('resize', onResize));

/** 生效的设备形态：auto 按宽度自动判断（<820 手机，>=820 PC） */
const effectiveMode = computed<'mobile' | 'desktop'>(() => {
  if (elderMode.value) return 'mobile';
  if (displayMode.value === 'mobile') return 'mobile';
  if (displayMode.value === 'desktop') return 'desktop';
  return containerWidth.value < 820 ? 'mobile' : 'desktop';
});
const isMobile = computed(() => effectiveMode.value === 'mobile');

const aspectVars = computed(() => aspectVarsMap[phoneAspect.value]);

const sizeZoom = computed(() => (elderMode.value ? 1.8 : sizeZoomMap[uiSize.value]));

const phoneVars = computed(() => {
  const vars: Record<string, string> = { ...currentTheme.value.vars };
  const accent = customAccent.value || vars['--accent'];
  vars['--accent'] = accent;
  vars['--accent-dim'] = `color-mix(in srgb, ${accent} 13%, transparent)`;
  vars['--chat-font-size'] = `${elderMode.value ? Math.max(fontSize.value + 8, 22) : fontSize.value}px`;
  vars['--ui-zoom'] = String(sizeZoom.value);
  if (isMobile.value) Object.assign(vars, aspectVars.value);
  return vars;
});

const tabs = panelTabs;

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
    运行中: '正在运行',
    已停止: '已停止运行',
    已冻结: '已冻结',
  };
  return map[store.data.千鹤.意识状态] ?? store.data.千鹤.意识状态;
});

const timeText = computed(() => {
  const m = store.data.世界.当前时间.match(/(\d{2}:\d{2})/);
  return m ? m[1] : '--:--';
});

/** 从原始消息里剥离变量更新块、状态占位符与结构化残片，只留下角色台词正文 */
// streaming.ts 已用酒馆官方 formatAsDisplayedMessage 处理过：
// 宏替换 → 预设显示正则 → HTML，流式与最终阶段都一样。
// 这里直接渲染，不再转义、不再剥离、不再自写 markdown。
// 自己再做一遍会把预设正则产出的 HTML 变成字面文本，或误删正则生成的标签。
const dialogHtml = computed(() => context.message || '');

</script>

<style scoped lang="scss">
.phone {
  /* 主题变量由 inline style 注入（见 phoneVars）；此处只声明基础字体 */
  --font-ui: system-ui, -apple-system, 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif;
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
  transition: background 0.35s ease, color 0.35s ease;
}

/* PC 形态：铺满宽屏，无手机壳约束。
   高度用固定像素锁定（iframe 内 100vh 等于 iframe 自身高度，会与自动撑高脚本互相追逐，导致首屏塌缩成 1cm 或无限拉长），
   内部面板各自滚动。 */
.phone.desktop {
  max-width: 100%;
  height: 820px;
  max-height: none;
  min-height: 0;
  border-radius: 0;
  border: none;
  box-shadow: none;
}

/* ===== 氛围光斑 ===== */
.phone-deco {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.deco-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(46px);
  transition: background 0.35s ease;
}

.deco-a {
  width: 230px;
  height: 230px;
  background: var(--deco-a);
  top: -70px;
  right: -60px;
}

.deco-b {
  width: 190px;
  height: 190px;
  background: var(--deco-b);
  bottom: -50px;
  left: -50px;
}

.deco-c {
  width: 130px;
  height: 130px;
  background: var(--deco-c);
  top: 34%;
  left: -40px;
}

/* ===== 屏幕主体 ===== */
.phone-screen {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.view {
  animation: fade-in 0.25s ease;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.status-update {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  background: var(--accent);
  color: #fff;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  border: none;
}

.status-update:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-view {
  display: flex;
  flex-direction: column;
}

.chat-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px 13px;
  border-bottom: 1px solid var(--line);
  background: color-mix(in srgb, var(--panel) 72%, transparent);
  flex-shrink: 0;
}

.avatar {
  position: relative;
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
  box-shadow: 0 5px 16px color-mix(in srgb, var(--accent) 38%, transparent);
}

.avatar-char {
  line-height: 1;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
  display: block;
}

.avatar::after {
  content: '';
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--green);
  border: 2px solid var(--panel);
}

.avatar.is-stopped::after {
  background: var(--red);
}

.avatar.is-frozen::after {
  background: var(--blue);
}

.chat-head-info {
  flex: 1;
  min-width: 0;
}

.chat-name {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;
}

.chat-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--muted);
  margin-top: 2px;
}

.sub-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--green);
  flex-shrink: 0;
}

.sub-dot.is-stopped {
  background: var(--red);
}

.sub-dot.is-frozen {
  background: var(--blue);
}

.chat-time {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 1px;
}

.chat-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 16px 18px 0;
}

.chat-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.chat-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--muted);
  margin-bottom: 13px;
}

.label-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--line), transparent);
}

.chat-bubble {
  font-size: var(--chat-font-size);
  line-height: 1.9;
  letter-spacing: 0.01em;
  color: var(--text);
  background: var(--panel);
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent);
  border-radius: 6px 16px 16px 16px;
  padding: 14px 16px;
  box-shadow: 0 8px 22px -16px color-mix(in srgb, var(--accent) 55%, transparent);
}

.chat-bubble :deep(p) {
  margin: 0 0 0.6rem;
}

.chat-bubble :deep(p:last-child) {
  margin-bottom: 0;
}

.chat-bubble :deep(strong) {
  color: var(--accent);
  font-weight: 700;
}

.chat-bubble :deep(em) {
  font-style: italic;
  opacity: 0.9;
}

.chat-bubble :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.86em;
  background: var(--accent-dim);
  padding: 0.05em 0.4em;
  border-radius: 4px;
}

.chat-bubble :deep(del) {
  opacity: 0.6;
}

.chat-compose {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  flex-shrink: 0;
}

.chat-compose input {
  flex: 1;
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
  transition: border-color 0.2s;
}

.chat-compose input:focus {
  border-color: var(--accent);
}

.chat-compose button {
  height: 36px;
  padding: 0 16px;
  border-radius: 18px;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;
}

.chat-compose button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 14px 0 18px;
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 1px;
  color: var(--muted);
  opacity: 0.75;
}

.foot-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent);
}

/* =========================================================
   APP 控制终端视图
   ========================================================= */
.app-view {
  display: flex;
  flex-direction: column;
}

.app-head {
  padding: 14px 16px 12px;
  background: color-mix(in srgb, var(--panel) 62%, var(--bg-2));
  border-bottom: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 11px;
  flex-shrink: 0;
}

.app-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.brand-caret {
  font-style: normal;
  color: var(--muted);
  margin-left: 2px;
}

.switch-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px dashed var(--accent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  color: var(--accent);
  font-size: 11px;
  cursor: pointer;

  b {
    margin-left: auto;
    font-weight: 600;
    font-size: 10.5px;
  }
}

.app-logo {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;
  background: linear-gradient(135deg, var(--avatar-a), var(--avatar-b));
  background-size: cover;
  background-position: center;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--accent) 32%, transparent);
}

.app-brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.app-name {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;
}

.app-model {
  font-size: 10px;
  color: var(--muted);
  font-family: var(--font-mono);
  letter-spacing: 1px;
}

.app-state {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  border: 1px solid;
  white-space: nowrap;

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

.app-meta {
  display: flex;
  gap: 9px;
}

/* 多角色切换：终端顶部一行 chips */
.app-roles {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}

.app-roles::-webkit-scrollbar {
  display: none;
}

.app-role {
  flex: 0 0 auto;
  padding: 4px 11px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--muted);
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}

.app-role.active {
  color: var(--accent);
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}

.app-role.add {
  border-style: dashed;
  color: var(--accent);
}

.meta-cell {
  flex: 1;
  min-width: 0;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.meta-label {
  font-size: 9.5px;
  color: var(--muted);
  letter-spacing: 1px;
}

.meta-value {
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
}

.meta-value.mono {
  font-family: var(--font-mono);
}

.meta-bar {
  height: 4px;
  border-radius: 2px;
  background: var(--line);
  overflow: hidden;
}

.meta-bar i {
  display: block;
  height: 100%;
  border-radius: 2px;
  background: var(--accent);
  transition: width 0.4s ease;
}

.meta-bar.amber i {
  background: var(--amber);
}

.app-panel {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 16px 34px;
  background: var(--panel);
}

.pane {
  animation: fade-in 0.3s ease;
  /* 手机形态下六页切换高度不跳变 */
  min-height: 520px;
}

.app-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr) 64px repeat(3, 1fr);
  border-top: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg-2) 82%, transparent);
  padding-top: 2px;
}

/* 6 个 tab：左 3 右 3，中间第 4 列留空（避开中央终端按钮） */
.app-tab:nth-child(1) {
  grid-column: 1;
}

.app-tab:nth-child(2) {
  grid-column: 2;
}

.app-tab:nth-child(3) {
  grid-column: 3;
}

.app-tab:nth-child(4) {
  grid-column: 5;
}

.app-tab:nth-child(5) {
  grid-column: 6;
}

.app-tab:nth-child(6) {
  grid-column: 7;
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

/* =========================================================
   设置视图
   ========================================================= */
.settings-view {
  padding: 20px 18px 38px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  min-height: 0;
}

/* =========================================================
   底部导航（中央主按钮式）
   ========================================================= */
.phone-nav {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  position: relative;
  z-index: 2;
  border-top: 1px solid var(--line);
  background: color-mix(in srgb, var(--panel) 88%, transparent);
  padding: 4px 6px 9px;
  gap: 4px;
}

.nav-btn {
  flex: 1;
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
  font-family: inherit;
}

.nav-btn:hover {
  color: var(--text);
}

.nav-btn.active {
  color: var(--accent);
}

.nav-ico {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-ico svg {
  width: 21px;
  height: 21px;
  display: block;
}

.nav-label {
  font-size: 10.5px;
  letter-spacing: 1px;
}

/* 中央主按钮：控制终端 */
.nav-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.center-btn {
  width: 56px;
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
  padding: 0;
}

.center-btn svg {
  width: 26px;
  height: 26px;
}

.center-btn:hover {
  transform: translateY(-1px);
}

.center-btn.active {
  box-shadow: 0 9px 22px -5px color-mix(in srgb, var(--accent) 80%, transparent);
}

.center-label {
  font-size: 10.5px;
  letter-spacing: 1px;
  color: var(--muted);
  transition: color 0.2s;
}

.center-label.active {
  color: var(--accent);
}

/* =========================================================
   PC 形态（顶栏 + 双栏）
   ========================================================= */
.pc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 22px;
  background: color-mix(in srgb, var(--panel) 72%, var(--bg-2));
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}

.pc-brand {
  display: flex;
  align-items: center;
  gap: 11px;
}

.pc-logo {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  color: #fff;
  background: linear-gradient(135deg, var(--avatar-a), var(--avatar-b));
  box-shadow: 0 4px 14px color-mix(in srgb, var(--accent) 32%, transparent);
}

.pc-brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.pc-name {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
}

.pc-model {
  font-size: 10.5px;
  color: var(--muted);
  font-family: var(--font-mono);
  letter-spacing: 1px;
}

.pc-nav {
  display: flex;
  gap: 6px;
}

.pc-nav button {
  padding: 8px 18px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.pc-nav button:hover {
  color: var(--text);
  background: var(--panel-2);
}

.pc-nav button.active {
  color: var(--accent);
  background: var(--accent-dim);
  border-color: var(--line);
}

.pc-main {
  flex: 1;
  display: flex;
  align-items: stretch;
  min-height: 0;
}

.pc-col {
  min-width: 0;
}

.pc-chat-col {
  flex: 1 1 40%;
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  background: color-mix(in srgb, var(--panel) 55%, transparent);
  min-height: 0;
}

/* 左侧对话栏：只有正文区独立滚动，头部固定在顶部（同手机端 chat-body 逻辑） */
.pc-chat-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 18px 26px 0;
}

.pc-term-col {
  flex: 1 1 60%;
  display: flex;
  flex-direction: column;
  background: var(--panel);
}

.pc-panel {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 18px 20px;
  background: var(--panel);
}

.pc-tabs {
  flex-shrink: 0;
}

.pc-settings {
  flex: 1;
  overflow-y: auto;
  padding: 26px 30px 40px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  max-width: 760px;
  margin: 0 auto;
  width: 100%;
}

/* 显示形态控件 */
/* ===== 老年机模式：超大触控目标 + 高对比 ===== */
.phone.elder .chat-compose input,
.phone.elder .chat-compose button {
  min-height: 46px;
  font-size: 18px;
}

.phone.elder .nav-label {
  font-weight: 700;
}

/* 设置页控件在子组件 SettingsPanel 内，跨组件穿透用 :deep */
.phone.elder :deep(.switch) {
  width: 52px;
  height: 32px;
}

.phone.elder :deep(.switch-knob) {
  width: 26px;
  height: 26px;
}

.phone.elder :deep(.switch.on .switch-knob) {
  transform: translateX(22px);
}

.phone.elder :deep(.setting-title),
.phone.elder :deep(.switch-title) {
  font-weight: 700;
}
</style>

<style>
.phone,
.phone * {
  scrollbar-width: thin;
  scrollbar-color: var(--line-2) transparent;
}

.phone::-webkit-scrollbar,
.phone ::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.phone::-webkit-scrollbar-track,
.phone ::-webkit-scrollbar-track {
  background: transparent;
}

.phone::-webkit-scrollbar-thumb,
.phone ::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--line-2) 78%, var(--accent));
  border-radius: 999px;
}

.phone::-webkit-scrollbar-thumb:hover,
.phone ::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}

@media (pointer: coarse) {
  .phone,
  .phone * {
    scrollbar-width: none;
  }

  .phone::-webkit-scrollbar,
  .phone ::-webkit-scrollbar {
    display: none;
  }
}
</style>
