# agent orchester

> AI编程工具的TUI配置文件管理器 — 一键切换编排层

<p align="center">
  <img src="https://img.shields.io/badge/version-0.2.0-blue" alt="version" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-green" alt="node" />
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="license" />
</p>

## 什么是 agent orchester？

Claude Code、Codex CLI、OpenCode 等 AI 编程工具支持编排层——agents、skills、hooks 和 plugins 来扩展其功能。流行的编排包包括 **omc**、**ecc**、**bkit**、**superpowers** 等。

问题在于：**同一时间只能使用一个编排层**，切换意味着需要手动移动 `~/.claude/` 或 `~/.config/opencode/` 中的文件。

**agent orchester** 通过隔离管理编排配置文件，并通过精美的终端 UI 实现一键切换来解决这个问题。

## 功能特性

- **一键切换** — 选择配置文件并按 Enter，即可完成
- **原始快照** — 首次运行时自动备份现有配置，选择"none"随时恢复
- **安全的 symlink** — 使用符号链接而非文件复制，原始文件不受影响
- **插件支持** — 识别插件类型安装（如 `/plugin install`），在 TUI 中显示手动命令。混合配置文件结合符号链接和插件
- **自动回滚** — 切换过程中出现错误时，自动恢复之前的配置
- **内置注册表** — 从 TUI 直接安装热门编排包（omc、ecc、bkit、superpowers 等）
- **自定义 URL 安装** — 将任意 Git 仓库添加为自定义配置文件
- **运行时检测** — 显示系统中已安装的 AI 工具（Claude Code、Codex、OpenCode、Gemini 等）
- **使用量仪表板** — 在一个界面查看所有 AI 编程工具的 Token 使用量
- **差异预览** — 切换前查看具体变更内容
- **多语言** — 支持英语、韩语、日语、中文界面

## 快速开始

```bash
# 克隆并安装
git clone https://github.com/brandsmore/orchester.git
cd orchester
npm install

# 运行
npm run dev
```

首次启动时，agent orchester 将：
1. 检测已安装的 AI 编程工具
2. 扫描现有的编排配置
3. 创建原始快照（当前配置的备份）

## 使用方法

### 主界面

```
╭──────────────────────────────────────────────────╮
│ agent orchester v0.2  配置文件管理器              │
├──────────────────────────────────────────────────┤
│ 运行时  claude ✓  codex ✓  opencode ✗           │
├──────────────────────────────────────────────────┤
│ ● omc — 28个代理、37个技能 [orchestration]       │
│ ○ ecc — 综合入门套件                             │
│ ○ superpowers 🔀 — TDD工作流、多工具             │
│ ○ none（原始状态）                                │
├──────────────────────────────────────────────────┤
│ Enter 选择  i 安装  u 使用量  h 帮助              │
╰──────────────────────────────────────────────────╯
```

### 快捷键

| 按键 | 操作 |
|------|------|
| `↑` `↓` | 浏览配置文件 |
| `Enter` | 选择/激活配置文件 |
| `i` | 打开安装注册表 |
| `u` | 查看使用量仪表板 |
| `h` | 帮助面板 |
| `l` | 切换语言 |
| `q` | 退出 |

### 安装界面

| 按键 | 操作 |
|------|------|
| `↑` `↓` | 浏览注册表 |
| `Enter` | 安装选中的配置文件 |
| `a` | 从 Git URL 添加配置文件 |
| `d` | 删除配置文件 |
| `Esc` | 返回 |

## 工作原理

agent orchester 使用**两阶段模型**：

### 阶段一：安装
将编排包下载到 `~/.orchester/profiles/`。仅在本地存储文件，**不会**激活。

### 阶段二：激活
从配置文件创建符号链接到目标工具的配置目录（如 `~/.claude/agents/`）。同一时间只能激活一个配置文件。对于插件类型的链接，agent orchester 会显示在 AI 编程工具中执行的手动命令。

```
~/.orchester/
├── state.json              # 活动配置文件追踪
├── vanilla/                # 原始配置备份
├── custom-registry.json    # 用户添加的配置文件
└── profiles/
    ├── omc/
    │   ├── manifest.yaml   # 配置文件元数据 + 链接定义
    │   └── files/          # agents/, skills/, hooks/
    ├── ecc/
    └── superpowers/
```

### 切换流程（4阶段）

```
验证 → 停用旧配置 → 激活新配置 → 验证
          ↓（失败时）
       自动恢复原始状态
```

### 安装类型

| 类型 | 图标 | 描述 |
|------|------|------|
| `symlink` | （默认） | 标准的符号链接安装 |
| `plugin` | 🔌 | 显示手动执行的插件命令 |
| `hybrid` | 🔀 | 符号链接和插件命令的组合 |

## 内置注册表

| 名称 | Stars | 描述 | 工具 |
|------|-------|------|------|
| omc | 6.4K | 28个代理、37个技能、Team模式 | Claude Code |
| ecc | 44.7K | 13个代理、30+技能、黑客松获奖作品 | Claude Code |
| bkit | 91 | 基于PDCA的AI原生工作流 | Claude Code |
| wshobson-agents | 28.7K | 73个插件、112个代理、146个技能 | Claude Code |
| oh-my-opencode | 31.6K | Sisyphus编排器、多代理 | OpenCode |
| claude-orchestra | 32 | 47个代理、10个团队组织架构 | Claude Code |
| superpowers | 53.5K | Agentic技能框架、TDD工作流 | Claude Code |

按 `a` 键可将任意 Git 仓库添加为自定义配置文件。

## 支持的运行时

| 运行时 | 检测方式 | 使用量数据 |
|--------|---------|-----------|
| Claude Code | `~/.claude/` | 从 stats-cache.json 获取 Token 使用量 |
| Codex CLI | `~/.codex/` | 会话级别的 Token 追踪 |
| OpenCode | `~/.config/opencode/` | 会话数 |
| Gemini CLI | `~/.gemini/` | 仅检测 |
| Cursor | `~/.cursor/` | 仅检测 |
| Antigravity | `~/.antigravity/` | 仅检测 |

## 技术栈

- **[Ink](https://github.com/vadimdemedes/ink)** — CLI 版 React
- **[@inkjs/ui](https://github.com/vadimdemedes/ink-ui)** — UI 组件（Spinner、Alert、Badge）
- **TypeScript** — 完整的类型安全
- **meow** — CLI 参数解析

## 路线图

- **v0.3** — MCP命名空间隔离、项目级配置文件、配置文件组合（混搭）
- **v1.0** — 完整多运行时支持、配置文件市场

## 许可证

MIT

## 制作

**BrandsMore** — dev@brandsmore.co.kr

---

[English](./README.md) · [한국어](./README.ko.md) · [日本語](./README.ja.md)
