# Plan: orch v0.1 — MVP

> PDCA Phase: Plan | Created: 2026-02-16 | Feature: orch-v0.1
> Full Roadmap: `orch-cli.plan.md` 참조
> 런타임 특성: `technical/runtime-profiles.md` 참조
> 격리 메커니즘: `technical/isolation-mechanism.md` 참조

---

## 1. MVP 목표

```
"npx orch 하나로 프로파일이 뭔지 이해하고, 뭐가 바뀌는지 확인하고,
 깨끗하게 전환하고, 언제든 원래대로 돌릴 수 있다."
```

## 2. 범위

### 포함

| 기능 | 설명 |
|------|------|
| TUI 프로파일 선택 | 이름 + 설명 + 태그로 뭔지 바로 파악 |
| 변경 미리보기 | 전환 전 제거/적용 항목 diff 표시 |
| 격리 전환 | symlink only, merge 금지 |
| vanilla 보존/복원 | `none` 선택으로 원본 복원 |
| 전환 결과 표시 | 성공/실패 + 변경 내역 |
| 레지스트리 Install | 알려진 도구를 git clone으로 프로파일 설치 |
| 시스템 감지 | 설치된 런타임 + 활성 오케스트레이션 레이어 감지 |
| 충돌 보호 | 이미 시스템에 있는 도구는 Install 차단 |
| 다국어 지원 (i18n) | en, ko, ja, zh 4개 언어, 시스템 로케일 자동 감지, `l` 키로 전환 |

### 제외 (Roadmap에 있음)

| 기능 | 시기 |
|------|------|
| MCP namespace 격리 | v0.2 |
| 멀티 런타임 어댑터 | v0.3 |
| doctor / auto-fix | v0.3 |
| 분할 패널 대시보드 | v0.4 |
| registry / 검색 | v0.5 |
| 프로파일 compose | v1.0 |
| 크로스 CLI 통합 | v1.0 |

## 3. 대상 런타임

v0.1은 **Claude Code 전용**. 멀티 런타임은 v0.3 이후.

## 4. 핵심 개념: Install vs Activate (2-Phase 모델)

orch는 프로파일을 **Install(다운로드)**과 **Activate(활성화)** 두 단계로 분리한다.
이 분리가 orch의 안전성의 핵심이다.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Phase 1: INSTALL (다운로드)                                     │
│  ─────────────────────────                                      │
│  • git clone → ~/.orch/profiles/<name>/files/ 에 파일 복사       │
│  • manifest.yaml 생성                                           │
│  • 시스템에 아무 영향 없음                                       │
│  • ~/.claude/, CLAUDE.md 등 전혀 건드리지 않음                   │
│  • 여러 프로파일을 동시에 설치해둘 수 있음                        │
│                                                                 │
│  비유: 앱스토어에서 앱 다운로드 (아직 실행 안 함)                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Phase 2: ACTIVATE (활성화)                                      │
│  ─────────────────────────                                      │
│  • 프로파일 목록에서 선택 → DiffPreview → Enter                  │
│  • 기존 활성 프로파일의 symlink 제거 (Deactivate)                │
│  • 새 프로파일의 symlink 생성 (Activate)                         │
│  • 이 시점에 ~/.claude/agents/, skills/ 등이 교체됨              │
│  • 한 번에 1개 프로파일만 활성 (Single Active 원칙)              │
│                                                                 │
│  비유: 다운로드한 앱을 실행 (기존 앱은 종료됨)                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 왜 분리하는가

```
문제: "omc를 설치하면 지금 쓰고 있는 bkit이 날아가나?"

답: 아니다.
  Install = ~/.orch/profiles/omc/ 에 파일을 복사할 뿐.
  Activate = 프로파일 목록에서 omc를 선택하면 그때 bkit → omc 전환.

이 분리 덕분에:
  1. 여러 프로파일을 미리 설치해두고 필요할 때 전환 가능
  2. 설치 자체가 안전 — 현재 작업 환경에 영향 없음
  3. 전환 전에 DiffPreview로 뭐가 바뀌는지 확인 가능
```

### 상태 흐름

```
                  Install           Activate
레지스트리 ──────────→ ~/.orch/profiles/ ──────────→ ~/.claude/ (symlink)
 (git clone)           (저장만)           (전환 시)

  omc  ───Install───→  profiles/omc/     ─┐
  ecc  ───Install───→  profiles/ecc/      ├── 하나만 Activate 가능
  bkit  (시스템에 이미 있음 → Install 차단) │
                                          │
                              현재 활성: ──┘ omc (선택한 것)
```

### TUI에서의 표현

```
Install 화면 (i 키):
  ⚠ Active on system: bkit
  Installing a new profile won't affect your current setup.
  Activating it later from the profile list will replace the active layer.

  ✓ omc   ★ 2.1K   5 modes, 32 agents          ← Install 가능
    ecc   ★ 44.7K  comprehensive starter kit    ← Install 가능
  ● bkit  ★ -      PDCA workflow  [already on system]  ← Install 차단

Install 완료 후:
  Profile downloaded. To activate, select it from the profile list.
  Activating will replace current: bkit

프로파일 목록 (메인 화면):
  ● omc — 5 modes, 32 agents               ← 활성
  ○ ecc — comprehensive starter kit        ← 설치됨, 비활성
  ○ none — Restore vanilla                 ← 원본 복원
```

### 시스템에 이미 있는 도구 (충돌 보호)

```
시나리오: bkit이 bkit-marketplace 플러그인으로 이미 설치되어 있음

Install 화면에서 bkit 선택 시:
  ✗ bkit is already installed on your system
    → plugin: bkit v1.5.2 (~/.claude/plugins/cache/bkit-marketplace/...)

  orch cannot overwrite an active installation.
  To manage it with orch, first uninstall it from its original source,
  then install via orch.

이유:
  • 같은 도구가 두 곳(원본 + orch)에서 관리되면 충돌
  • 사용자가 원본을 먼저 제거한 후 orch로 관리하도록 유도
  • 감지 소스: ~/.claude/plugins/installed_plugins.json + agents/ 디렉토리 스캔
```

## 5. UX 시나리오

### 5.1 첫 실행 — `npx orch`

orch 미초기화 상태에서 실행 시 자동으로 init 수행.

```
┌─ orch ─ 초기 설정 ─────────────────────────────────────────┐
│                                                             │
│  orch를 처음 실행합니다.                                     │
│  현재 설정을 원본(vanilla)으로 저장합니다.                    │
│                                                             │
│  감지된 설정:                                                │
│    ~/.claude/agents/    (12 files)                           │
│    ~/.claude/skills/    (5 files)                            │
│    ~/project/CLAUDE.md  (exists)                             │
│                                                             │
│  ████████████████████████████████████████  100%              │
│  ✓ vanilla 스냅샷 저장 완료                                  │
│                                                             │
│  [Enter] 계속                                                │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 프로파일 목록 — 뭔지 알 수 있게

```
┌─ orch ─────────────────────────────────────────────────────┐
│                                                             │
│  › ● oh-my-claudecode          5 modes, 32 agents           │
│      멀티 에이전트 오케스트레이션 (autopilot/swarm/pipeline) │
│                                                             │
│    ○ bkit                      PDCA workflow                │
│      AI 네이티브 개발 파이프라인 (plan→design→do→check)      │
│                                                             │
│    ○ everything-claude-code    agents + skills + hooks       │
│      프로덕션 레디 설정 종합 스타터킷                        │
│                                                             │
│    ○ none                                                   │
│      원본 상태로 복원 (vanilla)                              │
│                                                             │
│  [Enter] 상세보기  [q] 종료                                  │
└─────────────────────────────────────────────────────────────┘

● = 현재 활성
○ = 비활성
```

정보 출처: manifest.yaml의 `description`, `tags` 필드

### 5.3 변경 미리보기 — 뭐가 바뀌는지

프로파일 선택 후 Enter → 전환 전 변경사항 표시.

```
┌─ bkit 으로 전환 ────────────────────────────────────────────┐
│                                                              │
│  현재: oh-my-claudecode (active)                             │
│  변경: bkit                                                  │
│                                                              │
│  ┌─ 제거 (omc) ─────────────────────────────────────────────┐│
│  │  ✗ ~/.claude/agents/    ← omc/agents/         unlink    ││
│  │  ✗ ~/.claude/skills/    ← omc/skills/         unlink    ││
│  │  ✗ ~/project/CLAUDE.md  ← omc/CLAUDE.md       unlink    ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─ 적용 (bkit) ────────────────────────────────────────────┐│
│  │  ✓ ~/.claude/agents/    → bkit/agents/         link      ││
│  │  ✓ ~/.claude/skills/    → bkit/skills/         link      ││
│  │  ✓ ~/.claude/plugins/   → bkit/plugins/        link      ││
│  │  ✓ ~/project/CLAUDE.md  → bkit/CLAUDE.md       link      ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  [Enter] 전환 실행  [Esc] 취소                               │
└──────────────────────────────────────────────────────────────┘
```

### 5.4 전환 실행 — 결과 표시

```
┌─ 전환 완료 ─────────────────────────────────────────────────┐
│                                                              │
│  ✓ omc 비활성화 (3 links removed)                            │
│  ✓ bkit 활성화 (4 links created)                             │
│                                                              │
│  Active: bkit                                                │
│                                                              │
│  [Enter] 돌아가기  [q] 종료                                   │
└──────────────────────────────────────────────────────────────┘
```

### 5.5 none 선택 — vanilla 복원

```
┌─ 원본 복원 (vanilla) ───────────────────────────────────────┐
│                                                              │
│  현재: bkit (active)                                         │
│  변경: 모든 프로파일 해제, 원본 복원                          │
│                                                              │
│  ┌─ 제거 ───────────────────────────────────────────────────┐│
│  │  ✗ ~/.claude/agents/    ← bkit/agents/       unlink     ││
│  │  ✗ ~/.claude/skills/    ← bkit/skills/       unlink     ││
│  │  ✗ ~/.claude/plugins/   ← bkit/plugins/      unlink     ││
│  │  ✗ ~/project/CLAUDE.md  ← bkit/CLAUDE.md     unlink     ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─ 복원 ───────────────────────────────────────────────────┐│
│  │  ↩ ~/.claude/agents/    ← vanilla 원본                   ││
│  │  ↩ ~/project/CLAUDE.md  ← vanilla 원본                   ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  [Enter] 복원 실행  [Esc] 취소                               │
└──────────────────────────────────────────────────────────────┘
```

### 5.6 전환 실패 시

```
┌─ 전환 실패 ─────────────────────────────────────────────────┐
│                                                              │
│  ✗ bkit 활성화 실패                                          │
│    원인: ~/.claude/agents/ 쓰기 권한 없음                     │
│                                                              │
│  ✓ 바닐라 상태로 자동 복원되었습니다.                         │
│                                                              │
│  [Enter] 돌아가기  [q] 종료                                   │
└──────────────────────────────────────────────────────────────┘
```

## 6. manifest.yaml (v0.1 최소)

```yaml
name: omc
description: "멀티 에이전트 오케스트레이션 (autopilot/swarm/pipeline)"
tags: [agents, orchestration, multi-mode]
author: "Yeachan Heo"
version: 1.2.0

runtime: claude            # v0.1은 단일 런타임만

links:
  - source: files/CLAUDE.md
    target: $PROJECT/CLAUDE.md
  - source: files/agents/
    target: $HOME/.claude/agents/
  - source: files/skills/
    target: $HOME/.claude/skills/
  - source: files/hooks/
    target: $HOME/.claude/hooks/
```

v0.1에서는:
- `strategy` 필드 없음 (전부 symlink)
- `runtime` 단일 값 (멀티 런타임은 v0.3)
- `prerequisites`, `install`, `health` 없음

## 7. 기술 스택 (v0.1)

| 구성 | 선택 |
|------|------|
| 언어 | TypeScript |
| TUI | Ink 6.x |
| UI 컴포넌트 | @inkjs/ui (Select, Spinner, Alert, StatusMessage, Badge, ConfirmInput) |
| YAML | js-yaml |
| 파일 | fs-extra |
| CLI 진입 | meow |
| 패키징 | npm (`npx orch`) |

## 8. 파일 구조

```
source/
├── cli.tsx                # 진입점 (meow + Ink render)
├── app.tsx                # <App> 루트 컴포넌트
├── types.ts               # 타입 정의
├── views/
│   ├── InitView.tsx       # 첫 실행 (vanilla 생성)
│   ├── ProfileList.tsx    # 프로파일 목록 + 런타임 감지 표시
│   ├── InstallView.tsx    # 레지스트리 Install (2-Phase의 Phase 1)
│   ├── DiffPreview.tsx    # 변경 미리보기 (2-Phase의 Phase 2 진입점)
│   └── ResultView.tsx     # 전환 결과
├── core/
│   ├── state.ts           # state.json 관리
│   ├── vanilla.ts         # vanilla 스냅샷 생성/복원
│   ├── linker.ts          # symlink 생성/제거
│   ├── switcher.ts        # 4-phase 전환 로직
│   ├── manifest.ts        # manifest.yaml 파서
│   ├── registry.ts        # 레지스트리 (5개 도구) + git clone 설치
│   ├── detector.ts        # 런타임 감지 + 활성 오케스트레이션 감지
│   └── i18n.ts            # 다국어 지원 (en/ko/ja/zh, 시스템 로케일 감지)
├── hooks/
│   └── useOrch.ts         # 핵심 상태 훅
└── types.ts               # 타입 정의
```

## 9. 핵심 모듈별 역할

### core/vanilla.ts
```
createVanillaSnapshot()    현재 설정을 ~/.orch/vanilla/에 복사
restoreVanilla()           vanilla에서 원본 복원
hasVanilla()               init 여부 확인
```

### core/linker.ts
```
createSymlink(source, target)    심볼릭 링크 생성
removeSymlink(target)            심볼릭 링크 제거 (링크만, 원본 아님)
isOrchSymlink(path)              orch가 만든 링크인지 확인
listActiveLinks()                현재 활성 링크 목록
```

### core/switcher.ts
```
switchProfile(from, to)          4-phase 전환 (validate→deactivate→activate→verify)
deactivateProfile(name)          프로파일 비활성화
activateProfile(name)            프로파일 활성화
buildDiffPreview(from, to)       변경 미리보기 데이터 생성
```

### core/state.ts
```
loadState()                      ~/.orch/state.json 로드
saveState(state)                 상태 저장
getActiveProfile()               현재 활성 프로파일
setActiveProfile(name)           활성 프로파일 변경
```

### core/registry.ts
```
REGISTRY[]                       알려진 5개 도구 레지스트리 (omc, ecc, bkit, wshobson-agents, claude-orchestra)
installProfile(entry, onProgress) git clone → 파일 발견 → ~/.orch/profiles/<name>/ 복사 → manifest.yaml 생성
isInstalled(name)                프로파일 설치 여부 확인
getRegistryWithStatus()          설치 상태 포함 레지스트리 목록
discoverFiles(root)              클론된 저장소에서 agents/skills/hooks 자동 발견
```

### core/detector.ts
```
detectRuntimes()                 설치된 런타임 감지 (claude, codex, gemini, cursor, antigravity)
detectExistingTools()            ~/.claude/ 하위 디렉토리 스캔 (agents, skills, plugins 등)
detectActiveOrchestration()      활성 오케스트레이션 레이어 감지 (installed_plugins.json + agent 패턴)
```

### core/i18n.ts
```
initLocale()                     시스템 로케일 감지 or config.json에서 로드
setLocale(locale)                언어 변경 + ~/.orch/config.json에 저장 (영구 저장)
getLocale()                      현재 로케일
getLocales()                     지원 언어 목록 ['en', 'ko', 'ja', 'zh']
getLocaleLabel(locale)           로케일 표시 이름 (English, 한국어, 日本語, 中文)
t(key, params?)                  번역 함수 (보간 지원: {key} → 값 치환)
```

i18n 설계:
- 외부 의존성 없이 자체 구현 (경량)
- 시스템 `LANG` / `LC_ALL` 환경변수로 자동 감지
- `~/.orch/config.json`에 `locale` 영구 저장
- fallback: 번역 없으면 영어, 영어도 없으면 키 이름
- TUI에서 `[l]` 키로 언어 전환 (즉시 반영)

## 10. UX 흐름 (컴포넌트 네비게이션)

```
npx orch
  │
  ├── ~/.orch/ 없음 → <InitView>
  │                      │
  │                      ▼ (자동 init 완료)
  │                      │
  └── ~/.orch/ 있음 ─────┤
                         │
                         ▼
                    <ProfileList>
                      │                    │
                      │ [Enter] 선택       │ [i] Install
                      ▼                    ▼
                    <DiffPreview>       <InstallView>
                      │                    │
                      │ Enter              │ 레지스트리에서 선택
                      ▼                    ▼
                    전환 실행           git clone → ~/.orch/profiles/
                    (Activate)          (Install — 시스템 변경 없음)
                      │                    │
                      ▼                    │ 완료 후 Enter
                    <ResultView>           ▼
                      │               <ProfileList>로 돌아감
                      │ Enter         (설치된 프로파일이 목록에 표시)
                      ▼
                    <ProfileList>로 돌아감

  2-Phase 흐름:
    Phase 1: [i] → <InstallView> → git clone (안전, 시스템 무변경)
    Phase 2: [Enter] → <DiffPreview> → 전환 실행 (symlink 교체)
```

## 11. 격리 메커니즘 요약

상세: `technical/isolation-mechanism.md` 참조

```
원칙:
1. merge 금지 — symlink only
2. vanilla 보존 — init 시 원본 스냅샷
3. 원자적 전환 — 실패 시 vanilla 자동 복구
4. 원본 불변 — 사용자 파일 직접 수정 안 함

전환 시퀀스:
  Phase 1: Validate    검증
  Phase 2: Deactivate  이전 프로파일 링크 제거
  Phase 3: Activate    새 프로파일 링크 생성
  Phase 4: Verify      링크 유효성 확인
```

## 12. 프로파일 설치

v0.1에서 레지스트리 Install 기능 포함. TUI에서 `[i]` 키로 접근.

### 레지스트리 (내장 5종)

| 이름 | Stars | 설명 | 소스 |
|------|-------|------|------|
| omc | 2.1K | 5 modes, 32 agents, 31+ skills, HUD | claude-code-tooling |
| ecc | 44.7K | agents + skills + hooks + commands 종합 스타터킷 | claude-code-tooling |
| bkit | - | PDCA 기반 AI native 개발 워크플로우 | claude-code-tooling |
| wshobson-agents | 28.7K | 73 plugins, 112 agents, plugin marketplace | wshobson/agents |
| claude-orchestra | 37 | 40+ agents 조직도 구조 | mgesteban/claude-code-agents-orchestra |

### Install 프로세스

```
1. git clone --depth 1 → /tmp/orch-install-<name>-<timestamp>
2. discoverFiles() — agents/, skills/, hooks/ 등 자동 발견
3. ~/.orch/profiles/<name>/files/ 로 복사
4. manifest.yaml 자동 생성 (발견된 파일 기반 links 구성)
5. /tmp 클린업
```

### 수동 생성도 가능

```bash
mkdir -p ~/.orch/profiles/my-custom/files
vim ~/.orch/profiles/my-custom/manifest.yaml
cp -r /path/to/configs/* ~/.orch/profiles/my-custom/files/
```

## 13. 마일스톤

| Phase | 기간 | 범위 |
|-------|------|------|
| **M1** | 1일 | 프로젝트 셋업 + core 모듈 (state, vanilla, linker, switcher) |
| **M2** | 1일 | TUI (ProfileList + DiffPreview + ResultView + InitView) |
| **M3** | 반나절 | 샘플 프로파일 3종 + 테스트 + npm 패키징 |

## 14. 수용 기준

- [ ] `npx orch` → 프로파일 목록 렌더링 (이름 + 설명 + 태그)
- [ ] 프로파일 선택 시 변경 미리보기(diff) 표시
- [ ] Enter → 깨끗한 전환 (이전 흔적 0)
- [ ] `none` 선택 → vanilla 완전 복원
- [ ] 전환 실패 시 자동 vanilla 복구
- [ ] 미초기화 상태에서 실행 시 자동 init
- [ ] `[i]` → 레지스트리에서 프로파일 Install (시스템 무변경)
- [ ] 시스템에 이미 있는 도구는 Install 차단 + evidence 표시
- [ ] 런타임 감지 바 표시 (claude ✓ codex ✓ gemini ✓ 등)
- [ ] Install과 Activate가 명확히 분리 (2-Phase 모델)
- [ ] 다국어 지원 (en/ko/ja/zh) — 시스템 로케일 자동 감지
- [ ] `[l]` 키로 언어 전환, `~/.orch/config.json`에 영구 저장
- [ ] `[h]` 키로 도움말 표시 (개념 설명 + 키바인딩 목록)

## 15. 버전 로드맵 요약

| 버전 | 핵심 추가 기능 |
|------|---------------|
| **v0.1** | TUI 선택 + 격리 전환 + vanilla + 레지스트리 Install + 런타임/시스템 감지 + i18n (이 문서) |
| **v0.2** | MCP namespace 격리 + 커스텀 URL Install |
| **v0.3** | 멀티 런타임 어댑터 (Codex, Gemini, Cursor, Antigravity) + doctor |
| **v0.4** | 분할 패널 대시보드 + 키바인딩 확장 |
| **v0.5** | 커뮤니티 registry / 검색 / 프로파일 공유 |
| **v1.0** | 프로파일 compose + 크로스 CLI 통합 |

상세 로드맵: `orch-cli.plan.md` 참조
