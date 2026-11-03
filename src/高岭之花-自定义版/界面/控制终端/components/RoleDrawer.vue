<template>
  <div class="rd-mask" @click.self="emit('close')">
    <div class="rd-sheet">
      <div class="rd-grab"></div>

      <div class="rd-head">
        <b>当前角色</b>
        <span class="rd-count">{{ roles.length }} 台受控</span>
      </div>
      <p class="rd-tip">点一张就切。</p>

      <div class="rd-list">
        <button
          v-for="[id, role] in roles"
          :key="id"
          class="rd-card"
          :class="{ active: id === store.data.当前角色 }"
          type="button"
          @click="pick(id)"
        >
          <span class="rd-ava" :style="artStyle(id)">
            <span v-if="!getRoleArt(id)">{{ initialOf(role.档案.姓名 || id) }}</span>
          </span>
          <span class="rd-name">{{ role.档案.姓名 || '未命名' }}</span>
          <span class="rd-meta">{{ role.档案.型号 || '没型号' }}</span>
          <span class="rd-state">{{ stateOf(role) }}</span>
        </button>

        <button class="rd-card create" type="button" @click="emit('create')">
          <span class="rd-ava plus">＋</span>
          <span class="rd-name">新建</span>
          <span class="rd-meta">受控角色</span>
        </button>
      </div>

      <div class="rd-actions">
        <button class="rd-btn" type="button" @click="emit('manage')">管理</button>
        <button class="rd-btn ghost" type="button" @click="emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '../store';
import { controllableRoles } from '../role-info';
import { getRoleArt } from '../role-art';

const emit = defineEmits<{ close: []; manage: []; create: [] }>();

const store = useDataStore();
const roles = computed(() => controllableRoles(store.data));

function initialOf(name: string) {
  return Array.from(name.trim())[0] ?? '机';
}

function artStyle(id: string) {
  const art = getRoleArt(id);
  return art ? { backgroundImage: `url("${art}")` } : {};
}

function stateOf(role: { 状态?: { 意识状态: string } }) {
  const map: Record<string, string> = { 运行中: '运行中', 已停止: '已停止', 已冻结: '已冻结' };
  return role.状态 ? (map[role.状态.意识状态] ?? role.状态.意识状态) : '';
}

function pick(id: string) {
  if (id !== store.data.当前角色) store.data.当前角色 = id;
  emit('close');
}
</script>

<style scoped lang="scss">
.rd-mask {
  position: absolute;
  inset: 0;
  z-index: 45;
  background: rgba(12, 16, 24, 0.38);
  display: flex;
  align-items: flex-end;
}

.rd-sheet {
  width: 100%;
  background: var(--bg);
  border-top: 1px solid var(--line);
  border-radius: 16px 16px 0 0;
  padding: 10px 14px calc(14px + env(safe-area-inset-bottom));
  box-shadow: 0 -18px 40px -26px rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: rd-up 0.22s ease;
}

@keyframes rd-up {
  from {
    transform: translateY(14px);
    opacity: 0.6;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.rd-grab {
  width: 34px;
  height: 3px;
  border-radius: 2px;
  background: var(--line-2);
  margin: 0 auto;
}

.rd-head {
  display: flex;
  align-items: baseline;
  gap: 8px;

  b {
    font-size: 13px;
    letter-spacing: 1px;
  }
}

.rd-count {
  margin-left: auto;
  font-size: 10px;
  color: var(--muted);
}

.rd-tip {
  margin: -4px 0 0;
  font-size: 10px;
  color: var(--muted);
}

.rd-list {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.rd-card {
  flex: 0 0 auto;
  width: 92px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px 8px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel);
  color: var(--text);
  font-family: inherit;
  cursor: pointer;

  &.active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 8%, var(--panel));
  }

  &.create {
    border-style: dashed;
    color: var(--muted);
  }
}

.rd-ava {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--avatar-a), var(--avatar-b));
  background-size: cover;
  background-position: center;
  overflow: hidden;

  &.plus {
    background: var(--panel-2);
    color: var(--muted);
    border: 1px dashed var(--line);
    font-size: 18px;
    font-weight: 400;
  }
}

.rd-name {
  font-size: 12px;
  font-weight: 600;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rd-meta {
  font-size: 9.5px;
  color: var(--muted);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rd-state {
  font-size: 9px;
  color: var(--accent);
}

.rd-actions {
  display: flex;
  gap: 8px;
}

.rd-btn {
  flex: 1;
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--text);
  border-radius: 9px;
  padding: 9px 10px;
  font-size: 11.5px;
  font-family: inherit;
  cursor: pointer;

  &.ghost {
    flex: 0 0 auto;
    color: var(--muted);
    background: transparent;
  }
}
</style>
