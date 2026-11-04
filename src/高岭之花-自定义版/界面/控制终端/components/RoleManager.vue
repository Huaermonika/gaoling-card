<template>
  <div class="rm-overlay">
    <header class="rm-head">
      <button class="rm-back" type="button" @click="close">← 返回</button>
      <div class="rm-title">{{ mode === 'list' ? '角色引擎' : editingId ? '编辑角色' : '新建角色' }}</div>
      <span class="rm-tag">{{ mode === 'list' ? '局内' : 'PROFILE' }}</span>
    </header>

    <!-- ===== 列表 ===== -->
    <div v-if="mode === 'list'" class="rm-body">
      <section class="rm-section">
        <div class="rm-section-head">
          <span>受控角色</span>
          <button class="rm-add" type="button" @click="startCreate('受控')">＋ 新建</button>
        </div>
        <p class="rm-hint">能切换、能控制，有完整状态和记忆。</p>

        <div v-for="[id, role] in controllable" :key="id" class="rm-row" :class="{ current: id === store.data.当前角色 }">
          <span class="rm-avatar" :style="artStyle(id)">
            <span v-if="!getRoleArt(id)">{{ initialOf(role.档案.姓名 || id) }}</span>
          </span>
          <div class="rm-main">
            <div class="rm-name">
              {{ role.档案.姓名 || '未命名' }}
              <span v-if="id === store.data.当前角色" class="rm-badge">当前</span>
            </div>
            <div class="rm-sub">{{ role.档案.型号 || '没型号' }} · 优先级 {{ role.优先级 }}</div>
          </div>
          <div class="rm-ops">
            <button class="rm-btn" type="button" :disabled="id === store.data.当前角色" @click="switchTo(id)">切换</button>
            <button class="rm-btn" type="button" @click="startEdit(id)">编辑</button>
            <button class="rm-btn danger" type="button" @click="askDelete(id)">
              {{ confirmId === id ? '确认删除' : '删除' }}
            </button>
          </div>
        </div>
      </section>

      <section class="rm-section">
        <div class="rm-section-head">
          <span>背景角色</span>
          <button class="rm-add" type="button" @click="startCreate('背景')">＋ 新建</button>
        </div>
        <p class="rm-hint">只有基础资料。不能控制，也没有记忆。</p>

        <div v-for="[id, role] in backgrounds" :key="id" class="rm-row">
          <span class="rm-avatar bg" :style="artStyle(id)">
            <span v-if="!getRoleArt(id)">{{ initialOf(role.档案.姓名 || id) }}</span>
          </span>
          <div class="rm-main">
            <div class="rm-name">{{ role.档案.姓名 || '未命名' }}</div>
            <div class="rm-sub">{{ role.档案.关系 || '没写关系' }}</div>
          </div>
          <div class="rm-ops">
            <button class="rm-btn" type="button" @click="startEdit(id)">编辑</button>
            <button class="rm-btn danger" type="button" @click="askDelete(id)">
              {{ confirmId === id ? '确认删除' : '删除' }}
            </button>
          </div>
        </div>
        <p v-if="!backgrounds.length" class="rm-empty">没有背景角色。</p>
      </section>
    </div>

    <!-- ===== 表单 ===== -->
    <div v-else class="rm-body">
      <div class="rm-art">
        <div class="rm-art-preview" :style="form.头像 ? { backgroundImage: `url(&quot;${form.头像}&quot;)` } : {}">
          <span v-if="!form.头像">{{ initialOf(form.姓名 || '机') }}</span>
        </div>
        <div class="rm-art-ops">
          <button class="rm-btn" type="button" @click="artInput?.click()">上传图</button>
          <button v-if="form.头像" class="rm-btn" type="button" @click="form.头像 = ''">移除</button>
          <p class="rm-hint">裁成方图，最大 512。只显示用。</p>
        </div>
        <input ref="artInput" type="file" accept="image/*" style="display: none" @change="onArtChange" />
      </div>

      <label class="rm-field">
        <span>姓名 <i>必填</i></span>
        <input v-model="form.姓名" type="text" maxlength="20" placeholder="白峰千鹤" />
      </label>

      <template v-if="editingKind === '受控'">
        <label class="rm-field">
          <span>型号</span>
          <input v-model="form.型号" type="text" maxlength="40" placeholder="AN-0170A。空着就显示「控制终端」" />
        </label>
        <label class="rm-field">
          <span>外观</span>
          <textarea v-model="form.外观" maxlength="300" rows="3" placeholder="头发、身高、穿什么，有没有显眼的机械特征" />
        </label>
        <label class="rm-field">
          <span>性格</span>
          <textarea v-model="form.性格" maxlength="300" rows="3" placeholder="她怎么说话，遇事什么反应。空着就按互动自然长" />
        </label>
        <label class="rm-field">
          <span>语言习惯</span>
          <textarea v-model="form.语言习惯" maxlength="200" rows="2" placeholder="句子长短、怎么称呼人、有没有口癖" />
        </label>
        <label class="rm-field">
          <span>背景</span>
          <textarea v-model="form.背景" maxlength="500" rows="3" placeholder="从哪来，以前发生过什么，现在在哪" />
        </label>
        <label class="rm-field">
          <span>关系</span>
          <textarea v-model="form.关系" maxlength="200" rows="2" placeholder="和持有者、其他角色什么关系" />
        </label>
        <label class="rm-field">
          <span>其他</span>
          <textarea v-model="form.其他" maxlength="300" rows="2" placeholder="想到什么写什么" />
        </label>
        <div class="rm-field">
          <span>优先级</span>
          <div class="rm-priorities">
            <button
              v-for="p in [1, 2, 3]"
              :key="p"
              type="button"
              class="rm-priority"
              :class="{ active: form.优先级 === p }"
              @click="form.优先级 = p"
            >
              {{ p }}
            </button>
          </div>
          <p class="rm-hint">1 最高。越高，记忆给得越多，描写也越多。</p>
        </div>
      </template>

      <template v-else>
        <label class="rm-field">
          <span>外观</span>
          <textarea v-model="form.外观" maxlength="300" rows="3" placeholder="别人能看到的模样" />
        </label>
        <label class="rm-field">
          <span>关系</span>
          <textarea v-model="form.关系" maxlength="200" rows="2" placeholder="和持有者、主要角色什么关系" />
        </label>
        <label class="rm-field">
          <span>备注</span>
          <textarea v-model="form.备注" maxlength="300" rows="2" placeholder="想到什么写什么" />
        </label>
      </template>

      <p v-if="error" class="rm-error">{{ error }}</p>

      <div class="rm-actions">
        <button class="rm-btn" type="button" @click="mode = 'list'">取消</button>
        <button class="rm-btn primary" type="button" @click="save">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
import { useDataStore } from '../store';
import {
  删除角色,
  受控角色列表,
  切换角色,
  新建受控角色,
  新建背景角色,
  规范化优先级,
} from '../../../角色管理';
import { fileToAvatar, getRoleArt, removeRoleArt, setRoleArt } from '../role-art';

const props = defineProps<{ startCreate?: boolean }>();
const emit = defineEmits<{ close: [] }>();

const store = useDataStore();
const artInput = ref<HTMLInputElement | null>(null);

onMounted(() => {
  if (props.startCreate) startCreate('受控');
});

const mode = ref<'list' | 'edit'>('list');
const editingKind = ref<'受控' | '背景'>('受控');
const editingId = ref<string | null>(null);
const confirmId = ref<string | null>(null);
const error = ref('');

const form = reactive({
  姓名: '',
  型号: '',
  外观: '',
  性格: '',
  语言习惯: '',
  背景: '',
  关系: '',
  其他: '',
  备注: '',
  优先级: 1,
  头像: '',
});

const controllable = computed(() => 受控角色列表(store.data));
const backgrounds = computed(() =>
  Object.entries(store.data.角色).filter(([, role]) => role.类型 === '背景'),
);

function initialOf(name: string) {
  return Array.from(name.trim())[0] ?? '机';
}

function close() {
  emit('close');
}

function resetForm() {
  Object.assign(form, {
    姓名: '',
    型号: '',
    外观: '',
    性格: '',
    语言习惯: '',
    背景: '',
    关系: '',
    其他: '',
    备注: '',
    优先级: 1,
    头像: '',
  });
  error.value = '';
}

function artStyle(id: string) {
  const art = getRoleArt(id);
  return art ? { backgroundImage: `url("${art}")` } : {};
}

function onArtChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) {
    error.value = '图片超过 8MB，请先压缩。';
    return;
  }
  fileToAvatar(file)
    .then(dataUrl => {
      form.头像 = dataUrl;
      error.value = '';
    })
    .catch(() => {
      error.value = '图片读取失败，换一张试试。';
    });
}

function startCreate(kind: '受控' | '背景') {
  editingKind.value = kind;
  editingId.value = null;
  resetForm();
  if (kind === '受控') {
    const used = 受控角色列表(store.data).map(([, role]) => role.优先级);
    form.优先级 = Math.min(3, (used.length ? Math.max(...used) : 0) + 1);
  }
  mode.value = 'edit';
}

function startEdit(id: string) {
  const role = store.data.角色[id];
  if (!role) return;
  editingKind.value = role.类型;
  editingId.value = id;
  resetForm();
  form.头像 = getRoleArt(id);
  Object.assign(form, {
    姓名: role.档案.姓名,
    型号: '型号' in role.档案 ? role.档案.型号 : '',
    外观: role.档案.外观,
    性格: '性格' in role.档案 ? role.档案.性格 : '',
    语言习惯: '语言习惯' in role.档案 ? role.档案.语言习惯 : '',
    背景: '背景' in role.档案 ? role.档案.背景 : '',
    关系: role.档案.关系,
    其他: '其他' in role.档案 ? role.档案.其他 : '',
    备注: '备注' in role.档案 ? role.档案.备注 : '',
    优先级: role.类型 === '受控' ? role.优先级 : 1,
  });
  mode.value = 'edit';
}

function save() {
  const name = form.姓名.trim();
  if (!name) {
    error.value = '名字没填。';
    return;
  }
  const duplicate = Object.entries(store.data.角色).some(
    ([id, role]) => id !== editingId.value && role.档案.姓名.trim() === name,
  );
  if (duplicate) {
    error.value = '已有同名角色，换一个名字。';
    return;
  }

  let savedId: string | null = editingId.value;

  if (editingKind.value === '受控') {
    if (editingId.value) {
      const role = store.data.角色[editingId.value];
      if (!role || role.类型 !== '受控') return;
      Object.assign(role.档案, {
        姓名: name,
        型号: form.型号.trim(),
        外观: form.外观.trim(),
        性格: form.性格.trim(),
        语言习惯: form.语言习惯.trim(),
        背景: form.背景.trim(),
        关系: form.关系.trim(),
        其他: form.其他.trim(),
      });
      role.优先级 = form.优先级;
    } else {
      const newId = 新建受控角色(
        store.data,
        {
          姓名: name,
          型号: form.型号.trim(),
          外观: form.外观.trim(),
          性格: form.性格.trim(),
          语言习惯: form.语言习惯.trim(),
          背景: form.背景.trim(),
          关系: form.关系.trim(),
          其他: form.其他.trim(),
        },
        { 优先级: form.优先级 },
      );
      savedId = newId;
      切换角色(store.data, newId);
    }
    规范化优先级(store.data);
  } else {
    if (editingId.value) {
      const role = store.data.角色[editingId.value];
      if (!role || role.类型 !== '背景') return;
      Object.assign(role.档案, {
        姓名: name,
        外观: form.外观.trim(),
        关系: form.关系.trim(),
        备注: form.备注.trim(),
      });
    } else {
      savedId = 新建背景角色(store.data, {
        姓名: name,
        外观: form.外观.trim(),
        关系: form.关系.trim(),
        备注: form.备注.trim(),
      });
    }
  }

  if (savedId) {
    if (form.头像) setRoleArt(savedId, form.头像);
    else removeRoleArt(savedId);
  }

  mode.value = 'list';
  editingId.value = null;
}

function switchTo(id: string) {
  切换角色(store.data, id);
}

function askDelete(id: string) {
  if (confirmId.value !== id) {
    confirmId.value = id;
    return;
  }
  const role = store.data.角色[id];
  if (!role) return;
  if (role.类型 === '受控' && 受控角色列表(store.data).length <= 1) {
    error.value = '至少留一个能控制的。';
    confirmId.value = null;
    return;
  }
  删除角色(store.data, id);
  removeRoleArt(id);
  confirmId.value = null;
}
</script>

<style scoped lang="scss">
.rm-overlay {
  position: absolute;
  inset: 0;
  z-index: 40;
  background: var(--bg);
  color: var(--text);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rm-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
  background: color-mix(in srgb, var(--panel) 70%, var(--bg-2));
}

.rm-back {
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--text);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
}

.rm-title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;
}

.rm-tag {
  margin-left: auto;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  color: var(--muted);
  letter-spacing: 1px;
}

.rm-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 16px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.rm-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rm-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 700;
}

.rm-add {
  border: 1px dashed var(--accent);
  background: transparent;
  color: var(--accent);
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
}

.rm-hint {
  margin: 0;
  font-size: 11px;
  color: var(--muted);
  line-height: 1.5;
}

.rm-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 11px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel);

  &.current {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 7%, var(--panel));
  }
}

.rm-avatar {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--avatar-a), var(--avatar-b));
  background-size: cover;
  background-position: center;
  overflow: hidden;

  &.bg {
    background: var(--panel-2);
    color: var(--muted);
    border: 1px solid var(--line);
  }
}

.rm-art {
  display: flex;
  gap: 12px;
  align-items: center;
}

.rm-art-preview {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: linear-gradient(135deg, var(--avatar-a), var(--avatar-b));
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  overflow: hidden;
}

.rm-art-ops {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-items: center;
}

.rm-art-ops .rm-hint {
  flex-basis: 100%;
}

.rm-main {
  flex: 1;
  min-width: 0;
}

.rm-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
}

.rm-badge {
  font-size: 10px;
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 999px;
  padding: 0 6px;
}

.rm-sub {
  margin-top: 2px;
  font-size: 11px;
  color: var(--muted);
  word-break: break-all;
}

.rm-ops {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}

.rm-btn {
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--text);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  min-height: 34px;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &.danger {
    color: var(--red);
    border-color: color-mix(in srgb, var(--red) 40%, var(--line));
  }

  &.primary {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
    font-weight: 700;
  }
}

.rm-field {
  display: flex;
  flex-direction: column;
  gap: 5px;

  > span {
    font-size: 12px;
    color: var(--muted);
  }

  i {
    font-style: normal;
    color: var(--accent);
    margin-left: 4px;
  }

  input,
  textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--panel);
    color: var(--text);
    padding: 8px 10px;
    font-size: 13px;
    font-family: inherit;
    resize: vertical;
  }

  input:focus,
  textarea:focus {
    outline: none;
    border-color: var(--accent);
  }
}

.rm-priorities {
  display: flex;
  gap: 8px;
}

.rm-priority {
  width: 40px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--muted);
  font-family: var(--font-mono, monospace);
  font-size: 14px;
  cursor: pointer;

  &.active {
    color: var(--accent);
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }
}

.rm-error {
  margin: 0;
  color: var(--red);
  font-size: 12px;
}

.rm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}

.rm-empty {
  margin: 0;
  padding: 12px;
  border: 1px dashed var(--line);
  border-radius: 10px;
  color: var(--muted);
  font-size: 12px;
  text-align: center;
}
</style>
