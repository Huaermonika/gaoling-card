/**
 * console-theme.ts —— 操作台（FlatConsole）主题系统
 *
 * 与 App.vue 内的主题定义保持同一套预设（同一 localStorage 键 `ch:theme` / `ch:accentCustom` / `ch:fontSize`），
 * 使操作台在独立挂载（不经过 App.vue）时也能呈现完全一致的多主题外观，并与其双向同步。
 *
 * 主题变量全部走 CSS 变量（var(--xxx)），组件内不硬编码颜色。
 */

export interface ConsoleTheme {
  name: string;
  desc: string;
  vars: Record<string, string>;
}

export const CONSOLE_THEMES: Record<string, ConsoleTheme> = {
  campus: {
    name: '校园柔风',
    desc: '温暖柔和的日常',
    vars: {
      '--bg': '#f5f1e8',
      '--bg-2': '#efe9dd',
      '--panel': '#fffdf7',
      '--panel-2': '#f3eee3',
      '--line': '#e7dfd0',
      '--line-2': '#d3c6b0',
      '--accent': '#cf8f97',
      '--green': '#8fbe9c',
      '--blue': '#8fb2d6',
      '--red': '#df8b8b',
      '--amber': '#d9ab6b',
      '--purple': '#b394cf',
      '--text': '#433d33',
      '--muted': '#a29483',
      '--radius': '20px',
      '--shadow': '0 20px 48px -20px rgba(120,90,60,0.38)',
      '--deco-a': 'rgba(207,143,151,0.16)',
      '--deco-b': 'rgba(143,178,214,0.14)',
      '--deco-c': 'rgba(217,171,107,0.10)',
      '--avatar-a': '#f2c9cc',
      '--avatar-b': '#d99aa6',
    },
  },
  terminal: {
    name: '控制终端',
    desc: '冷静的科幻质感',
    vars: {
      '--bg': '#0b0e14',
      '--bg-2': '#0e121b',
      '--panel': '#131824',
      '--panel-2': '#1a2130',
      '--line': '#2a3248',
      '--line-2': '#39445e',
      '--accent': '#3fd6c4',
      '--green': '#57d97b',
      '--blue': '#5aa7ff',
      '--red': '#ff5c7a',
      '--amber': '#ffc24d',
      '--purple': '#a78bfa',
      '--text': '#e9edf5',
      '--muted': '#8c96ab',
      '--radius': '16px',
      '--shadow': '0 22px 52px -22px rgba(0,0,0,0.75)',
      '--deco-a': 'rgba(63,214,196,0.09)',
      '--deco-b': 'rgba(90,167,255,0.07)',
      '--deco-c': 'rgba(255,92,122,0.04)',
      '--avatar-a': '#3fd6c4',
      '--avatar-b': '#5aa7ff',
    },
  },
  midnight: {
    name: '深夜幽蓝',
    desc: '静谧的深夜蓝',
    vars: {
      '--bg': '#0d1220',
      '--bg-2': '#111831',
      '--panel': '#151c30',
      '--panel-2': '#1d2742',
      '--line': '#2a3757',
      '--line-2': '#3a4a74',
      '--accent': '#7aa2ff',
      '--green': '#7fd6a0',
      '--blue': '#6cb0ff',
      '--red': '#ff7a9b',
      '--amber': '#ffd17a',
      '--purple': '#a78bfa',
      '--text': '#e8ecf7',
      '--muted': '#8d9ac0',
      '--radius': '18px',
      '--shadow': '0 22px 52px -22px rgba(0,0,0,0.78)',
      '--deco-a': 'rgba(122,162,255,0.12)',
      '--deco-b': 'rgba(127,214,160,0.07)',
      '--deco-c': 'rgba(255,209,122,0.05)',
      '--avatar-a': '#7aa2ff',
      '--avatar-b': '#a78bfa',
    },
  },
  sakura: {
    name: '樱色薄暮',
    desc: '粉色薄暮的梦境',
    vars: {
      '--bg': '#fbf3f4',
      '--bg-2': '#f6e8ea',
      '--panel': '#fffafb',
      '--panel-2': '#f7ecee',
      '--line': '#f0dde1',
      '--line-2': '#e0c2c9',
      '--accent': '#e58fa0',
      '--green': '#9fc9a6',
      '--blue': '#9bb8dd',
      '--red': '#e58686',
      '--amber': '#dfad73',
      '--purple': '#c39bd6',
      '--text': '#54434a',
      '--muted': '#b09aa2',
      '--radius': '22px',
      '--shadow': '0 20px 48px -20px rgba(180,110,130,0.38)',
      '--deco-a': 'rgba(229,143,160,0.16)',
      '--deco-b': 'rgba(155,184,221,0.13)',
      '--deco-c': 'rgba(223,173,115,0.09)',
      '--avatar-a': '#f4c3cd',
      '--avatar-b': '#e58fa0',
    },
  },
  mint: {
    name: '薄荷晨光',
    desc: '清爽的晨间空气',
    vars: {
      '--bg': '#f0f6f1',
      '--bg-2': '#e6f0e9',
      '--panel': '#fbfffb',
      '--panel-2': '#eff6ef',
      '--line': '#dde9dd',
      '--line-2': '#c4d8c4',
      '--accent': '#6fae8c',
      '--green': '#7fb98a',
      '--blue': '#8fb2d6',
      '--red': '#df8b8b',
      '--amber': '#d9ab6b',
      '--purple': '#a9b8d9',
      '--text': '#3c4a40',
      '--muted': '#93a498',
      '--radius': '20px',
      '--shadow': '0 20px 48px -20px rgba(60,110,80,0.32)',
      '--deco-a': 'rgba(111,174,140,0.15)',
      '--deco-b': 'rgba(143,178,214,0.11)',
      '--deco-c': 'rgba(217,171,107,0.08)',
      '--avatar-a': '#b7e0c6',
      '--avatar-b': '#6fae8c',
    },
  },
  /* 隐藏主题：由终端彩蛋 unlock 解锁（与 App.vue 判定一致） */
  'sakura-secret': {
    name: '樱之回忆',
    desc: '夜色中的一抹樱',
    vars: {
      '--bg': '#16111f',
      '--bg-2': '#1b1526',
      '--panel': '#201a2d',
      '--panel-2': '#2a2240',
      '--line': '#362a50',
      '--line-2': '#4a3a6a',
      '--accent': '#e8a3c8',
      '--green': '#8fc9a4',
      '--blue': '#8fb2dd',
      '--red': '#ef8b9b',
      '--amber': '#e8b56d',
      '--purple': '#c39bd6',
      '--text': '#f0e6f2',
      '--muted': '#a893b5',
      '--radius': '20px',
      '--shadow': '0 22px 54px -22px rgba(30,10,40,0.85)',
      '--deco-a': 'rgba(232,163,200,0.13)',
      '--deco-b': 'rgba(195,155,214,0.10)',
      '--deco-c': 'rgba(232,181,109,0.05)',
      '--avatar-a': '#e8a3c8',
      '--avatar-b': '#a78bfa',
    },
  },
  /* 隐藏主题：手记（thanks 解锁） */
  manifesto: {
    name: '手记',
    desc: '泛黄纸页上的幕后手记',
    vars: {
      '--bg': '#f5efe0',
      '--bg-2': '#efe7d5',
      '--panel': '#faf6eb',
      '--panel-2': '#f0e8d5',
      '--line': '#d4c5a9',
      '--line-2': '#c0af8e',
      '--accent': '#8b3a3a',
      '--green': '#8fa87a',
      '--blue': '#6b8fa0',
      '--red': '#c47070',
      '--amber': '#c49a6c',
      '--purple': '#9b7f8f',
      '--text': '#3a2e23',
      '--muted': '#6b5d4f',
      '--radius': '12px',
      '--shadow': '0 1px 4px rgba(58,46,35,0.08)',
      '--deco-a': 'rgba(139,58,58,0.06)',
      '--deco-b': 'rgba(196,154,108,0.06)',
      '--deco-c': 'rgba(143,168,122,0.05)',
      '--avatar-a': '#c49a6c',
      '--avatar-b': '#8b3a3a',
    },
  },
};

export const CONSOLE_ACCENT_PRESETS = [
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

export const CONSOLE_FONT_SIZES = [
  { label: '小', value: 12 },
  { label: '中', value: 14 },
  { label: '大', value: 16 },
  { label: '特大', value: 18 },
  { label: '超大', value: 20 },
];

const FONT_UI = "system-ui, -apple-system, 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Cascadia Code', 'Courier New', monospace";

/** 隐藏主题是否可用（彩蛋解锁判定，与 App.vue 一致） */
function themeVisible(key: string): boolean {
  if (key === 'sakura-secret') return localStorage.getItem('ch:secret') === '1';
  if (key === 'manifesto') return localStorage.getItem('ch:theme-manifesto') === '1';
  return true;
}

/** 读取当前生效主题的 key（含解锁校验与回退） */
export function loadConsoleThemeKey(): string {
  let key = localStorage.getItem('ch:theme') || 'campus';
  if (!CONSOLE_THEMES[key] || !themeVisible(key)) key = 'campus';
  return key;
}

/** 当前生效主题定义 */
export function loadConsoleTheme(): ConsoleTheme {
  return CONSOLE_THEMES[loadConsoleThemeKey()] || CONSOLE_THEMES.campus;
}

/** 当前自定义主色（未自定义时取主题默认 accent） */
export function loadConsoleAccent(): string {
  return localStorage.getItem('ch:accentCustom') || loadConsoleTheme().vars['--accent'];
}

/** 当前正文字号（px） */
export function loadConsoleFontSize(): number {
  return Number(localStorage.getItem('ch:fontSize')) || 13;
}

/** 生成操作台根元素完整 CSS 变量表（含字体与 accent-dim），供 :style 注入 */
export function buildConsoleVars(key?: string, accent?: string): Record<string, string> {
  const theme = CONSOLE_THEMES[key || loadConsoleThemeKey()] || CONSOLE_THEMES.campus;
  const vars: Record<string, string> = { ...theme.vars };
  const acc = accent || loadConsoleAccent();
  vars['--accent'] = acc;
  vars['--accent-dim'] = `color-mix(in srgb, ${acc} 13%, transparent)`;
  vars['--font-ui'] = FONT_UI;
  vars['--font-mono'] = FONT_MONO;
  return vars;
}

/** 可选的可见主题列表（操作台设置页用） */
export function visibleConsoleThemes(): Record<string, ConsoleTheme> {
  const out: Record<string, ConsoleTheme> = {};
  for (const [k, v] of Object.entries(CONSOLE_THEMES)) {
    if (!themeVisible(k)) continue;
    out[k] = v;
  }
  return out;
}
