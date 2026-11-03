/** 官方立绘触发：只认状态迁移、关键词与冷却，避免每轮重复弹同一张图。 */

import type { GalleryMeta, TriggerConfig } from './types';

export interface TriggerContext {
  stage?: string;
  consciousness?: string;
  message?: string;
  floor: number;
}

export interface TriggerHistoryItem {
  id: string;
  title: string;
  reason: string;
  floor: number;
  at: number;
}

export interface TriggerState {
  lastStage?: string;
  lastConsciousness?: string;
  lastArtId?: string;
  /** imageId → 最近触发楼层 */
  cooldown: Record<string, number>;
  /** once 键 → 已触发 */
  fired: Record<string, true>;
  history: TriggerHistoryItem[];
}

const DEFAULT_PRIORITY: Record<TriggerConfig['mode'], number> = {
  state: 100,
  affection: 80,
  keyword: 60,
  manual: 999,
};

export function initialTriggerState(): TriggerState {
  return { cooldown: {}, fired: {}, history: [] };
}

function matchWhen(when: Record<string, string> | undefined, ctx: TriggerContext): boolean {
  if (!when) return true;
  return Object.entries(when).every(([key, value]) => {
    if (key === '意识状态') return ctx.consciousness === value;
    if (key === '好感阶段') return ctx.stage === value;
    return false;
  });
}

function keywordScore(trigger: TriggerConfig, message: string): number {
  if (!trigger.keywords?.length) return 0;
  return trigger.keywords.reduce((score, item) => {
    if (!item.word || !message.includes(item.word)) return score;
    return score + (item.weight ?? 1) + item.word.length * 0.1;
  }, 0);
}

function onceKey(image: GalleryMeta, trigger: TriggerConfig, ctx: TriggerContext): string {
  const condition =
    trigger.mode === 'state'
      ? ctx.consciousness
      : trigger.mode === 'affection'
        ? ctx.stage
        : trigger.keywords?.map(item => item.word).join('|');
  return `${image.id}:${trigger.mode}:${condition ?? ''}`;
}

/**
 * 评估所有官方图，返回本轮应显示的图；没有则返回 null。
 * 会就地更新 lastStage / lastConsciousness，保证「状态不变不重复」。
 */
export function evaluateTriggers(
  images: GalleryMeta[],
  ctx: TriggerContext,
  state: TriggerState,
): GalleryMeta | null {
  const stageChanged = ctx.stage !== state.lastStage;
  const consciousnessChanged = ctx.consciousness !== state.lastConsciousness;

  const candidates = images
    .filter(image => image.trigger && image.trigger.mode !== 'manual')
    .map(image => {
      const trigger = image.trigger!;
      if (trigger.mode === 'state') {
        if (!consciousnessChanged || !matchWhen(trigger.when, ctx)) return null;
      } else if (trigger.mode === 'affection') {
        if (!stageChanged || !matchWhen(trigger.when, ctx)) return null;
      } else if (trigger.mode === 'keyword') {
        if (!ctx.message || keywordScore(trigger, ctx.message) <= 0) return null;
      }

      const lastFired = state.cooldown[image.id];
      if (trigger.cooldown && lastFired !== undefined && ctx.floor - lastFired < trigger.cooldown) return null;

      const key = onceKey(image, trigger, ctx);
      if (trigger.once && state.fired[key]) return null;

      return {
        image,
        trigger,
        key,
        score: (trigger.priority ?? DEFAULT_PRIORITY[trigger.mode]) + keywordScore(trigger, ctx.message ?? ''),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => b.score - a.score);

  state.lastStage = ctx.stage;
  state.lastConsciousness = ctx.consciousness;

  const picked = candidates[0];
  if (!picked) return null;

  state.lastArtId = picked.image.id;
  state.cooldown[picked.image.id] = ctx.floor;
  if (picked.trigger.once) state.fired[picked.key] = true;
  state.history.unshift({
    id: picked.image.id,
    title: picked.image.title,
    reason: picked.trigger.mode,
    floor: ctx.floor,
    at: Date.now(),
  });
  state.history = state.history.slice(0, 50);
  return picked.image;
}

/** 手动固定：不参与自动评估，但记一次历史 */
export function manualPick(state: TriggerState, image: GalleryMeta, floor: number): void {
  state.lastArtId = image.id;
  state.history.unshift({ id: image.id, title: image.title, reason: 'manual', floor, at: Date.now() });
  state.history = state.history.slice(0, 50);
}
