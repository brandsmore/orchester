# agent orchester

> AI 코딩 도구의 오케스트레이션 프로파일을 한 번의 키 입력으로 전환하는 TUI 매니저

<p align="center">
  <img src="https://img.shields.io/badge/version-0.2.0-blue" alt="version" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-green" alt="node" />
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="license" />
</p>

## agent orchester란?

Claude Code, Codex CLI, OpenCode 같은 AI 코딩 도구들은 오케스트레이션 레이어를 지원합니다 — agents, skills, hooks, plugins 등으로 기능을 확장할 수 있죠. **omc**, **ecc**, **bkit**, **superpowers** 등 인기 있는 오케스트레이션 패키지들이 있습니다.

문제는 **한 번에 하나의 오케스트레이션 레이어만 사용할 수 있다**는 것입니다. 전환하려면 `~/.claude/`나 `~/.config/opencode/` 안의 파일들을 수동으로 옮겨야 합니다.

**agent orchester**는 오케스트레이션 프로파일을 격리 관리하고, 터미널 UI에서 키 하나로 전환할 수 있게 해줍니다.

## 주요 기능

- **원키 전환** — 프로파일 선택 후 Enter. 끝.
- **바닐라 스냅샷** — 첫 실행 시 기존 설정을 자동 백업. "none"으로 언제든 복원.
- **안전한 심링크** — 파일 복사 대신 심링크 사용. 원본은 그대로 유지.
- **플러그인 지원** — 플러그인 타입 설치(`/plugin install` 등)를 인식하고 TUI에서 수동 명령어를 안내. 하이브리드 프로파일은 심링크와 플러그인을 조합.
- **자동 롤백** — 전환 중 오류 발생 시 이전 설정을 자동 복구.
- **내장 레지스트리** — TUI에서 바로 인기 오케스트레이션 패키지(omc, ecc, bkit, superpowers 등) 설치.
- **커스텀 URL 설치** — 모든 Git 저장소를 커스텀 프로파일로 추가.
- **런타임 감지** — 시스템에 설치된 AI 도구 표시 (Claude Code, Codex, OpenCode, Gemini 등).
- **사용량 대시보드** — 모든 AI 코딩 도구의 토큰 사용량을 한 곳에서 확인.
- **Diff 미리보기** — 전환 전 정확히 뭐가 바뀌는지 확인.
- **다국어 지원** — 영어, 한국어, 일본어, 중국어 인터페이스.

## 빠른 시작

```bash
# 클론 및 설치
git clone https://github.com/brandsmore/orchester.git
cd orchester
npm install

# 실행
npm run dev
```

첫 실행 시 agent orchester가 자동으로:
1. 설치된 AI 코딩 도구를 감지
2. 기존 오케스트레이션 설정을 스캔
3. 바닐라 스냅샷(현재 설정 백업) 생성

## 사용법

### 메인 화면

```
╭──────────────────────────────────────────────────╮
│ agent orchester v0.2  프로파일 매니저             │
├──────────────────────────────────────────────────┤
│ 런타임  claude ✓  codex ✓  opencode ✗           │
├──────────────────────────────────────────────────┤
│ ● omc — 28 에이전트, 37 스킬 [orchestration]    │
│ ○ ecc — 종합 스타터 킷                          │
│ ○ superpowers 🔀 — TDD 워크플로우, 멀티 도구     │
│ ○ none (바닐라)                                  │
├──────────────────────────────────────────────────┤
│ Enter 선택  i 설치  u 사용량  h 도움말            │
╰──────────────────────────────────────────────────╯
```

### 단축키

| 키 | 동작 |
|----|------|
| `↑` `↓` | 프로파일 탐색 |
| `Enter` | 프로파일 선택/활성화 |
| `i` | 설치 레지스트리 열기 |
| `u` | 사용량 대시보드 |
| `h` | 도움말 |
| `l` | 언어 변경 |
| `q` | 종료 |

### 설치 화면

| 키 | 동작 |
|----|------|
| `↑` `↓` | 레지스트리 탐색 |
| `Enter` | 선택한 프로파일 설치 |
| `a` | Git URL로 프로파일 추가 |
| `d` | 프로파일 삭제 |
| `Esc` | 뒤로 |

## 동작 원리

agent orchester는 **2단계 모델**을 사용합니다:

### 1단계: 설치 (Install)
오케스트레이션 패키지를 `~/.orchester/profiles/`에 다운로드합니다. 파일을 로컬에 저장하지만 **활성화하지는 않습니다**.

### 2단계: 활성화 (Activate)
프로파일의 파일들을 대상 도구의 설정 디렉토리(예: `~/.claude/agents/`)에 심링크로 연결합니다. 한 번에 하나의 프로파일만 활성화할 수 있습니다. 플러그인 타입 링크의 경우, AI 코딩 도구에서 실행할 수동 명령어를 안내합니다.

```
~/.orchester/
├── state.json              # 활성 프로파일 추적
├── vanilla/                # 원본 설정 백업
├── custom-registry.json    # 사용자 추가 프로파일
└── profiles/
    ├── omc/
    │   ├── manifest.yaml   # 프로파일 메타데이터 + 링크 정의
    │   └── files/          # agents/, skills/, hooks/
    ├── ecc/
    └── superpowers/
```

### 전환 흐름 (4단계)

```
검증 → 이전 프로파일 비활성화 → 새 프로파일 활성화 → 확인
              ↓ (실패 시)
         바닐라 자동 복원
```

### 설치 타입

| 타입 | 아이콘 | 설명 |
|------|--------|------|
| `symlink` | (기본) | 표준 심링크 기반 설치 |
| `plugin` | 🔌 | 수동 실행할 플러그인 명령어 안내 |
| `hybrid` | 🔀 | 심링크와 플러그인 명령어 조합 |

## 내장 레지스트리

| 이름 | Stars | 설명 | 대상 도구 |
|------|-------|------|----------|
| omc | 6.4K | 28 에이전트, 37 스킬, Team 모드 | Claude Code |
| ecc | 44.7K | 13 에이전트, 30+ 스킬, 해커톤 우승작 | Claude Code |
| bkit | 91 | PDCA 기반 AI 네이티브 워크플로우 | Claude Code |
| wshobson-agents | 28.7K | 73 플러그인, 112 에이전트, 146 스킬 | Claude Code |
| oh-my-opencode | 31.6K | Sisyphus 오케스트레이터, 멀티 에이전트 | OpenCode |
| claude-orchestra | 32 | 47 에이전트, 10 팀 조직도 구조 | Claude Code |
| superpowers | 53.5K | Agentic 스킬 프레임워크, TDD 워크플로우 | Claude Code |

`a` 키로 모든 Git 저장소를 커스텀 프로파일로 추가할 수도 있습니다.

## 지원 런타임

| 런타임 | 감지 | 사용량 데이터 |
|--------|------|-------------|
| Claude Code | `~/.claude/` | stats-cache.json에서 토큰 사용량 |
| Codex CLI | `~/.codex/` | 세션별 토큰 추적 |
| OpenCode | `~/.config/opencode/` | 세션 수 |
| Gemini CLI | `~/.gemini/` | 감지만 |
| Cursor | `~/.cursor/` | 감지만 |
| Antigravity | `~/.antigravity/` | 감지만 |

## 기술 스택

- **[Ink](https://github.com/vadimdemedes/ink)** — CLI용 React
- **[@inkjs/ui](https://github.com/vadimdemedes/ink-ui)** — UI 컴포넌트 (Select, Spinner, Alert, Badge)
- **TypeScript** — 완전한 타입 안전성
- **meow** — CLI 인자 파싱

## 로드맵

- **v0.3** — MCP 네임스페이스 격리, 프로젝트별 프로파일, 프로파일 합성 (믹스 & 매치)
- **v1.0** — 멀티 런타임 완전 지원, 프로파일 마켓플레이스

## 라이선스

MIT

## 제작

**BrandsMore** — dev@brandsmore.co.kr

---

[English](./README.md) · [日本語](./README.ja.md) · [中文](./README.zh.md)
