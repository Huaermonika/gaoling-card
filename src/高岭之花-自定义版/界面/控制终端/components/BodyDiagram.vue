<template>
  <!-- 状态页缩略图：纯展示，不响应点击 -->
  <div v-if="thumb" class="body-thumb-wrap">
    <svg
      ref="svgEl"
      class="body-thumb-svg"
      viewBox="0 0 1672 2508"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="机体总览缩略图"
    >
      <g class="shell-layer"></g>
      <g class="segs-layer"></g>
      <g class="iparts-layer"></g>
    </svg>
  </div>

  <!-- 躯体页完整版：图层 / 缩放 / 选中详情 -->
  <div v-else class="body-wrap">
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
    <svg
      ref="svgEl"
      class="body-svg"
      viewBox="0 0 1672 2508"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="机体结构图"
    >
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
    <div v-if="detailText" class="body-detail">
      <span class="body-detail-text">{{ detailText }}</span>
      <button v-if="selectedLock" class="btn ghost sm" type="button" @click="toggleSelectedLock">
        {{ selectedLocked ? '解锁' : '锁定' }} {{ selectedLock }}
      </button>
    </div>
    <div v-else class="body-detail hint-only">
      <span class="body-detail-hint">点击机体段或内部部件查看详情；点「脑/胸/腹」舱门或身体锁定按钮可联动高亮</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  BODY_PATHS,
  INTERNAL_PARTS,
  SVG_W,
  SVG_H,
  SEG_LOCK_MAP,
  LOCK_TO_SEGS,
  HATCH_TO_SEG,
  segLockInfo,
  type InternalPart,
  type SegState,
} from '../body-diagram';
import { useDataStore, setBodyLock } from '../store';

const props = defineProps<{ thumb?: boolean }>();

const store = useDataStore();
const svgEl = ref<SVGSVGElement | null>(null);

const NS = 'http://www.w3.org/2000/svg';

/* ===== 段状态：由身体状态（8 部位）折算成图上的 4 种颜色 ===== */
function segStateOf(seg: string): SegState {
  const part = SEG_LOCK_MAP[seg];
  const state = part ? store.data.千鹤.身体状态[part] : undefined;
  if (state === '损坏' || state === '故障') return '受损';
  if (state === '离线') return '拆除';
  return '完好';
}

function isBodyLocked(part: string | null): boolean {
  return !!(part && store.data.千鹤.身体锁定[part]);
}

/* ===== 渲染 ===== */
function renderSvg() {
  const svg = svgEl.value;
  if (!svg) return;
  const thumb = !!props.thumb;
  const shellLayer = svg.querySelector('.shell-layer');
  const segsLayer = svg.querySelector('.segs-layer');
  const ipartsLayer = svg.querySelector('.iparts-layer');
  if (!shellLayer || !segsLayer || !ipartsLayer) return;
  shellLayer.innerHTML = '';
  segsLayer.innerHTML = '';
  ipartsLayer.innerHTML = '';

  for (const name of Object.keys(BODY_PATHS)) {
    const d = BODY_PATHS[name];
    const shell = document.createElementNS(NS, 'path');
    shell.setAttribute('d', d);
    shell.setAttribute('class', 'shell-line');
    shellLayer.appendChild(shell);

    const seg = document.createElementNS(NS, 'path');
    seg.setAttribute('d', d);
    seg.setAttribute('class', 'seg seg-' + segStateOf(name));
    seg.dataset.seg = name;
    if (!thumb) seg.addEventListener('click', () => onSegClick(name));
    segsLayer.appendChild(seg);
  }

  if (!thumb) {
    for (const ip of INTERNAL_PARTS) {
      const el = createPartEl(ip);
      if (!el) continue;
      el.addEventListener('click', () => onPartClick(ip));
      ipartsLayer.appendChild(el);
    }
  }

  syncLocks();
  if (!thumb) {
    applyLayer();
    applyIparts();
    applyView();
  }
}

function createPartEl(ip: InternalPart): SVGElement | null {
  let el: SVGElement | null = null;
  if (ip.shape === 'circle') {
    el = document.createElementNS(NS, 'circle');
    el.setAttribute('cx', String(ip.cx));
    el.setAttribute('cy', String(ip.cy));
    el.setAttribute('r', String(ip.r));
  } else if (ip.shape === 'ellipse') {
    el = document.createElementNS(NS, 'ellipse');
    el.setAttribute('cx', String(ip.cx));
    el.setAttribute('cy', String(ip.cy));
    el.setAttribute('rx', String(ip.rx));
    el.setAttribute('ry', String(ip.ry));
  } else if (ip.shape === 'rect') {
    el = document.createElementNS(NS, 'rect');
    el.setAttribute('x', String((ip.cx ?? 0) - (ip.rx ?? 0)));
    el.setAttribute('y', String((ip.cy ?? 0) - (ip.ry ?? 0)));
    el.setAttribute('width', String((ip.rx ?? 0) * 2));
    el.setAttribute('height', String((ip.ry ?? 0) * 2));
    el.setAttribute('rx', '6');
  } else if (ip.shape === 'line') {
    el = document.createElementNS(NS, 'line');
    el.setAttribute('x1', String(ip.x1));
    el.setAttribute('y1', String(ip.y1));
    el.setAttribute('x2', String(ip.x2));
    el.setAttribute('y2', String(ip.y2));
  } else if (ip.shape === 'path') {
    el = document.createElementNS(NS, 'path');
    el.setAttribute('d', ip.d ?? '');
  } else if (ip.shape === 'diamond') {
    el = document.createElementNS(NS, 'path');
    el.setAttribute(
      'd',
      `M ${ip.cx} ${(ip.cy ?? 0) - (ip.ry ?? 0)} L ${(ip.cx ?? 0) + (ip.rx ?? 0)} ${ip.cy} L ${ip.cx} ${(ip.cy ?? 0) + (ip.ry ?? 0)} L ${(ip.cx ?? 0) - (ip.rx ?? 0)} ${ip.cy} Z`,
    );
  } else if (ip.shape === 'dots') {
    const g = document.createElementNS(NS, 'g');
    g.classList.add('ipart-dots');
    for (const p of ip.points || []) {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', String(p[0]));
      c.setAttribute('cy', String(p[1]));
      c.setAttribute('r', '6');
      g.appendChild(c);
    }
    el = g;
  }
  if (!el) return null;

  if (ip.rot) {
    const cx = ip.cx ?? ((ip.x1 ?? 0) + (ip.x2 ?? 0)) / 2;
    const cy = ip.cy ?? ((ip.y1 ?? 0) + (ip.y2 ?? 0)) / 2;
    el.setAttribute('transform', `rotate(${ip.rot} ${cx} ${cy})`);
  }
  el.classList.add('ipart');
  if (ip.shape === 'line') el.classList.add('ipart-line');
  if (ip.decorative) {
    el.classList.add('decorative');
    (el as SVGElement & { style: CSSStyleDeclaration }).style.pointerEvents = 'none';
  }
  el.dataset.part = ip.id;
  return el;
}

/* ===== 锁定状态 → 蓝色虚线 ===== */
function syncLocks() {
  const svg = svgEl.value;
  if (!svg) return;
  svg.querySelectorAll<SVGPathElement>('.seg').forEach(seg => {
    const name = seg.dataset.seg ?? '';
    seg.classList.toggle('locked', isBodyLocked(SEG_LOCK_MAP[name] ?? null));
  });
}

/* ===== 选中与详情 ===== */
const bodySelected = ref<{ type: 'seg' | 'part'; seg?: string; part?: InternalPart } | null>(null);

const detailText = computed(() => {
  const sel = bodySelected.value;
  if (!sel) return '';
  if (sel.type === 'part') {
    const p = sel.part!;
    const name = p.subItem || p.module;
    return p.subItem && p.subItem !== p.module ? `${name} · ${p.module}` : p.module;
  }
  const seg = sel.seg!;
  const lock = segLockInfo(seg);
  const hatch = Object.keys(HATCH_TO_SEG).find(h => HATCH_TO_SEG[h] === seg) ?? null;
  let s = `${seg} · ${segStateOf(seg)}`;
  if (lock) s += ` · 锁定部位：${lock}`;
  if (hatch) s += ` · 舱门：${hatch}`;
  return s;
});

function clearHighlights() {
  svgEl.value?.querySelectorAll('.seg.selected, .ipart.selected').forEach(el => el.classList.remove('selected'));
}

function onSegClick(name: string) {
  clearHighlights();
  const seg = [...(svgEl.value?.querySelectorAll<SVGPathElement>('.seg') ?? [])].find(s => s.dataset.seg === name);
  seg?.classList.add('selected');
  bodySelected.value = { type: 'seg', seg: name };
}

function onPartClick(ip: InternalPart) {
  clearHighlights();
  const el = [...(svgEl.value?.querySelectorAll<SVGElement>('.ipart') ?? [])].find(x => x.dataset.part === ip.id);
  el?.classList.add('selected');
  bodySelected.value = { type: 'part', part: ip };
}

const selectedLock = computed(() =>
  bodySelected.value?.type === 'seg' ? segLockInfo(bodySelected.value.seg ?? '') : null,
);
const selectedLocked = computed(() => isBodyLocked(selectedLock.value));

function toggleSelectedLock() {
  const lock = selectedLock.value;
  if (!lock) return;
  setBodyLock(store.data, lock, !isBodyLocked(lock));
  flashLock(lock);
}

/* ===== 图层 ===== */
const bodyLayer = ref(1);
const bodyShowIparts = ref(true);

function applyLayer() {
  const svg = svgEl.value;
  if (!svg) return;
  svg.querySelectorAll<SVGPathElement>('.seg').forEach(s => {
    s.classList.toggle('seg-dim', bodyLayer.value !== 1);
    s.style.opacity = bodyLayer.value !== 1 ? '0.54' : '';
  });
}

function applyIparts() {
  const svg = svgEl.value;
  if (!svg) return;
  const show: Record<number, number[]> = { 1: [1, 2, 3], 2: [1, 2], 3: [1, 3] };
  svg.querySelectorAll<SVGElement>('.ipart').forEach(el => {
    const ip = INTERNAL_PARTS.find(x => x.id === el.dataset.part);
    if (ip) el.style.display = bodyShowIparts.value && show[bodyLayer.value].includes(ip.layer) ? '' : 'none';
  });
}

function bodySetLayer(l: number) {
  bodyLayer.value = l;
  applyLayer();
  applyIparts();
}

function bodyToggleIparts() {
  bodyShowIparts.value = !bodyShowIparts.value;
  applyIparts();
}

/* ===== 缩放 ===== */
const bodyZoom = ref(1);
const bodyCenter = ref({ x: SVG_W / 2, y: SVG_H / 2 });

function applyView() {
  const svg = svgEl.value;
  if (!svg || props.thumb) return;
  const w = SVG_W / bodyZoom.value;
  const h = SVG_H / bodyZoom.value;
  const c = bodyCenter.value;
  svg.setAttribute('viewBox', `${c.x - w / 2} ${c.y - h / 2} ${w} ${h}`);
}

function bodyZoomIn() {
  bodyZoom.value = Math.max(1, Math.min(8, bodyZoom.value * 1.3));
  applyView();
}

function bodyZoomOut() {
  bodyZoom.value = Math.max(1, Math.min(8, bodyZoom.value / 1.3));
  applyView();
}

function bodyReset() {
  bodyZoom.value = 1;
  bodyCenter.value = { x: SVG_W / 2, y: SVG_H / 2 };
  applyView();
}

/* ===== 与躯体页按钮联动：闪烁对应段 ===== */
function flashSeg(name: string) {
  const seg = [...(svgEl.value?.querySelectorAll<SVGPathElement>('.seg') ?? [])].find(s => s.dataset.seg === name);
  if (!seg) return;
  seg.classList.add('flash');
  window.setTimeout(() => seg.classList.remove('flash'), 1600);
}

function flashHatch(part: string) {
  const segName = HATCH_TO_SEG[part];
  if (segName) flashSeg(segName);
}

function flashLock(part: string) {
  for (const seg of LOCK_TO_SEGS[part] || []) flashSeg(seg);
}

defineExpose({ flashLock, flashHatch });

/* ===== 生命周期与响应 ===== */
onMounted(() => renderSvg());

watch(
  () => store.data.千鹤.身体锁定,
  () => syncLocks(),
  { deep: true },
);

// 身体状态变化 → 重画段颜色（损伤/离线会改变配色）
watch(
  () => store.data.千鹤.身体状态,
  () => {
    renderSvg();
    clearHighlights();
  },
  { deep: true },
);
</script>

<style lang="scss" scoped>
/* ===== 完整版（躯体页） ===== */
.body-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.body-tools {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.layer-quick-btn {
  background: var(--panel-2);
  color: var(--muted);
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 3px 9px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  font-family: var(--font-mono);
  transition: all 0.15s;

  &.active {
    color: var(--accent);
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }

  &:hover {
    color: var(--text);
    border-color: var(--muted);
  }
}

.body-tool-btn {
  background: var(--panel-2);
  color: var(--text);
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 3px 9px;
  font-size: 12px;
  cursor: pointer;
  font-family: var(--font-mono);
  transition: all 0.15s;

  &:hover {
    color: var(--accent);
    border-color: var(--accent);
  }
}

.body-pct {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  min-width: 42px;
  text-align: center;
}

.body-svg {
  width: 100%;
  height: auto;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  max-height: 62vh;

  :deep(.shell-line) {
    fill: none;
    stroke: var(--line-2);
    stroke-width: 2;
    stroke-opacity: 0.55;
  }

  :deep(.seg) {
    fill: rgba(65, 216, 163, 0.18);
    stroke: rgba(65, 216, 163, 0.5);
    stroke-width: 1.6;
    transition: all 0.18s;
    cursor: pointer;

    &:hover {
      fill: rgba(65, 216, 163, 0.3);
      stroke: rgba(65, 216, 163, 0.85);
      stroke-width: 2;
    }

    &.seg-完好 {
      fill: rgba(65, 216, 163, 0.18);
      stroke: rgba(65, 216, 163, 0.5);
    }

    &.seg-受损 {
      fill: rgba(232, 182, 76, 0.22);
      stroke: rgba(232, 182, 76, 0.55);
    }

    &.seg-损毁 {
      fill: rgba(229, 96, 96, 0.26);
      stroke: rgba(229, 96, 96, 0.6);
    }

    &.seg-拆除 {
      fill: rgba(92, 102, 117, 0.1);
      stroke: rgba(92, 102, 117, 0.5);
      stroke-dasharray: 5 4;
    }

    &.locked {
      stroke: var(--blue);
      stroke-width: 2.6;
      fill: color-mix(in srgb, var(--blue) 24%, transparent);
      stroke-dasharray: 5 4;
    }

    &.selected {
      stroke: #fff;
      stroke-width: 3.4;
      filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.45));
    }

    &.flash {
      stroke: var(--amber);
      stroke-width: 3.4;
      fill: color-mix(in srgb, var(--amber) 30%, transparent);
      filter: drop-shadow(0 0 10px rgba(232, 182, 76, 0.6));
    }
  }

  :deep(.seg-dim) {
    pointer-events: none;
  }

  :deep(.ipart) {
    fill: rgba(106, 153, 255, 0.28);
    stroke: rgba(106, 153, 255, 0.6);
    stroke-width: 1.4;
    transition: all 0.15s;
    cursor: pointer;

    &:hover {
      fill: rgba(106, 153, 255, 0.45);
      stroke: rgba(106, 153, 255, 0.95);
      stroke-width: 2;
    }

    &.selected {
      stroke: #fff;
      stroke-width: 2.4;
      filter: drop-shadow(0 0 5px rgba(106, 153, 255, 0.6));
    }

    &.decorative {
      fill: none;
      stroke: var(--line-2);
      stroke-width: 1.2;
      opacity: 0.7;
    }
  }
}

.body-legend {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 2px 2px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--muted);

  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    border: 1px solid;
  }

  .dot.dot-完好 {
    background: rgba(65, 216, 163, 0.35);
    border-color: rgba(65, 216, 163, 0.8);
  }

  .dot.dot-受损 {
    background: rgba(232, 182, 76, 0.35);
    border-color: rgba(232, 182, 76, 0.8);
  }

  .dot.dot-损毁 {
    background: rgba(229, 96, 96, 0.35);
    border-color: rgba(229, 96, 96, 0.8);
  }

  .dot.dot-拆除 {
    background: rgba(92, 102, 117, 0.25);
    border-color: rgba(92, 102, 117, 0.7);
    border-style: dashed;
  }

  .dot.dot-module {
    background: rgba(106, 153, 255, 0.3);
    border-color: rgba(106, 153, 255, 0.8);
  }
}

.body-detail {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 10px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;
  font-size: 11px;

  &.hint-only {
    border-style: dashed;
  }
}

.body-detail-text {
  color: var(--text);
  font-family: var(--font-mono);
}

/* 详情行里的锁定按钮：组件内自带，避免依赖父面板的 scoped 样式 */
.body-detail .btn {
  padding: 5px 10px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  font-family: inherit;
  transition: all 0.2s;

  &.ghost {
    background: transparent;
    border-color: var(--line-2);
    color: var(--muted);

    &:hover {
      color: var(--text);
      border-color: var(--muted);
    }
  }
}

.body-detail-hint {
  color: var(--muted);
  line-height: 1.5;
}

/* ===== 缩略图（状态页） ===== */
.body-thumb-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 474px;
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
}

.body-thumb-svg {
  width: auto;
  height: 400px;
  max-width: 100%;
  flex-shrink: 0;
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;

  :deep(.shell-line) {
    fill: none;
    stroke: var(--line-2);
    stroke-width: 2;
    stroke-opacity: 0.45;
  }

  :deep(.seg) {
    fill: rgba(65, 216, 163, 0.16);
    stroke: rgba(65, 216, 163, 0.45);
    stroke-width: 1.2;

    &.seg-完好 {
      fill: rgba(65, 216, 163, 0.16);
      stroke: rgba(65, 216, 163, 0.45);
    }

    &.seg-受损 {
      fill: rgba(232, 182, 76, 0.2);
      stroke: rgba(232, 182, 76, 0.5);
    }

    &.seg-损毁 {
      fill: rgba(229, 96, 96, 0.24);
      stroke: rgba(229, 96, 96, 0.55);
    }

    &.seg-拆除 {
      fill: rgba(92, 102, 117, 0.1);
      stroke: rgba(92, 102, 117, 0.45);
      stroke-dasharray: 4 3;
    }

    &.locked {
      stroke: var(--blue);
      stroke-width: 2.2;
      fill: color-mix(in srgb, var(--blue) 22%, transparent);
      stroke-dasharray: 4 3;
    }
  }
}
</style>
