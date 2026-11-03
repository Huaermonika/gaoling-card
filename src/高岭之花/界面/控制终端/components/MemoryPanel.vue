<template>
  <div class="panel">
    <div class="panel-head">
      <div class="panel-head-left">
        <span class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" /><path d="M9 8h7" /><path d="M9 12h7" /><path d="M9 16h4" /></svg></span>
        <span class="panel-title">记忆</span>
      </div>
      <span class="panel-tag">{{ memoryLog.length }} 条</span>
    </div>
    <p class="panel-desc">按时间排序 · 钉选与高强度记忆优先发给 AI · 记忆不设条数上限</p>

    <div class="mem-toolbar">
      <button class="btn primary sm" type="button" @click="startAdd">＋ 新增记忆</button>
      <button
        v-if="memoryLog.length > 1"
        class="btn ghost sm"
        :class="{ active: selecting }"
        type="button"
        @click="toggleSelectMode"
      >
        {{ selecting ? '退出合并' : '合并记忆' }}
      </button>
    </div>

    <div v-if="adding" class="add-box">
      <input v-model="newEntry.时间" class="add-input" type="text" placeholder="YYYY-MM-DD HH:MM" />
      <textarea v-model="newEntry.事件" class="edit-area" rows="2" placeholder="记忆内容"></textarea>
      <div class="field-row">
        <label class="mini-label">强度</label>
        <input v-model.number="newEntry.强度" class="add-input mini-input" type="number" min="0" max="100" step="5" />
        <label class="mini-label">标签</label>
        <select v-model="newEntry.标签" class="add-input mini-input">
          <option v-for="tag in TAGS" :key="tag" :value="tag">{{ tag }}</option>
        </select>
      </div>
      <div class="edit-actions">
        <button class="btn primary sm" type="button" @click="addMemory">保存</button>
        <button class="btn ghost sm" type="button" @click="cancelAdd">取消</button>
      </div>
    </div>

    <div v-if="selecting" class="merge-bar">
      <span class="merge-count">已选 {{ selected.size }} 条</span>
      <button class="btn primary sm" type="button" :disabled="selected.size < 2" @click="startMerge">合并所选</button>
      <button class="btn ghost sm" type="button" @click="clearSelection">清空选择</button>
    </div>

    <div v-if="merging" class="add-box merge-box">
      <div class="merge-title">合并为一楼</div>
      <input v-model="mergeDraft.时间" class="add-input" type="text" placeholder="YYYY-MM-DD HH:MM" />
      <textarea v-model="mergeDraft.事件" class="edit-area" rows="3"></textarea>
      <div class="field-row">
        <label class="mini-label">强度</label>
        <input v-model.number="mergeDraft.强度" class="add-input mini-input" type="number" min="0" max="100" step="5" />
        <label class="mini-label">标签</label>
        <select v-model="mergeDraft.标签" class="add-input mini-input">
          <option v-for="tag in TAGS" :key="tag" :value="tag">{{ tag }}</option>
        </select>
      </div>
      <div class="edit-actions">
        <button class="btn primary sm" type="button" @click="confirmMerge">保存合并</button>
        <button class="btn ghost sm" type="button" @click="cancelMerge">取消</button>
      </div>
    </div>

    <p v-if="error" class="mem-error">{{ error }}</p>

    <div class="mem-filter">
      <input v-model="search" class="add-input" type="text" placeholder="搜索时间或内容" />
      <div class="tag-row">
        <button
          v-for="tag in FILTER_TAGS"
          :key="tag"
          class="tag-chip"
          :class="{ active: activeTag === tag }"
          type="button"
          @click="activeTag = tag"
        >
          {{ tag }}
        </button>
      </div>
    </div>

    <div v-if="memoryLog.length && filtered.length" class="memory-list">
      <div
        v-for="item in pageItems"
        :key="item.entry.时间 + '|' + item.index"
        class="memory-item"
        :class="{ picked: selecting && selected.has(item.index), pinned: item.entry.钉选 }"
        @click="selecting && togglePick(item.index)"
      >
        <input
          v-if="selecting"
          class="pick-box"
          type="checkbox"
          :checked="selected.has(item.index)"
          @click.stop
          @change="togglePick(item.index)"
        />
        <span v-if="item.entry.钉选" class="mem-pin" title="已钉选">★</span>
        <div class="memory-main">
          <div class="memory-meta">
            <span class="memory-time">{{ formatDate(item.entry.时间) }}</span>
            <span class="mem-tag" :class="tagClass(item.entry.标签)">{{ item.entry.标签 }}</span>
            <span class="mem-strength" :class="{ strong: item.entry.强度 >= 60 }">强度 {{ item.entry.强度 }}</span>
            <span v-if="item.entry.楼层 > 0" class="mem-tag tag-floor" :title="`来源：第 ${item.entry.楼层} 楼`">第 {{ item.entry.楼层 }} 楼</span>
            <span v-if="filledTags.includes(tagOf(item.entry))" class="mem-tag tag-fill">填补</span>
            <span v-if="editedTags.includes(tagOf(item.entry))" class="mem-tag tag-edit">修改</span>
          </div>
          <template v-if="editingIndex === item.index">
            <input v-model="editDraft.时间" class="add-input" type="text" placeholder="YYYY-MM-DD HH:MM" />
            <textarea v-model="editDraft.事件" class="edit-area" rows="2"></textarea>
            <div class="field-row">
              <label class="mini-label">强度</label>
              <input v-model.number="editDraft.强度" class="add-input mini-input" type="number" min="0" max="100" step="5" />
              <label class="mini-label">标签</label>
              <select v-model="editDraft.标签" class="add-input mini-input">
                <option v-for="tag in TAGS" :key="tag" :value="tag">{{ tag }}</option>
              </select>
            </div>
            <div class="edit-actions">
              <button class="btn primary sm" type="button" @click="saveEdit(item.index)">保存</button>
              <button class="btn ghost sm" type="button" @click="editingIndex = null">取消</button>
            </div>
          </template>
          <span v-else class="memory-event">{{ item.entry.事件 }}</span>
        </div>
        <div v-if="!selecting" class="memory-ops">
          <button class="op-btn" :class="{ on: item.entry.钉选 }" type="button" title="钉选 / 取消钉选" @click="togglePin(item.index)">★</button>
          <button class="op-btn" type="button" title="修改这条记忆" @click="startEdit(item.index)">✎</button>
          <button class="op-btn del" type="button" title="删除这条记忆" @click="removeMemory(item.index)">✕</button>
        </div>
      </div>
    </div>

    <div v-else-if="memoryLog.length" class="memory-empty">
      <span class="memory-empty-title">没有匹配的记忆</span>
      <span class="memory-empty-hint">换个关键词或标签筛选</span>
    </div>
    <div v-else class="memory-empty">
      <span class="memory-empty-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" /><path d="M9 8h7" /><path d="M9 12h7" /><path d="M9 16h4" /></svg></span>
      <span class="memory-empty-title">记忆日志为空</span>
      <span class="memory-empty-hint">与千鹤的互动会沉淀为记忆条目，显示在这里</span>
    </div>

    <div v-if="pageCount > 1" class="pager">
      <button class="btn ghost sm" type="button" :disabled="page <= 1" @click="page--">上一页</button>
      <span class="pager-info">{{ page }} / {{ pageCount }}</span>
      <button class="btn ghost sm" type="button" :disabled="page >= pageCount" @click="page++">下一页</button>
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
</template>

<script setup lang="ts">
import { useDataStore } from '../store';
import type { 记忆条目 } from '../../../schema';

const store = useDataStore();

type MemTag = 记忆条目['标签'];
const TAGS = ['日常', '重要', '约定', '亲密', '秘密', '其他'] as const;
const FILTER_TAGS = ['全部', ...TAGS] as const;

/** 每页条数 */
const PAGE_SIZE = 20;

/** 记忆日志已在 schema 中按时间升序整理 */
const memoryLog = computed<记忆条目[]>(() => store.data.千鹤.记忆日志);

/** 被删除、等待填补的记忆 */
const deletedLog = ref<记忆条目[]>([]);
/** 本次会话里被修改/填补过的条目（带标签） */
const editedTags = ref<string[]>([]);
const filledTags = ref<string[]>([]);
const tagOf = (entry: 记忆条目) => `${entry.时间}|${entry.事件}`;

const editingIndex = ref<number | null>(null);
const editDraft = ref<{ 时间: string; 事件: string; 强度: number; 标签: MemTag }>({
  时间: '',
  事件: '',
  强度: 50,
  标签: '日常',
});

const adding = ref(false);
const newEntry = ref<{ 时间: string; 事件: string; 强度: number; 标签: MemTag }>({
  时间: '',
  事件: '',
  强度: 50,
  标签: '日常',
});
const error = ref('');

/** 检索与筛选 */
const search = ref('');
const activeTag = ref<string>('全部');
const page = ref(1);

const filtered = computed(() => {
  const kw = search.value.trim();
  return memoryLog.value
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => activeTag.value === '全部' || entry.标签 === activeTag.value)
    .filter(({ entry }) => !kw || entry.事件.includes(kw) || entry.时间.includes(kw));
});

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)));
const pageItems = computed(() =>
  filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE),
);

watch([search, activeTag], () => {
  page.value = 1;
});
watch(pageCount, count => {
  if (page.value > count) page.value = count;
});

/** 合并模式 */
const selecting = ref(false);
const selected = ref<Set<number>>(new Set());
const merging = ref(false);
const mergeDraft = ref<{ 时间: string; 事件: string; 强度: number; 标签: MemTag }>({
  时间: '',
  事件: '',
  强度: 50,
  标签: '日常',
});

const TAG_CLASS: Record<string, string> = {
  日常: 't-daily',
  重要: 't-important',
  约定: 't-promise',
  亲密: 't-intimate',
  秘密: 't-secret',
  其他: 't-other',
};

function tagClass(tag: string): string {
  return TAG_CLASS[tag] ?? 't-other';
}

/** 只接受 YYYY-MM-DD HH:MM，补零后返回；不合法返回 null */
function normalizeInputTime(raw: string): string | null {
  const m = raw.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[4]);
  if (hh > 23 || Number(m[5]) > 59) return null;
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')} ${String(hh).padStart(2, '0')}:${m[5]}`;
}

function clampStrength(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, n));
}

function formatDate(time: string): string {
  return time.replace(/^\d{4}-/, '');
}

/** 按时间插入，保持数组始终有序 */
function insertSorted(entry: 记忆条目) {
  const list = store.data.千鹤.记忆日志;
  const at = list.findIndex(item => item.时间 > entry.时间);
  if (at < 0) list.push(entry);
  else list.splice(at, 0, entry);
}

function startAdd() {
  adding.value = true;
  error.value = '';
  newEntry.value = { 时间: store.data.世界.当前时间, 事件: '', 强度: 50, 标签: '日常' };
}

function addMemory() {
  const time = normalizeInputTime(newEntry.value.时间);
  const text = newEntry.value.事件.trim();
  if (!time) {
    error.value = '时间格式应为 YYYY-MM-DD HH:MM';
    return;
  }
  if (!text) {
    error.value = '记忆内容不能为空';
    return;
  }
  insertSorted({
    时间: time,
    事件: text,
    强度: clampStrength(newEntry.value.强度),
    标签: newEntry.value.标签,
    钉选: false,
    楼层: 0,
  });
  page.value = 1;
  error.value = '';
  newEntry.value = { 时间: '', 事件: '', 强度: 50, 标签: '日常' };
  adding.value = false;
}

function cancelAdd() {
  newEntry.value = { 时间: '', 事件: '', 强度: 50, 标签: '日常' };
  error.value = '';
  adding.value = false;
}

function startEdit(i: number) {
  const entry = store.data.千鹤.记忆日志[i];
  if (!entry) return;
  editingIndex.value = i;
  editDraft.value = { 时间: entry.时间, 事件: entry.事件, 强度: entry.强度, 标签: entry.标签 };
  error.value = '';
}

function saveEdit(i: number) {
  const time = normalizeInputTime(editDraft.value.时间);
  const text = editDraft.value.事件.trim();
  if (!time) {
    error.value = '时间格式应为 YYYY-MM-DD HH:MM';
    return;
  }
  if (!text) {
    error.value = '记忆内容不能为空';
    return;
  }
  const old = store.data.千鹤.记忆日志[i];
  const next: 记忆条目 = {
    时间: time,
    事件: text,
    强度: clampStrength(editDraft.value.强度),
    标签: editDraft.value.标签,
    钉选: old?.钉选 === true,
    楼层: old?.楼层 ?? 0,
  };
  store.data.千鹤.记忆日志.splice(i, 1);
  insertSorted(next);
  editedTags.value.push(tagOf(next));
  editingIndex.value = null;
  editDraft.value = { 时间: '', 事件: '', 强度: 50, 标签: '日常' };
  error.value = '';
}

function removeMemory(i: number) {
  const [removed] = store.data.千鹤.记忆日志.splice(i, 1);
  if (!removed) return;
  deletedLog.value.push(removed);
  editedTags.value = editedTags.value.filter(tag => tag !== tagOf(removed));
  selected.value.delete(i);
}

function togglePin(i: number) {
  const entry = store.data.千鹤.记忆日志[i];
  if (!entry) return;
  entry.钉选 = !entry.钉选;
}

/** 自动填补被删的记忆（保留时间与标签，内容标注为自动填补） */
function fillGap(i: number) {
  const g = deletedLog.value[i];
  if (!g) return;
  const restored: 记忆条目 = { ...g, 事件: `（自动填补）${g.事件}`, 钉选: false };
  insertSorted(restored);
  filledTags.value.push(tagOf(restored));
  deletedLog.value.splice(i, 1);
}

function clearMemory() {
  store.data.千鹤.记忆日志 = [];
  deletedLog.value = [];
  editedTags.value = [];
  filledTags.value = [];
  selected.value.clear();
  selecting.value = false;
  merging.value = false;
  page.value = 1;
}

function toggleSelectMode() {
  selecting.value = !selecting.value;
  if (!selecting.value) clearSelection();
  merging.value = false;
  editingIndex.value = null;
}

function togglePick(i: number) {
  const next = new Set(selected.value);
  if (next.has(i)) next.delete(i);
  else next.add(i);
  selected.value = next;
}

function clearSelection() {
  selected.value = new Set();
  merging.value = false;
}

function startMerge() {
  const picks = [...selected.value]
    .sort((a, b) => a - b)
    .map(i => store.data.千鹤.记忆日志[i])
    .filter(Boolean);
  if (picks.length < 2) {
    error.value = '至少选择两条记忆才能合并';
    return;
  }
  const sorted = [...picks].sort((a, b) => a.时间.localeCompare(b.时间));
  const tagCount = new Map<MemTag, number>();
  for (const entry of picks) tagCount.set(entry.标签, (tagCount.get(entry.标签) ?? 0) + 1);
  const tag = [...tagCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '日常';
  mergeDraft.value = {
    时间: sorted[0]?.时间 ?? store.data.世界.当前时间,
    事件: sorted.map(entry => entry.事件).join('\n'),
    强度: Math.max(...picks.map(entry => entry.强度)),
    标签: tag,
  };
  error.value = '';
  merging.value = true;
}

function cancelMerge() {
  merging.value = false;
  error.value = '';
}

function confirmMerge() {
  const time = normalizeInputTime(mergeDraft.value.时间);
  const text = mergeDraft.value.事件.trim();
  if (!time) {
    error.value = '时间格式应为 YYYY-MM-DD HH:MM';
    return;
  }
  if (!text) {
    error.value = '记忆内容不能为空';
    return;
  }
  const indices = [...selected.value].sort((a, b) => b - a);
  const sourceFloors = indices.map(i => store.data.千鹤.记忆日志[i]?.楼层 ?? 0);
  for (const i of indices) {
    if (store.data.千鹤.记忆日志[i]) store.data.千鹤.记忆日志.splice(i, 1);
  }
  const merged: 记忆条目 = {
    时间: time,
    事件: text,
    强度: clampStrength(mergeDraft.value.强度),
    标签: mergeDraft.value.标签,
    钉选: false,
    楼层: Math.max(0, ...sourceFloors),
  };
  insertSorted(merged);
  editedTags.value.push(tagOf(merged));
  selected.value = new Set();
  merging.value = false;
  selecting.value = false;
  error.value = '';
  page.value = 1;
}
</script>

<style lang="scss" scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-head-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-icon {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-dim);
  color: var(--accent);
  font-size: 12px;

  svg {
    width: 15px;
    height: 15px;
    display: block;
  }
}

.panel-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text);
}

.panel-tag {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--muted);
}

.panel-desc {
  font-size: 11.5px;
  color: var(--muted);
  margin-top: -6px;
}

.mem-toolbar {
  display: flex;
  gap: 6px;
  align-items: center;
}

.mem-toolbar .btn {
  align-self: auto;
}

.btn.ghost.active {
  color: var(--accent);
  border-color: var(--accent);
}

.mem-error {
  font-size: 11px;
  color: var(--red);
}

.mem-filter {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag-chip {
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid var(--line-2);
  background: transparent;
  color: var(--muted);
  font-size: 10.5px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-chip.active {
  color: var(--bg);
  background: var(--accent);
  border-color: var(--accent);
}

.memory-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.memory-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 9px 11px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;
}

.memory-item.pinned {
  border-color: color-mix(in srgb, var(--amber) 55%, var(--line));
}

.memory-item.picked {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, var(--panel-2));
}

.mem-pin {
  color: var(--amber);
  font-size: 12px;
  line-height: 1.4;
  flex-shrink: 0;
}

.pick-box {
  margin-top: 3px;
  accent-color: var(--accent);
  flex-shrink: 0;
}

.memory-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 3px;
}

.memory-time {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  flex-shrink: 0;
}

.mem-tag {
  flex-shrink: 0;
  font-size: 9.5px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 999px;
  border: 1px solid var(--line-2);
  color: var(--muted);
}

.t-daily {
  color: var(--muted);
  border-color: var(--line-2);
}

.t-important {
  color: var(--amber);
  border-color: var(--amber);
  background: color-mix(in srgb, var(--amber) 12%, transparent);
}

.t-promise {
  color: var(--blue);
  border-color: var(--blue);
  background: color-mix(in srgb, var(--blue) 12%, transparent);
}

.t-intimate {
  color: var(--accent);
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}

.t-secret {
  color: var(--red);
  border-color: var(--red);
  background: color-mix(in srgb, var(--red) 12%, transparent);
}

.t-other {
  color: var(--muted);
  border-style: dashed;
}

.tag-floor {
  font-family: var(--font-mono);
  color: var(--muted);
  border-color: var(--line-2);
  background: var(--panel-2);
}

.mem-strength {
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--muted);
}

.mem-strength.strong {
  color: var(--amber);
}

.tag-edit {
  color: var(--amber);
  border: 1px solid var(--amber);
  background: color-mix(in srgb, var(--amber) 12%, transparent);
}

.tag-fill {
  color: var(--blue);
  border: 1px solid var(--blue);
  background: color-mix(in srgb, var(--blue) 12%, transparent);
}

.memory-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.memory-event {
  font-size: 12px;
  color: var(--text);
  line-height: 1.55;
  white-space: pre-wrap;
}

.memory-ops {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}

.op-btn {
  width: 22px;
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
  transition: all 0.2s;
}

.op-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.op-btn.on {
  color: var(--amber);
  border-color: var(--amber);
}

.op-btn.del:hover {
  color: var(--red);
  border-color: var(--red);
}

.merge-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border: 1px dashed var(--accent);
  border-radius: 9px;
  background: color-mix(in srgb, var(--accent) 6%, transparent);
}

.merge-count {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--accent);
  margin-right: auto;
}

.merge-box {
  border-color: var(--accent);
}

.merge-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 1px;
}

.add-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: var(--panel-2);
  border: 1px solid var(--accent);
  border-radius: 10px;
}

.add-input {
  width: 100%;
  padding: 7px 9px;
  background: var(--panel);
  border: 1px solid var(--line-2);
  border-radius: 8px;
  color: var(--text);
  font-size: 12px;
  font-family: var(--font-ui);
  outline: none;
}

.add-input:focus {
  border-color: var(--accent);
}

.field-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mini-label {
  font-size: 10.5px;
  color: var(--muted);
  flex-shrink: 0;
}

.mini-input {
  width: auto;
  flex: 1;
  min-width: 0;
}

.edit-area {
  width: 100%;
  padding: 7px 9px;
  background: var(--panel);
  border: 1px solid var(--accent);
  border-radius: 8px;
  color: var(--text);
  font-size: 12px;
  font-family: var(--font-ui);
  resize: vertical;
  outline: none;
}

.edit-actions {
  display: flex;
  gap: 6px;
  margin-top: 2px;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.pager-info {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--muted);
}

.pager .btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.memory-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 12px;
  padding: 34px 18px;
  border: 1px dashed var(--line-2);
  border-radius: 12px;
  background: color-mix(in srgb, var(--panel-2) 60%, transparent);
}

.memory-empty-ico {
  color: var(--accent);
  line-height: 1;

  svg {
    width: 22px;
    height: 22px;
    display: block;
  }
}

.memory-empty-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.memory-empty-hint {
  font-size: 11px;
  color: var(--muted);
}

/* ===== 待填补区 ===== */
.gap-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border: 1px dashed var(--blue);
  border-radius: 12px;
  background: color-mix(in srgb, var(--blue) 5%, transparent);
}

.gap-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.gap-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--blue);
  letter-spacing: 1px;
}

.gap-count {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
}

.gap-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 9px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 9px;
  opacity: 0.85;
}

.gap-time {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--muted);
  flex-shrink: 0;
}

.gap-content {
  font-size: 11.5px;
  color: var(--muted);
  flex: 1;
  text-decoration: line-through;
  opacity: 0.8;
  min-width: 0;
}

.btn {
  padding: 8px 14px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  font-family: inherit;
  transition: all 0.2s;
  align-self: flex-start;
}

.btn.sm {
  padding: 4px 10px;
  font-size: 11px;
  border-radius: 7px;
}

.btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.btn.primary {
  background: var(--accent);
  color: var(--bg);
}

.btn.primary:hover {
  filter: brightness(1.1);
}

.btn.ghost {
  background: transparent;
  border-color: var(--line-2);
  color: var(--muted);
}

.btn.ghost:hover {
  color: var(--text);
  border-color: var(--muted);
}

.btn.danger {
  background: transparent;
  border-color: var(--red);
  color: var(--red);
}

.btn.danger:hover {
  background: color-mix(in srgb, var(--red) 10%, transparent);
}
</style>
