#!/usr/bin/env node
// 一键导入：重新打包角色卡并导入到本地酒馆 (SillyTavern)
// 用法：node import-to-tavern.mjs [配置名]
// 配置名默认 "高岭之花"，对应 tavern_sync.yaml 里的配置名称。
//
// 背景：本机的 tavern_sync 实时同步脚本与 SillyTavern 1.14.0 不兼容，
// 所以改用酒馆的 /api/characters/import 接口直接导入。
// 打包产物在 src/<配置名>/<配置名>.png（无头像时内容其实是 JSON，脚本会自动识别）。
//
// 每次导入前会先清掉同名角色卡、同名世界书、同名缩略图，避免生成「高岭之花1/2/3…」重复卡。

import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, unlinkSync, existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TAVERN_URL = process.env.TAVERN_URL ?? 'http://127.0.0.1:8000';
// 酒馆数据根目录（默认 SillyTavern 1.14.0 安装位置，可按需用环境变量覆盖）
const DATA_DIR = process.env.TAVERN_DATA_DIR
  ?? 'D:/deepseek/ST/SillyTavern-Launcher/SillyTavern/data/default-user';
const CONFIG_NAME = process.argv[2] ?? '高岭之花';

// 打包输出文件：<导出文件路径>.png，这里按约定路径推导
const BUNDLE_FILE = path.join(__dirname, 'src', CONFIG_NAME, `${CONFIG_NAME}.png`);

function log(msg) {
  console.log(`[导入] ${msg}`);
}

// 删除某目录下以「角色名」开头、以 .png/.json 结尾的文件（角色名1/2/3 一并清掉）
function deleteByNamePrefix(dir, name) {
  if (!existsSync(dir)) return 0;
  let removed = 0;
  for (const file of readdirSync(dir)) {
    const ok = file.startsWith(name)
      && (file.endsWith('.png') || file.endsWith('.json'));
    if (ok) {
      unlinkSync(path.join(dir, file));
      removed++;
    }
  }
  return removed;
}

// 把角色卡里嵌入的旧版 character_book（V2 规范，entries 数组）转成 SillyTavern 1.14 的新版世界书格式
// （entries 按 uid 建索引的对象）。逻辑与酒馆前端 public/scripts/world-info.js 的 convertCharacterBook 一致，
// 只是这里跑在 Node 端，用来直接落盘 worlds/<世界书名>.json，绕过前端「导入卡内世界书」的手动弹窗。
function convertCharacterBook(characterBook) {
  const result = { entries: {}, originalData: characterBook };
  characterBook.entries.forEach((entry, index) => {
    if (entry.id === undefined) entry.id = index;
    const ext = entry.extensions || {};
    result.entries[entry.id] = {
      uid: entry.id,
      key: entry.keys || [],
      keysecondary: entry.secondary_keys || [],
      comment: entry.comment || '',
      content: entry.content,
      constant: entry.constant || false,
      selective: entry.selective || false,
      order: entry.insertion_order ?? index,
      position: ext.position ?? (entry.position === 'before_char' ? 0 : 1),
      excludeRecursion: ext.exclude_recursion ?? false,
      preventRecursion: ext.prevent_recursion ?? false,
      delayUntilRecursion: ext.delay_until_recursion ?? false,
      disable: !entry.enabled,
      addMemo: !!entry.comment,
      displayIndex: ext.display_index ?? index,
      probability: ext.probability ?? 100,
      useProbability: ext.useProbability ?? true,
      depth: ext.depth ?? 4,
      selectiveLogic: ext.selectiveLogic ?? 0,
      outletName: ext.outlet_name ?? '',
      group: ext.group ?? '',
      groupOverride: ext.group_override ?? false,
      groupWeight: ext.group_weight ?? 100,
      scanDepth: ext.scan_depth ?? null,
      caseSensitive: ext.case_sensitive ?? null,
      matchWholeWords: ext.match_whole_words ?? null,
      useGroupScoring: ext.use_group_scoring ?? null,
      automationId: ext.automation_id ?? '',
      role: ext.role ?? 0,
      vectorized: ext.vectorized ?? false,
      sticky: ext.sticky ?? null,
      cooldown: ext.cooldown ?? null,
      delay: ext.delay ?? null,
      matchPersonaDescription: ext.match_persona_description ?? false,
      matchCharacterDescription: ext.match_character_description ?? false,
      matchCharacterPersonality: ext.match_character_personality ?? false,
      matchCharacterDepthPrompt: ext.match_character_depth_prompt ?? false,
      matchScenario: ext.match_scenario ?? false,
      matchCreatorNotes: ext.match_creator_notes ?? false,
      extensions: ext,
      triggers: ext.triggers || [],
      ignoreBudget: ext.ignore_budget ?? false,
    };
  });
  return result;
}

// 1. 重新打包
log(`打包角色卡 '${CONFIG_NAME}' ...`);
const bundle = spawnSync('node', ['tavern_sync.mjs', 'bundle', CONFIG_NAME], {
  cwd: __dirname,
  stdio: 'inherit',
  encoding: 'utf8',
});
if (bundle.status !== 0) {
  console.error(`[导入] 打包失败，退出码 ${bundle.status}`);
  process.exit(1);
}

// 2. 读取打包产物，识别是 PNG 还是 JSON
const buf = readFileSync(BUNDLE_FILE);
const isPng = buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
const fileType = isPng ? 'png' : 'json';
log(`读取 ${BUNDLE_FILE}（识别为 ${fileType}）`);

// 2'. 从打包产物里取 worldbook 名与嵌入的 character_book（仅 JSON 模式，头像为空时就是 JSON）。
//     这些数据用于直接落盘 worlds/<世界书名>.json，绕过前端「导入卡内世界书」的手动弹窗。
let worldBookName = null;
let worldBookData = null;
if (!isPng) {
  try {
    const card = JSON.parse(buf.toString('utf8'));
    worldBookName = card.data?.extensions?.world || null;
    if (worldBookName && card.data?.character_book && Array.isArray(card.data.character_book.entries)) {
      worldBookData = convertCharacterBook(card.data.character_book);
      log(`解析到世界书 '${worldBookName}'（${Object.keys(worldBookData.entries).length} 条）`);
    } else {
      log('未在角色卡内找到可用的 character_book，跳过世界书落盘');
    }
  } catch (e) {
    log(`解析角色卡 JSON 失败，跳过世界书落盘：${e.message}`);
  }
}

async function importCard() {
  // 2a. 清掉旧卡（角色卡 / 世界书 / 缩略图），避免重复
  const charsDir = path.join(DATA_DIR, 'characters');
  const worldsDir = path.join(DATA_DIR, 'worlds');
  const thumbDir = path.join(DATA_DIR, 'thumbnails', 'avatar');

  const removedChars = deleteByNamePrefix(charsDir, CONFIG_NAME);
  const removedWorlds = deleteByNamePrefix(worldsDir, CONFIG_NAME);
  const removedThumbs = deleteByNamePrefix(thumbDir, CONFIG_NAME);
  if (removedChars + removedWorlds + removedThumbs > 0) {
    log(`已清理旧文件：角色卡 ${removedChars} 个、世界书 ${removedWorlds} 个、缩略图 ${removedThumbs} 个`);
  }

  // 2a'. 直接落盘世界书到 worlds/<世界书名>.json（新版格式），这样 MVU 才能读到 initvar 并初始化 stat_data
  if (worldBookName && worldBookData) {
    const worldFile = path.join(worldsDir, `${worldBookName}.json`);
    writeFileSync(worldFile, JSON.stringify(worldBookData, null, 2), 'utf8');
    log(`已写入世界书 ${worldFile}`);
  }

  // 2b. 获取 CSRF token 和会话 cookie
  const tokenRes = await fetch(`${TAVERN_URL}/csrf-token`);
  const setCookie = tokenRes.headers.get('set-cookie') ?? '';
  // 只保留 cookie 的 name=value 部分（去掉 Path/HttpOnly 等属性）
  const sessionCookie = setCookie.split(',').map(c => c.trim().split(';')[0]).filter(Boolean).join('; ');
  const tokenJson = await tokenRes.json();
  const token = tokenJson.token;
  if (!token || token === 'disabled') {
    throw new Error('无法获取 CSRF token');
  }

  // 2c. 构造 multipart（文件字段名必须是 avatar，不是 file）
  const form = new FormData();
  form.append(
    'avatar',
    new Blob([buf], { type: isPng ? 'image/png' : 'application/json' }),
    `${CONFIG_NAME}.${isPng ? 'png' : 'json'}`,
  );
  form.append('file_type', fileType);

  // 2d. 导入
  const res = await fetch(`${TAVERN_URL}/api/characters/import`, {
    method: 'POST',
    headers: {
      'Cookie': sessionCookie,
      'X-CSRF-Token': token,
    },
    body: form,
  });

  const text = await res.text();
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    result = text;
  }

  if (res.ok) {
    log(`导入成功：${JSON.stringify(result)}`);
    log('若酒馆角色列表没刷新，按 F5 刷新页面即可。');
  } else {
    throw new Error(`导入失败 HTTP ${res.status}：${text}`);
  }
}

importCard().catch(err => {
  console.error(`[导入] ${err.message}`);
  process.exit(1);
});
