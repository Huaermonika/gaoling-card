// ===== 记忆日志 =====
// 存储为有序数组：每条记忆带完整时间与事件，按时间升序排列。
// 旧存档是「时间事件名 → 内容」的对象，解析时自动迁移；迁移在根节点做，以便用 世界.当前时间 补全缺失的日期。

/** 记忆标签：选填，用来区分这条经历在她心里的性质 */
export const 记忆标签 = ['日常', '重要', '约定', '亲密', '秘密', '其他'] as const;

export const 记忆条目 = z.object({
  // catch 兜底：单条记忆写坏（漏字段 / 填了数字）时只丢弃该条，不让整轮变量更新失败
  时间: z.string().catch('').describe('完整时间，格式 YYYY-MM-DD HH:MM；可以是早于剧情的前史'),
  事件: z.string().catch('').describe('该时间发生的关键事件，用千鹤的视角记录'),
  强度: z.coerce
    .number()
    .catch(50)
    .default(50)
    .describe('记忆强度：0~100，越高越清晰、越不容易淡忘，面板按它排序')
    .transform(v => _.clamp(v, 0, 100)),
  标签: z
    .enum(记忆标签)
    .catch('日常')
    .default('日常')
    .describe('记忆标签：日常 / 重要 / 约定 / 亲密 / 秘密 / 其他'),
  钉选: z.boolean().catch(false).default(false).describe('钉选：为 true 时每轮强制注入；只由终端操作，AI 不改'),
  楼层: z.coerce
    .number()
    .catch(0)
    .default(0)
    .describe('来源楼层 id；0 表示没有对应楼层（手动新增、旧存档或提示词模式写入）')
    .transform(v => (Number.isFinite(v) && v > 0 ? Math.round(v) : 0)),
});
export type 记忆条目 = z.infer<typeof 记忆条目>;

const TIME_PATTERN = /(\d{1,2}):(\d{2})/;
const DATE_PATTERN = /(\d{4})-(\d{1,2})-(\d{1,2})/;

const pad2 = (n: number) => String(n).padStart(2, '0');

/** 从 世界.当前时间 取日期，作为缺失日期的旧记忆的锚点 */
function anchorDate(anchor: string): string {
  const m = anchor.match(DATE_PATTERN);
  return m ? `${m[1]}-${pad2(Number(m[2]))}-${pad2(Number(m[3]))}` : '1970-01-01';
}

/** 把各种写法的时间统一成 YYYY-MM-DD HH:MM；完全无法识别时返回 null */
function normalizeTime(raw: string, fallbackDate: string): string | null {
  const time = raw.match(TIME_PATTERN);
  if (!time) return null;
  const date = raw.match(DATE_PATTERN);
  const ymd = date ? `${date[1]}-${pad2(Number(date[2]))}-${pad2(Number(date[3]))}` : fallbackDate;
  const hh = Number(time[1]);
  if (hh > 23) return null;
  return `${ymd} ${pad2(hh)}:${time[2]}`;
}

/** 旧格式的键去掉时间后剩下的文字，作为事件标题 */
function labelOfKey(key: string): string {
  return key.replace(DATE_PATTERN, ' ').replace(TIME_PATTERN, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * 把历史存档里的任意形态整理成有序数组。
 * - 对象形态：键是「08:35 抵达教室」，值是内容 → 时间取 08:35，标题并入事件
 * - 数组形态：已是 { 时间, 事件 }，只做时间规范化与排序
 * 结果按时间升序；相同时间保持原有先后。
 */
export function normalizeMemoryLog(input: unknown, anchor: string): 记忆条目[] {
  const fallbackDate = anchorDate(anchor);
  const rawEntries: 记忆条目[] = [];
  const tagOf = (value: unknown): 记忆标签 =>
    typeof value === 'string' && (记忆标签 as readonly string[]).includes(value) ? (value as 记忆标签) : '日常';
  const strengthOf = (value: unknown): number => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.round(Math.min(100, Math.max(0, n))) : 50;
  };
  const floorOf = (value: unknown): number => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  };

  if (Array.isArray(input)) {
    for (const item of input) {
      if (!item || typeof item !== 'object') continue;
      const raw = item as Record<string, unknown>;
      const time = String(raw.时间 ?? '');
      const event = String(raw.事件 ?? '');
      if (!event.trim()) continue;
      rawEntries.push({
        时间: time,
        事件: event.trim(),
        强度: strengthOf(raw.强度),
        标签: tagOf(raw.标签),
        钉选: raw.钉选 === true,
        楼层: floorOf(raw.楼层),
      });
    }
  } else if (input && typeof input === 'object') {
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      const event = String(value ?? '').trim();
      if (!event) continue;
      const label = labelOfKey(key);
      const merged = label && !event.includes(label) ? `${label}：${event}` : event;
      rawEntries.push({ 时间: key, 事件: merged, 强度: 50, 标签: '日常', 钉选: false, 楼层: 0 });
    }
  }

  // 时间完全无法识别时退回「当前世界时间」，比塞一个 00:00 更接近实际发生时刻
  const fallbackTime = normalizeTime(anchor, fallbackDate) ?? `${fallbackDate} 00:00`;

  const seen = new Set<string>();
  const normalized: 记忆条目[] = [];
  for (const entry of rawEntries) {
    const time = normalizeTime(entry.时间, fallbackDate) ?? fallbackTime;
    const key = `${time}|${entry.事件}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({ ...entry, 时间: time });
  }

  // 稳定排序：时间相同则保持写入顺序
  return normalized
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => (a.entry.时间 === b.entry.时间 ? a.index - b.index : a.entry.时间.localeCompare(b.entry.时间)))
    .map(({ entry }) => entry);
}

export const Schema = z.object({
  世界: z.object({
    当前时间: z.string(),
    当前地点: z.string(),
    近期事务: z.record(z.string().describe('事务名'), z.string().describe('事务描述')),
  }),

  千鹤: z
    .object({
      // ===== 操控轨 =====
      意识状态: z.enum(['运行中', '已停止', '已冻结']),
      电源状态: z.enum(['开机', '待机', '关机']),
      性格: z.string().describe('千鹤当前的性格设定'),
      cpu使用率: z.coerce.number().describe('CPU 使用率百分比').transform(v => _.clamp(v, 0, 100)),
      内存使用率: z.coerce.number().describe('内存使用率百分比').transform(v => _.clamp(v, 0, 100)),
      身体状态: z.record(
        z.string().describe('部位'),
        z.enum(['正常', '锁定', '损坏', '离线', '故障']).describe('躯体部位状态：锁定/损坏/离线(卸除)/故障'),
      ),
      身体锁定: z.record(z.string().describe('部位'), z.boolean().describe('是否锁定')),
      身体锁定前状态: z
        .record(
          z.string().describe('部位'),
          z.enum(['正常', '损坏', '离线', '故障']).describe('该部位被锁定前的物理状态'),
        )
        .default({})
        .describe('终端锁定时自动记录锁定前的物理状态，解锁时据此还原；AI 不主动修改'),
      指令覆盖: z.record(
        z.string().describe('指令编号'),
        z.object({
          内容: z.string(),
          优先级: z.coerce.number().describe('0 为最高优先级，数字越小越先执行').transform(v => _.clamp(v, 0, 9)),
        }),
      ),
      身份认知: z.string().describe('千鹤认为自己是谁：人类/机器人/恋人/宠物等，初始无自觉'),
      身体认知: z.string().describe('千鹤对自己身体的认知，可与实际着装、身体状态不一致'),
      处境认知: z.string().describe('千鹤认为自己身处何处、当前发生了什么'),
      常识认知: z.string().describe('千鹤对「什么算正常」的认知，常识修改的落点'),
      认知自洽: z.boolean().describe('自动修正开关：true 时系统自动维护当前认知自洽，抹平违和细节'),
      敏感度: z.coerce.number().describe('敏感度：无硬上限，最低 1，决定刺激转化为快感值的速度').transform(v => Math.max(1, v)),
      快感值: z.coerce.number().describe('快感值：0~120，100=高潮，100~120=过载临界区，120=过载').transform(v => _.clamp(v, 0, 120)),
      力量限制器: z.boolean().describe('出力限制：true=限制中，false=已解除').default(true),
      性单元: z.enum(['收纳', '弹出']).describe('性单元（生殖模块）状态').default('收纳'),
      维护模式: z.boolean().describe('维护模式：开启后关闭人格，用于调试与维护').default(false),
      维护舱门: z
        .object({
          电子脑: z.boolean().describe('电子脑维护舱门是否打开'),
          胸部: z.boolean().describe('胸部维护舱门是否打开'),
          腹部: z.boolean().describe('腹部维护舱门是否打开'),
        })
        .describe('电子脑/胸/腹维护舱门状态，打开后露出维护接口与内部结构')
        .default({ 电子脑: false, 胸部: false, 腹部: false }),
      电量: z.coerce.number().transform(v => _.clamp(v, 0, 100)),
      // ===== 液体储备 =====
      冷却液: z.coerce
        .number()
        .default(100)
        .describe('冷却液余量：0~100，常态固定 100 的装饰性读数，不随时间或剧情变化')
        .transform(v => _.clamp(v, 0, 100)),
      润滑液: z.coerce
        .number()
        .default(60)
        .describe('润滑液储量：0~100，体液储存罐内剩余的量（不是湿润程度），常规储量 60')
        .transform(v => _.clamp(v, 0, 100)),
      实际着装: z.record(z.enum(['上装', '下装', '内衣', '袜子', '鞋子', '饰品']), z.string().describe('服装描述')),
      // 兼容旧存档的对象形态；输出统一为有序数组（由根节点 transform 迁移）
      记忆日志: z.union([
        z.array(记忆条目),
        z.record(z.string().describe('时间'), z.string().catch('').describe('事件')),
      ]),
      // ===== 好感轨 =====
      好感度: z.coerce.number().transform(v => _.clamp(v, 0, 100)),
      // ===== 系统轨 =====
      系统状态: z.enum(['正常运行', '未响应', '休眠', '关闭']),
      崩溃原因: z.string().describe('未响应/休眠时的原因说明，正常运行时为空字符串'),
    })
    .transform(data => {
      const $好感阶段 =
        data.好感度 < 20
          ? '冷漠疏离'
          : data.好感度 < 40
            ? '勉强认可'
            : data.好感度 < 60
              ? '口是心非'
              : data.好感度 < 80
                ? '依赖萌芽'
                : '独占亲密';
      return { ...data, $好感阶段 };
    }),

  主角: z.object({
    测试员: z.object({
      编号: z.string(),
      权限: z.string(),
    }),
    物品栏: z
      .record(
        z.string().describe('物品名'),
        z.object({
          描述: z.string(),
          数量: z.coerce.number(),
        }),
      )
      .transform(data => _.pickBy(data, ({ 数量 }) => 数量 > 0)),
    bug报告: z.array(z.string().describe('bug报告内容')),
  }),

  系统日志: z.array(
    z.object({
      时间: z.string(),
      级别: z.enum(['INFO', 'WARN', 'ERROR', 'DEBUG']),
      事件: z.string(),
    }),
  ),
}).transform(root => ({
  ...root,
  千鹤: {
    ...root.千鹤,
    // 根节点才能同时拿到 世界.当前时间，用它给缺失日期的旧记忆补锚点
    记忆日志: normalizeMemoryLog(root.千鹤.记忆日志, root.世界.当前时间),
  },
}));
export type Schema = z.output<typeof Schema>;
