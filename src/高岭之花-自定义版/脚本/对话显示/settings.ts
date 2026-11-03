/**
 * settings.ts —— 外观设置的唯一状态源
 *
 * 手机壳（App.vue）、PC 外壳（App.vue）与操作台（FlatConsole.vue）三处显示的是同一组设置，
 * 此前各写一份 ref + setter，改一处容易漏掉另外两处。这里统一收口：
 * 状态、setter、可选主题列表、副色预设、字号预设全部由此导出，localStorage 键保持不变。
 *
 * 模块级单例：同一 bundle 内所有界面读到的都是同一份 ref，无需再靠 storage 事件互相同步。
 */
import { computed, ref } from 'vue';
import { uiState } from '../../界面/控制终端/ui-state';
import { isHideUIOn, onHideUIChange, setHideUI } from './hide-ui';
import {
  CONSOLE_ACCENT_PRESETS,
  CONSOLE_FONT_SIZES,
  CONSOLE_THEMES,
  type ConsoleTheme,
} from './console-theme';

export type DisplayMode = 'auto' | 'mobile' | 'desktop';
export type PhoneAspect = '2:3' | '9:16' | '3:4' | '1:1' | '4:3' | '16:9';
export type UiSize = 'mini' | 'compact' | 'standard' | 'comfort' | 'large' | 'xlarge';

/* ============ 彩蛋解锁状态（终端与设置页共用） ============ */
uiState.secretUnlocked = localStorage.getItem('ch:secret') === '1';
uiState.eggManifestoUnlocked = localStorage.getItem('ch:egg1') === '1';
uiState.eggBirthUnlocked = localStorage.getItem('ch:egg2') === '1';
uiState.eggBtsUnlocked = localStorage.getItem('ch:egg3') === '1';
uiState.eggThanksUnlocked = localStorage.getItem('ch:egg4') === '1';
uiState.manifestoThemeUnlocked = localStorage.getItem('ch:theme-manifesto') === '1';
uiState.termLang = (localStorage.getItem('ch:termLang') as 'zh' | 'en') || 'zh';

/* 未解锁却存着隐藏主题时，回落到默认主题 */
if (localStorage.getItem('ch:theme') === 'sakura-secret' && !uiState.secretUnlocked) {
  localStorage.setItem('ch:theme', 'campus');
}
if (localStorage.getItem('ch:theme') === 'manifesto' && !uiState.manifestoThemeUnlocked) {
  localStorage.setItem('ch:theme', 'campus');
}

/* ============ 主题 / 主题色 / 字号 ============ */
export const themeKey = ref<string>(localStorage.getItem('ch:theme') || 'campus');
export const customAccent = ref<string>(localStorage.getItem('ch:accentCustom') || '');
export const fontSize = ref<number>(Number(localStorage.getItem('ch:fontSize')) || 13);

/** 主题定义与 FlatConsole 共用一份，避免两套配色各自维护后漂移 */
export const themes: Record<string, ConsoleTheme> = CONSOLE_THEMES;

export const currentTheme = computed<ConsoleTheme>(() => themes[themeKey.value] || themes.campus);

/** 隐藏主题仅在彩蛋解锁后显示 */
export const visibleThemes = computed(() => {
  const out: Record<string, ConsoleTheme> = {};
  for (const [k, v] of Object.entries(themes)) {
    if (k === 'sakura-secret' && !uiState.secretUnlocked) continue;
    if (k === 'manifesto' && !uiState.manifestoThemeUnlocked) continue;
    out[k] = v;
  }
  return out;
});

export const accentPresets = CONSOLE_ACCENT_PRESETS;
export const fontSizeOptions = CONSOLE_FONT_SIZES;

export function setTheme(key: string): void {
  if (!themes[key]) return;
  themeKey.value = key;
  customAccent.value = '';
  localStorage.setItem('ch:theme', key);
  localStorage.removeItem('ch:accentCustom');
}

export function setCustomAccent(c: string): void {
  customAccent.value = c;
  localStorage.setItem('ch:accentCustom', c);
}

export function resetAccent(): void {
  customAccent.value = '';
  localStorage.removeItem('ch:accentCustom');
}

export function setFontSize(n: number): void {
  fontSize.value = n;
  localStorage.setItem('ch:fontSize', String(n));
}

export function themePreviewStyle(t: ConsoleTheme): Record<string, string> {
  return {
    background: `linear-gradient(135deg, ${t.vars['--panel']} 0%, ${t.vars['--bg-2']} 100%)`,
    borderColor: t.vars['--line-2'],
    '--pd': t.vars['--accent'],
  } as Record<string, string>;
}

/* ============ 显示形态 / 屏幕比例 / 界面大小 / 老年机 ============ */
export const displayMode = ref<DisplayMode>((localStorage.getItem('ch:mode') as DisplayMode) || 'auto');
export const phoneAspect = ref<PhoneAspect>((localStorage.getItem('ch:aspect') as PhoneAspect) || '9:16');
export const uiSize = ref<UiSize>((localStorage.getItem('ch:size') as UiSize) || 'standard');
export const elderMode = ref<boolean>(localStorage.getItem('ch:elder') === '1');

export const displayModes = [
  { value: 'auto', label: '自适应' },
  { value: 'mobile', label: '手机' },
  { value: 'desktop', label: 'PC' },
];

export const aspectOptions = [
  { value: '2:3', label: '2:3 窄竖屏' },
  { value: '9:16', label: '9:16 竖屏' },
  { value: '3:4', label: '3:4' },
  { value: '1:1', label: '1:1 方屏' },
  { value: '4:3', label: '4:3 横屏' },
  { value: '16:9', label: '16:9 横屏' },
];

export const uiSizeOptions = [
  { value: 'mini', label: '迷你' },
  { value: 'compact', label: '紧凑' },
  { value: 'standard', label: '标准' },
  { value: 'comfort', label: '舒适' },
  { value: 'large', label: '大' },
  { value: 'xlarge', label: '特大' },
];

export const aspectVarsMap: Record<PhoneAspect, Record<string, string>> = {
  '2:3': { '--phone-maxw': '380px', '--phone-minh': '560px', '--phone-maxh': '900px' },
  '9:16': { '--phone-maxw': '415px', '--phone-minh': '720px', '--phone-maxh': '920px' },
  '3:4': { '--phone-maxw': '440px', '--phone-minh': '560px', '--phone-maxh': '860px' },
  '1:1': { '--phone-maxw': '500px', '--phone-minh': '500px', '--phone-maxh': '800px' },
  '4:3': { '--phone-maxw': '600px', '--phone-minh': '460px', '--phone-maxh': '760px' },
  '16:9': { '--phone-maxw': '680px', '--phone-minh': '460px', '--phone-maxh': '640px' },
};

export const sizeZoomMap: Record<UiSize, number> = {
  mini: 0.85,
  compact: 0.9,
  standard: 1,
  comfort: 1.12,
  large: 1.25,
  xlarge: 1.4,
};

export function setDisplayMode(m: DisplayMode): void {
  displayMode.value = m;
  localStorage.setItem('ch:mode', m);
}

export function setPhoneAspect(a: PhoneAspect): void {
  phoneAspect.value = a;
  localStorage.setItem('ch:aspect', a);
}

export function setUiSize(s: UiSize): void {
  uiSize.value = s;
  localStorage.setItem('ch:size', s);
}

export function setElderMode(on: boolean): void {
  elderMode.value = on;
  localStorage.setItem('ch:elder', on ? '1' : '0');
}

/* ============ 隐藏酒馆原生界面元素（沉浸模式） ============ */
export const hideTavernUI = ref(isHideUIOn());

export function setHideTavernUI(on: boolean): void {
  hideTavernUI.value = on;
  setHideUI(on);
}

onHideUIChange(on => {
  hideTavernUI.value = on;
});

/* ============ 流式美化开关 ============ */
/** ch:pretty === '0' 时整层界面只渲染操作台（FlatConsole），不渲染手机壳 */
export const prettyOff = ref(localStorage.getItem('ch:pretty') === '0');
export const prettyEnabled = computed(() => !prettyOff.value);

export function setPrettyEnabled(on: boolean): void {
  prettyOff.value = !on;
  localStorage.setItem('ch:pretty', on ? '1' : '0');
  SillyTavern.reloadCurrentChat();
}

/* ============ 跨 iframe 同步（其他楼层/其他框架实例改了 localStorage 时跟随） ============ */
window.addEventListener('storage', e => {
  if (e.key === 'ch:pretty') prettyOff.value = e.newValue === '0';
  if (e.key === 'ch:theme' && e.newValue) themeKey.value = e.newValue;
  if (e.key === 'ch:accentCustom') customAccent.value = e.newValue || '';
  if (e.key === 'ch:fontSize') fontSize.value = Number(e.newValue) || 13;
});
