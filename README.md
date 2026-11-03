# 高岭之花 · 白峰千鹤

酒馆助手（SillyTavern）MVU 角色卡：一台仿生机器人的控制终端。

## 版本

| 版本 | 位置 | 状态 |
| --- | --- | --- |
| 稳定版 V1.6.3 | `src/高岭之花/` | 已发布，保持只读 |
| 自定义版 | `src/高岭之花-自定义版/` | 开发中：角色槽位、多角色、画廊 |

## 技术栈

Vue 3 · TypeScript · pinia · zod 4 · MVU · Tavern Helper

## 构建

```bash
pnpm install
pnpm build                         # 产出 dist/**
node _sync_inline.mjs              # 稳定版脚本内联回 index.yaml
node _sync_inline_自定义版.mjs       # 自定义版脚本内联
node tavern_sync.mjs bundle "高岭之花"
node tavern_sync.mjs bundle "高岭之花-自定义版"
```

构建产物：

- `src/高岭之花/高岭之花.png`
- `src/高岭之花-自定义版/高岭之花-自定义版.png`

## 目录

```text
src/高岭之花/                 稳定版：schema、世界书、脚本、界面、首条消息
src/高岭之花-自定义版/         开发版：角色系统、画廊等新增内容
tavern_sync.yaml             打包配置
webpack.config.ts            入口扫描与打包
util/                        模板工具函数
@types/                      酒馆助手接口类型
```

## 说明

角色卡仅发布于类脑，授权 Li2KN 搬运。其他平台出现的版本均非本人发布。

模板部分来自 `tavern_helper_template`（Aladdin License）。
