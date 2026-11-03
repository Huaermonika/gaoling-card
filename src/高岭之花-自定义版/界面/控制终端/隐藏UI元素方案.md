# 隐藏酒馆界面元素 · 方案与操作指南

本清单交接给负责前端编写的 AI。目标：在「高岭之花」角色卡的酒馆助手脚本里，加入隐藏酒馆界面元素（头像、输入栏、顶部栏等）的能力，支持开关切换。

## 一、原理（先读懂，别乱改）

「高岭之花」的脚本通过酒馆助手跑在 **iframe** 里，脚本内的 `$` 就是 `window.parent.$`，**直接操作酒馆主页面 DOM**。项目里已有两处注入 CSS 到酒馆 `<head>` 的先例，可照抄模式：

- `src/高岭之花/脚本/对话显示/index.ts` 第 12–14 行：注入过一条 `.hidden\!{display:none!important}`
- `src/高岭之花/脚本/对话显示/state-sync-card.ts` 的 `injectStyle()`：注入过 `#ch-state-sync-style`

所以「隐藏元素」= 往酒馆 `<head>` 再塞一段 CSS，用 `display:none!important` 覆盖目标元素。

## 二、唯一要改的源文件

| 文件 | 作用 |
|------|------|
| `src/高岭之花/脚本/对话显示/index.ts` | 脚本入口，在这里加隐藏逻辑 |
| （可选）`src/高岭之花/脚本/对话显示/App.vue` | 若想用项目自己的 Vue 界面做开关，才动它 |

**不要动** `src/高岭之花/index.yaml` 里其它条目、不要动正则、不要动 `state-sync-card.ts` 的既有逻辑。

## 三、实现方式

### 方案 A — 永久隐藏（最简单，10 行）

在 `index.ts` 的 `$(async () => {...})` 里，紧跟第 12–14 行之后加一段：

```ts
// 隐藏酒馆界面元素
if (!$('#ch-hide-ui-style').length) {
  $('<style id="ch-hide-ui-style">#send_form{display:none!important}.avatar{display:none!important}</style>').appendTo('head');
}
```

### 方案 B — 可切换开关（推荐，通用性最好）

用 `body` 上的 class 控制，隐藏规则全挂在 `body.ch-hide-ui` 下，再注入一个固定在右下角的切换按钮：

```ts
function injectHideUI() {
  const STYLE_ID = 'ch-hide-ui-style';
  const BTN_ID = 'ch-hide-ui-toggle';
  if ($(`#${STYLE_ID}`).length) return;

  // 所有隐藏项都挂在这个 class 下；想多藏一个就加一行
  const css = `
body.ch-hide-ui #send_form{display:none!important}
body.ch-hide-ui .avatar{display:none!important}
body.ch-hide-ui #top-bar{display:none!important}
`;
  $('<style>').attr('id', STYLE_ID).text(css).appendTo('head');

  const $btn = $(
    `<button id="${BTN_ID}" type="button" style="position:fixed;right:16px;bottom:120px;z-index:99999;padding:6px 12px;border-radius:8px;border:1px solid rgba(126,167,178,.4);background:rgba(13,20,27,.8);color:#d5e9f0;cursor:pointer;font-size:12px">隐藏UI</button>`,
  );
  const refresh = () => {
    const on = $('body').hasClass('ch-hide-ui');
    $btn.text(on ? '显示UI' : '隐藏UI');
  };
  $btn.on('click', () => {
    $('body').toggleClass('ch-hide-ui');
    refresh();
  });
  $('body').append($btn);
  refresh();
}

// 在 index.ts 的 $(async () => {...}) 内调用一次
injectHideUI();
```

## 四、要隐藏的元素选择器参考

SillyTavern 桌面版常见 DOM，**以实际 DevTools 选中元素为准**（不同版本可能微调）：

| 元素 | 选择器 | 备注 |
|------|--------|------|
| 输入栏整体 | `#send_form` | 底部整条发送区 |
| 输入框 | `#send_textarea` | 只藏输入框 |
| 消息头像 | `.avatar` | 聊天区每条消息的头像 |
| 顶部工具栏 | `#top-bar` | 顶部栏 |
| 聊天区 | `#chat` | 整个聊天容器 |
| 左侧导航 | `#left-nav` | 左侧面板 |
| 右侧导航 | `#right-nav` | 右侧面板 |

不确定某个元素时，在酒馆里按 F12 → 选中该元素 → 看 class/id，把选择器补进上面的 CSS 列表即可。

## 五、⚠️ 构建 + 同步 + 打包（最容易踩的坑，务必照做）

改完 `index.ts` 后，**不能只跑 `pnpm build`**。这套工具的打包链路是：

1. **构建**：项目根目录跑 `pnpm build`，产出 `dist/高岭之花/脚本/对话显示/index.js`
2. **同步回 index.yaml（关键！）**：`bundle` 打包时读的是 `src/高岭之花/index.yaml` 里「酒馆助手 → 脚本库 → 名称: 对话显示 → 内容: |-」的**内联字段**，**不读 dist/**。所以必须把 `dist/高岭之花/脚本/对话显示/index.js` 的内容写回 `index.yaml` 那个 `内容:` 字段：
   - 用脚本定位 `      - 名称: 对话显示` 之后第一个 `内容: |-`
   - 用 dist 里 `index.js` 的完整内容替换 `内容: |-` 之后的块
   - **每行加 10 空格缩进**，块尾保留 `//# sourceMappingURL=index.js.map`
3. **打包导出**：`node tavern_sync.mjs bundle 高岭之花`
4. **验证**：`grep -ac "ch-hide-ui" src/高岭之花/高岭之花.png` 应 ≥1（用字符串字面量校验，别用函数名，production 构建会混淆标识符）
5. **同步 .json**：`cp src/高岭之花/高岭之花.png src/高岭之花/高岭之花.json`（此卡无头像，bundle 产物是 JSON 明文，.json 与 .png 内容一致，需手动同步）

> 只有改「对话显示」脚本才需要走上面流程；若只改 CSS 字符串，build + 同步 + bundle 一样不能省。

## 六、验证清单

- [ ] 酒馆加载「高岭之花」卡后，右下角出现「隐藏UI」按钮
- [ ] 点击后输入栏、头像消失；再点恢复
- [ ] 换一张卡（不带此脚本）后，按钮和隐藏效果消失（确认是卡专属、非全局）
