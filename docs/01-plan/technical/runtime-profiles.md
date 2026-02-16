# Technical Spec: 런타임 프로파일 (Runtime Profiles)

> 각 AI 코딩 도구의 설정 구조, 포맷, 제약사항 정리.
> orch가 프로파일 전환 시 각 런타임에 맞게 적용하기 위한 기초 자료.
> Version: 3.0 | Date: 2026-02-16
>
> **v3.0 변경사항:**
> - Cursor 스킬(SKILL.md) 지원 반영
> - 지원 대상 5 → 12+ 도구로 확장 (Windsurf, Cline, GitHub Copilot, Zed, Roo Code, Amp, OpenCode 등)
> - 플러그인/어댑터 아키텍처 설계 추가 (확장 가능한 런타임 지원)
> - Agent Skills 표준 채택 현황 업데이트
>
> Sources:
> - [Claude Code Docs - Skills](https://code.claude.com/docs/en/skills)
> - [Claude Code Docs - Subagents](https://code.claude.com/docs/en/sub-agents)
> - [Codex - AGENTS.md](https://developers.openai.com/codex/guides/agents-md/)
> - [Codex - Advanced Config](https://developers.openai.com/codex/config-advanced/)
> - [Codex - Skills](https://developers.openai.com/codex/skills/)
> - [Gemini CLI - Configuration](https://geminicli.com/docs/get-started/configuration/)
> - [Cursor Release Notes](https://releasebot.io/updates/cursor)
> - [Windsurf Cascade Skills](https://docs.windsurf.com/windsurf/cascade/skills)
> - [Cline Rules](https://docs.cline.bot/features/cline-rules)
> - [Zed AI Rules](https://zed.dev/docs/ai/rules)
> - [GitHub Copilot Instructions](https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)
> - [Agent Skills Standard](https://agentskills.io/home)
> - [AGENTS.md Standard](https://agents.md/)
> - [Antigravity Skills Codelab](https://codelabs.developers.google.com/getting-started-with-antigravity-skills)

---

## 0. 설계 원칙: 확장 가능한 런타임 지원

### 0.1 왜 플러그인 아키텍처인가

```
문제: 하드코딩된 5개 도구만 지원 → 개인 프로젝트 수준
해결: 런타임 어댑터 플러그인 → 커뮤니티가 새 도구를 추가할 수 있음

핵심 관찰:
  1. Agent Skills (SKILL.md)가 업계 표준으로 수렴 중 (12+ 도구 채택)
  2. 규칙 파일은 도구마다 다르지만 패턴은 3가지로 분류됨
  3. 설정 경로만 알면 대부분의 도구에 orch 적용 가능
```

### 0.2 런타임 어댑터 인터페이스

```typescript
interface RuntimeAdapter {
  // 메타데이터
  id: string;                         // 'claude', 'cursor', 'windsurf' 등
  name: string;                       // 사용자 표시명
  vendor: string;
  type: 'cli' | 'ide' | 'extension';

  // 감지
  detect(): Promise<RuntimeDetection>;  // 설치 여부, 버전

  // 설정 경로 매핑
  paths: {
    global: {
      rules?: string;                  // 글로벌 규칙 파일/디렉토리
      skills?: string;                 // 글로벌 스킬 디렉토리
      agents?: string;                 // 글로벌 에이전트 디렉토리
      mcp?: string;                    // MCP 설정 파일
      config?: string;                 // 메인 설정 파일
    };
    project: {
      rules?: string;                  // 프로젝트 규칙 파일/디렉토리
      skills?: string;                 // 프로젝트 스킬 디렉토리
      agents?: string;                 // 프로젝트 에이전트 디렉토리
      mcp?: string;                    // MCP 설정 파일
      config?: string;                 // 프로젝트 설정 파일
    };
  };

  // 전략
  strategies: {
    rules: 'symlink' | 'copy' | 'namespace';
    skills: 'symlink' | 'copy';
    mcp: 'symlink' | 'namespace' | 'none';
  };

  // 변환
  transforms?: {
    rulesToFormat?(markdown: string, meta: any): string;  // .mdc 변환 등
    skillsToFormat?(skill: SkillManifest): any;           // 스킬 포맷 변환
  };

  // Hot Reload
  hotReload: boolean;
  restartMessage?: string;

  // 제약
  limitations: string[];
}
```

### 0.3 버전별 런타임 지원 계획

```
v0.1  —  Claude Code (내장 어댑터)
v0.2  —  + MCP namespace 격리
v0.3  —  어댑터 플러그인 시스템 + Tier 1 어댑터 (Codex, Cursor, Gemini CLI, Windsurf, Cline)
v0.4  —  + Tier 2 어댑터 (Antigravity, Zed, GitHub Copilot, Roo Code, Amp)
v0.5  —  커뮤니티 어댑터 레지스트리
v1.0  —  크로스 런타임 프로파일 compose
```

---

## 1. 런타임 에코시스템 전체 비교

### 1.1 Tier 1 — 핵심 지원 (v0.1~v0.3)

| | Claude Code | Codex CLI | Cursor | Gemini CLI | Windsurf |
|---|:-----------:|:---------:|:------:|:----------:|:--------:|
| **벤더** | Anthropic | OpenAI | Anysphere | Google | Codeium |
| **타입** | CLI | CLI | IDE | CLI | IDE |
| **규칙 파일** | CLAUDE.md | AGENTS.md | .mdc | GEMINI.md | .windsurfrules |
| **SKILL.md** | **O** | **O** | **O** (2026~) | **O** | **O** (2026.01~) |
| **에이전트** | agents/ | .agents/ | — | extensions/ | — |
| **MCP** | ~/.mcp.json | — | .cursor/mcp.json | settings.json 내 | mcp.json |
| **Symlink** | **완전** | **완전** | **미확인** | 미확인 | 미확인 |
| **Hot Reload** | O | O | 부분적 | **X** | 미확인 |
| **글로벌** | ~/.claude/ | ~/.codex/ | ~/.cursor/ | ~/.gemini/ | ~/.codeium/windsurf/ |
| **프로젝트** | .claude/ | .agents/ | .cursor/ | .gemini/ | .windsurf/ |
| **orch** | **v0.1** | v0.3 | v0.3 | v0.3 | v0.3 |

### 1.2 Tier 2 — 확장 지원 (v0.4)

| | Cline | Antigravity | Zed | GitHub Copilot | Roo Code |
|---|:-----:|:-----------:|:---:|:--------------:|:--------:|
| **벤더** | Cline.bot | Google | Zed | GitHub | Roo Code |
| **타입** | Extension | IDE | IDE | Extension | Extension |
| **규칙 파일** | .clinerules/ | GEMINI.md | .rules | copilot-instructions.md | .roo/ |
| **SKILL.md** | **O** | **O** | X (Rules만) | **O** | **O** |
| **MCP** | mcp 설정 | .vscode/mcp.json | settings.json | — | mcp 설정 |
| **Symlink** | 미확인 | **공식 권장** | 미확인 | 미확인 | 미확인 |
| **글로벌** | ~/Documents/Cline/ | ~/.gemini/antigravity/ | Rules Library | — | ~/.roo/ |
| **프로젝트** | .clinerules/ | .agent/ | .rules | .github/ | .roo/ |
| **orch** | v0.4 | v0.4 | v0.4 | v0.4 | v0.4 |

### 1.3 Tier 3 — 커뮤니티 (v0.5+)

| | Amp | OpenCode | Goose | Aider | Continue.dev |
|---|:---:|:--------:|:-----:|:-----:|:------------:|
| **SKILL.md** | **O** | **O** | **O** | 설정 가능 | 미확인 |
| **규칙** | AGENTS.md | AGENTS.md | 커스텀 | convention | — |
| **orch** | 커뮤니티 어댑터 | 커뮤니티 어댑터 | 커뮤니티 어댑터 | 커뮤니티 어댑터 | 커뮤니티 어댑터 |

---

## 2. 업계 표준 수렴 현황

### 2.1 Agent Skills (SKILL.md) — 사실상 업계 표준

```
발표: Anthropic (오픈 표준으로 공개)
표준: agentskills.io
채택: 12+ 도구 (2026.02 기준)

채택 도구:
  ✅ Claude Code      — 네이티브 (원조)
  ✅ Codex CLI        — 네이티브
  ✅ Cursor           — 네이티브 (2026~) ← NEW
  ✅ Windsurf         — 네이티브 (2026.01~) ← NEW
  ✅ Cline            — 네이티브
  ✅ Antigravity      — 네이티브
  ✅ GitHub Copilot   — 네이티브
  ✅ Roo Code         — 네이티브
  ✅ Amp              — 네이티브
  ✅ OpenCode         — 네이티브
  ✅ Goose            — 네이티브
  ✅ Manus            — 네이티브
  ❌ Zed              — 미지원 (Rules Library만)
  ❌ Aider            — 간접 지원 (설정 파일 경유)

런타임별 스킬 경로:
  Claude Code:   ~/.claude/skills/<name>/SKILL.md
  Codex CLI:     ~/.codex/skills/<name>/SKILL.md
  Cursor:        .cursor/skills/<name>/SKILL.md      ← NEW
  Windsurf:      .windsurf/skills/<name>/SKILL.md     ← NEW
                 ~/.codeium/windsurf/skills/ (글로벌)
  Cline:         .cline/.skills/<name>/SKILL.md
                 ~/Documents/Cline/.skills/ (글로벌)
  Antigravity:   .agent/skills/<name>/SKILL.md
  GitHub Copilot: .github/skills/<name>/SKILL.md
  Roo Code:      .roo/skills/<name>/SKILL.md

orch 시사점:
  → SKILL.md 기반 프로파일은 12+ 도구에 동시 배포 가능
  → 스킬 경로 매핑만 어댑터에서 정의하면 됨
  → 프로파일의 핵심 가치: "한 번 만들어서 모든 도구에 적용"
```

### 2.2 AGENTS.md — 크로스 에이전트 규칙 표준

```
표준: agents.md
목적: 규칙 파일의 통합 포맷

지원 도구:
  ✅ Codex CLI (네이티브)
  ✅ OpenCode (네이티브)
  ✅ Gemini CLI (설정 가능)
  ✅ Zed (자동 인식)
  ✅ Roo Code (논의 중)
  ✅ Aider (설정 가능)

orch 시사점:
  → AGENTS.md, CLAUDE.md, GEMINI.md는 본질적으로 같은 목적
  → 프로파일이 하나의 규칙 원본을 두고 런타임별로 적절한 파일명으로 배포
```

### 2.3 규칙 파일 크로스 인식 (중요!)

```
Zed가 인식하는 규칙 파일 (우선순위 순):
  1. .rules
  2. .cursorrules
  3. .windsurfrules
  4. .clinerules
  5. .github/copilot-instructions.md
  6. AGENT.md
  7. AGENTS.md
  8. CLAUDE.md
  9. GEMINI.md
  → 하나만 사용 (첫 매치)

Cline이 인식하는 규칙 파일:
  - .clinerules/ (1순위)
  - .cursorrules (자동 감지)
  - .windsurfrules (자동 감지)
  - AGENTS.md (자동 감지)

orch 시사점:
  → 규칙 파일을 여러 개 생성하면 크로스 도구 호환 가능
  → 또는 하나의 정규 파일 + symlink로 여러 이름 매핑
```

---

## 3. Tier 1 상세: Claude Code (Anthropic) — v0.1부터

### 3.1 설정 경로 전체 맵

```
글로벌 레벨:
  ~/.claude/
  ├── settings.json              # 권한, 환경변수, 일반 설정
  ├── agents/                    # 사용자 레벨 서브에이전트 (모든 프로젝트)
  │   └── <name>.md              # YAML frontmatter + Markdown
  ├── skills/                    # 사용자 레벨 스킬
  │   └── <name>/
  │       ├── SKILL.md           # 필수
  │       ├── scripts/           # 선택
  │       └── references/        # 선택
  ├── plugins/                   # 플러그인 (bkit 등)
  ├── agent-memory/              # 에이전트 퍼시스턴트 메모리 (user scope)
  └── commands/                  # 레거시 커맨드 (skills로 통합됨)

  ~/.mcp.json                    # MCP 서버 설정 (글로벌)

프로젝트 레벨:
  $PROJECT/
  ├── CLAUDE.md                  # 프로젝트 규칙/지시사항
  ├── .claude/
  │   ├── settings.json          # 프로젝트별 설정
  │   ├── settings.local.json    # 개인 오버라이드 (VCS 제외)
  │   ├── agents/                # 프로젝트별 에이전트
  │   ├── skills/                # 프로젝트별 스킬
  │   ├── hooks/                 # 라이프사이클 훅
  │   └── agent-memory/          # 에이전트 메모리 (project scope)
  └── .mcp.json                  # MCP 서버 설정 (프로젝트)
```

### 3.2 에이전트 파일 포맷 (agents/*.md)

```yaml
---
name: code-reviewer           # 필수. 소문자+하이픈
description: "코드 품질 검토"   # 필수. 자동 위임 판단에 사용
tools: Read, Grep, Glob       # 선택. 생략 시 모든 도구 상속
disallowedTools: Write, Edit   # 선택. 거부 목록
model: sonnet                  # 선택. sonnet|opus|haiku|inherit
permissionMode: default        # 선택. default|acceptEdits|plan|...
maxTurns: 10                   # 선택. 최대 턴 수
skills:                        # 선택. 프리로드할 스킬
  - api-conventions
memory: user                   # 선택. user|project|local
mcpServers:                    # 선택. MCP 서버 접근
  - slack
hooks:                         # 선택. 라이프사이클 훅
  PreToolUse: [...]
---

에이전트 시스템 프롬프트 (Markdown)
```

### 3.3 스킬 파일 포맷 (skills/*/SKILL.md)

```yaml
---
name: explain-code                   # 선택. 생략 시 디렉토리명
description: "코드를 시각적으로 설명"   # 권장. 자동 발견에 사용
argument-hint: "[filename]"          # 선택. 자동완성 힌트
disable-model-invocation: false      # 선택. true면 수동만 가능
user-invocable: true                 # 선택. false면 AI만 호출
allowed-tools: Read, Grep            # 선택. 도구 제한
model: sonnet                        # 선택. 모델 지정
context: fork                        # 선택. 서브에이전트에서 실행
agent: Explore                       # 선택. context:fork 시 에이전트 타입
hooks: {}                            # 선택. 스킬 범위 훅
---

스킬 지시사항 (Markdown)

동적 변수:
  $ARGUMENTS, $ARGUMENTS[0], $0, ${CLAUDE_SESSION_ID}

동적 컨텍스트 주입:
  !`gh pr diff`  → 셸 명령 결과가 삽입됨
```

### 3.4 symlink/Hot Reload/격리 전략

```
Symlink: 완전 지원 (디렉토리, 파일 모두)
Hot Reload: skills/ 즉시, agents/ 즉시, CLAUDE.md 세션 시작 시

orch 격리 전략:
  v0.1 (symlink only):
    ~/.claude/agents/   → symlink 전환
    ~/.claude/skills/   → symlink 전환
    $PROJECT/CLAUDE.md  → symlink 전환

  v0.2+ (+ namespace):
    ~/.mcp.json         → namespace (__orch_<profile>__ 접두사)

  건드리면 안 되는 파일:
    ~/.claude/settings.json          ← 사용자 개인 설정
    .claude/settings.local.json      ← 개인 오버라이드
    ~/.claude/agent-memory/          ← 학습 데이터
```

---

## 4. Tier 1 상세: Codex CLI (OpenAI) — v0.3부터

### 4.1 설정 경로 전체 맵

```
글로벌 레벨:
  ~/.codex/                          # CODEX_HOME 환경변수로 변경 가능
  ├── config.toml (또는 config.json) # 메인 설정
  ├── AGENTS.md                      # 글로벌 지시사항
  ├── AGENTS.override.md             # 글로벌 오버라이드 (있으면 AGENTS.md 대신 사용)
  ├── auth.json                      # 인증 정보
  ├── skills/                        # 사용자 레벨 스킬
  │   └── <name>/
  │       └── SKILL.md
  └── history.jsonl                  # 세션 히스토리

프로젝트 레벨:
  $PROJECT/
  ├── AGENTS.md                      # 프로젝트 지시사항
  ├── AGENTS.override.md             # 프로젝트 오버라이드
  ├── .codex/
  │   └── config.toml                # 프로젝트별 설정 오버라이드
  └── .agents/
      └── skills/                    # 프로젝트 스킬
          └── <name>/
              └── SKILL.md
```

### 4.2 주요 특징

- `AGENTS.override.md` 존재 시 `AGENTS.md` 완전 무시
- 합산 지시사항 크기 32KB 제한
- 자체 프로파일 시스템 (`codex --profile review`) — orch와 역할 겹침 가능
- `CODEX_HOME` 환경변수로 설정 디렉토리 자체 변경 가능

### 4.3 orch 격리 전략

```
v0.3:
  ~/.codex/      → symlink 전환 (디렉토리 전체)
                   또는 CODEX_HOME 환경변수 활용
  AGENTS.md      → symlink 전환 (파일)
  .agents/skills → symlink 전환 (디렉토리)
```

---

## 5. Tier 1 상세: Cursor (Anysphere) — v0.3부터

### 5.1 설정 경로 전체 맵

```
글로벌 레벨:
  Cursor Settings UI > Rules for AI    # 글로벌 사용자 규칙 (텍스트, orch 접근 불가)
  ~/.cursor/
  └── mcp.json                         # 글로벌 MCP 설정

프로젝트 레벨:
  $PROJECT/
  ├── .cursor/
  │   ├── rules/                       # 프로젝트 규칙 (v0.45+)
  │   │   └── *.mdc                    # YAML frontmatter + Markdown
  │   ├── skills/                      # 프로젝트 스킬 ← NEW (2026~)
  │   │   └── <name>/
  │   │       └── SKILL.md
  │   └── mcp.json                     # 프로젝트 MCP 설정
  └── .cursorrules                     # 레거시 (deprecated)
```

### 5.2 .mdc 규칙 포맷

```yaml
---
description: "규칙의 목적 설명"
globs: "src/**/*.ts,src/**/*.tsx"    # Auto-Attach 시
alwaysApply: false
---

# 규칙 본문 (Markdown)
```

**규칙 타입:**
| 타입 | 조건 | 동작 |
|------|------|------|
| **Always** | `alwaysApply: true` | 항상 컨텍스트에 포함 |
| **Auto-Attach** | `globs` 있음 | 매칭 파일 참조 시 활성화 |
| **Agent** | `description`만 있음 | AI가 관련성 판단 |
| **Manual** | 아무것도 없음 | `@rule-name`으로 수동 호출 |

### 5.3 스킬 지원 (NEW — 2026)

```
Cursor가 Agent Skills(SKILL.md) 지원을 시작:
  - .cursor/skills/<name>/SKILL.md
  - 슬래시 커맨드 메뉴로 호출
  - 자동 발견: description 기반 의미적 매칭
  - 서브에이전트 시스템과 연동

이전 버전에서의 변경:
  v2.0 문서: "Cursor: 스킬 미지원, .mdc 변환 필요"
  v3.0 수정: "Cursor: SKILL.md 네이티브 지원"
```

### 5.4 orch 격리 전략

```
v0.3:
  .cursor/rules/    → copy 전략 (symlink 미확인)
                       Markdown → .mdc frontmatter 변환 필요
  .cursor/skills/   → symlink 시도, 실패 시 copy ← NEW
  .cursor/mcp.json  → namespace (__orch__ 접두사)

건드리면 안 되는 설정:
  Cursor Settings UI 의 User Rules ← orch가 접근 불가
```

---

## 6. Tier 1 상세: Gemini CLI (Google) — v0.3부터

### 6.1 설정 경로 전체 맵

```
글로벌 레벨:
  ~/.gemini/
  ├── settings.json              # 메인 설정 (모델, MCP, 도구, 보안 등)
  ├── GEMINI.md                  # 글로벌 컨텍스트/규칙
  ├── mcp-server-enablement.json # MCP 서버 활성화 상태
  └── extensions/                # 확장 기능

시스템 레벨:
  /etc/gemini-cli/system-defaults.json    # 시스템 기본값
  /etc/gemini-cli/settings.json           # 시스템 오버라이드 (최고 우선순위)

프로젝트 레벨:
  $PROJECT/
  ├── GEMINI.md (또는 AGENT.md)  # 프로젝트 규칙
  └── .gemini/
      ├── settings.json          # 프로젝트별 설정
      └── sandbox.Dockerfile     # 커스텀 샌드박스
```

### 6.2 주요 특징

- **Hot Reload 미지원** → 전환 후 CLI 재시작 안내 필수
- Antigravity와 `GEMINI.md`, `~/.gemini/settings.json` 공유
- 설정 우선순위: 하드코딩 < system-defaults < 사용자 < 프로젝트 < 시스템 오버라이드 < 환경변수 < CLI 인자
- `/memory refresh`로 GEMINI.md 리로드 가능

### 6.3 orch 격리 전략

```
v0.3:
  GEMINI.md          → symlink (파일)
  settings.json MCP  → namespace (__orch_<profile>__ 접두사, mcpServers 키만 조작)

건드리면 안 되는 파일:
  settings.json 전체  ← MCP 키 외의 설정은 보존
```

---

## 7. Tier 1 상세: Windsurf (Codeium) — v0.3부터

### 7.1 설정 경로 전체 맵

```
글로벌 레벨:
  ~/.codeium/windsurf/
  ├── skills/                    # 글로벌 스킬
  │   └── <name>/
  │       └── SKILL.md
  └── global_rules.md            # 글로벌 규칙

프로젝트 레벨:
  $PROJECT/
  ├── .windsurf/
  │   ├── rules/                 # 프로젝트 규칙 (신규)
  │   │   └── rules.md
  │   └── skills/                # 프로젝트 스킬
  │       └── <name>/
  │           └── SKILL.md
  ├── .windsurfrules             # 레거시 규칙 파일
  └── .agents/skills/            # Agent Skills 표준 경로도 인식 (2026.02~)
```

### 7.2 규칙 포맷

```
규칙 활성화 모드 (4종):
  - Manual: @멘션으로 수동 호출
  - Always On: 항상 적용
  - Model Decision: AI가 description 기반 판단
  - Glob: 파일 패턴 매칭

제한:
  - 개별 규칙 파일 6,000자 제한 (초과 시 잘림)
  - 글로벌 + 로컬 합산 12,000자 제한 (글로벌 우선)
```

### 7.3 스킬 지원 (NEW — 2026.01)

```
2026.01.12: Agent Skills(SKILL.md) 지원 시작
2026.02.12: .agents/skills/ 경로 추가 인식

스킬 구조:
  <skill-name>/
  ├── SKILL.md               # 필수 (YAML frontmatter: name, description)
  └── scripts/, templates/   # 선택 (지원 파일)

발견 방식:
  - 자동: Cascade가 description 기반 관련성 분석하여 자동 호출
  - 수동: @skill-name으로 호출
```

### 7.4 orch 격리 전략

```
v0.3:
  .windsurf/rules/     → copy 또는 symlink (테스트 필요)
  .windsurf/skills/    → symlink 시도
  ~/.codeium/windsurf/skills/ → symlink (글로벌)

건드리면 안 되는 파일:
  Cascade Memories     ← AI 자동 학습 데이터
```

---

## 8. Tier 2 상세 요약

### 8.1 Cline (VS Code Extension)

```
규칙 경로:
  프로젝트: .clinerules/ (디렉토리, 모든 .md/.txt 자동 연결)
           .clinerules  (단일 파일, 레거시)
  글로벌:  ~/Documents/Cline/Rules/

크로스 인식:
  .cursorrules, .windsurfrules, AGENTS.md 자동 감지

조건부 규칙 (frontmatter):
  ---
  paths:
    - "src/components/**"
  ---

스킬 경로:
  프로젝트: .cline/.skills/<name>/SKILL.md
  글로벌:  ~/.cline/.skills/<name>/SKILL.md

특징:
  - 오픈소스, API 키 직접 사용
  - 조건부 규칙으로 컨텍스트 최적화
```

### 8.2 Antigravity (Google)

```
규칙: GEMINI.md (Gemini CLI와 공유)

스킬 경로:
  프로젝트: .agent/skills/<name>/SKILL.md
  글로벌:  ~/.gemini/antigravity/skills/

워크플로우: .agent/workflows/<name>.md (/command로 트리거)

특징:
  - symlink 공식 권장
  - {{SKILL_PATH}}, {{WORKSPACE_PATH}} 변수
  - .gemini/antigravity/brain/ (자동 지식 베이스, 건드리면 안 됨)
```

### 8.3 Zed

```
규칙:
  .rules (고유), .cursorrules, .windsurfrules, .clinerules,
  .github/copilot-instructions.md, AGENT.md, AGENTS.md,
  CLAUDE.md, GEMINI.md
  → 첫 매치만 사용 (1개)

글로벌: Rules Library (UI)

특징:
  - SKILL.md 미지원
  - 9개 규칙 파일 형식 자동 인식 → 크로스 도구 호환 최강
  - Rust 기반 120fps 에디터
```

### 8.4 GitHub Copilot

```
규칙: .github/copilot-instructions.md

스킬: .github/skills/<name>/SKILL.md (네이티브 지원)

특징:
  - VS Code, JetBrains, Neovim 등 광범위한 IDE 지원
  - 규칙은 자동으로 모든 Copilot Chat 요청에 첨부
```

### 8.5 Roo Code

```
규칙: .roo/ 디렉토리 내 커스텀 모드 설정
스킬: .roo/skills/<name>/SKILL.md
특징:
  - Custom Modes로 도구 권한 스코핑
  - AGENTS.md 표준 논의 중
```

---

## 9. 규칙 파일 패턴 분류

### 9.1 세 가지 패턴

```
패턴 A: "단일 Markdown 파일"
  파일: CLAUDE.md, AGENTS.md, GEMINI.md, .cursorrules, .windsurfrules, .rules
  사용: Claude Code, Codex, Gemini CLI, Antigravity, Zed (레거시 모드)
  전략: symlink (파일 단위)

패턴 B: "디렉토리 기반 규칙"
  파일: .cursor/rules/*.mdc, .windsurf/rules/, .clinerules/
  사용: Cursor, Windsurf (신규), Cline
  전략: copy 또는 디렉토리 symlink
  변환: 일부 도구는 .mdc frontmatter 변환 필요

패턴 C: "설정 파일 내 규칙"
  파일: copilot-instructions.md, Cursor Settings UI
  사용: GitHub Copilot, Cursor (글로벌)
  전략: copy (프로그래밍 접근 제한적)
```

### 9.2 orch 규칙 변환 매트릭스

```
프로파일 규칙 원본 (Markdown) →

  → CLAUDE.md       (그대로, 패턴 A)
  → AGENTS.md       (그대로, 패턴 A)
  → GEMINI.md       (그대로, 패턴 A)
  → .rules          (그대로, 패턴 A)
  → .cursorrules    (그대로, 패턴 A — deprecated)
  → .windsurfrules  (그대로, 패턴 A)
  → .clinerules     (그대로, 패턴 A — 단일 파일 모드)
  → .cursor/rules/rule.mdc (frontmatter 추가, 패턴 B)
  → .github/copilot-instructions.md (그대로, 패턴 C)
```

---

## 10. 스킬 경로 통합 매핑

### 10.1 SKILL.md 경로 매핑 (모든 도구)

```
하나의 스킬 원본 → 모든 도구에 배포:

  원본: ~/.orch/profiles/<profile>/files/skills/<name>/SKILL.md

  → Claude Code:    ~/.claude/skills/<name>/             symlink
  → Codex CLI:      ~/.codex/skills/<name>/              symlink
  → Cursor:         $PROJECT/.cursor/skills/<name>/      symlink|copy
  → Windsurf:       $PROJECT/.windsurf/skills/<name>/    symlink|copy
                    ~/.codeium/windsurf/skills/<name>/   symlink (글로벌)
  → Cline:          $PROJECT/.cline/.skills/<name>/      symlink|copy
  → Antigravity:    $PROJECT/.agent/skills/<name>/       symlink
  → GitHub Copilot: $PROJECT/.github/skills/<name>/      copy
  → Roo Code:       $PROJECT/.roo/skills/<name>/         symlink|copy
  → Amp:            $PROJECT/.agents/skills/<name>/      symlink
  → OpenCode:       $PROJECT/.agents/skills/<name>/      symlink
```

### 10.2 MCP 설정 매핑

```
| 런타임        | MCP 경로                        | 포맷                     | 전략       |
|--------------|-------------------------------|-------------------------|-----------|
| Claude Code  | ~/.mcp.json                   | { mcpServers: {} }      | namespace |
| Cursor       | .cursor/mcp.json              | { mcpServers: {} }      | namespace |
| Windsurf     | mcp 설정                       | 미확인                   | TBD       |
| Gemini CLI   | ~/.gemini/settings.json 내     | settings.mcpServers     | namespace |
| Antigravity  | .vscode/mcp.json              | { mcpServers: {} }      | namespace |
| Codex CLI    | —                             | MCP 미지원 (2026.02)    | none      |
```

---

## 11. manifest.yaml 런타임 설정 (v3.0)

### v0.1 (단일 런타임)

```yaml
name: omc
description: "멀티 에이전트 오케스트레이션"
runtime: claude

links:
  - source: files/agents/
    target: $HOME/.claude/agents/
  - source: files/CLAUDE.md
    target: $PROJECT/CLAUDE.md
```

### v0.3+ (어댑터 기반 멀티 런타임)

```yaml
name: omc
description: "멀티 에이전트 오케스트레이션"
runtimes:
  supported: [claude, codex, cursor, windsurf, cline, gemini, antigravity]
  primary: claude

# 공통 스킬 (SKILL.md 표준 — 모든 런타임에 자동 배포)
skills:
  - source: files/skills/
    # 각 런타임 어댑터가 적절한 경로에 매핑

# 공통 규칙 (런타임별 변환)
rules:
  - source: files/rules.md
    # 어댑터가 CLAUDE.md, AGENTS.md, .mdc 등으로 변환

# 런타임별 커스텀 설정 (필요 시)
overrides:
  claude:
    - source: files/claude-agents/
      target: $HOME/.claude/agents/
      strategy: symlink

  cursor:
    - source: files/cursor-rules/
      target: $PROJECT/.cursor/rules/
      strategy: copy
      transform: to-mdc

  codex:
    env:
      CODEX_HOME: $ORCH_HOME/profiles/omc/codex-home
```

---

## 12. 런타임 감지 로직 (v3.0)

```typescript
interface RuntimeDetection {
  id: string;
  name: string;
  vendor: string;
  type: 'cli' | 'ide' | 'extension';
  installed: boolean;
  version?: string;
  tier: 1 | 2 | 3;

  // 표준 지원
  skillsSupport: boolean;       // SKILL.md 지원 여부
  agentsmdSupport: boolean;     // AGENTS.md 지원 여부

  // 전략
  symlinkSupport: 'confirmed' | 'likely' | 'unknown';
  hotReload: boolean;
  restartMessage?: string;
}

// 감지 순서: 바이너리 존재 → 설정 디렉토리 존재 → 버전 체크
const DETECTION_METHODS: Record<string, () => Promise<boolean>> = {
  claude:       () => which('claude'),
  codex:        () => which('codex'),
  cursor:       () => which('cursor') || exists('.cursor/'),
  windsurf:     () => which('windsurf') || exists('.windsurf/'),
  cline:        () => exists('.clinerules') || exists('.cline/'),
  gemini:       () => which('gemini'),
  antigravity:  () => which('agy') || exists('.agent/'),
  zed:          () => which('zed'),
  copilot:      () => exists('.github/copilot-instructions.md'),
  roocode:      () => exists('.roo/'),
  amp:          () => which('amp'),
  opencode:     () => which('opencode'),
};
```

---

## 13. 크로스 런타임 분석

### 13.1 설정 경로 충돌 매트릭스

```
경로 충돌:
  GEMINI.md               ← Gemini CLI + Antigravity 공유
  ~/.gemini/settings.json ← Gemini CLI + Antigravity 공유

충돌 없음:
  CLAUDE.md    ← Claude Code 전용
  AGENTS.md    ← Codex CLI / OpenCode / Amp 전용
  ~/.claude/   ← Claude Code 전용
  ~/.codex/    ← Codex CLI 전용
  .cursor/     ← Cursor 전용
  .windsurf/   ← Windsurf 전용
  .clinerules/ ← Cline 전용
  .agent/      ← Antigravity 전용
  .roo/        ← Roo Code 전용
  .github/     ← GitHub Copilot 전용
```

### 13.2 "한 번 만들어서 모든 곳에" 전략

```
프로파일 구성:
  ~/.orch/profiles/my-profile/
  ├── manifest.yaml          # 메타데이터 + 런타임 설정
  ├── files/
  │   ├── rules.md           # 규칙 원본 (Markdown)
  │   ├── skills/            # SKILL.md 스킬 (표준 포맷)
  │   │   ├── code-review/
  │   │   │   └── SKILL.md
  │   │   └── deploy/
  │   │       ├── SKILL.md
  │   │       └── scripts/
  │   ├── agents/            # Claude Code 전용 에이전트
  │   └── workflows/         # Antigravity 전용 워크플로우
  └── adapters/              # 런타임별 변환 결과 (자동 생성)
      ├── claude/
      │   └── CLAUDE.md      # rules.md → CLAUDE.md
      ├── codex/
      │   └── AGENTS.md      # rules.md → AGENTS.md
      ├── cursor/
      │   └── rules/
      │       └── rule.mdc   # rules.md → .mdc 변환
      └── gemini/
          └── GEMINI.md      # rules.md → GEMINI.md
```

---

## 14. 주의사항 총정리

### 14.1 건드리면 안 되는 파일 (전 런타임)

```
Claude Code:
  ~/.claude/settings.json, .claude/settings.local.json, ~/.claude/agent-memory/

Codex CLI:
  ~/.codex/auth.json, ~/.codex/history.jsonl

Cursor:
  Cursor Settings UI (User Rules), 글로벌 설정

Gemini CLI:
  settings.json (MCP 외 설정), mcp-server-enablement.json

Windsurf:
  Cascade Memories (AI 학습)

Antigravity:
  .gemini/antigravity/brain/ (자동 지식 베이스)

Cline:
  ~/Documents/Cline/Rules/ (사용자 글로벌 규칙 — 건드리지 않되, 인식은 해야 함)
```

### 14.2 크기 제한

```
Codex CLI:   지시사항 합산 32KB
Cursor:      규칙 500줄 이하 권장
Windsurf:    개별 규칙 6,000자, 합산 12,000자
Claude Code: 스킬 description이 컨텍스트 예산 2% 차지
```

### 14.3 전환 후 안내 메시지 (런타임별)

```
즉시 적용:      Claude Code, Codex CLI
세션 재시작:     Claude Code (CLAUDE.md), Cline
CLI 재시작:     Gemini CLI
IDE 재시작:     Cursor, Windsurf
프로젝트 재오픈: Antigravity, Zed
```
