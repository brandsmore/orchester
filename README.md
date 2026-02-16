# orchester

> TUI profile manager for AI coding tools — switch orchestration layers in one keystroke

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue" alt="version" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-green" alt="node" />
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="license" />
</p>

## What is orchester?

AI coding tools like Claude Code, Codex CLI, and OpenCode support orchestration layers — agents, skills, hooks, and plugins that extend their capabilities. Popular orchestration packages include **omc**, **ecc**, **bkit**, and many community projects.

The problem: **you can only use one orchestration layer at a time**, and switching between them means manually moving files around `~/.claude/` or `~/.config/opencode/`.

**orchester** solves this by managing orchestration profiles in isolation and switching between them with a single keystroke via a beautiful terminal UI.

## Features

- **One-keystroke switching** — Select a profile and press Enter. Done.
- **Vanilla snapshot** — Automatically backs up your existing config on first run. Restore anytime with "none".
- **Safe symlinks** — Uses symlinks instead of file copies. Your originals stay untouched.
- **Auto-rollback** — If anything fails during a switch, automatically restores your previous config.
- **Built-in registry** — Install popular orchestration packages (omc, ecc, bkit, etc.) directly from the TUI.
- **Custom URL install** — Add any Git repository as a custom profile.
- **Runtime detection** — Shows which AI tools are installed on your system (Claude Code, Codex, OpenCode, Gemini, etc.).
- **Usage dashboard** — View token usage across all your AI coding tools in one place.
- **Diff preview** — See exactly what will change before switching profiles.
- **i18n** — English, Korean, Japanese, Chinese interface.

## Quick Start

```bash
# Clone and install
git clone https://github.com/anthropics/orchester.git
cd orchester
npm install

# Run
npm run dev
```

On first launch, orchester will:
1. Detect your installed AI coding tools
2. Scan for existing orchestration configs
3. Create a vanilla snapshot (backup of your current setup)

## Usage

### Main Screen

```
╭─────────────────────────────────────────────╮
│ orchester v0.1  Profile Manager             │
├─────────────────────────────────────────────┤
│ Runtimes  claude ✓  codex ✓  opencode ✗    │
├─────────────────────────────────────────────┤
│ ● omc — 5 modes, 32 agents [orchestration] │
│ ○ ecc — comprehensive starter kit           │
│ ○ bkit — PDCA workflow                      │
│ ○ none (vanilla)                            │
├─────────────────────────────────────────────┤
│ Enter select  i install  u usage  h help    │
╰─────────────────────────────────────────────╯
```

### Keybindings

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate profiles |
| `Enter` | Select / activate profile |
| `i` | Open install registry |
| `u` | View usage dashboard |
| `h` | Help overlay |
| `l` | Change language |
| `q` | Quit |

### Install View

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate registry |
| `Enter` | Install selected profile |
| `a` | Add profile from Git URL |
| `d` | Delete profile |
| `Esc` | Back |

## How It Works

orchester uses a **2-phase model**:

### Phase 1: Install
Download orchestration packages to `~/.orchester/profiles/`. This stores the files locally but does **not** activate them.

### Phase 2: Activate
Create symlinks from the profile's files to the target tool's config directory (e.g., `~/.claude/agents/`). Only one profile can be active at a time.

```
~/.orchester/
├── state.json              # Active profile tracking
├── vanilla/                # Backup of original config
├── custom-registry.json    # User-added profiles
└── profiles/
    ├── omc/
    │   ├── manifest.yaml   # Profile metadata + link definitions
    │   └── files/          # agents/, skills/, hooks/
    ├── ecc/
    └── bkit/
```

### Switch Flow (4 phases)

```
Validate → Deactivate old → Activate new → Verify
                ↓ (on failure)
           Auto-restore vanilla
```

## Built-in Registry

| Name | Description | Tool |
|------|-------------|------|
| omc | 5 modes, 32 agents, 31+ skills, HUD | Claude Code |
| ecc | Comprehensive starter kit | Claude Code |
| bkit | PDCA-based AI native workflow | Claude Code |
| wshobson-agents | 73 plugins, 112 agents, marketplace | Claude Code |
| oh-my-opencode | Sisyphus orchestrator, 25+ hooks | OpenCode |
| claude-orchestra | 40+ agents org chart structure | Claude Code |

You can also add any Git repository as a custom profile with the `a` key.

## Supported Runtimes

| Runtime | Detection | Usage Data |
|---------|-----------|------------|
| Claude Code | `~/.claude/` | Token usage from stats-cache.json |
| Codex CLI | `~/.codex/` | Session-level token tracking |
| OpenCode | `~/.config/opencode/` | Session count |
| Gemini CLI | `~/.gemini/` | Detection only |
| Cursor | `~/.cursor/` | Detection only |
| Antigravity | `~/.antigravity/` | Detection only |

## Tech Stack

- **[Ink](https://github.com/vadimdemedes/ink)** — React for CLIs
- **[@inkjs/ui](https://github.com/vadimdemedes/ink-ui)** — UI components (Select, Spinner, Alert, Badge)
- **TypeScript** — Full type safety
- **meow** — CLI argument parsing

## Project Structure

```
source/
├── cli.tsx              # Entry point
├── app.tsx              # Root component (view routing)
├── types.ts             # Type definitions
├── core/
│   ├── manifest.ts      # manifest.yaml parser
│   ├── state.ts         # state.json management
│   ├── vanilla.ts       # Vanilla snapshot backup/restore
│   ├── linker.ts        # Symlink management
│   ├── switcher.ts      # 4-phase profile switching
│   ├── detector.ts      # Runtime & tool detection
│   ├── registry.ts      # Profile registry & installer
│   ├── usage.ts         # Token usage aggregator
│   └── i18n.ts          # Internationalization (en/ko/ja/zh)
├── hooks/
│   └── useOrch.ts       # Main state hook
└── views/
    ├── InitView.tsx      # First-run setup
    ├── ProfileList.tsx   # Profile selection
    ├── DiffPreview.tsx   # Change preview before switch
    ├── ResultView.tsx    # Switch result
    ├── InstallView.tsx   # Registry browser & installer
    └── UsageView.tsx     # Token usage dashboard
```

## Roadmap

- **v0.2** — MCP namespace isolation, per-project profiles
- **v0.3** — Plugin system, profile composition (mix & match)
- **v1.0** — Full multi-runtime support, profile marketplace

## License

MIT

---

[한국어](./README.ko.md)
