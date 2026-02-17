# agent orchester

> TUI profile manager for AI coding tools — switch orchestration layers in one keystroke

<p align="center">
  <img src="https://img.shields.io/badge/version-0.2.0-blue" alt="version" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-green" alt="node" />
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="license" />
</p>

## What is agent orchester?

AI coding tools like Claude Code, Codex CLI, and OpenCode support orchestration layers — agents, skills, hooks, and plugins that extend their capabilities. Popular orchestration packages include **omc**, **ecc**, **bkit**, **superpowers**, and many community projects.

The problem: **you can only use one orchestration layer at a time**, and switching between them means manually moving files around `~/.claude/` or `~/.config/opencode/`.

**agent orchester** solves this by managing orchestration profiles in isolation and switching between them with a single keystroke via a beautiful terminal UI.

## Features

- **One-keystroke switching** — Select a profile and press Enter. Done.
- **Vanilla snapshot** — Automatically backs up your existing config on first run. Restore anytime with "none".
- **Safe symlinks** — Uses symlinks instead of file copies. Your originals stay untouched.
- **Plugin support** — Recognizes plugin-type installs (e.g., `/plugin install`) and shows manual commands in the TUI. Hybrid profiles combine symlinks and plugins.
- **Auto-rollback** — If anything fails during a switch, automatically restores your previous config.
- **Built-in registry** — Install popular orchestration packages (omc, ecc, bkit, superpowers, etc.) directly from the TUI.
- **Custom URL install** — Add any Git repository as a custom profile.
- **Runtime detection** — Shows which AI tools are installed on your system (Claude Code, Codex, OpenCode, Gemini, etc.).
- **Usage dashboard** — View token usage across all your AI coding tools in one place.
- **Diff preview** — See exactly what will change before switching profiles.
- **i18n** — English, Korean, Japanese, Chinese interface.

## Quick Start

```bash
# Clone and install
git clone https://github.com/brandsmore/orchester.git
cd orchester
npm install

# Run
npm run dev
```

On first launch, agent orchester will:
1. Detect your installed AI coding tools
2. Scan for existing orchestration configs
3. Create a vanilla snapshot (backup of your current setup)

## Usage

### Main Screen

```
╭──────────────────────────────────────────────────╮
│ agent orchester v0.2  Profile Manager            │
├──────────────────────────────────────────────────┤
│ Runtimes  claude ✓  codex ✓  opencode ✗         │
├──────────────────────────────────────────────────┤
│ ● omc — 28 agents, 37 skills [orchestration]    │
│ ○ ecc — comprehensive starter kit               │
│ ○ superpowers 🔀 — TDD workflow, multi-tool     │
│ ○ none (vanilla)                                 │
├──────────────────────────────────────────────────┤
│ Enter select  i install  u usage  h help         │
╰──────────────────────────────────────────────────╯
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

agent orchester uses a **2-phase model**:

### Phase 1: Install
Download orchestration packages to `~/.orchester/profiles/`. This stores the files locally but does **not** activate them.

### Phase 2: Activate
Create symlinks from the profile's files to the target tool's config directory (e.g., `~/.claude/agents/`). Only one profile can be active at a time. For plugin-type links, agent orchester displays the manual commands to run in your AI coding tool.

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
    └── superpowers/
```

### Switch Flow (4 phases)

```
Validate → Deactivate old → Activate new → Verify
                ↓ (on failure)
           Auto-restore vanilla
```

### Install Types

| Type | Icon | Description |
|------|------|-------------|
| `symlink` | (default) | Standard symlink-based installation |
| `plugin` | 🔌 | Plugin commands shown for manual execution |
| `hybrid` | 🔀 | Combines symlinks and plugin commands |

## Built-in Registry

| Name | Stars | Description | Tool |
|------|-------|-------------|------|
| omc | 6.4K | 28 agents, 37 skills, Team mode | Claude Code |
| ecc | 44.7K | 13 agents, 30+ skills, hackathon winner | Claude Code |
| bkit | 91 | PDCA-based AI native workflow | Claude Code |
| wshobson-agents | 28.7K | 73 plugins, 112 agents, 146 skills | Claude Code |
| oh-my-opencode | 31.6K | Sisyphus orchestrator, multi-agent | OpenCode |
| claude-orchestra | 32 | 47 agents, 10 teams org chart | Claude Code |
| superpowers | 53.5K | Agentic skills framework, TDD workflow | Claude Code |

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

## Roadmap

- **v0.3** — MCP namespace isolation, per-project profiles, profile composition (mix & match)
- **v1.0** — Full multi-runtime support, profile marketplace

## License

MIT

## Author

**BrandsMore** — dev@brandsmore.co.kr

---

[한국어](./README.ko.md) · [日本語](./README.ja.md) · [中文](./README.zh.md)
