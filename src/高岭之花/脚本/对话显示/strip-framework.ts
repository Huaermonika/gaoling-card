/**
 * 显示前的预处理。
 *
 * 酒馆官方的 formatAsDisplayedMessage 会依次完成宏替换、预设与角色卡的显示正则、转 HTML。
 * 本文件只清掉本应用自己产生、不属于剧情正文的结构化块，其余内容原样交给官方格式化。
 *
 * 此前这里还手动执行过一遍预设显示正则、并删除代码围栏。两者都发生在官方格式化之前：
 * 正则会被官方再执行一次，围栏则会在预设正则匹配到之前就被删掉。
 */
export function stripFrameworkBlocks(text: string): string {
  return text
    .replace(/<StatusPlaceHolderImpl\s*\/>/gi, '')
    .replace(/<tableEdit>[\s\S]*?<\/tableEdit>/gi, '');
}

/** 显示与记忆整理共用的入口：只剥离本应用块，预设正则与代码围栏交给官方格式化 */
export function preprocessForDisplay(
  raw: string,
  _message_id?: number,
  _source?: 'ai_output' | 'user_input',
): string {
  return stripFrameworkBlocks(raw);
}

/**
 * 气泡里不显示代码块。
 *
 * 围栏在官方格式化里已经转成 `<pre><code>`，这里按元素整块移除，
 * 不再按围栏原文匹配：CRLF、未闭合、围栏长度不一致都不会把正文一起吞掉。
 * 原始消息不变，酒馆助手仍能从消息里拿到围栏原文。
 *
 * 整条消息只有一个代码块时保留原样，否则这一楼会变成空白。
 */
export function stripRenderedCodeBlocks(html: string): string {
  const stripped = html.replace(/<pre\b[^>]*>\s*<code\b[\s\S]*?<\/code>\s*<\/pre>/gi, '');
  return stripped.trim() ? stripped : html;
}
