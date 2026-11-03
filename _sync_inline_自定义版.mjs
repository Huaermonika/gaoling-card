import fs from 'node:fs';

const CARD = '高岭之花-自定义版';
const idx = `src/${CARD}/index.yaml`;
const lines = fs.readFileSync(idx, 'utf8').split('\n');
const INDENT = ' '.repeat(10);

function sync(name) {
  const distFile = `dist/${CARD}/脚本/${name}/index.js`;
  const dist = fs.readFileSync(distFile, 'utf8').replace(/\n$/, '');
  const indented = dist.split('\n').map(l => INDENT + l).join('\n');

  const nameIdx = lines.findIndex(l => l.trim() === `- 名称: ${name}`);
  if (nameIdx < 0) throw new Error(`name not found: ${name}`);

  let ci = -1;
  for (let i = nameIdx + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t === '内容: |-') { ci = i; break; }
    if (t.startsWith('- 名称:')) break;
  }
  if (ci < 0) throw new Error(`content block not found: ${name}`);

  let ei = ci + 1;
  while (ei < lines.length && lines[ei].startsWith(INDENT)) ei++;

  const oldCount = ei - ci - 1;
  const newCount = dist.split('\n').length;
  lines.splice(ci + 1, oldCount, indented);
  console.log(`${name}: 替换 [第 ${ci + 2} 行起 ${oldCount} 行] -> ${newCount} 行`);
}

sync('变量结构');
sync('对话显示');
fs.writeFileSync(idx, lines.join('\n'));
console.log(`已写回 ${idx}`);
