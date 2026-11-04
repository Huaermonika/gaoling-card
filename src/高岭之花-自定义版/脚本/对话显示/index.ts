import { waitUntil } from 'async-wait-until';
import { createPinia } from 'pinia';
import { mountStreamingMessages } from '@util/streaming';
import App from './App.vue';
import { initStateSyncCard } from './state-sync-card';
import { initFloorWindow, inWindow } from './floor-window';
import { initHideUI } from './hide-ui';
import { initSubmodel } from './submodel';
import { initPromptInjection } from './prompt-inject';
import { initGallery } from '../../画廊/runtime';
import { preprocessForDisplay, stripRenderedCodeBlocks } from './strip-framework';

$(async () => {
  await waitGlobalInitialized('Mvu');
  await waitUntil(() => _.has(getVariables({ type: 'message' }), 'stat_data'));

  // 流式楼层界面用 .hidden! 类隐藏原生楼层文本，但酒馆主页面没有 tailwind 的该规则，手动补一条
  if (!$('#ch-hidden-rule').length) {
    $('<style id="ch-hidden-rule">.hidden\\!{display:none!important}</style>').appendTo('head');
  }

  const pinia = createPinia();
  const { unmount, prune } = mountStreamingMessages(() => createApp(App).use(pinia), {
    host: 'iframe',
    preprocess: preprocessForDisplay,
    // 代码块整块从气泡里移除：围栏原文留在消息里，交给酒馆助手渲染
    postprocess: html => stripRenderedCodeBlocks(html),
    // 只渲染最近两个千鹤楼层，更老的楼层不挂载界面
    filter: message_id => inWindow(message_id),
    // 流式阶段不套预设正则：每个 token 都要把整段正文重新跑一遍宏替换、正则与 HTML 转换，
    // 生成期间的开销随正文长度放大。生成结束时的完整渲染仍会应用预设正则。
    formatStreaming: false,
  });
  $(window).on('pagehide', () => unmount());

  // 楼层窗口：旧楼层界面整楼隐藏，同时标记为不发给 AI
  initFloorWindow({ afterApply: prune });

  // 终端状态同步卡片：把用户楼层里一行「⚙ 终端状态已同步」美化为可折叠的状态变更卡片
  initStateSyncCard();

  // 隐藏酒馆原生界面元素：注入规则，开关在 App.vue 设置页（body.ch-hide-ui）
  initHideUI();

  // 副模型：变量更新 + 记忆整理（配置在 App.vue 设置页）
  initSubmodel();

  // 变量快照与记忆提示：不写进聊天记录，只在生成时注入
  initPromptInjection();

  // 画廊：同步官方图，并在生成结束后评估立绘触发
  initGallery();
});

// 滚动条交给 App.vue 的主题细条样式处理，不再全局强制隐藏。
