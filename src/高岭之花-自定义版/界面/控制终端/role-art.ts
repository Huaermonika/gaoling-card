import { reactive } from 'vue';

/**
 * 角色头像 / 立绘：只作展示，存 localStorage，不进 MVU 变量。
 * 变量里放 base64 会让每条消息、每次打包都带上图片，代价太大。
 * 换设备或清缓存会丢；导出预设时可另行携带（后续做）。
 */
const PREFIX = 'ch:role-art:';
const SEED_FLAG = 'ch:role-art:seeded:';
const cache = reactive<Record<string, string>>({});

/** 把相对地址补成绝对地址，iframe 内 CSS background 才能取到 */
function absolute(url: string): string {
  if (!url) return '';
  if (/^(data:|blob:|https?:)/i.test(url)) return url;
  try {
    const base = (globalThis as any).parent?.location?.href || globalThis.location.href;
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

/** 当前角色卡卡图（绝对地址） */
export function getCardImage(): string {
  try {
    const st = (globalThis as any).SillyTavern;
    const char = st?.characters?.[Number(st.characterId)];
    if (!char?.avatar || char.avatar === 'none') return '';
    return absolute(st.getThumbnailUrl('avatar', char.avatar) || '');
  } catch {
    return '';
  }
}

/**
 * 千鹤的预设头像：只播种一次。
 * 用 seeded 标记而不是「键不存在就补」，这样玩家删掉后不会又被自动加回来。
 */
export function ensurePresetArt(id: string, url: string): void {
  try {
    if (localStorage.getItem(SEED_FLAG + id) === '1') return;
    if (localStorage.getItem(PREFIX + id) === null && url) {
      localStorage.setItem(PREFIX + id, url);
      cache[id] = url;
    }
    localStorage.setItem(SEED_FLAG + id, '1');
  } catch {
    /* ignore */
  }
}

export function getRoleArt(id: string): string {
  if (cache[id] !== undefined) return cache[id];
  let value = '';
  try {
    value = localStorage.getItem(PREFIX + id) ?? '';
  } catch {
    value = '';
  }
  cache[id] = value;
  return value;
}

export function setRoleArt(id: string, dataUrl: string): void {
  cache[id] = dataUrl;
  try {
    localStorage.setItem(PREFIX + id, dataUrl);
  } catch {
    /* 超出配额时只保留内存中的这份 */
  }
}

export function removeRoleArt(id: string): void {
  cache[id] = '';
  try {
    localStorage.removeItem(PREFIX + id);
  } catch {
    /* ignore */
  }
}

/** 读取文件 → 居中裁切成方图 → 压缩成 webp/jpeg data URL */
export async function fileToAvatar(file: File, size = 512): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片解码失败'));
    image.src = raw;
  });

  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return raw;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

  try {
    return canvas.toDataURL('image/webp', 0.86);
  } catch {
    return canvas.toDataURL('image/jpeg', 0.86);
  }
}
