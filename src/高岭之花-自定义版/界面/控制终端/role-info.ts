import type { CardData } from '../../schema';

/** 当前受控角色；没有则 null */
export function currentRole(data: CardData) {
  const role = data.角色?.[data.当前角色];
  return role && role.类型 === '受控' ? role : null;
}

/** 当前角色显示名：档案姓名为空时回退「未命名」 */
export function currentName(data: CardData): string {
  const name = currentRole(data)?.档案?.姓名?.trim();
  return name || '未命名';
}

/** 当前角色型号：为空时回退「控制终端」 */
export function currentModel(data: CardData): string {
  const model = currentRole(data)?.档案?.型号?.trim();
  return model || '控制终端';
}

/** 头像缺省字：取姓名首字 */
export function currentInitial(data: CardData): string {
  const chars = Array.from(currentName(data));
  return chars[0] ?? '机';
}

/** 按优先级排序的受控角色 [id, role] */
export function controllableRoles(data: CardData) {
  return Object.entries(data.角色 ?? {})
    .filter(([, role]) => role.类型 === '受控')
    .sort((a, b) => (a[1] as { 优先级: number }).优先级 - (b[1] as { 优先级: number }).优先级);
}

/** 切换终端当前角色；背景角色不可选 */
export function switchRole(data: CardData, id: string): boolean {
  const role = data.角色?.[id];
  if (!role || role.类型 !== '受控') return false;
  data.当前角色 = id;
  return true;
}
