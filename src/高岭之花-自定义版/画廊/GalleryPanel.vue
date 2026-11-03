<template>
  <div class="gp-overlay">
    <header class="gp-head">
      <button class="gp-back" type="button" @click="emit('close')">← 返回</button>
      <b>画廊</b>
      <span class="gp-count">{{ official.length + player.length }} 张</span>
    </header>

    <div class="gp-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="gp-tab"
        :class="{ active: current === tab.key }"
        @click="current = tab.key"
      >
        {{ tab.label }}
      </button>
      <button class="gp-tab upload" type="button" :disabled="uploading" @click="fileInput?.click()">
        {{ uploading ? '上传中…' : '＋ 上传' }}
      </button>
      <input ref="fileInput" type="file" accept="image/*" multiple style="display: none" @change="onFiles" />
    </div>

    <div class="gp-body">
      <div v-if="!visible.length" class="gp-empty">
        <span>{{ current === 'official' ? '官方图库还没有同步' : '还没有图片' }}</span>
        <button type="button" class="gp-empty-btn" @click="fileInput?.click()">上传一张</button>
      </div>

      <div v-else class="gp-grid">
        <button v-for="item in visible" :key="item.id" type="button" class="gp-cell" @click="open(item)">
          <img :src="urls[item.id]?.thumb" :alt="item.meta.title" loading="lazy" />
          <span class="gp-cell-title">{{ item.meta.title }}</span>
          <span v-if="item.meta.source === 'official'" class="gp-badge">官方</span>
        </button>
      </div>
    </div>

    <div v-if="active" class="gp-viewer" @click.self="active = null">
      <div class="gp-viewer-panel">
        <header class="gp-viewer-head">
          <b>{{ active.meta.title }}</b>
          <button type="button" class="gp-close" @click="active = null">关闭</button>
        </header>
        <img class="gp-viewer-img" :src="urls[active.id]?.full" :alt="active.meta.title" />
        <div class="gp-viewer-meta">
          <span>{{ active.meta.source === 'official' ? '官方' : '我的上传' }}</span>
          <span v-if="active.meta.width">{{ active.meta.width }}×{{ active.meta.height }}</span>
          <span>{{ formatBytes(active.blob.size) }}</span>
        </div>
        <div class="gp-viewer-actions">
          <button type="button" class="gp-primary" @click="useAsAvatar(active)">设为当前角色头像</button>
          <button v-if="active.meta.source === 'player'" type="button" class="gp-danger" @click="remove(active)">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useDataStore } from '../界面/控制终端/store';
import { setRoleArt } from '../界面/控制终端/role-art';
import { deletePlayer, listOfficial, listPlayer, makeMeta, putPlayer } from './db';
import { prepareImage, blobToDataURL } from './upload';
import type { GalleryRecord } from './types';

const emit = defineEmits<{ close: [] }>();
const store = useDataStore();

const official = ref<GalleryRecord[]>([]);
const player = ref<GalleryRecord[]>([]);
const urls = ref<Record<string, { full: string; thumb: string }>>({});
const current = ref<'all' | 'official' | 'player'>('all');
const active = ref<GalleryRecord | null>(null);
const uploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const tabs = [
  { key: 'all' as const, label: '全部' },
  { key: 'official' as const, label: '官方' },
  { key: 'player' as const, label: '我的' },
];

const visible = computed(() => {
  if (current.value === 'official') return official.value;
  if (current.value === 'player') return player.value;
  return [...official.value, ...player.value];
});

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function revokeAll() {
  for (const item of Object.values(urls.value)) {
    URL.revokeObjectURL(item.full);
    URL.revokeObjectURL(item.thumb);
  }
  urls.value = {};
}

async function refresh() {
  try {
    const [off, own] = await Promise.all([listOfficial(), listPlayer()]);
    official.value = off;
    player.value = own;
    revokeAll();
    const next: Record<string, { full: string; thumb: string }> = {};
    for (const record of [...off, ...own]) {
      next[record.id] = {
        full: URL.createObjectURL(record.blob),
        thumb: URL.createObjectURL(record.thumbBlob ?? record.blob),
      };
    }
    urls.value = next;
  } catch (error) {
    console.warn('[画廊] 读取本地图片失败', error);
    official.value = [];
    player.value = [];
  }
}

async function onFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = '';
  if (!files.length) return;

  uploading.value = true;
  for (const file of files) {
    try {
      const prepared = await prepareImage(file);
      const meta = makeMeta({
        title: file.name.replace(/\.[^.]+$/, ''),
        source: 'player',
        width: prepared.width,
        height: prepared.height,
        bytes: prepared.blob.size,
      });
      await putPlayer({ id: meta.id, meta, blob: prepared.blob, thumbBlob: prepared.thumbBlob });
    } catch (error) {
      console.warn('[画廊] 上传失败', file.name, error);
      toastr.warning(`上传失败：${file.name}`);
    }
  }
  uploading.value = false;
  await refresh();
}

function open(record: GalleryRecord) {
  active.value = record;
}

async function useAsAvatar(record: GalleryRecord) {
  const blob = record.thumbBlob ?? record.blob;
  const dataUrl = await blobToDataURL(blob);
  setRoleArt(store.data.当前角色, dataUrl);
  toastr.success('已设为当前角色头像');
  active.value = null;
}

async function remove(record: GalleryRecord) {
  if (!confirm(`删除「${record.meta.title}」？`)) return;
  await deletePlayer(record.id);
  active.value = null;
  await refresh();
}

onMounted(() => {
  void refresh();
});
onBeforeUnmount(revokeAll);
</script>

<style scoped lang="scss">
.gp-overlay {
  position: absolute;
  inset: 0;
  z-index: 55;
  background: var(--bg);
  color: var(--text);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.gp-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--line);

  b {
    font-size: 14px;
    letter-spacing: 1px;
  }
}

.gp-back {
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--text);
  border-radius: 8px;
  padding: 5px 9px;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
}

.gp-count {
  margin-left: auto;
  font-size: 10px;
  color: var(--muted);
}

.gp-tabs {
  flex-shrink: 0;
  display: flex;
  gap: 6px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
}

.gp-tab {
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--muted);
  border-radius: 999px;
  padding: 5px 11px;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;

  &.active {
    color: var(--accent);
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 8%, var(--panel));
  }

  &.upload {
    margin-left: auto;
    color: var(--accent);
    border-style: dashed;
  }
}

.gp-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 14px calc(18px + env(safe-area-inset-bottom));
}

.gp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
}

.gp-cell {
  position: relative;
  aspect-ratio: 1;
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
  padding: 0;
  background: var(--panel-2);
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.gp-cell-title {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px 6px 4px;
  font-size: 9.5px;
  color: #fff;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.55));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gp-badge {
  position: absolute;
  top: 5px;
  left: 5px;
  padding: 1px 5px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--accent) 80%, transparent);
  color: #fff;
  font-size: 8px;
}

.gp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding-top: 80px;
  color: var(--muted);
  font-size: 12px;
}

.gp-empty-btn {
  border: 1px dashed var(--line-2);
  background: transparent;
  color: var(--accent);
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
}

.gp-viewer {
  position: absolute;
  inset: 0;
  z-index: 60;
  background: rgba(10, 12, 18, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
}

.gp-viewer-panel {
  width: 100%;
  max-height: 100%;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.gp-viewer-head {
  display: flex;
  align-items: center;
  gap: 8px;

  b {
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.gp-close {
  margin-left: auto;
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--muted);
  border-radius: 7px;
  padding: 4px 9px;
  font-size: 10.5px;
  font-family: inherit;
  cursor: pointer;
}

.gp-viewer-img {
  width: 100%;
  max-height: 58vh;
  object-fit: contain;
  border-radius: 10px;
  background: #10131a;
}

.gp-viewer-meta {
  display: flex;
  gap: 10px;
  font-size: 10px;
  color: var(--muted);
}

.gp-viewer-actions {
  display: flex;
  gap: 8px;
}

.gp-primary,
.gp-danger {
  flex: 1;
  border-radius: 9px;
  padding: 9px;
  font-size: 11.5px;
  font-family: inherit;
  cursor: pointer;
}

.gp-primary {
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #fff;
}

.gp-danger {
  flex: 0 0 auto;
  border: 1px solid color-mix(in srgb, var(--red) 50%, var(--line));
  background: transparent;
  color: var(--red);
  padding: 9px 14px;
}
</style>
