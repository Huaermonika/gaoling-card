/** 内置开场：千鹤三条预设 + 通用自定义。 */

import YAML from 'yaml';
import { Schema, 受控档案, 受控状态Schema, type 记忆条目 } from '../schema';
import raw0 from './文本/0.txt?raw';
import raw1 from './文本/1.txt?raw';
import raw2 from './文本/2.txt?raw';

export interface OpeningPreset {
  id: string;
  name: string;
  subtitle: string;
  characterId: string;
  text: string;
  data: Record<string, any>;
}

function parsePreset(id: string, name: string, subtitle: string, text: string): OpeningPreset {
  const match = text.match(/<initvar>\s*```yaml\r?\n([\s\S]*?)```/);
  if (!match) throw new Error(`开场缺少 initvar：${id}`);
  const data = Schema.parse(YAML.parse(match[1]));
  return { id, name, subtitle, characterId: '千鹤', text, data };
}

export const 千鹤开场: OpeningPreset[] = [
  parsePreset('qianhe-classroom', '教室 · 初次连接', '早自习，终端第一次亮起', raw0),
  parsePreset('qianhe-tutoring', '放学后 · 单独辅导', '教室里只剩你们两个人', raw1),
  parsePreset('qianhe-home', '周末 · 家中', '她已经把你当作恋人', raw2),
];

/** 去掉开场里给 AI 看的隐藏块，只留下玩家该看到的正文 */
export function stripOpeningHidden(text: string): string {
  return text
    .replace(/<initvar>[\s\S]*?<\/initvar>/g, '')
    .replace(/<UpdateVariable>[\s\S]*$/i, '')
    .replace(/<StatusPlaceHolderImpl\s*\/>/gi, '')
    .replace(/<ch_writing>[\s\S]*?<\/ch_writing>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
}

/** 从开场文本里去掉 initvar 与隐藏块，供预览与摘要 */
export function previewText(text: string, limit = 180): string {
  return stripOpeningHidden(text).slice(0, limit);
}

export interface CustomOpeningInput {
  姓名: string;
  型号: string;
  外观: string;
  性格: string;
  语言习惯: string;
  背景: string;
  关系: string;
  其他: string;
  开场白: string;
  持有者称呼: string;
  地点: string;
  时间: string;
  处境: string;
  世界设定: string;
}

export function defaultCustomText(name: string): string {
  const who = name.trim() || '她';
  return `终端在桌面上亮起，屏幕上浮出一行字：
「连接已建立。持有者权限确认。」

你抬起头。${who}站在不远处，像是刚从待机中醒来，目光落在你身上，安静地等一个指令。`;
}

export function buildCustomOpening(input: CustomOpeningInput): OpeningPreset {  const name = input.姓名.trim();
  if (!name) throw new Error('姓名必填');

  const time = input.时间.trim() || '2026-04-06 09:00';
  const place = input.地点.trim() || '你的住处';
  const holder = input.持有者称呼.trim() || '你';
  const memories: 记忆条目[] = [
    { 时间: time, 事件: '终端第一次亮起，连接建立。', 强度: 60, 标签: '重要', 钉选: false, 楼层: 0 },
    { 时间: time, 事件: `${name}第一次在${place}见到持有者。`, 强度: 70, 标签: '重要', 钉选: false, 楼层: 0 },
  ];

  const 档案 = 受控档案.parse({
    姓名: name,
    型号: input.型号.trim(),
    外观: input.外观.trim(),
    性格: input.性格.trim(),
    语言习惯: input.语言习惯.trim(),
    背景: input.背景.trim(),
    关系: input.关系.trim(),
    其他: input.其他.trim(),
  });

  const 状态 = 受控状态Schema.parse({
    性格: input.性格.trim(),
    处境认知: input.处境.trim() || `和${holder}在一起`,
    记忆日志: memories,
  });

  const data = Schema.parse({
    世界: {
      当前时间: time,
      当前地点: place,
      设定: input.世界设定.trim(),
      近期事务: {},
    },
    当前角色: 'c1',
    角色: {
      c1: { 类型: '受控', 优先级: 1, 档案, 状态 },
    },
    主角: {
      持有者: { 称呼: holder, 权限: '完整控制权限' },
      物品栏: {},
      bug报告: [],
    },
    系统日志: [{ 时间: time, 级别: 'INFO', 事件: '终端首次连接' }],
  });

  return {
    id: 'custom',
    name,
    subtitle: '自定义开场',
    characterId: 'c1',
    text: input.开场白.trim() || defaultCustomText(name),
    data,
  };
}

/** 从角色库记录生成可直接写入的开场 */
export function openingFromCharacter(record: {
  profile: {
    姓名: string;
    型号: string;
    外观: string;
    性格: string;
    语言习惯: string;
    背景: string;
    关系: string;
    其他: string;
  };
  world: { 持有者称呼: string; 地点: string; 时间: string; 处境: string; 设定: string };
  openings: { id: string; name: string; text: string }[];
}, openingIndex = 0): OpeningPreset {
  const opening = record.openings[openingIndex] ?? record.openings[0];
  if (!opening) throw new Error('角色没有开场');
  return buildCustomOpening({
    姓名: record.profile.姓名,
    型号: record.profile.型号,
    外观: record.profile.外观,
    性格: record.profile.性格,
    语言习惯: record.profile.语言习惯,
    背景: record.profile.背景,
    关系: record.profile.关系,
    其他: record.profile.其他,
    持有者称呼: record.world.持有者称呼,
    地点: record.world.地点,
    时间: record.world.时间,
    处境: record.world.处境,
    世界设定: record.world.设定,
    开场白: opening.text,
  });
}
