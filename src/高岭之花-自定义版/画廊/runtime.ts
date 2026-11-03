/** 画廊运行时：同步官方图 + 在生成结束后评估立绘触发。 */

import { getOfficial, kvGet, kvSet, listOfficial } from './db';
import { syncOfficialGallery, writeCurrentArt } from './remote';
import { evaluateTriggers, initialTriggerState, manualPick, type TriggerState } from './triggers';
import type { GalleryMeta } from './types';

const STAT_ROOT = { type: 'message', message_id: -1 } as const;
const STATE_KEY = 'trigger_state:';

function chatKey(): string {
  try {
    return SillyTavern.getCurrentChatId() || 'default';
  } catch {
    return 'default';
  }
}

async function loadState(): Promise<TriggerState> {
  const saved = await kvGet<TriggerState>(STATE_KEY + chatKey());
  return saved ?? initialTriggerState();
}

function readContext(): { stage?: string; consciousness?: string; message?: string; floor: number } {
  const stat = _.get(getVariables(STAT_ROOT), 'stat_data', {}) as any;
  const roleId = String(stat?.当前角色 ?? '');
  const status = stat?.角色?.[roleId]?.状态;
  const affinity = Number(status?.好感度 ?? 0);
  const stage = status?.好感阶段 ?? (affinity >= 80 ? '独占亲密' : affinity >= 60 ? '依赖萌芽' : affinity >= 40 ? '口是心非' : affinity >= 20 ? '勉强认可' : '冷漠疏离');

  let message = '';
  try {
    const latest = getChatMessages(-1);
    message = Array.isArray(latest) ? (latest[0]?.message ?? '') : '';
  } catch {
    message = '';
  }

  return {
    stage,
    consciousness: status?.意识状态,
    message,
    floor: getLastMessageId(),
  };
}

async function evaluateNow(): Promise<void> {
  const images = (await listOfficial()).map(record => record.meta);
  if (!images.length) return;

  const state = await loadState();
  const picked = evaluateTriggers(images, readContext(), state);
  await kvSet(STATE_KEY + chatKey(), state);

  if (picked) {
    writeCurrentArt(picked.id, picked.title);
    console.info('[画廊] 立绘触发', picked.id, picked.title);
  }
}

/** 手动选择：入口等界面定稿后再接，先保留接口 */
export async function pickArtManually(id: string, floor = getLastMessageId()): Promise<GalleryMeta | null> {
  const record = await getOfficial(id);
  if (!record) return null;
  const state = await loadState();
  manualPick(state, record.meta, floor);
  await kvSet(STATE_KEY + chatKey(), state);
  writeCurrentArt(record.meta.id, record.meta.title);
  return record.meta;
}

export function initGallery(): void {
  syncOfficialGallery().catch(error => console.info('[画廊] 官方图同步暂不可用', error));

  const run = () => {
    void evaluateNow().catch(error => console.warn('[画廊] 触发评估失败', error));
  };

  eventOn(tavern_events.MESSAGE_RECEIVED, () => window.setTimeout(run, 400));
  eventOn(tavern_events.GENERATION_ENDED, () => window.setTimeout(run, 400));
  eventOn(tavern_events.CHAT_CHANGED, () =>
    window.setTimeout(() => {
      void syncOfficialGallery().finally(run);
    }, 800),
  );

  window.setTimeout(run, 1500);
}
