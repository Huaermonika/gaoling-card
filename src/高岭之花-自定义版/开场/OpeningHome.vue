<template>
  <div class="oh-overlay">
    <!-- 首页：整页翻页 -->
    <template v-if="view === 'home'">
      <!-- 桌面：整幅主画面 + 底部选择条 -->
      <div v-if="isDesktop" class="oh-desk" :class="{ 'no-cover': !desktopSelected?.cover }">
        <div class="oh-desk-stage" :style="desktopSelected?.cover ? { backgroundImage: `url(&quot;${desktopSelected.cover}&quot;)` } : {}">
          <div class="oh-desk-shade" />

          <div v-if="!desktopSelected?.cover" class="oh-desk-type">
            <span>{{ desktopSelected?.key === 'custom' ? 'PORTRAIT' : 'LIBRARY' }}</span>
            <b>{{ desktopSelected?.key === 'custom' ? '你的角色' : '角色库' }}</b>
            <small>{{ desktopSelected?.key === 'custom' ? '创建后可上传立绘' : '你写过的角色' }}</small>
          </div>

          <span v-if="desktopSelected?.badge" class="oh-badge">{{ desktopSelected.badge }}</span>

          <div class="oh-desk-copy">
            <span class="oh-kicker">{{ desktopSelected?.kicker }}</span>
            <h2>{{ desktopSelected?.title }}</h2>
            <p>{{ desktopSelected?.line }}</p>
            <span class="oh-page-meta">{{ desktopSelected?.meta }}</span>
            <button class="oh-btn primary big" type="button" @click="desktopSelected?.action()">
              {{ desktopSelected?.button }}
            </button>
          </div>

          <div class="oh-desk-strip">
            <button
              v-for="page in pages"
              :key="page.key"
              type="button"
              class="oh-desk-tab"
              :class="{ active: desktopPage === page.key }"
              @click="desktopPage = page.key"
            >
              <span class="oh-desk-thumb" :style="page.cover ? { backgroundImage: `url(&quot;${page.cover}&quot;)` } : {}" />
              <span class="oh-desk-tab-text">
                <b>{{ page.title }}</b>
                <small>{{ page.kicker }}</small>
              </span>
            </button>
          </div>
        </div>
      </div>

      <template v-else>
        <div class="oh-pager-wrap">
          <button class="oh-nav prev" type="button" :disabled="pageIndex === 0" @click="scrollToPage(pageIndex - 1)">‹</button>

          <div ref="pager" class="oh-pager" @scroll="onPagerScroll">
            <article v-for="page in pages" :key="page.key" class="oh-page" :class="page.key">
              <div class="oh-cover" :style="page.cover ? { backgroundImage: `url(&quot;${page.cover}&quot;)` } : {}">
                <div v-if="!page.cover" class="oh-placeholder" :class="page.key">
                  <span class="oh-ph-label">{{ page.key === 'custom' ? 'PORTRAIT' : 'LIBRARY' }}</span>
                  <b>{{ page.key === 'custom' ? '你的角色' : '角色库' }}</b>
                  <small>{{ page.key === 'custom' ? '创建后可上传立绘' : '草稿 · 导入导出' }}</small>
                </div>
                <span v-if="page.badge" class="oh-badge">{{ page.badge }}</span>
              </div>

              <div class="oh-page-caption">
                <span class="oh-kicker">{{ page.kicker }}</span>
                <h2>{{ page.title }}</h2>
                <p>{{ page.line }}</p>
                <span class="oh-page-meta">{{ page.meta }}</span>
                <button class="oh-btn primary big" type="button" @click="page.action">{{ page.button }}</button>
              </div>
            </article>
          </div>

          <button class="oh-nav next" type="button" :disabled="pageIndex === pages.length - 1" @click="scrollToPage(pageIndex + 1)">›</button>
        </div>

        <div class="oh-dots">
          <button v-for="(page, index) in pages" :key="page.key" type="button" class="oh-dot" :class="{ active: pageIndex === index }" @click="scrollToPage(index)" />
        </div>
      </template>
    </template>

    <!-- 千鹤子页 -->
    <template v-else-if="view === 'official'">
      <div class="oh-official-hero" :style="cardImage ? { backgroundImage: `url(&quot;${cardImage}&quot;)` } : {}">
        <div class="oh-shade" />
        <button class="oh-back floating" type="button" @click="goHome('official')">← 返回</button>
        <span class="oh-tag floating">官方</span>
      </div>

      <div class="oh-official-title">
        <h2>{{ officialProfile.姓名 || '白峰千鹤' }}</h2>
        <span>{{ officialProfile.型号 || 'AN-0170A' }}</span>
      </div>

      <div class="oh-sub-body">
        <div class="oh-story-tabs">
          <button
            v-for="preset in presets"
            :key="preset.id"
            type="button"
            class="oh-story-tab"
            :class="{ active: selectedOfficial === preset.id }"
            @click="selectedOfficial = preset.id"
          >
            <b>{{ preset.name }}</b>
            <span>{{ preset.subtitle }}</span>
          </button>
        </div>

        <div class="oh-reading">
          <div class="oh-reading-head">
            <span>开场全文</span>
            <b>{{ activeOfficial?.name }}</b>
          </div>
          <p>{{ openingFull }}</p>
        </div>

        <details class="oh-dossier">
          <summary>档案与设定</summary>
          <p class="oh-official-desc">{{ officialProfile.外观 }}</p>
          <div class="oh-rows">
            <div><span>性格</span><p>{{ officialProfile.性格 }}</p></div>
            <div><span>背景</span><p>{{ officialProfile.背景 }}</p></div>
            <div><span>关系</span><p>{{ officialProfile.关系 }}</p></div>
          </div>
        </details>
      </div>

      <footer class="oh-foot">
        <span class="oh-hint">开场只写一次。要换，只能开新聊天。</span>
        <button class="oh-btn primary big" type="button" :disabled="busy" @click="startOfficial">
          {{ busy ? '正在写入…' : '开始' }}
        </button>
      </footer>
    </template>

    <!-- 自定义编辑 -->
    <template v-else-if="view === 'custom'">
      <header class="oh-sub-head">
        <button class="oh-back" type="button" @click="backFromCustom">← 返回</button>
        <b>{{ form.姓名 || '未命名角色' }}</b>
        <span class="oh-save" :class="{ saving }">{{ saving ? '保存中…' : savedAt ? `已暂存 ${timeText(savedAt)}` : '未保存' }}</span>
      </header>

      <nav class="oh-line">
        <button
          v-for="section in sections"
          :key="section.key"
          type="button"
          :class="{ active: currentSection === section.key, done: sectionDone(section.key) }"
          @click="currentSection = section.key"
        >
          <i></i><span>{{ section.label }}</span>
        </button>
      </nav>

      <div class="oh-editor">
        <div class="oh-form">
          <template v-if="currentSection === 'role'">
            <div class="oh-avatar-row">
              <div class="oh-avatar" :style="form.avatar ? { backgroundImage: `url(&quot;${form.avatar}&quot;)` } : {}">
                {{ form.avatar ? '' : firstChar(form.姓名 || '机') }}
              </div>
              <div class="oh-avatar-ops">
                <button class="oh-mini" type="button" @click="avatarInput?.click()">上传立绘</button>
                <button v-if="form.avatar" class="oh-mini" type="button" @click="form.avatar = ''">移除</button>
                <small>方图。空着也行，之后补。</small>
              </div>
              <input ref="avatarInput" type="file" accept="image/*" style="display: none" @change="onAvatar" />
            </div>
            <div class="oh-grid">
              <label class="oh-field"><span>姓名 <i>必填</i></span><input v-model="form.姓名" maxlength="20" placeholder="岚" /></label>
              <label class="oh-field"><span>型号</span><input v-model="form.型号" maxlength="30" placeholder="HK-7" /></label>
            </div>
            <label class="oh-field"><span>外观</span><textarea v-model="form.外观" rows="3" placeholder="头发、身高、穿什么" /></label>
            <label class="oh-field"><span>性格</span><textarea v-model="form.性格" rows="3" placeholder="她怎么说话，遇事什么反应" /></label>
            <label class="oh-field"><span>语言习惯</span><textarea v-model="form.语言习惯" rows="2" placeholder="句子长短、怎么称呼人、有没有口癖" /></label>
            <label class="oh-field"><span>背景</span><textarea v-model="form.背景" rows="3" placeholder="从哪来，以前发生过什么，现在在哪" /></label>
            <label class="oh-field"><span>关系</span><textarea v-model="form.关系" rows="3" placeholder="和持有者是什么关系" /></label>
            <label class="oh-field"><span>其他</span><textarea v-model="form.其他" rows="2" placeholder="想到什么写什么" /></label>
          </template>

          <template v-else-if="currentSection === 'opening'">
            <label class="oh-field"><span>开场名称</span><input v-model="form.开场名称" maxlength="30" /></label>
            <label class="oh-field"><span>开场正文</span><textarea v-model="form.开场白" rows="8" /></label>
            <button class="oh-mini" type="button" @click="useTemplate">用上面填的生成一段</button>
            <div class="oh-preview"><span>开头</span><p>{{ previewText(form.开场白 || defaultCustomText(form.姓名), 220) }}</p></div>
          </template>

          <template v-else-if="currentSection === 'world'">
            <div class="oh-grid">
              <label class="oh-field"><span>持有者称呼</span><input v-model="form.持有者称呼" maxlength="20" /></label>
              <label class="oh-field"><span>起始地点</span><input v-model="form.地点" maxlength="30" /></label>
              <label class="oh-field"><span>起始时间</span><input v-model="form.时间" maxlength="30" /></label>
              <label class="oh-field"><span>当前处境</span><input v-model="form.处境" maxlength="60" /></label>
            </div>
            <label class="oh-field"><span>世界设定</span><textarea v-model="form.设定" rows="5" placeholder="时代、城市、规矩。空着也行" /></label>
          </template>

          <template v-else-if="currentSection === 'memory'">
            <p class="oh-note">开局会写两条记忆：连接建立、第一次见面。之后靠剧情加。</p>
            <div class="oh-memory">
              <div><span>{{ form.时间 || '开局时间' }}</span><p>终端第一次亮起，连接建立。</p></div>
              <div><span>{{ form.时间 || '开局时间' }}</span><p>{{ form.姓名 || '她' }}第一次在{{ form.地点 || '房间' }}见到持有者。</p></div>
            </div>
          </template>

          <template v-else>
            <div class="oh-summary">
              <div><span>角色</span><b>{{ form.姓名 || '未命名' }}</b></div>
              <div><span>型号</span><b>{{ form.型号 || '未填写' }}</b></div>
              <div><span>开场</span><b>{{ form.开场名称 || '初次连接' }}</b></div>
              <div><span>世界</span><b>{{ form.地点 || '默认' }} · {{ form.时间 || '默认' }}</b></div>
            </div>
            <div class="oh-preview"><span>开场</span><p>{{ previewText(form.开场白 || defaultCustomText(form.姓名), 260) }}</p></div>
            <p class="oh-note">开始后也能在管理里改。</p>
          </template>

          <p v-if="error" class="oh-error">{{ error }}</p>
        </div>
      </div>

      <footer class="oh-foot">
        <button class="oh-mini" type="button" @click="persist('draft')">先存着</button>
        <span class="oh-hint">{{ form.姓名 ? '自动存。' : '名字填了才能开始。' }}</span>
        <button class="oh-btn primary" type="button" :disabled="busy || !form.姓名.trim()" @click="startCustom">
          {{ busy ? '正在写入…' : '开始' }}
        </button>
      </footer>
    </template>

    <!-- 管理 -->
    <template v-else>
      <header class="oh-sub-head">
        <button class="oh-back" type="button" @click="goHome('manage')">← 返回</button>
        <b>管理</b>
        <div class="oh-manage-actions">
          <button class="oh-mini" type="button" @click="importInput?.click()">导入</button>
          <button class="oh-mini" type="button" :disabled="!saved.length" @click="exportAll">导出全部</button>
          <input ref="importInput" type="file" accept="application/json,.json" style="display: none" @change="onImport" />
        </div>
      </header>

      <div class="oh-sub-body">
        <div class="oh-lib-tabs">
          <button type="button" class="oh-filter" :class="{ active: manageTab === 'mine' }" @click="manageTab = 'mine'">
            我的角色 <i>{{ mine.length }}</i>
          </button>
          <button type="button" class="oh-filter" :class="{ active: manageTab === 'workshop' }" @click="manageTab = 'workshop'">
            创意工坊
          </button>
        </div>

        <template v-if="manageTab === 'mine'">
          <div v-if="!mine.length" class="oh-empty">
            <p>这里还是空的。</p>
            <button class="oh-btn primary" type="button" @click="openCustom()">新建角色</button>
          </div>

          <div v-else class="oh-lib-grid">
            <article v-for="item in mine" :key="item.id" class="oh-card">
              <button class="oh-card-main" type="button" @click="editCharacter(item)">
                <div class="oh-card-cover" :style="item.avatar ? { backgroundImage: `url(&quot;${item.avatar}&quot;)` } : {}">
                  {{ item.avatar ? '' : firstChar(item.name) }}
                </div>
                <div class="oh-card-info">
                  <b>{{ item.name || '未命名角色' }}</b>
                  <span>{{ item.profile.型号 || '未填写型号' }}</span>
                  <em>{{ timeText(item.updatedAt) }}</em>
                </div>
              </button>
              <div class="oh-card-actions">
                <button type="button" @click="exportOne(item)">导出</button>
                <button type="button" class="danger" @click="removeCharacter(item)">删除</button>
              </div>
            </article>
          </div>
        </template>

        <div v-else class="oh-workshop">
          <b>创意工坊</b>
          <p>官方审核过的玩家角色会放这里。现在还没有接口。</p>
          <span>还没接</span>
        </div>

        <div class="oh-section">导入导出</div>
        <div class="oh-help">
          <p>单角色导出是一个 JSON。导出全部会把整个库打成一个文件。</p>
          <p>导入只添加，不改同名角色。</p>
        </div>
        <p v-if="error" class="oh-error">{{ error }}</p>
      </div>

      <footer class="oh-foot">
        <span class="oh-hint">库在本机。换设备就导出再导入。</span>
        <button class="oh-btn primary" type="button" @click="openCustom()">新建角色</button>
      </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { 千鹤开场, buildCustomOpening, defaultCustomText, previewText } from './presets';
import { applyOpening } from './apply';
import { fileToAvatar, getCardImage } from '../界面/控制终端/role-art';
import {
  deleteCharacter,
  listCharacters,
  makeCharacter,
  parseCharacterFile,
  parseCollectionFile,
  saveCharacter,
  serializeCharacter,
  serializeCollection,
  type CharacterPreset,
} from '../角色库/db';

const props = defineProps<{ messageId: number; desktop?: boolean }>();
const emit = defineEmits<{ done: [] }>();

const view = ref<'home' | 'official' | 'custom' | 'manage'>('home');
const pager = ref<HTMLElement | null>(null);
const pageIndex = ref(0);
const isDesktop = ref(props.desktop ?? false);
const returnPage = ref<'custom' | 'official' | 'manage'>('custom');
const customReturn = ref<'home' | 'manage'>('home');
const busy = ref(false);
const error = ref('');

const presets = 千鹤开场;
const selectedOfficial = ref(presets[0]?.id ?? '');
const cardImage = computed(() => getCardImage());
const officialData = (presets[0]?.data ?? {}) as any;
const officialProfile = computed(() => officialData?.角色?.['千鹤']?.档案 ?? {});
const activeOfficial = computed(() => presets.find(item => item.id === selectedOfficial.value));
const openingFull = computed(() => stripOpening(activeOfficial.value?.text ?? ''));

function stripOpening(text: string) {
  return text
    .replace(/<initvar>[\s\S]*?<\/initvar>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
}

function openingExcerpt(text: string) {
  return stripOpening(text).replace(/\s+/g, ' ').slice(0, 92);
}

const saved = ref<CharacterPreset[]>([]);
const manageTab = ref<'mine' | 'workshop'>('mine');
/** 角色库只管理玩家自定义来源；官方、背景角色不在这里 */
const mine = computed(() =>
  saved.value.filter(item => item.source === 'custom' && item.kind !== 'background'),
);

const importInput = ref<HTMLInputElement | null>(null);
const avatarInput = ref<HTMLInputElement | null>(null);

const sections = [
  { key: 'role' as const, label: '角色' },
  { key: 'opening' as const, label: '开场' },
  { key: 'world' as const, label: '世界' },
  { key: 'memory' as const, label: '记忆' },
  { key: 'confirm' as const, label: '确认' },
];
const currentSection = ref<(typeof sections)[number]['key']>('role');

const form = reactive({
  姓名: '',
  型号: '',
  外观: '',
  性格: '',
  语言习惯: '',
  背景: '',
  关系: '',
  其他: '',
  avatar: '',
  开场名称: '初次连接',
  开场白: '',
  持有者称呼: '你',
  地点: '你的住处',
  时间: '2026-04-06 09:00',
  处境: '',
  设定: '',
});

const draftId = ref<string | null>(null);
const draftCreatedAt = ref(0);
const savedAt = ref(0);
const saving = ref(false);
let saveTimer: number | undefined;
let suppressWatch = false;

onMounted(async () => {
  if (props.desktop === undefined) {
    const media = window.matchMedia('(min-width: 900px)');
    isDesktop.value = media.matches;
    media.addEventListener('change', event => {
      isDesktop.value = event.matches;
    });
  }
  await refreshLibrary();
});

watch(
  () => props.desktop,
  value => {
    if (value !== undefined) isDesktop.value = value;
  },
);

watch(
  form,
  () => {
    if (suppressWatch || view.value !== 'custom') return;
    if (!hasContent()) return;
    scheduleSave();
  },
  { deep: true },
);

async function refreshLibrary() {
  try {
    saved.value = await listCharacters();
  } catch (reason) {
    console.warn('[开局] 读取角色库失败', reason);
  }
}

function hasContent() {
  return Boolean(
    form.姓名.trim() ||
      form.型号.trim() ||
      form.外观.trim() ||
      form.性格.trim() ||
      form.背景.trim() ||
      form.关系.trim() ||
      form.开场白.trim(),
  );
}

function scheduleSave() {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    void persist('draft');
  }, 700);
}

function buildRecord(status: 'draft' | 'ready'): CharacterPreset {
  const now = Date.now();
  const base = {
    name: form.姓名.trim() || '未命名角色',
    avatar: form.avatar,
    profile: {
      姓名: form.姓名.trim(),
      型号: form.型号.trim(),
      外观: form.外观.trim(),
      性格: form.性格.trim(),
      语言习惯: form.语言习惯.trim(),
      背景: form.背景.trim(),
      关系: form.关系.trim(),
      其他: form.其他.trim(),
    },
    openings: [
      {
        id: 'default',
        name: form.开场名称.trim() || '初次连接',
        text: form.开场白 || defaultCustomText(form.姓名),
      },
    ],
    world: {
      持有者称呼: form.持有者称呼,
      地点: form.地点,
      时间: form.时间,
      处境: form.处境,
      设定: form.设定,
    },
    source: 'custom' as const,
    kind: 'controlled' as const,
    status,
  };

  if (!draftId.value) {
    const record = makeCharacter(base);
    draftId.value = record.id;
    draftCreatedAt.value = record.createdAt;
    return record;
  }
  return { ...base, id: draftId.value, createdAt: draftCreatedAt.value || now, updatedAt: now };
}

async function persist(status: 'draft' | 'ready') {
  if (!hasContent() && !draftId.value) return;
  saving.value = true;
  try {
    const record = buildRecord(status);
    await saveCharacter(record);
    savedAt.value = record.updatedAt;
    await refreshLibrary();
  } catch (reason) {
    console.warn('[开局] 暂存失败', reason);
  } finally {
    saving.value = false;
  }
}

function openCustom(record?: CharacterPreset) {
  customReturn.value = view.value === 'manage' ? 'manage' : 'home';
  returnPage.value = 'custom';
  suppressWatch = true;
  if (record) {
    form.姓名 = record.profile.姓名;
    form.型号 = record.profile.型号;
    form.外观 = record.profile.外观;
    form.性格 = record.profile.性格;
    form.语言习惯 = record.profile.语言习惯;
    form.背景 = record.profile.背景;
    form.关系 = record.profile.关系;
    form.其他 = record.profile.其他;
    form.avatar = record.avatar ?? '';
    form.开场名称 = record.openings[0]?.name ?? '初次连接';
    form.开场白 = record.openings[0]?.text ?? '';
    form.持有者称呼 = record.world.持有者称呼;
    form.地点 = record.world.地点;
    form.时间 = record.world.时间;
    form.处境 = record.world.处境;
    form.设定 = record.world.设定;
    draftId.value = record.id;
    draftCreatedAt.value = record.createdAt;
    savedAt.value = record.updatedAt;
  } else {
    form.姓名 = '';
    form.型号 = '';
    form.外观 = '';
    form.性格 = '';
    form.语言习惯 = '';
    form.背景 = '';
    form.关系 = '';
    form.其他 = '';
    form.avatar = '';
    form.开场名称 = '初次连接';
    form.开场白 = '';
    form.持有者称呼 = '你';
    form.地点 = '你的住处';
    form.时间 = '2026-04-06 09:00';
    form.处境 = '';
    form.设定 = '';
    draftId.value = null;
    draftCreatedAt.value = 0;
    savedAt.value = 0;
  }
  currentSection.value = 'role';
  error.value = '';
  view.value = 'custom';
  window.setTimeout(() => {
    suppressWatch = false;
  }, 0);
}

function goHome(page: 'custom' | 'official' | 'manage' = returnPage.value) {
  view.value = 'home';
  desktopPage.value = page;
  const index = Math.max(0, pages.value.findIndex(item => item.key === page));
  pageIndex.value = index;
  nextTick(() => {
    const element = pager.value;
    if (element) element.scrollTo({ left: index * element.clientWidth });
  });
}

function backFromCustom() {
  if (saveTimer) window.clearTimeout(saveTimer);
  if (hasContent()) void persist('draft');
  if (customReturn.value === 'manage') {
    view.value = 'manage';
    return;
  }
  goHome('custom');
}

function editCharacter(record: CharacterPreset) {
  openCustom(record);
}

async function startOfficial() {
  if (!activeOfficial.value) return;
  busy.value = true;
  try {
    await applyOpening(activeOfficial.value, props.messageId);
    emit('done');
  } catch (reason) {
    error.value = String(reason);
  } finally {
    busy.value = false;
  }
}

async function startCustom() {
  if (!form.姓名.trim()) {
    error.value = '名字没填。';
    currentSection.value = 'role';
    return;
  }
  if (!form.开场白.trim()) form.开场白 = defaultCustomText(form.姓名);
  busy.value = true;
  try {
    await persist('ready');
    const preset = buildCustomOpening({
      姓名: form.姓名,
      型号: form.型号,
      外观: form.外观,
      性格: form.性格,
      语言习惯: form.语言习惯,
      背景: form.背景,
      关系: form.关系,
      其他: form.其他,
      开场白: form.开场白,
      持有者称呼: form.持有者称呼,
      地点: form.地点,
      时间: form.时间,
      处境: form.处境,
      世界设定: form.设定,
    });
    await applyOpening(preset, props.messageId);
    emit('done');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    busy.value = false;
  }
}

async function onAvatar(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    form.avatar = await fileToAvatar(file);
  } catch {
    toastr.warning('立绘读取失败');
  }
}

function useTemplate() {
  if (!form.姓名.trim()) {
    error.value = '先填名字。';
    currentSection.value = 'role';
    return;
  }
  form.开场白 = defaultCustomText(form.姓名);
  error.value = '';
}

function sectionDone(key: string) {
  if (key === 'role') return Boolean(form.姓名.trim());
  if (key === 'opening') return Boolean(form.开场白.trim());
  if (key === 'world') return Boolean(form.地点.trim());
  return false;
}

function firstChar(name: string) {
  return Array.from(name.trim())[0] ?? '机';
}

function firstSentence(text: string) {
  const plain = text.replace(/<initvar>[\s\S]*?<\/initvar>/g, '').trim();
  return plain.split(/\n+/).find(Boolean) ?? '';
}

function timeText(timestamp: number) {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function download(text: string, filename: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportOne(record: CharacterPreset) {
  download(serializeCharacter(record), `${record.name || '角色'}.gaoling.json`);
}

function exportAll() {
  download(serializeCollection(saved.value), '角色库.gaoling.json');
}

async function removeCharacter(record: CharacterPreset) {
  if (!confirm(`从角色库删除「${record.name || '未命名角色'}」？`)) return;
  await deleteCharacter(record.id);
  if (draftId.value === record.id) {
    draftId.value = null;
    draftCreatedAt.value = 0;
  }
  await refreshLibrary();
}

async function onImport(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    const text = await file.text();
    const raw = JSON.parse(text) as any;
    const records =
      raw?.kind === 'gaoling.collection'
        ? parseCollectionFile(text).map(item => makeCharacter(item))
        : [makeCharacter(parseCharacterFile(text))];
    for (const record of records) await saveCharacter(record);
    await refreshLibrary();
    error.value = '';
    toastr.success(`已导入 ${records.length} 个角色`);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  }
}

const pages = computed(() => [
  {
    key: 'custom',
    kicker: 'Custom',
    title: '自定义角色',
    line: '名字填了就能开始。开场写一半退出，草稿还在。',
    meta: '存在本机',
    button: '新建角色',
    cover: '',
    badge: '',
    action: () => openCustom(),
  },
  {
    key: 'official',
    kicker: 'Official',
    title: '白峰千鹤',
    line: '清岭学园二年 A 班。三条开场：教室、放学后、她家门口。',
    meta: '档案只读',
    button: '进入',
    cover: cardImage.value,
    badge: '官方',
    action: () => {
      returnPage.value = 'official';
      view.value = 'official';
      error.value = '';
    },
  },
  {
    key: 'manage',
    kicker: 'Library',
    title: '管理',
    line: '你存过的角色。导出是一个 JSON。',
    meta: '导入导出',
    button: '打开',
    cover: '',
    badge: '',
    action: () => {
      returnPage.value = 'manage';
      view.value = 'manage';
      error.value = '';
    },
  },
]);

const desktopPage = ref<'custom' | 'official' | 'manage'>('custom');
const desktopSelected = computed(() => pages.value.find(page => page.key === desktopPage.value) ?? pages.value[0]);

watch(isDesktop, desktop => {
  if (desktop) return;
  nextTick(() => {
    const index = Math.max(0, pages.value.findIndex(page => page.key === desktopPage.value));
    pageIndex.value = index;
    const element = pager.value;
    if (element) element.scrollTo({ left: index * element.clientWidth });
  });
});

function onPagerScroll() {
  const element = pager.value;
  if (!element) return;
  const width = element.clientWidth;
  pageIndex.value = Math.round(element.scrollLeft / Math.max(1, width));
}

function scrollToPage(index: number) {
  const element = pager.value;
  if (!element) return;
  element.scrollTo({ left: index * element.clientWidth, behavior: 'smooth' });
}
</script>

<style scoped lang="scss">
.oh-overlay {
  position: absolute;
  inset: 0;
  z-index: 70;
  background: var(--bg);
  color: var(--text);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.oh-top {
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 16px 18px 10px;

  b {
    font-size: 16px;
    letter-spacing: 2px;
  }

  span {
    display: block;
    margin-top: 3px;
    font-size: 10px;
    color: var(--muted);
  }
}

.oh-version {
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--muted);
}

.oh-pager {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 12px;
  padding: 8px 18px 0;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.oh-page {
  flex: 0 0 calc(100% - 6px);
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--panel);
  overflow: hidden;
  min-height: 0;
}

.oh-cover {
  position: relative;
  flex: 1;
  min-height: 0;
  background: var(--panel-2);
  background-size: cover;
  background-position: center top;
  display: flex;
  align-items: center;
  justify-content: center;
}

.oh-page.custom .oh-cover {
  background: linear-gradient(160deg, color-mix(in srgb, var(--accent) 10%, var(--panel)), var(--panel-2));
}

.oh-page.manage .oh-cover {
  background: var(--bg-2);
}

.oh-cover-empty {
  font-size: 30px;
  color: color-mix(in srgb, var(--accent) 55%, var(--muted));
}

.oh-placeholder {
  width: auto;
  height: auto;
  border: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;

  b {
    font-family: Georgia, 'Songti SC', 'SimSun', serif;
    font-size: 32px;
    font-weight: 500;
    letter-spacing: 8px;
    color: var(--text);
  }

  small {
    font-size: 10px;
    letter-spacing: 2px;
    color: var(--muted);
  }
}

.oh-page.custom .oh-shade {
  background: linear-gradient(to bottom, transparent 56%, rgba(20, 16, 12, 0.6) 100%);
}

.oh-page.manage .oh-shade {
  background: linear-gradient(to bottom, transparent 58%, rgba(20, 16, 12, 0.55) 100%);
}

.oh-page.manage .oh-placeholder {
  border-style: none;
}

.oh-ph-label {
  font-size: 8px;
  letter-spacing: 4px;
  color: var(--accent);
}

.oh-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 85%, transparent);
  color: #fff;
  font-size: 9px;
}

.oh-page-body {
  flex-shrink: 0;
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-top: 1px solid var(--line);
}

.oh-kicker {
  font-size: 8.5px;
  letter-spacing: 2px;
  color: var(--accent);
  text-transform: uppercase;
}

.oh-page-body h2 {
  margin: 0;
  font-size: 20px;
  letter-spacing: 1px;
}

.oh-page-body p {
  margin: 0 0 6px;
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--muted);
}

.oh-btn {
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--text);
  border-radius: 9px;
  padding: 8px 14px;
  font-size: 11.5px;
  font-family: inherit;
  cursor: pointer;

  &.primary {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
}

.oh-dots {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  gap: 5px;
  padding: 8px 0 2px;
}

.oh-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: 0;
  padding: 0;
  background: var(--line-2);
  cursor: pointer;

  &.active {
    background: var(--accent);
  }
}

.oh-recent {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 18px calc(10px + env(safe-area-inset-bottom));
  font-size: 9px;
  color: var(--muted);
  overflow-x: auto;
  white-space: nowrap;

  button {
    border: 1px solid var(--line);
    background: transparent;
    color: var(--text);
    border-radius: 999px;
    padding: 3px 8px;
    font-size: 9px;
    font-family: inherit;
    cursor: pointer;
  }
}

.oh-sub-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--line);

  b {
    font-size: 14px;
    letter-spacing: 1px;
  }
}

.oh-back {
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--text);
  border-radius: 7px;
  padding: 4px 8px;
  font-size: 10px;
  font-family: inherit;
  cursor: pointer;
}

.oh-tag {
  margin-left: auto;
  padding: 2px 8px;
  border: 1px solid var(--accent);
  border-radius: 999px;
  color: var(--accent);
  font-size: 9px;
}

.oh-save {
  margin-left: auto;
  font-size: 9px;
  color: var(--muted);

  &.saving {
    color: var(--accent);
  }
}

.oh-sub-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.oh-hero {
  display: flex;
  gap: 10px;
}

.oh-hero-img {
  width: 76px;
  height: 96px;
  flex-shrink: 0;
  border-radius: 10px;
  background: var(--panel-2);
  background-size: cover;
  background-position: center top;
}

.oh-hero-text {
  min-width: 0;

  h2 {
    margin: 0;
    font-size: 17px;
  }

  span {
    font-size: 9.5px;
    color: var(--muted);
  }

  p {
    margin: 6px 0 0;
    font-size: 10px;
    line-height: 1.55;
    color: var(--muted);
  }
}

.oh-rows {
  display: flex;
  flex-direction: column;
  gap: 5px;

  div {
    display: flex;
    gap: 8px;
    font-size: 10px;
    line-height: 1.55;
  }

  span {
    flex: 0 0 28px;
    color: var(--muted);
  }

  p {
    margin: 0;
  }
}

.oh-section {
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--muted);
  margin-top: 2px;
}

.oh-stories {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.oh-story {
  text-align: left;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--panel);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-family: inherit;
  color: var(--text);
  cursor: pointer;

  b {
    font-size: 11.5px;
  }

  span {
    font-size: 9.5px;
    color: var(--muted);
  }

  &.active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 7%, var(--panel));
  }
}

.oh-preview {
  border: 1px dashed var(--line-2);
  border-radius: 9px;
  padding: 8px 10px;

  span {
    font-size: 8.5px;
    letter-spacing: 1px;
    color: var(--muted);
  }

  p {
    margin: 4px 0 0;
    font-size: 10.5px;
    line-height: 1.65;
    white-space: pre-wrap;
  }
}

.oh-foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--line);
}

.oh-hint {
  flex: 1;
  font-size: 8.5px;
  color: var(--muted);
  line-height: 1.4;
}

.oh-editor {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.oh-line {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  padding: 14px 10px 6px;
  border-bottom: 1px solid var(--line);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 32px;
    right: 32px;
    top: 18px;
    height: 1px;
    background: var(--line-2);
  }

  button {
    position: relative;
    z-index: 1;
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    color: var(--muted);
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    font-family: inherit;
    cursor: pointer;
  }

  i {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--bg);
    border: 1px solid var(--line-2);
  }

  button.done i {
    background: var(--green);
    border-color: var(--green);
  }

  button.active i {
    background: var(--accent);
    border-color: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent);
  }

  button.active span {
    color: var(--accent);
  }
}

.oh-rail {
  flex: 0 0 78px;
  border-right: 1px solid var(--line);
  padding: 8px 5px;
  display: flex;
  flex-direction: column;
  gap: 2px;

  button {
    border: 0;
    background: transparent;
    color: var(--muted);
    border-radius: 7px;
    padding: 7px 5px;
    font-size: 9.5px;
    font-family: inherit;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;

    &.active {
      background: color-mix(in srgb, var(--accent) 10%, var(--panel));
      color: var(--accent);
    }
  }

  i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--line-2);
    flex-shrink: 0;
  }

  button.done i {
    background: var(--green);
  }
}

.oh-form {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 10px 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.oh-avatar-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.oh-avatar {
  width: 54px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--avatar-a), var(--avatar-b));
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  overflow: hidden;
}

.oh-avatar-ops {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;

  small {
    flex-basis: 100%;
    font-size: 8.5px;
    color: var(--muted);
    line-height: 1.4;
  }
}

.oh-mini {
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--muted);
  border-radius: 6px;
  padding: 4px 7px;
  font-size: 9px;
  font-family: inherit;
  cursor: pointer;

  &.danger {
    color: var(--red);
    border-color: color-mix(in srgb, var(--red) 40%, var(--line));
  }
}

.oh-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}

.oh-field {
  display: flex;
  flex-direction: column;
  gap: 3px;

  > span {
    font-size: 9px;
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
    border-radius: 7px;
    background: var(--panel);
    color: var(--text);
    padding: 6px 8px;
    font-size: 10.5px;
    font-family: inherit;
    line-height: 1.5;
    resize: vertical;
  }
}

.oh-note {
  margin: 0;
  font-size: 9px;
  color: var(--muted);
  line-height: 1.6;
}

.oh-memory {
  display: flex;
  flex-direction: column;
  gap: 6px;

  div {
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--panel);
    padding: 7px 9px;
  }

  span {
    font-size: 8.5px;
    color: var(--muted);
  }

  p {
    margin: 3px 0 0;
    font-size: 10px;
  }
}

.oh-summary {
  display: flex;
  flex-direction: column;
  gap: 5px;
  border: 1px solid var(--line);
  border-radius: 9px;
  padding: 9px 10px;

  div {
    display: flex;
    gap: 8px;
    font-size: 10.5px;
  }

  span {
    flex: 0 0 34px;
    color: var(--muted);
  }
}

.oh-error {
  margin: 0;
  font-size: 10px;
  color: var(--red);
}

.oh-manage-actions {
  margin-left: auto;
  display: flex;
  gap: 6px;

  .oh-mini {
    padding: 7px 12px;
    font-size: 11px;
    border-radius: 8px;
  }
}

.oh-workshop {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 30px 18px;
  border: 1px dashed var(--line-2);
  border-radius: 12px;
  text-align: center;
  color: var(--muted);

  b {
    font-size: 15px;
    color: var(--text);
  }

  p {
    margin: 0;
    max-width: 260px;
    font-size: 11.5px;
    line-height: 1.7;
  }

  span {
    font-size: 10px;
    letter-spacing: 1px;
    color: var(--accent);
  }
}

.oh-lib-tabs {
  display: flex;
  gap: 6px;
}

.oh-filter {
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--muted);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;

  i {
    font-style: normal;
    margin-left: 3px;
    opacity: 0.7;
  }

  &.active {
    color: var(--accent);
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 8%, var(--panel));
  }
}

.oh-lib-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.oh-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.oh-card-main {
  border: 0;
  background: transparent;
  padding: 0;
  text-align: left;
  font-family: inherit;
  color: var(--text);
  cursor: pointer;
}

.oh-card-cover {
  height: 120px;
  background: var(--panel-2);
  background-size: cover;
  background-position: center top;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-size: 26px;
  font-weight: 700;
}

.oh-card-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 9px;

  b {
    font-size: 13px;
  }

  span {
    font-size: 10px;
    color: var(--muted);
  }

  em {
    font-style: normal;
    font-size: 9.5px;
    color: var(--accent);
  }
}

.oh-card-actions {
  display: flex;
  border-top: 1px solid var(--line);

  button {
    flex: 1;
    border: 0;
    background: transparent;
    color: var(--muted);
    padding: 9px 0;
    font-size: 10.5px;
    font-family: inherit;
    cursor: pointer;

    & + button {
      border-left: 1px solid var(--line);
    }

    &.danger {
      color: var(--red);
    }
  }
}

.oh-lib {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.oh-lib-item {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--panel);
  padding: 7px;
}

.oh-lib-avatar {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--avatar-a), var(--avatar-b));
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.oh-lib-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;

  b {
    font-size: 10.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    font-size: 8.5px;
    color: var(--muted);
  }
}

.oh-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 26px 0;
  color: var(--muted);
  font-size: 10px;
}

.oh-help {
  p {
    margin: 0 0 4px;
    font-size: 9px;
    color: var(--muted);
    line-height: 1.6;
  }
}

/* ===== 整页翻页与放大版式 ===== */
.oh-pager-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
}

.oh-pager {
  height: 100%;
  padding: 0;
  gap: 0;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
}

.oh-page {
  flex: 0 0 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 0;
  border-radius: 0;
  background: var(--bg);
  overflow: hidden;
}

.oh-cover {
  flex: 0 0 58%;
  height: auto;
  position: relative;
  border-radius: 0;
}

.oh-page-caption {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 18px 22px calc(30px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 6px;
  color: var(--text);
  background: var(--bg);

  .oh-kicker {
    color: var(--accent);
  }

  h2 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    letter-spacing: 1px;
    color: var(--text);
  }

  p {
    margin: 0 0 4px;
    max-width: 100%;
    font-size: 13px;
    line-height: 1.75;
    color: var(--muted);
  }

  .oh-btn {
    margin-top: 14px;
    width: 100%;
  }
}

.oh-page-meta {
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--muted);
}

.oh-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 32%, rgba(20, 16, 12, 0.74) 100%);
  pointer-events: none;
}

.oh-btn.big {
  padding: 11px 26px;
  font-size: 14px;
  border-radius: 10px;
}

.oh-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 6;
  width: 38px;
  height: 66px;
  border: 0;
  background: rgba(38, 33, 27, 0.28);
  color: #fff;
  font-size: 30px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(6px);

  &.prev {
    left: 0;
    border-radius: 0 12px 12px 0;
  }

  &.next {
    right: 0;
    border-radius: 12px 0 0 12px;
  }

  &:disabled {
    opacity: 0;
    pointer-events: none;
  }
}

.oh-dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 9px;
  z-index: 7;
  padding: 0;
}

.oh-dot {
  width: 7px;
  height: 7px;
  background: var(--line-2);

  &.active {
    background: var(--accent);
  }
}

/* 官方页 */
.oh-official-hero {
  position: relative;
  flex-shrink: 0;
  height: 246px;
  background-color: var(--panel-2);
  background-size: cover;
  background-position: center 28%;
}

.oh-official-hero .oh-shade {
  background: linear-gradient(to bottom, rgba(20, 16, 12, 0.32), transparent 32%);
}

.oh-official-title {
  flex-shrink: 0;
  padding: 12px 18px 0;

  h2 {
    display: inline-block;
    margin: 0;
    font-size: 30px;
    letter-spacing: 1px;
  }

  span {
    margin-left: 10px;
    font-size: 11px;
    color: var(--muted);
  }
}

.oh-official-desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--muted);
}

.oh-back.floating {
  position: absolute;
  left: 14px;
  top: 14px;
  z-index: 3;
  background: rgba(255, 253, 247, 0.82);
}

.oh-tag.floating {
  position: absolute;
  right: 14px;
  top: 16px;
  z-index: 3;
  background: rgba(255, 253, 247, 0.82);
}

.oh-official-name {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 16px;
  z-index: 3;

  h2 {
    margin: 0;
    font-size: 30px;
    letter-spacing: 1px;
  }

  span {
    font-size: 11px;
    color: var(--muted);
  }

  p {
    margin: 6px 0 0;
    max-width: 92%;
    font-size: 11.5px;
    line-height: 1.6;
    color: var(--muted);
  }
}

.oh-story-tabs {
  display: flex;
  gap: 6px;
}

.oh-story-tab {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--panel);
  padding: 9px 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-family: inherit;
  color: var(--text);
  cursor: pointer;

  b {
    font-size: 12.5px;
    line-height: 1.3;
  }

  span {
    font-size: 9px;
    color: var(--muted);
    line-height: 1.3;
  }

  &.active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 8%, var(--panel));
  }
}

.oh-dossier {
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel);
  padding: 0 12px 12px;

  summary {
    padding: 10px 0;
    font-size: 11px;
    color: var(--muted);
    cursor: pointer;
    list-style: none;

    &::before {
      content: '＋';
      margin-right: 6px;
      color: var(--accent);
    }
  }

  &[open] summary::before {
    content: '－';
  }

  .oh-official-desc {
    margin-bottom: 8px;
  }
}

.oh-reading p {
  max-height: 320px;
}

.oh-sub-body {
  padding: 14px 18px 18px;
  gap: 12px;
}

.oh-rows div {
  font-size: 12px;
  line-height: 1.65;
}

.oh-rows span {
  flex-basis: 34px;
}

.oh-section {
  font-size: 11px;
  letter-spacing: 2px;
}

.oh-story {
  padding: 11px 12px;
  gap: 3px;

  b {
    font-size: 14px;
  }

  span {
    font-size: 11.5px;
  }

  em {
    margin-top: 3px;
    font-style: normal;
    font-size: 11.5px;
    line-height: 1.6;
    color: var(--muted);
  }
}

.oh-reading {
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel);
  overflow: hidden;

  p {
    margin: 0;
    max-height: 240px;
    overflow-y: auto;
    padding: 10px 12px 14px;
    font-size: 12.5px;
    line-height: 1.85;
    white-space: pre-wrap;
  }
}

.oh-reading-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--line);
  background: var(--panel-2);

  span {
    font-size: 10px;
    letter-spacing: 1px;
    color: var(--muted);
  }

  b {
    margin-left: auto;
    font-size: 11px;
    font-weight: 500;
    color: var(--accent);
  }
}

.oh-foot .oh-btn {
  padding: 10px 22px;
  font-size: 13px;
}

/* 自定义编辑器 */
.oh-rail {
  flex-basis: 92px;

  button {
    font-size: 11px;
    padding: 9px 7px;
  }
}

.oh-form {
  padding: 14px;
  gap: 10px;
}

.oh-field > span {
  font-size: 10.5px;
}

.oh-field input,
.oh-field textarea {
  padding: 8px 9px;
  font-size: 12px;
}

.oh-avatar {
  width: 64px;
  height: 78px;
}

.oh-sub-head b {
  font-size: 16px;
}

.oh-save {
  font-size: 10px;
}

.oh-hint {
  font-size: 9.5px;
}

/* 角色库 */
.oh-lib-item {
  padding: 10px;
  gap: 8px;
}

.oh-lib-avatar {
  width: 42px;
  height: 42px;
  font-size: 15px;
}

.oh-lib-text b {
  font-size: 13px;
}

.oh-lib-text span {
  font-size: 10.5px;
}

.oh-mini {
  padding: 5px 8px;
  font-size: 10px;
}

.oh-empty {
  font-size: 12px;
  gap: 10px;
}

.oh-help p {
  font-size: 10.5px;
}

.oh-desk {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.oh-desk-stage {
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background-color: var(--ink);
  background-size: cover;
  background-position: center 25%;
}

.oh-desk.no-cover .oh-desk-stage {
  background: var(--ink);
}

.oh-desk-shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(18, 15, 12, 0.8), rgba(18, 15, 12, 0.3) 58%, transparent),
    linear-gradient(0deg, rgba(18, 15, 12, 0.74), transparent 48%);
}

.oh-desk-type {
  position: absolute;
  left: 56px;
  top: 46px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: rgba(255, 255, 255, 0.55);

  span {
    font-size: 9px;
    letter-spacing: 4px;
    color: rgba(255, 255, 255, 0.42);
  }

  b {
    font-family: Georgia, 'Songti SC', 'SimSun', serif;
    font-size: 42px;
    font-weight: 500;
    letter-spacing: 9px;
    color: rgba(255, 255, 255, 0.84);
  }

  small {
    font-size: 10px;
    letter-spacing: 2px;
  }
}

.oh-desk-copy {
  position: relative;
  z-index: 2;
  max-width: 620px;
  padding: 0 56px 116px;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;

  .oh-kicker {
    font-size: 9px;
    letter-spacing: 3px;
    color: rgba(255, 255, 255, 0.6);
  }

  h2 {
    margin: 2px 0 0;
    font-size: 44px;
    letter-spacing: 1px;
  }

  p {
    margin: 8px 0 0;
    max-width: 460px;
    font-size: 14px;
    line-height: 1.9;
    color: rgba(255, 255, 255, 0.78);
  }

  .oh-page-meta {
    color: rgba(255, 255, 255, 0.48);
  }

  .oh-btn {
    width: auto;
    min-width: 180px;
    margin-top: 16px;
    padding: 12px 28px;
    font-size: 14px;
  }
}

.oh-desk-strip {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  display: flex;
  border-top: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(16, 13, 10, 0.34);
  backdrop-filter: blur(9px);
}

.oh-desk-tab {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border: 0;
  border-top: 2px solid transparent;
  background: transparent;
  color: rgba(255, 255, 255, 0.62);
  font-family: inherit;
  text-align: left;
  cursor: pointer;

  &.active {
    color: #fff;
    border-top-color: var(--accent);
    background: rgba(255, 255, 255, 0.06);
  }
}

.oh-desk-thumb {
  width: 38px;
  height: 46px;
  flex-shrink: 0;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.12);
  background-size: cover;
  background-position: center;
}

.oh-desk-tab-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  b {
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    font-size: 9px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.48);
  }
}

</style>
