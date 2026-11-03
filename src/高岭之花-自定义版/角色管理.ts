import { 受控角色Schema, type CardData, type 初始认知, type 受控档案, type 受控角色 } from './schema';
import { 默认状态 } from './角色预设';

/** 按优先级（1 最高）排序的受控角色列表 */
export function 受控角色列表(data: CardData): Array<[string, 受控角色]> {
  const list: Array<[string, 受控角色]> = [];
  for (const [id, role] of Object.entries(data.角色)) {
    if (role.类型 === '受控') list.push([id, role as 受控角色]);
  }
  return list.sort((a, b) => a[1].优先级 - b[1].优先级);
}

/** 当前受控角色；没有则返回 null */
export function 当前角色条目(data: CardData): [string, 受控角色] | null {
  const role = data.角色[data.当前角色];
  if (role && role.类型 === '受控') return [data.当前角色, role];
  return 受控角色列表(data)[0] ?? null;
}

/** 当前受控角色的状态对象；没有则返回 null */
export function 当前状态(data: CardData) {
  return 当前角色条目(data)?.[1].状态 ?? null;
}

export function 角色显示名(role: { 档案: { 姓名: string } }, id: string): string {
  const name = role.档案.姓名.trim();
  return name || id;
}

/** 切换终端当前角色；背景角色不可切换 */
export function 切换角色(data: CardData, id: string): boolean {
  const role = data.角色[id];
  if (!role || role.类型 !== '受控') return false;
  data.当前角色 = id;
  return true;
}

/** 生成下一个空闲的受控角色 id：c1、c2…… */
export function 下一个角色ID(data: CardData): string {
  let index = 1;
  while (data.角色[`c${index}`]) index++;
  return `c${index}`;
}

/** 新角色的默认优先级：已有角色的最大优先级 + 1，上限 3 */
function 下一个优先级(data: CardData): number {
  const used = 受控角色列表(data).map(([, role]) => role.优先级);
  return Math.min(3, (used.length ? Math.max(...used) : 0) + 1);
}

export interface 新建角色选项 {
  id?: string;
  优先级?: number;
  初始认知?: Partial<初始认知>;
}

/**
 * 新建受控角色：档案写入新建的默认状态（性格与初始认知作为开局种子），
 * 若当前没有可控制的角色，自动切到新角色。
 */
export function 新建受控角色(data: CardData, 档案: Partial<受控档案> = {}, options: 新建角色选项 = {}): string {
  const id = options.id ?? 下一个角色ID(data);
  const 状态 = 默认状态();

  if (档案.性格) 状态.性格 = 档案.性格;
  const 认知 = options.初始认知 ?? {};
  if (认知.身份认知) 状态.身份认知 = 认知.身份认知;
  if (认知.身体认知) 状态.身体认知 = 认知.身体认知;
  if (认知.处境认知) 状态.处境认知 = 认知.处境认知;
  if (认知.常识认知) 状态.常识认知 = 认知.常识认知;

  const role = 受控角色Schema.parse({
    类型: '受控',
    优先级: options.优先级 ?? 下一个优先级(data),
    档案,
    状态,
  });

  data.角色[id] = role;
  if (!当前角色条目(data)) data.当前角色 = id;
  return id;
}

/** 新建背景角色：只存基础档案，不参与终端控制 */
export function 新建背景角色(data: CardData, 档案: { 姓名: string; 外观?: string; 关系?: string; 备注?: string }, id?: string): string {
  const key = id ?? 下一个角色ID(data);
  data.角色[key] = {
    类型: '背景',
    档案: {
      姓名: 档案.姓名,
      外观: 档案.外观 ?? '',
      关系: 档案.关系 ?? '',
      备注: 档案.备注 ?? '',
    },
  };
  return key;
}

/** 删除角色；删掉当前角色时回退到优先级最高的受控角色 */
export function 删除角色(data: CardData, id: string): boolean {
  if (!data.角色[id]) return false;
  delete data.角色[id];

  if (data.当前角色 === id) {
    const next = 受控角色列表(data)[0]?.[0];
    data.当前角色 = next ?? '';
  }
  return true;
}

/** 把受控角色的优先级压回 1~3 且不重复（按现有顺序重排） */
export function 规范化优先级(data: CardData): void {
  const list = 受控角色列表(data);
  list.forEach(([, role], index) => {
    role.优先级 = Math.min(3, index + 1);
  });
}
