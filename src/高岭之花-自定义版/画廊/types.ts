/** 画廊数据模型：官方图与玩家上传共用一套展示结构，来源分开存。 */

export type GallerySource = 'official' | 'player';

export interface TriggerKeyword {
  word: string;
  weight?: number;
}

export interface TriggerConfig {
  /** state = 意识状态；affection = 好感阶段；keyword = 剧情关键词；manual = 只在手动选择时出现 */
  mode: 'state' | 'affection' | 'keyword' | 'manual';
  /** 如 { 意识状态: '已停止' } 或 { 好感阶段: '独占亲密' } */
  when?: Record<string, string>;
  keywords?: TriggerKeyword[];
  /** 数值越大越优先；默认 state 100 / affection 80 / keyword 60 / manual 999 */
  priority?: number;
  /** 冷却楼层数；0 表示不限制 */
  cooldown?: number;
  /** 同一触发条件只触发一次 */
  once?: boolean;
}

export interface GalleryMeta {
  id: string;
  title: string;
  tags: string[];
  source: GallerySource;
  /** 只对官方角色有意义；自定义角色可为空 */
  characterId?: string;
  description?: string;
  trigger?: TriggerConfig;
  width?: number;
  height?: number;
  bytes?: number;
  createdAt?: number;
  /** 官方图版本，用于增量同步 */
  version?: string;
}

export interface GalleryRecord {
  id: string;
  meta: GalleryMeta;
  blob: Blob;
  thumbBlob?: Blob;
}

/** CDN manifest 里的条目：比 GalleryMeta 多文件路径与校验 */
export interface ManifestImage extends Omit<GalleryMeta, 'source' | 'createdAt'> {
  file: string;
  thumb?: string;
  sha256?: string;
}

export interface GalleryManifest {
  version: string;
  images: ManifestImage[];
}

export interface GalleryStats {
  official: number;
  player: number;
  bytes: number;
}
