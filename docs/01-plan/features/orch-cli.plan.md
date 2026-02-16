# Plan: Orchestration Profile Manager (OPM / `orch`) — Full Roadmap

> PDCA Phase: Plan v5 (Roadmap) | Updated: 2026-02-16 | Feature: orch-cli
> 런타임 어댑터 플러그인 아키텍처 — 12+ AI 코딩 도구 지원
> 런타임 특성: `technical/runtime-profiles.md` (v3.0) 참조
> 격리 메커니즘: `technical/isolation-mechanism.md` (v1.1) 참조
> 이 문서는 최종 비전 로드맵입니다. 초기 구현은 `orch-v0.1.plan.md`를 참조하세요.

---

## 1. 문제 정의

AI 코딩 CLI(Claude Code, Codex CLI) 위에 오케스트레이션 레이어가 폭발적으로 증가 중:

| 도구 | Stars | 대상 CLI | 핵심 기능 |
|------|-------|----------|-----------|
| **everything-claude-code** | 44,700+ | Claude Code | 에이전트/스킬/훅/커맨드 종합 스타터킷 |
| **wshobson/agents** | 28,700+ | Claude Code | 73 플러그인, 112 에이전트, 플러그인 마켓플레이스 |
| **oh-my-claudecode (OMC)** | 2,100+ | Claude Code | 5 실행 모드, 32 에이전트, 31+ 스킬, HUD |
| **oh-my-codex (OMX)** | 370+ | Codex CLI | 30 에이전트, 39 스킬, tmux 팀 오케스트레이션 |
| **agent-council** | 87+ | Claude+Codex+Gemini | 멀티 CLI 합의 기반 의사결정 |
| **claude-code-agents-orchestra** | 37+ | Claude Code | 40+ 에이전트 조직도 구조 |
| **claude-orchestrator** | 65+ | Claude Code | 자동 PR/CI/머지 파이프라인 |
| **claude-code-by-agents** | 773+ | Claude Code | 멀티 에이전트 데스크톱 앱 |
| **bkit** | - | Claude Code | PDCA 기반 개발 워크플로우 |

**현재 고통점:**

1. **설치 상태 파편화** — 각 도구가 `~/.claude/`, `CLAUDE.md`, `.mcp.json`, `hooks/` 등을 제각각 수정
2. **스위칭 비용** — 프로젝트마다 다른 레이어를 쓰고 싶지만 수동 전환이 고통
3. **가시성 부족** — 현재 어떤 레이어가 활성인지 한눈에 안 보임
4. **롤백 불가** — 설정이 꼬이면 수동 복구 외 방법 없음
5. **신규 도구 온보딩** — 새 오케스트레이션 도구가 매주 등장하지만 시험이 번거로움

## 2. 제품 비전

> **"oh-my-zsh가 쉘 플러그인을 표준화했듯, orch가 AI CLI 오케스트레이션 레이어를 표준화한다."**

**TUI(Terminal User Interface)**로:
1. **12+ AI 코딩 도구** 통합 관리 (어댑터 플러그인 아키텍처)
   - Tier 1 (v0.1~v0.3): Claude Code, Codex CLI, Cursor, Gemini CLI, Windsurf
   - Tier 2 (v0.4): Cline, Antigravity, Zed, GitHub Copilot, Roo Code
   - Tier 3 (v0.5+): 커뮤니티 어댑터 (Amp, OpenCode, Goose, Aider 등)
2. 프로파일 대시보드에서 설치/활성 상태 한눈에 확인
3. 키보드 인터랙션으로 프로파일 선택/전환/실행
4. 실시간 진행 표시와 상태 모니터링
5. 직관적 진단/롤백 UI
6. **SKILL.md 표준** 활용 — "한 번 만들어서 모든 도구에 적용"

## 3. 타겟 사용자

| 구분 | 페르소나 | 핵심 니즈 |
|------|----------|-----------|
| **1차** | macOS에서 Claude Code/Codex를 병행하는 파워유저 | 빠른 스위칭, 안정성 |
| **2차** | 소규모 AI 개발팀 리더 | 팀 표준화, 온보딩 |
| **3차** | 새 오케스트레이션 도구를 시험하고 싶은 얼리어답터 | 간편 설치/제거 |

## 4. 핵심 유스케이스

### TUI 모드 (기본)
```
UC-1: orch              → TUI 대시보드 실행 (메인 화면)
UC-2: 대시보드 → 프로파일 선택 → Enter → 런타임 선택 → 활성화
UC-3: 대시보드 → Tab → Status 패널에서 현재 상태 확인
UC-4: 대시보드 → 'd' 키 → Doctor 진단 뷰 (모든 런타임 체크)
UC-5: 대시보드 → 'r' 키 → Rollback 확인 다이얼로그
UC-6: 대시보드 → '/' 키 → Registry 검색 입력
```

### CLI 모드 (비대화형/스크립팅)
```
UC-7: orch --headless install omx       → 비대화형 설치
UC-8: orch --headless use omx           → 비대화형 전환
UC-9: orch --headless status --json     → JSON 상태 출력
UC-10: orch --headless doctor           → 진단 결과 출력
```

## 4.1 멀티 런타임 아키텍처

### 지원 런타임 & 설정 매핑 (Tier 1)

| | **Claude Code** | **Codex CLI** | **Cursor** | **Gemini CLI** | **Windsurf** |
|---|---|---|---|---|---|
| **규칙 파일** | `CLAUDE.md` | `AGENTS.md` | `.cursor/rules/*.mdc` | `GEMINI.md` | `.windsurfrules` |
| **글로벌 설정** | `~/.claude/` | `~/.codex/` | `~/.cursor/` | `~/.gemini/` | `~/.codeium/windsurf/` |
| **스킬 (SKILL.md)** | `.claude/skills/` | `~/.codex/skills/` | `.cursor/skills/` | — | `.windsurf/skills/` |
| **에이전트** | `.claude/agents/` | `~/.codex/agents/` | — | — | — |
| **MCP** | `~/.mcp.json` | — | `.cursor/mcp.json` | `settings.json 내` | `mcp 설정` |
| **실행 명령** | `claude` | `codex` | `cursor .` | `gemini` | `windsurf .` |
| **orch 적용** | **v0.1** | v0.3 | v0.3 | v0.3 | v0.3 |

> 전체 런타임(Tier 1~3) 상세: `technical/runtime-profiles.md` (v3.0) 참조
> Agent Skills(SKILL.md) 표준: 12+ 도구가 채택 (agentskills.io)

### 런타임 어댑터 패턴 (플러그인 아키텍처)

각 런타임별 어댑터가 **동일한 프로파일 파일을 해당 런타임 형식으로 변환**:

```
프로파일 파일 (원본)          런타임 어댑터             대상 경로
─────────────────────    ──────────────    ─────────────────────
files/rules.md       →  claude-adapter  → CLAUDE.md
                     →  codex-adapter   → AGENTS.md
                     →  gemini-adapter  → GEMINI.md
                     →  cursor-adapter  → .cursor/rules/orch.mdc
                     →  windsurf-adapt  → .windsurfrules
                     →  cline-adapter   → .clinerules
                     →  copilot-adapter → .github/copilot-instructions.md

files/skills/        →  [모든 어댑터]    → 각 런타임의 SKILL.md 경로에 매핑
                        (SKILL.md 표준이므로 변환 없이 경로만 다름)

files/mcp.json       →  claude-adapter  → ~/.mcp.json (namespace)
                     →  cursor-adapter  → .cursor/mcp.json (namespace)
                     →  gemini-adapter  → ~/.gemini/settings.json (namespace)
```

어댑터 플러그인 인터페이스: `technical/runtime-profiles.md` §0.2 참조

### 런타임 자동 감지

`orch` 실행 시 시스템에 설치된 런타임을 자동 감지하여 TUI에 표시:

```typescript
interface RuntimeDetector {
  detect(): Promise<DetectedRuntime[]>;
}

interface DetectedRuntime {
  id: string;                   // 'claude', 'codex', 'cursor', 'windsurf', 'cline', ...
  name: string;                 // 사용자 표시명
  tier: 1 | 2 | 3;             // 지원 티어
  installed: boolean;
  version: string | null;
  binaryPath: string | null;
  configDir: string;            // ~/.claude, ~/.codex 등
  skillsSupport: boolean;       // SKILL.md 지원 여부
}
```

## 5. TUI 화면 설계

### 5.1 메인 대시보드 (orch 실행 시)

```
┌─ orch ─ Orchestration Profile Manager ──────────────────────────┐
│                                                                  │
│  ┌─ Profiles ──────────────┐  ┌─ Status ──────────────────────┐ │
│  │                         │  │                                │ │
│  │  ● omx        v0.3.9   │  │  Active: omx                   │ │
│  │  ○ omc        v1.2.0   │  │  Runtime: codex                │ │
│  │  ○ ecc        v2.1.0   │  │  Since: 2m ago                 │ │
│  │  ○ bkit       v1.5.2   │  │                                │ │
│  │  ○ council    v0.1.0   │  │  Links: 12 active              │ │
│  │                         │  │  Health: OK                    │ │
│  │                         │  │  Last Backup: 14:05            │ │
│  └─────────────────────────┘  └────────────────────────────────┘ │
│                                                                  │
│  ┌─ Runtimes (detected) ──────────────────────────────────────┐ │
│  │  claude ✓  codex ✓  cursor ✓  gemini ✓  windsurf ✓        │ │
│  │  cline ✓   zed ✓    copilot ✓  antigravity ✗              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ Actions ───────────────────────────────────────────────────┐ │
│  │  [Enter] Use  [s] Start  [i] Install  [d] Doctor           │ │
│  │  [r] Rollback  [u] Update  [/] Search  [q] Quit            │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 프로파일 상세 (Enter or Tab → 상세)

```
┌─ Profile: omx ──────────────────────────────────────────────────┐
│                                                                  │
│  Name:        oh-my-codex                                        │
│  Version:     0.3.9                                              │
│  Author:      Yeachan Heo                                        │
│  Runtime:     codex (primary), claude (compatible)                │
│  Source:      github.com/Yeachan-Heo/oh-my-codex                 │
│                                                                  │
│  ┌─ Link Map ──────────────────────────────────────────────────┐ │
│  │  agents/      → ~/.claude/agents/          [link]   ✓      │ │
│  │  skills/      → ~/.claude/skills/          [link]   ✓      │ │
│  │  prompts/     → ~/.codex/prompts/          [link]   ✓      │ │
│  │  CLAUDE.md    → ./CLAUDE.md                [merge]  ✓      │ │
│  │  mcp.json     → ./.mcp.json                [merge]  ✗      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ Prerequisites ─────────────────────────────────────────────┐ │
│  │  node ✓   npx ✓   tmux ✓                                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [Enter] Activate  [s] Start with runtime  [Esc] Back           │
└──────────────────────────────────────────────────────────────────┘
```

### 5.3 Install 뷰 (i 키)

```
┌─ Install Profile ───────────────────────────────────────────────┐
│                                                                  │
│  Source: ▌ https://github.com/user/repo                         │
│                                                                  │
│  ── or select from registry ──                                   │
│                                                                  │
│  › oh-my-claudecode    ★ 2.1K   5 modes, 32 agents              │
│    oh-my-codex         ★ 370    30 agents, tmux team             │
│    everything-cc       ★ 44.7K  comprehensive starter kit        │
│    agent-council       ★ 87     multi-CLI consensus              │
│    claude-orchestra    ★ 37     40+ agents org chart             │
│                                                                  │
│  ┌─ Progress ──────────────────────────────────────────────────┐ │
│  │  ████████████░░░░░░░░  60%  Cloning repository...           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [Enter] Install  [Esc] Cancel                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 5.4 Doctor 뷰 (d 키)

```
┌─ Doctor ─ Health Check ─────────────────────────────────────────┐
│                                                                  │
│  Profile: omx                                                    │
│                                                                  │
│  ✓ Binary 'node' found at /usr/local/bin/node                    │
│  ✓ Binary 'npx' found at /usr/local/bin/npx                     │
│  ✓ Binary 'tmux' found at /usr/local/bin/tmux                   │
│  ✓ Binary 'omx' found at /usr/local/bin/omx                     │
│  ✓ Directory ~/.claude/agents/ exists                            │
│  ✗ Symlink ~/.claude/skills/ is broken                           │
│    → Fix: re-link to ~/.orch/profiles/omx/files/skills/          │
│  ✓ Command 'omx doctor' passed                                   │
│                                                                  │
│  Result: 6/7 checks passed                                       │
│                                                                  │
│  [f] Auto-fix  [Esc] Back                                        │
└──────────────────────────────────────────────────────────────────┘
```

### 5.5 Start 뷰 (s 키)

```
┌─ Start: omx ────────────────────────────────────────────────────┐
│                                                                  │
│  Select runtime:          (✓ = installed, ● = primary)           │
│                                                                  │
│  › ● codex      ✓  OpenAI Codex CLI                             │
│      claude     ✓  Anthropic Claude Code                        │
│      gemini     ✓  Google Gemini CLI                            │
│      cursor     ✓  Cursor IDE                                   │
│      antigravity ✗  Antigravity (not installed)                  │
│                                                                  │
│  Profile supports: codex, claude, gemini                         │
│  Project: ~/workspace/my-project                                 │
│                                                                  │
│  [Enter] Launch  [p] Change project  [Esc] Back                  │
└──────────────────────────────────────────────────────────────────┘
```

### 5.6 키바인딩 요약

| 키 | 전역 | 컨텍스트 |
|----|------|----------|
| `↑↓` / `j/k` | 목록 탐색 | |
| `Enter` | 선택/실행 | |
| `Tab` | 패널 전환 | |
| `Esc` | 뒤로가기 | |
| `i` | Install | 메인 |
| `s` | Start | 메인, 상세 |
| `d` | Doctor | 메인 |
| `r` | Rollback | 메인 |
| `u` | Update | 메인 |
| `/` | Search | 메인 |
| `?` | Help | 전역 |
| `q` | Quit | 전역 |

## 6. 정보 아키텍처

```
~/.orch/
├── config.yaml                 # 글로벌 설정 (기본 런타임, 레지스트리 URL 등)
├── state.json                  # 런타임 상태
│   ├── activeProfile
│   ├── lastProfile
│   ├── backups[]
│   └── installedVersions{}
├── registry/                   # 프로파일 레지스트리 (로컬 캐시)
│   └── index.json
├── profiles/
│   ├── omx/
│   │   ├── manifest.yaml       # 프로파일 메타데이터
│   │   └── files/              # 실제 설정 파일들
│   │       ├── AGENTS.md
│   │       ├── CLAUDE.md
│   │       ├── hooks/
│   │       ├── skills/
│   │       ├── commands/
│   │       └── mcp.json
│   ├── omc/
│   │   ├── manifest.yaml
│   │   └── files/
│   ├── ecc/                    # everything-claude-code
│   │   ├── manifest.yaml
│   │   └── files/
│   └── bkit/
│       ├── manifest.yaml
│       └── files/
├── vanilla/                    # 바닐라 스냅샷 (orch init 시 원본 보존)
│   ├── CLAUDE.md               # 사용자 원본 CLAUDE.md
│   ├── AGENTS.md               # 사용자 원본 AGENTS.md
│   ├── GEMINI.md               # 사용자 원본 GEMINI.md
│   ├── agents/                 # 사용자 원본 에이전트
│   ├── skills/                 # 사용자 원본 스킬
│   └── mcp-originals/          # MCP 원본 스냅샷
│       ├── .mcp.json
│       ├── gemini-settings.json
│       └── cursor-mcp.json
└── backups/
    └── <timestamp>/            # 전환 전 자동 백업
```

### manifest.yaml 스키마 (v3 — Multi-Runtime)

```yaml
name: omx
version: 0.3.9
description: "Multi-agent orchestration for Codex CLI"
author: "Yeachan Heo"
source:
  type: git                     # git | npm | local
  url: "https://github.com/Yeachan-Heo/oh-my-codex"
  branch: main

# ── 멀티 런타임 지원 ──
runtimes:
  primary: codex
  supported:
    - name: codex
      minVersion: "0.1.0"
      launch: "codex"
    - name: claude
      minVersion: "1.0.0"
      launch: "claude"
    - name: gemini
      minVersion: "1.0.0"
      launch: "gemini"

prerequisites:
  binaries: [node, npx, tmux]
  env: []

# ── 런타임별 격리 맵 ──
# 전략: symlink (디렉토리/파일 통째로 교체) 또는 namespace (MCP 키 격리)
# merge 사용 금지 — 격리 원칙 위반

# 런타임별 링크 (해당 런타임 활성화 시에만 적용)
links.claude:
  - source: files/rules.md
    target: $PROJECT/CLAUDE.md
    strategy: symlink             # 파일 통째로 교체
  - source: files/agents/
    target: $HOME/.claude/agents/
    strategy: symlink             # 디렉토리 통째로 교체
  - source: files/skills/
    target: $HOME/.claude/skills/
    strategy: symlink
  - source: files/mcp.json
    target: $HOME/.mcp.json
    strategy: namespace           # __orch_<name>__ 접두사로 키 격리

links.codex:
  - source: files/rules.md
    target: $PROJECT/AGENTS.md
    strategy: symlink
  - source: files/agents/
    target: $HOME/.codex/agents/
    strategy: symlink
  - source: files/skills/
    target: $HOME/.codex/skills/
    strategy: symlink

links.gemini:
  - source: files/rules.md
    target: $PROJECT/GEMINI.md
    strategy: symlink
  - source: files/mcp.json
    target: $HOME/.gemini/settings.json
    strategy: namespace
    namespaceKey: mcpServers      # mcpServers 하위에 네임스페이스 격리

links.cursor:
  - source: files/rules.md
    target: $PROJECT/.cursor/rules/__orch__.mdc
    strategy: copy                # .mdc는 변환 필요하므로 copy (파일명에 __orch__ 표시)
    transform: markdown-to-mdc
  - source: files/mcp.json
    target: $PROJECT/.cursor/mcp.json
    strategy: namespace

links.antigravity:
  - source: files/rules.md
    target: $PROJECT/GEMINI.md
    strategy: symlink
  - source: files/agents/
    target: $PROJECT/.agent/skills/
    strategy: symlink
  - source: files/mcp.json
    target: $PROJECT/.vscode/mcp.json
    strategy: namespace

install:
  pre: []
  post:
    - "npm install -g oh-my-codex"
    - "omx setup --non-interactive"

uninstall:
  pre: []
  post:
    - "npm uninstall -g oh-my-codex"

health:
  checks:
    - type: binary_exists
      name: omx
    - type: file_exists
      path: $HOME/.claude/agents/
    - type: command_succeeds
      command: "omx doctor"
```

### 프로파일 files/ 디렉토리 구조

```
profiles/omx/files/
├── rules.md            # 범용 규칙 (런타임 어댑터가 변환)
├── agents/             # 에이전트 정의 (런타임별 경로로 배포)
├── skills/             # 스킬 정의
├── hooks/              # 훅 설정
├── mcp.json            # MCP 서버 설정 (범용)
└── runtime-specific/   # (옵션) 런타임별 전용 파일
    ├── claude/         # Claude Code 전용 오버라이드
    ├── codex/          # Codex CLI 전용 오버라이드
    └── cursor/         # Cursor 전용 오버라이드
```

**규칙 파일 변환 흐름:**
- `files/rules.md` → 범용 마크다운 규칙 (프로파일 작성자가 1번만 작성)
- 어댑터가 런타임별로 변환: CLAUDE.md, AGENTS.md, GEMINI.md, .mdc
- `runtime-specific/` 에 런타임 전용 오버라이드 가능 (옵션)

## 7. 기술 스택

| 구성 | 선택 | 이유 |
|------|------|------|
| 언어 | **TypeScript** | Claude/Codex 생태계와 동일 |
| TUI 프레임워크 | **Ink 6.x (React for CLI)** | Claude Code 자체가 Ink 기반. React 컴포넌트 모델. |
| UI 컴포넌트 | **@inkjs/ui** | 공식 컴포넌트 (Select, Spinner, ConfirmInput, Badge 등) |
| 추가 컴포넌트 | **ink-table, ink-select-input** | 테이블 뷰, 인터랙티브 선택 |
| 레이아웃 | **Yoga (Flexbox)** | Ink 내장. CSS Flexbox 기반 레이아웃 |
| YAML 파싱 | **js-yaml** | manifest.yaml 처리 |
| 파일 조작 | **fs-extra** | 심볼릭 링크, 복사, 이동 |
| CLI 파서 | **meow** | Ink 공식 권장. `--headless` 등 플래그 파싱 |
| 테스트 | **vitest + ink-testing-library** | Ink 컴포넌트 테스트 지원 |
| 패키징 | **npm** (`npx orch`) | 소스 기반 배포, 보안 검사 통과 |

### Ink 선정 근거

1. **Claude Code 자체가 Ink 기반** — 동일 기술로 확장/통합 용이
2. **npm 배포** — 바이너리 아닌 소스코드 배포로 보안 정책 통과
3. **React 컴포넌트** — 선언적 UI, 상태 관리, 컴포넌트 재사용
4. **풍부한 생태계** — @inkjs/ui, ink-table 등 즉시 사용 가능한 컴포넌트
5. **React DevTools** — 개발 시 디버깅 지원
6. **Flexbox** — 복잡한 분할 레이아웃을 CSS 방식으로 구현

## 8. 아키텍처

### 컴포넌트 트리

```
<App>
├── <Router>                    # 현재 뷰 상태 관리
│   ├── <Dashboard>             # 메인 대시보드
│   │   ├── <ProfileList>       # 좌측: 프로파일 목록
│   │   ├── <StatusPanel>       # 우측: 상태 패널
│   │   └── <ActionBar>         # 하단: 키바인딩 가이드
│   ├── <ProfileDetail>         # 프로파일 상세 뷰
│   │   ├── <LinkMap>           # 링크 맵 표시
│   │   └── <Prerequisites>     # 필수 조건 표시
│   ├── <InstallView>           # 설치 뷰
│   │   ├── <SourceInput>       # URL/경로 입력
│   │   ├── <RegistryList>      # 레지스트리 검색
│   │   └── <ProgressBar>       # 설치 진행
│   ├── <StartView>             # 런타임 선택 + 실행
│   ├── <DoctorView>            # 진단 결과
│   └── <RollbackView>          # 롤백 확인
├── <Notifications>             # 토스트 알림
└── <HelpOverlay>               # ? 키 도움말
```

### 상태 관리

```typescript
// useOrch() — 핵심 상태 훅
interface OrchState {
  profiles: Profile[];         // 설치된 프로파일 목록
  activeProfile: string | null;// 현재 활성 프로파일
  lastProfile: string | null;  // 이전 프로파일 (롤백용)
  backups: Backup[];           // 백업 히스토리
  view: View;                  // 현재 TUI 뷰
}
```

### 듀얼 모드 진입점

```typescript
// src/index.tsx
const args = meow({ flags: { headless: { type: 'boolean' } } });

if (args.flags.headless) {
  // CLI 모드: 비대화형 실행
  await runHeadless(args);
} else {
  // TUI 모드: Ink 렌더링
  render(<App />);
}
```

## 9. 격리 메커니즘 (핵심 아키텍처)

> **설계 원칙: merge 금지. 모든 것은 격리되어야 하고, 깨끗하게 제거 가능해야 한다.**

### 9.1 문제: 왜 merge가 위험한가

```
시나리오: OMC 설치 → bkit 설치 → OMC 제거
─────────────────────────────────────────────────
1. OMC install  → CLAUDE.md에 OMC 규칙 merge
2. bkit install → CLAUDE.md에 bkit 규칙 merge
3. OMC remove   → CLAUDE.md에서 OMC 부분만 제거?
   → 어디가 OMC 것이고 어디가 bkit 것인지 구분 불가!
   → 결국 CLAUDE.md 전체를 날리거나, 잔여물이 남거나.
─────────────────────────────────────────────────
```

### 9.2 해결: Snapshot + Symlink Only 전략

```
orch의 격리 원칙:
─────────────────────────────────────────────────
1. 최초 1회: 사용자의 원본 설정을 "바닐라 스냅샷"으로 저장
2. 프로파일 활성화: 심볼릭 링크만 사용 (원본 파일 절대 수정 안 함)
3. 프로파일 비활성화: 심볼릭 링크 제거 → 바닐라 상태 복원
4. 전환: 이전 링크 제거 → 새 링크 생성 (원자적)
─────────────────────────────────────────────────
```

### 9.3 구체적 격리 방식

#### 디렉토리형 (agents/, skills/, hooks/)

```
비활성 상태:
  ~/.claude/agents/     → (사용자 원본 또는 비어있음)

orch use omc:
  ~/.claude/agents/     → symlink → ~/.orch/profiles/omc/files/agents/

orch use bkit:
  ~/.claude/agents/     → symlink → ~/.orch/profiles/bkit/files/agents/

orch use none:
  ~/.claude/agents/     → (바닐라 스냅샷 복원)
```

**핵심: 디렉토리 자체를 통째로 심볼릭 링크.** 파일 단위 merge 절대 안 함.

#### 파일형 (CLAUDE.md, AGENTS.md, .mcp.json)

```
orch init 시:
  사용자 원본 CLAUDE.md 존재
  → ~/.orch/vanilla/CLAUDE.md 로 백업 (바닐라 스냅샷)
  → 원본은 그대로 유지

orch use omc:
  1. 현재 CLAUDE.md → ~/.orch/vanilla/CLAUDE.md (이미 저장됨)
  2. CLAUDE.md 삭제
  3. CLAUDE.md → symlink → ~/.orch/profiles/omc/files/CLAUDE.md

orch use bkit:
  1. omc의 symlink 제거
  2. CLAUDE.md → symlink → ~/.orch/profiles/bkit/files/CLAUDE.md

orch use none:
  1. symlink 제거
  2. ~/.orch/vanilla/CLAUDE.md → CLAUDE.md 복원
```

#### MCP 설정 (.mcp.json) — 유일한 예외: 구조적 병합

MCP만은 완전한 symlink 교체가 어려움 (사용자 고유 MCP 서버 + 프로파일 MCP 서버 공존 필요).
→ **네임스페이스 격리** 사용:

```json
// ~/.mcp.json (orch가 관리)
{
  // 사용자 원본 MCP 서버 (orch가 건드리지 않음)
  "my-custom-server": { ... },

  // orch가 관리하는 영역 (프로파일 전환 시 이 블록만 교체)
  "__orch_omc__github-mcp": { ... },
  "__orch_omc__memory": { ... }
}
```

- 프로파일 MCP 서버에 `__orch_<profile>__` 접두사 부여
- 전환 시 해당 접두사 키만 제거/추가
- 사용자 원본 키는 절대 건드리지 않음

### 9.4 격리 상태 추적

```typescript
// ~/.orch/state.json
{
  "activeProfile": "omc",
  "vanilla": {                    // 바닐라 스냅샷 경로
    "CLAUDE.md": "~/.orch/vanilla/CLAUDE.md",
    "agents/": "~/.orch/vanilla/agents/",
    ".mcp.json": "~/.orch/vanilla/.mcp.json"
  },
  "activeLinks": [                // 현재 활성 심볼릭 링크 목록
    {
      "source": "~/.orch/profiles/omc/files/CLAUDE.md",
      "target": "~/project/CLAUDE.md",
      "type": "symlink"
    },
    {
      "source": "~/.orch/profiles/omc/files/agents/",
      "target": "~/.claude/agents/",
      "type": "symlink"
    }
  ],
  "activeMcpKeys": [              // 현재 주입된 MCP 키 목록
    "__orch_omc__github-mcp",
    "__orch_omc__memory"
  ]
}
```

### 9.5 전환 시퀀스 (원자적 보장)

```
orch use <new-profile>:
─────────────────────────────────────────────────
Phase 1: Preflight
  ✓ new-profile 존재 확인
  ✓ 필수 바이너리 체크
  ✓ 대상 경로 쓰기 권한 체크

Phase 2: Deactivate (현재 프로파일)
  ✓ activeLinks[]의 모든 symlink 제거
  ✓ activeMcpKeys[]의 MCP 키 제거
  ✓ state.json 업데이트: activeProfile = null

Phase 3: Activate (새 프로파일)
  ✓ 새 symlink 생성
  ✓ MCP 키 주입 (__orch_<name>__ 접두사)
  ✓ state.json 업데이트: activeProfile = new

Phase 4: Verify
  ✓ 모든 symlink 정상 확인
  ✓ 실패 시 → Phase 2로 돌아가 vanilla 복원
─────────────────────────────────────────────────
어느 Phase에서 실패해도, vanilla 스냅샷으로 복원 가능.
```

### 9.6 `orch use none` — 바닐라 복원

```
orch use none:
─────────────────────────────────────────────────
1. 모든 orch symlink 제거
2. 모든 __orch_*__ MCP 키 제거
3. vanilla 스냅샷에서 원본 복원
4. 결과: orch 설치 전과 동일한 상태
─────────────────────────────────────────────────
```

## 10. 동작 원칙

1. **완전 격리** — 프로파일 간 파일이 절대 섞이지 않음. symlink only.
2. **바닐라 복원** — `orch use none`으로 언제든 설치 전 상태로 복귀
3. **Single Active** — 한 번에 active profile 1개 (v1.2에서 compose로 다중 허용)
4. **원자적 전환** — 전환 중 실패 시 이전 상태 자동 복구
5. **원본 불변** — 사용자의 원본 파일은 절대 수정하지 않음 (바닐라 보존)
6. **Dual Mode** — TUI(기본) + `--headless` CLI 모드
7. **No Secrets** — API 키 등 민감값 직접 저장 금지, `$ENV` 참조만 허용
8. **Idempotent** — 같은 작업 반복 실행해도 동일 결과

## 11. 비기능 요구사항

| 항목 | 기준 |
|------|------|
| 플랫폼 | macOS 우선, Linux 호환 |
| 전환 속도 | 프로파일 전환 3초 이내 |
| TUI 응답성 | 키 입력 반응 100ms 이내 |
| 안정성 | 실패 시 즉시 이전 상태 복구 |
| 보안 | 소스코드 배포 (바이너리 X), 민감값 저장 금지 |
| 크기 | 패키지 < 2MB (node_modules 제외) |

## 12. 확장성 고려 (v1.1~v1.3)

### v1.1: 레지스트리
- TUI 내 검색 UI (`/` 키)
- GitHub 기반 커뮤니티 프로파일 인덱스
- Stars/다운로드 수 표시

### v1.2: 프로파일 조합 (Compose)
- 여러 프로파일을 레이어링하여 동시 사용
- TUI에서 체크박스 다중 선택
- 충돌 우선순위 시각적 표시

### v1.3: 크로스 CLI 통합
- agent-council 패턴 지원
- 멀티 런타임 동시 실행 뷰

## 13. 리스크 & 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 설정 충돌 (CLAUDE.md 등) | 높음 | preflight 충돌 검증 + TUI 시각적 표시 |
| 버전 호환성 | 중간 | manifest에 minVersion 명시 |
| Ink 렌더링 제한 | 낮음 | Claude Code가 Ink 기반이므로 검증된 호환성 |
| 빠른 생태계 변화 | 높음 | manifest 스키마 확장 가능 설계 |
| 터미널 호환성 | 낮음 | Ink이 주요 터미널 에뮬레이터 지원 |

## 14. 마일스톤

| Phase | 기간 | 범위 |
|-------|------|------|
| **M1** | 1~2일 | Ink 프로젝트 셋업 + 대시보드 레이아웃 + `--headless status` |
| **M2** | 2~3일 | ProfileList + StatusPanel + use/rollback 동작 |
| **M3** | 2~3일 | InstallView + StartView + DoctorView |
| **M4** | 1일 | 샘플 프로파일 3종 (OMC, OMX, ECC) + 문서 |
| **M5** | 1일 | npm 패키징 + `npx orch` 배포 |

## 15. 수용 기준 (Acceptance Criteria)

- [ ] `npx orch` → TUI 대시보드 정상 렌더링
- [ ] 프로파일 목록에서 ↑↓ 탐색 + Enter 선택 동작
- [ ] 프로파일 전환 시 실시간 Progress 표시
- [ ] `orch --headless status --json` → JSON 상태 출력
- [ ] 전환 실패 시 `r` 키로 즉시 롤백
- [ ] `d` 키 → Doctor 뷰에서 진단 결과 + Auto-fix
- [ ] 신규 프로파일 설치 5분 이내
- [ ] macOS Terminal, iTerm2, Warp에서 정상 렌더링

## 16. 샘플 프로파일 (초기 3종)

### OMC (oh-my-claudecode)
- 런타임: claude
- 링크: CLAUDE.md(merge), agents/(link), skills/(link), hooks/(link)
- 설치 후: `npx oh-my-claudecode setup`

### OMX (oh-my-codex)
- 런타임: codex
- 링크: prompts/(link), agents/(link), skills/(link)
- 설치 후: `npm install -g oh-my-codex && omx setup`

### ECC (everything-claude-code)
- 런타임: claude
- 링크: CLAUDE.md(merge), agents/(link), skills/(link), hooks/(link), commands/(link)
- 설치 후: 없음 (파일 배포만)

---

## 부록 A: 런타임 호환성 매트릭스

### 프로파일 × 런타임 지원 범위

| 프로파일 | Claude | Codex | Gemini | Cursor | Antigravity | 비고 |
|----------|:------:|:-----:|:------:|:------:|:-----------:|------|
| **OMC** | ✓ (native) | △ (rules만) | △ (rules만) | △ (rules만) | △ (rules만) | Claude 전용 에이전트 |
| **OMX** | △ (rules만) | ✓ (native) | △ (rules만) | △ (rules만) | △ (rules만) | Codex 전용 에이전트 |
| **ECC** | ✓ (native) | △ (rules만) | △ (rules만) | △ (rules+MCP) | △ (rules만) | 풍부한 에이전트/스킬 |
| **bkit** | ✓ (native) | ○ (plugin) | △ (rules만) | △ (rules만) | △ (rules만) | PDCA 워크플로우 |
| **council** | ✓ | ✓ | ✓ | ✗ | ✗ | 크로스 CLI 전용 |

- ✓ = 완전 지원 (에이전트+스킬+훅+MCP)
- ○ = 부분 지원 (에이전트+스킬)
- △ = 규칙/MCP만 (rules.md 변환 배포)
- ✗ = 미지원

### 공통 배포 가능 요소

```
모든 런타임에 동일 포맷 배포:   런타임별로 다른 형태로 배포:
──────────────────────        ──────────────────────────
• SKILL.md 스킬 (12+ 도구)    • 규칙 파일 (CLAUDE/AGENTS/GEMINI.md, .mdc, .windsurfrules)
• MCP 서버 설정               • 에이전트 디렉토리 경로
• 환경변수 참조               • 훅 설정 형식 (JSON/TOML)
                              • 워크플로우 (Antigravity 전용)
```

---

## 부록 B: 오케스트레이션 생태계 현황 (2026-02)

현재 AI 코딩 CLI 오케스트레이션 생태계는 2013~2014년 oh-my-zsh 시대와 유사한 단계:

**공통 확장 포인트:**
| 확장점 | 설명 | 사용 도구 |
|--------|------|-----------|
| `CLAUDE.md` | 프로젝트 레벨 메모리/규칙 | 전체 |
| `AGENTS.md` | 에이전트 역할 정의 | OMC, ECC, orchestra |
| `.claude/agents/` | 에이전트 정의 파일 | OMC, OMX, wshobson, ECC |
| `.claude/skills/` | 재사용 스킬 | OMC, OMX, ECC, wshobson |
| `.claude/commands/` | 커스텀 슬래시 커맨드 | ECC, wshobson |
| `hooks/` | 라이프사이클 훅 | OMC, ECC |
| `.mcp.json` | MCP 서버 설정 | 전체 |

**핵심 트렌드:**
1. **Agent Skills 표준 수렴** — SKILL.md가 사실상 업계 표준 (12+ 도구 채택, agentskills.io)
2. **Convention over Configuration** — `CLAUDE.md` + `agents/` + `skills/` + `hooks/` 표준 레이아웃 수렴
3. **플러그인 마켓플레이스** — skills.sh, SkillsMP 등 스킬 레지스트리 등장
4. **멀티모달 실행** — autopilot/swarm/pipeline/eco 모드 제공
5. **크로스 CLI 수렴** — 같은 저자가 Claude + Codex 병행 도구 개발
6. **자기 진화 에이전트** — 세션 간 지식 유지 + 스킬 자동 학습
7. **크로스 도구 호환** — Zed가 9개 규칙 파일 인식, Cline이 4개 포맷 자동 감지
8. **범용 스킬 CLI** — Vercel skills CLI, agent-skills-cli 등 도구 간 스킬 동기화
