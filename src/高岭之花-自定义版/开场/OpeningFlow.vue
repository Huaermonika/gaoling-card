<template>
  <div class="of-overlay">
    <header class="of-head">
      <button v-if="step !== 'home'" class="of-back" type="button" @click="back">← 返回</button>
      <div class="of-title">
        <b>{{ title }}</b>
        <span>{{ subtitle }}</span>
      </div>
      <span v-if="step === 'official'" class="of-seal">官方</span>
    </header>

    <!-- 首页 -->
    <div v-if="step === 'home'" class="of-body">
      <div class="of-hero">
        <h2>选择开始方式</h2>
        <p>官方设定直接进入千鹤线；自定义从角色、开场、世界开始写。</p>
      </div>

      <div class="of-modes">
        <button class="of-mode official" type="button" @click="openOfficial">
          <span class="of-mode-tag">官方设定</span>
          <b>白峰千鹤</b>
          <small>档案与三条官方开场，只读</small>
        </button>
        <button class="of-mode custom" type="button" @click="openCustom">
          <span class="of-mode-tag">自定义</span>
          <b>写一个角色</b>
          <small>角色、开场、世界都可以改</small>
        </button>
        <button class="of-mode import" type="button" @click="importInput?.click()">
          <span class="of-mode-tag">导入</span>
          <b>角色文件</b>
          <small>读取别人分享的 JSON</small>
        </button>
        <input ref="importInput" type="file" accept="application/json,.json" style="display: none" @change="onImportFile" />
      </div>

      <section v-if="saved.length" class="of-saved">
        <div class="of-section-title">角色库</div>
        <div class="of-saved-list">
          <div v-for="item in saved" :key="item.id" class="of-saved-item">
            <button class="of-saved-main" type="button" @click="startSaved(item)">
              <span class="of-saved-avatar" :style="item.avatar ? { backgroundImage: `url(&quot;${item.avatar}&quot;)` } : {}">
                {{ item.avatar ? '' : firstChar(item.name) }}
              </span>
              <span class="of-saved-text">
                <b>{{ item.name }}</b>
                <small>{{ item.profile.型号 || '未填写型号' }} · {{ item.openings.length }} 个开场</small>
              </span>
            </button>
            <button class="of-saved-act" type="button" @click="editSaved(item)">编辑</button>
            <button class="of-saved-act" type="button" @click="exportSaved(item)">导出</button>
            <button class="of-saved-act danger" type="button" @click="removeSaved(item)">删除</button>
          </div>
        </div>
      </section>
    </div>

    <!-- 官方 -->
    <div v-else-if="step === 'official'" class="of-body">
      <div class="of-official-card">
        <div class="of-official-avatar" :style="cardImage ? { backgroundImage: `url(&quot;${cardImage}&quot;)` } : {}">
          {{ cardImage ? '' : '鹤' }}
        </div>
        <div class="of-official-text">
          <b>{{ officialProfile.姓名 || '白峰千鹤' }}</b>
          <span>{{ officialProfile.型号 || 'AN-0170A' }}</span>
          <p>{{ officialProfile.外观 }}</p>
        </div>
      </div>

      <div class="of-profile">
        <div><span>性格</span><p>{{ officialProfile.性格 }}</p></div>
        <div><span>背景</span><p>{{ officialProfile.背景 }}</p></div>
        <div><span>关系</span><p>{{ officialProfile.关系 }}</p></div>
      </div>

      <div class="of-section-title">选择开场</div>
      <div class="of-presets">
        <button
          v-for="preset in presets"
          :key="preset.id"
          type="button"
          class="of-preset"
          :class="{ active: selectedOfficial === preset.id }"
          @click="selectedOfficial = preset.id"
        >
          <b>{{ preset.name }}</b>
          <span>{{ preset.subtitle }}</span>
        </button>
      </div>

      <div class="of-preview">
        <div class="of-preview-label">开场预览</div>
        <p>{{ previewText(activeOfficial?.text ?? '') }}</p>
      </div>

      <button class="of-primary" type="button" :disabled="busy" @click="startOfficial">
        {{ busy ? '正在写入…' : '以官方设定开始' }}
      </button>
    </div>

    <!-- 自定义 -->
    <div v-else-if="step === 'custom'" class="of-body">
      <div class="of-steps">
        <span v-for="(label, index) in stepLabels" :key="label" class="of-step" :class="{ active: customStep === index, done: customStep > index }">
          {{ index + 1 }} {{ label }}
        </span>
      </div>

      <template v-if="customStep === 0">
        <div class="of-role-head">
          <div class="of-role-avatar" :style="form.avatar ? { backgroundImage: `url(&quot;${form.avatar}&quot;)` } : {}">
            {{ form.avatar ? '' : firstChar(form.姓名 || '机') }}
          </div>
          <div class="of-role-ops">
            <button class="of-ghost" type="button" @click="avatarInput?.click()">上传头像 / 立绘</button>
            <button v-if="form.avatar" class="of-ghost" type="button" @click="form.avatar = ''">移除</button>
            <small>方形裁切，最大 512×512；也可稍后从画廊选。</small>
          </div>
          <input ref="avatarInput" type="file" accept="image/*" style="display: none" @change="onAvatar" />
        </div>

        <div class="of-grid">
          <label class="of-field"><span>姓名 <i>必填</i></span><input v-model="form.姓名" maxlength="20" placeholder="例如：岚" /></label>
          <label class="of-field"><span>型号</span><input v-model="form.型号" maxlength="30" placeholder="例如：HK-7" /></label>
        </div>
        <label class="of-field"><span>外观</span><textarea v-model="form.外观" rows="2" /></label>
        <label class="of-field"><span>性格</span><textarea v-model="form.性格" rows="2" /></label>
        <label class="of-field"><span>背景</span><textarea v-model="form.背景" rows="2" /></label>
        <label class="of-field"><span>关系</span><textarea v-model="form.关系" rows="2" /></label>
      </template>

      <template v-else-if="customStep === 1">
        <label class="of-field"><span>开场名称</span><input v-model="form.开场名称" maxlength="30" placeholder="例如：初次连接" /></label>
        <label class="of-field"><span>开场白</span><textarea v-model="form.开场白" rows="7" /></label>
        <button class="of-ghost" type="button" @click="useTemplate">用角色字段生成通用开场</button>

        <div class="of-section-title">世界</div>
        <div class="of-grid">
          <label class="of-field"><span>持有者称呼</span><input v-model="form.持有者称呼" maxlength="20" placeholder="你" /></label>
          <label class="of-field"><span>起始地点</span><input v-model="form.地点" maxlength="30" placeholder="你的住处" /></label>
          <label class="of-field"><span>起始时间</span><input v-model="form.时间" maxlength="30" placeholder="2026-04-06 09:00" /></label>
          <label class="of-field"><span>当前处境</span><input v-model="form.处境" maxlength="60" placeholder="和持有者在一起" /></label>
        </div>
        <label class="of-field"><span>世界设定</span><textarea v-model="form.设定" rows="4" placeholder="时代、城市、机构、公开规则；可留空" /></label>
      </template>

      <template v-else>
        <div class="of-summary">
          <div><span>角色</span><b>{{ form.姓名 || '未命名' }}</b></div>
          <div><span>型号</span><b>{{ form.型号 || '未填写' }}</b></div>
          <div><span>开场</span><b>{{ form.开场名称 || '默认开场' }}</b></div>
          <div><span>世界</span><b>{{ form.地点 || '默认' }} · {{ form.时间 || '默认' }}</b></div>
        </div>
        <div class="of-preview">
          <div class="of-preview-label">开场预览</div>
          <p>{{ previewText(form.开场白 || defaultCustomText(form.姓名), 260) }}</p>
        </div>
        <p class="of-note">开始后会存入角色库，可在设置里再编辑或导出。</p>
      </template>

      <p v-if="error" class="of-error">{{ error }}</p>
    </div>

    <!-- 导入预览 -->
    <div v-else class="of-body">
      <div v-if="imported" class="of-summary">
        <div><span>角色</span><b>{{ imported.name }}</b></div>
        <div><span>型号</span><b>{{ imported.profile.型号 || '未填写' }}</b></div>
        <div><span>开场</span><b>{{ imported.openings[0]?.name }}</b></div>
      </div>
      <div v-if="imported" class="of-preview">
        <div class="of-preview-label">开场预览</div>
        <p>{{ previewText(imported.openings[0]?.text ?? '', 260) }}</p>
      </div>
      <p v-if="error" class="of-error">{{ error }}</p>
    </div>

    <footer v-if="step === 'custom'" class="of-foot">
      <button v-if="customStep > 0" class="of-ghost" type="button" @click="customStep--">上一步</button>
      <span class="of-foot-hint">开场只写一次，写入首楼后带上初始变量与记忆。</span>
      <button v-if="customStep < 2" class="of-primary" type="button" @click="nextCustom">下一步</button>
      <button v-else class="of-primary" type="button" :disabled="busy" @click="startCustom">
        {{ busy ? '正在写入…' : '开始' }}
      </button>
    </footer>

    <footer v-else-if="step === 'import'" class="of-foot">
      <span class="of-foot-hint">导入后存入角色库，再选择是否用这个开场开始。</span>
      <button v-if="imported" class="of-primary" type="button" :disabled="busy" @click="startImported">开始</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { 千鹤开场, buildCustomOpening, defaultCustomText, openingFromCharacter, previewText } from './presets';
import { applyOpening } from './apply';
import { getCardImage } from '../界面/控制终端/role-art';
import { fileToAvatar } from '../界面/控制终端/role-art';
import {
  deleteCharacter,
  listCharacters,
  makeCharacter,
  parseCharacterFile,
  saveCharacter,
  serializeCharacter,
  type CharacterPreset,
} from '../角色库/db';

const props = defineProps<{ messageId: number }>();
const emit = defineEmits<{ done: [] }>();

const step = ref<'home' | 'official' | 'custom' | 'import'>('home');
const customStep = ref(0);
const stepLabels = ['角色', '开场与世界', '确认'];
const presets = 千鹤开场;
const selectedOfficial = ref(presets[0]?.id ?? '');
const busy = ref(false);
const error = ref('');
const saved = ref<CharacterPreset[]>([]);
const imported = ref<CharacterPreset | null>(null);

const importInput = ref<HTMLInputElement | null>(null);
const avatarInput = ref<HTMLInputElement | null>(null);

const form = reactive({
  姓名: '',
  型号: '',
  外观: '',
  性格: '',
  背景: '',
  关系: '',
  avatar: '',
  开场名称: '初次连接',
  开场白: '',
  持有者称呼: '你',
  地点: '你的住处',
  时间: '2026-04-06 09:00',
  处境: '',
  设定: '',
});

const officialData = (presets[0]?.data ?? {}) as any;
const officialProfile = computed(() => officialData?.角色?.['千鹤']?.档案 ?? {});
const cardImage = computed(() => getCardImage());
const activeOfficial = computed(() => presets.find(item => item.id === selectedOfficial.value));

const title = computed(() =>
  step.value === 'home'
    ? '控制终端'
    : step.value === 'official'
      ? '官方设定'
      : step.value === 'custom'
        ? '自定义角色'
        : '导入角色',
);
const subtitle = computed(() =>
  step.value === 'home'
    ? '从官方或自定义开始'
    : step.value === 'official'
      ? '白峰千鹤 · 只读'
      : step.value === 'custom'
        ? stepLabels[customStep.value]
        : '预览后开始',
);

function firstChar(name: string) {
  return Array.from(name.trim())[0] ?? '机';
}

onMounted(async () => {
  try {
    saved.value = await listCharacters();
  } catch (reason) {
    console.warn('[开局] 读取角色库失败', reason);
  }
});

function back() {
  if (step.value === 'custom' && customStep.value > 0) {
    customStep.value--;
    return;
  }
  step.value = 'home';
  error.value = '';
}

function openOfficial() {
  step.value = 'official';
  error.value = '';
}

function openCustom() {
  step.value = 'custom';
  customStep.value = 0;
  error.value = '';
}

async function onAvatar(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    form.avatar = await fileToAvatar(file);
  } catch {
    toastr.warning('头像读取失败');
  }
}

function useTemplate() {
  if (!form.姓名.trim()) {
    error.value = '先填姓名，再生成通用开场。';
    return;
  }
  form.开场白 = defaultCustomText(form.姓名);
  error.value = '';
}

function nextCustom() {
  if (customStep.value === 0 && !form.姓名.trim()) {
    error.value = '姓名必填。';
    return;
  }
  if (customStep.value === 1 && !form.开场白.trim()) {
    form.开场白 = defaultCustomText(form.姓名);
  }
  error.value = '';
  customStep.value = Math.min(2, customStep.value + 1);
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
    error.value = '姓名必填。';
    customStep.value = 0;
    return;
  }
  busy.value = true;
  try {
    const preset = buildCustomOpening({
      姓名: form.姓名,
      型号: form.型号,
      外观: form.外观,
      性格: form.性格,
      背景: form.背景,
      关系: form.关系,
      开场白: form.开场白 || defaultCustomText(form.姓名),
      持有者称呼: form.持有者称呼,
      地点: form.地点,
      时间: form.时间,
      处境: form.处境,
      世界设定: form.设定,
    });

    const record = makeCharacter({
      name: form.姓名.trim(),
      avatar: form.avatar,
      profile: {
        姓名: form.姓名.trim(),
        型号: form.型号.trim(),
        外观: form.外观.trim(),
        性格: form.性格.trim(),
        背景: form.背景.trim(),
        关系: form.关系.trim(),
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
      source: 'custom',
    });
    await saveCharacter(record);

    await applyOpening(preset, props.messageId);
    emit('done');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    busy.value = false;
  }
}

async function startSaved(record: CharacterPreset) {
  busy.value = true;
  try {
    await applyOpening(openingFromCharacter(record), props.messageId);
    emit('done');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    busy.value = false;
  }
}

function editSaved(record: CharacterPreset) {
  form.姓名 = record.profile.姓名;
  form.型号 = record.profile.型号;
  form.外观 = record.profile.外观;
  form.性格 = record.profile.性格;
  form.背景 = record.profile.背景;
  form.关系 = record.profile.关系;
  form.avatar = record.avatar ?? '';
  form.开场名称 = record.openings[0]?.name ?? '初次连接';
  form.开场白 = record.openings[0]?.text ?? '';
  form.持有者称呼 = record.world.持有者称呼;
  form.地点 = record.world.地点;
  form.时间 = record.world.时间;
  form.处境 = record.world.处境;
  form.设定 = record.world.设定;
  step.value = 'custom';
  customStep.value = 0;
}

function exportSaved(record: CharacterPreset) {
  const blob = new Blob([serializeCharacter(record)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${record.name || '角色'}.gaoling.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function removeSaved(record: CharacterPreset) {
  if (!confirm(`从角色库删除「${record.name}」？`)) return;
  await deleteCharacter(record.id);
  saved.value = await listCharacters();
}

async function onImportFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    const data = parseCharacterFile(await file.text());
    imported.value = makeCharacter(data);
    step.value = 'import';
    error.value = '';
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  }
}

async function startImported() {
  if (!imported.value) return;
  busy.value = true;
  try {
    await saveCharacter(imported.value);
    await applyOpening(openingFromCharacter(imported.value), props.messageId);
    emit('done');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped lang="scss">
.of-overlay {
  position: absolute;
  inset: 0;
  z-index: 70;
  background: var(--bg);
  color: var(--text);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.of-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px 10px;
}

.of-back {
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--text);
  border-radius: 8px;
  padding: 5px 9px;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
}

.of-title {
  display: flex;
  flex-direction: column;
  gap: 2px;

  b {
    font-size: 15px;
    letter-spacing: 1px;
  }

  span {
    font-size: 10px;
    color: var(--muted);
  }
}

.of-seal {
  margin-left: auto;
  padding: 3px 9px;
  border: 1px solid var(--accent);
  border-radius: 6px;
  color: var(--accent);
  font-size: 10px;
  letter-spacing: 2px;
}

.of-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.of-hero h2 {
  margin: 4px 0 4px;
  font-size: 20px;
  letter-spacing: 1px;
}

.of-hero p {
  margin: 0;
  font-size: 11px;
  color: var(--muted);
  line-height: 1.6;
}

.of-modes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.of-mode {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel);
  color: var(--text);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  min-height: 92px;

  &.official {
    grid-column: 1 / -1;
    border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--accent) 10%, var(--panel)),
      var(--panel)
    );
  }

  &.custom {
    border-style: dashed;
  }

  &.import {
    color: var(--muted);
  }

  b {
    font-size: 15px;
    letter-spacing: 1px;
  }

  small {
    font-size: 10px;
    color: var(--muted);
    line-height: 1.4;
  }
}

.of-mode-tag {
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--accent);
}

.of-section-title {
  margin-top: 4px;
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--muted);
}

.of-saved-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.of-saved-item {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 7px;
  background: var(--panel);
}

.of-saved-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  color: var(--text);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.of-saved-avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--avatar-a), var(--avatar-b));
  background-size: cover;
  background-position: center;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}

.of-saved-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  b {
    font-size: 12px;
  }

  small {
    font-size: 9.5px;
    color: var(--muted);
  }
}

.of-saved-act {
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--muted);
  border-radius: 6px;
  padding: 3px 6px;
  font-size: 9.5px;
  font-family: inherit;
  cursor: pointer;

  &.danger {
    color: var(--red);
    border-color: color-mix(in srgb, var(--red) 40%, var(--line));
  }
}

.of-official-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel);
}

.of-official-avatar {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--avatar-a), var(--avatar-b));
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
  font-weight: 700;
}

.of-official-text {
  min-width: 0;

  b {
    font-size: 15px;
  }

  span {
    margin-left: 8px;
    font-size: 10px;
    color: var(--muted);
  }

  p {
    margin: 6px 0 0;
    font-size: 10.5px;
    color: var(--muted);
    line-height: 1.55;
  }
}

.of-profile {
  display: flex;
  flex-direction: column;
  gap: 6px;

  div {
    display: flex;
    gap: 8px;
    font-size: 10.5px;
    line-height: 1.55;
  }

  span {
    flex: 0 0 30px;
    color: var(--muted);
  }

  p {
    margin: 0;
  }
}

.of-presets {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.of-preset {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 9px 11px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--panel);
  color: var(--text);
  font-family: inherit;
  text-align: left;
  cursor: pointer;

  b {
    font-size: 12px;
  }

  span {
    font-size: 10px;
    color: var(--muted);
  }

  &.active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 7%, var(--panel));
  }
}

.of-preview {
  border: 1px dashed var(--line-2);
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--panel-2);

  p {
    margin: 5px 0 0;
    font-size: 11px;
    line-height: 1.65;
    white-space: pre-wrap;
  }
}

.of-preview-label {
  font-size: 9.5px;
  letter-spacing: 1px;
  color: var(--muted);
}

.of-steps {
  display: flex;
  gap: 6px;
}

.of-step {
  flex: 1;
  text-align: center;
  padding: 5px 4px;
  border-radius: 6px;
  border: 1px solid var(--line);
  font-size: 9.5px;
  color: var(--muted);

  &.active {
    color: var(--accent);
    border-color: var(--accent);
  }

  &.done {
    color: var(--green);
    border-color: color-mix(in srgb, var(--green) 40%, var(--line));
  }
}

.of-role-head {
  display: flex;
  gap: 10px;
  align-items: center;
}

.of-role-avatar {
  width: 58px;
  height: 58px;
  flex-shrink: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--avatar-a), var(--avatar-b));
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  overflow: hidden;
}

.of-role-ops {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;

  small {
    flex-basis: 100%;
    font-size: 9px;
    color: var(--muted);
    line-height: 1.4;
  }
}

.of-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.of-field {
  display: flex;
  flex-direction: column;
  gap: 4px;

  > span {
    font-size: 10px;
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
    border-radius: 8px;
    background: var(--panel);
    color: var(--text);
    padding: 7px 9px;
    font-size: 11px;
    font-family: inherit;
    line-height: 1.5;
    resize: vertical;
  }
}

.of-ghost {
  border: 1px dashed var(--line-2);
  background: transparent;
  color: var(--accent);
  border-radius: 7px;
  padding: 4px 9px;
  font-size: 10px;
  font-family: inherit;
  cursor: pointer;
}

.of-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel);

  div {
    display: flex;
    gap: 10px;
    font-size: 11px;
  }

  span {
    flex: 0 0 40px;
    color: var(--muted);
  }
}

.of-note {
  margin: 0;
  font-size: 9.5px;
  color: var(--muted);
  line-height: 1.5;
}

.of-error {
  margin: 0;
  font-size: 11px;
  color: var(--red);
}

.of-foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px calc(14px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--line);
}

.of-foot-hint {
  flex: 1;
  font-size: 9px;
  color: var(--muted);
  line-height: 1.4;
}

.of-primary {
  flex: 0 0 auto;
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #fff;
  border-radius: 9px;
  padding: 9px 16px;
  font-size: 11.5px;
  font-family: inherit;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
  }
}
</style>
