# Agent Orchester - AI Coding Tool Orchestration Profile Manager

## Project Overview

Symlink 기반 프로파일 격리로 AI coding tool orchestration layer를 전환하는 TUI CLI 도구.
`~/.orchester/profiles/` 하위에 프로파일별 manifest.yaml을 관리하고, 심볼릭 링크로 활성화/비활성화한다.
Plugin 타입 링크도 인식하여 slash command 기반 플러그인 설치를 사용자에게 안내한다.

## Tech Stack

- **Runtime**: Node.js >= 18 (ESM)
- **Language**: TypeScript (strict)
- **UI**: React 19 + Ink 6 (Terminal UI)
- **CLI**: meow
- **Config**: js-yaml, fs-extra
- **Build**: tsc → dist/
- **Dev**: tsx (ts 직접 실행)

## Commands

```bash
pnpm dev        # tsx로 개발 실행
pnpm build      # tsc 빌드
pnpm start      # dist/cli.js 실행
```

## Architecture

```
source/
├── cli.tsx              # Entry point (meow + ink render)
├── app.tsx              # Root component (view router)
├── types.ts             # All type definitions
├── core/                # Business logic (순수 함수 중심)
│   ├── state.ts         # ~/.orchester/state.json 관리
│   ├── manifest.ts      # manifest.yaml 파싱
│   ├── switcher.ts      # 4-phase 프로파일 전환 (Validate→Deactivate→Activate→Verify)
│   ├── linker.ts        # Symlink 생성/제거
│   ├── vanilla.ts       # Vanilla 상태 백업/복원
│   ├── registry.ts      # 내장 레지스트리 (알려진 도구 목록)
│   ├── detector.ts      # 설치된 도구 감지
│   ├── theme.ts         # TUI 테마/색상
│   ├── i18n.ts          # 다국어 지원
│   └── usage.ts         # 사용법 텍스트
├── hooks/
│   └── useOrch.ts       # 메인 상태 관리 훅 (view, profiles, switch flow)
└── views/               # Ink TUI 컴포넌트
    ├── Header.tsx
    ├── SplashView.tsx
    ├── InitView.tsx
    ├── ProfileList.tsx
    ├── DiffPreview.tsx
    ├── ResultView.tsx
    ├── InstallView.tsx
    └── UsageView.tsx
```

## Coding Conventions

- ESM 사용 (`"type": "module"`) — import 시 `.js` 확장자 필수
- Type 정의는 `source/types.ts`에 집중 관리
- `interface` 사용 (프로젝트 기존 패턴 유지)
- core/ 모듈은 React 의존 없이 순수 Node.js로 작성
- views/ 컴포넌트는 Ink의 `<Box>`, `<Text>` 기반
- 경로 변수: `$HOME`, `$PROJECT`, `~` 확장 지원 (switcher.ts의 `expandVars`)

## Key Concepts

- **Profile**: `~/.orchester/profiles/{name}/` 디렉토리 + manifest.yaml
- **Manifest**: 프로파일 메타데이터 (name, description, tags, tool, links, installType)
- **Link**: source(프로파일 내 파일) → target(실제 설치 경로) 심볼릭 링크
- **InstallType**: `symlink` (기본) | `plugin` (slash command) | `hybrid` (혼합)
- **PluginCommand**: plugin 타입 링크의 설치/제거 명령어 (TUI에서 안내만 표시)
- **Vanilla**: 프로파일 적용 전 원본 상태 백업
- **Registry**: 알려진 orchestration 도구 목록 (내장)

## View Flow

```
splash → (hasVanilla?) → init or list → preview → result → list
                                list → install → list
                                list → usage → list
```

## Prohibited

- console.log 직접 사용 (Ink TUI가 stdout 제어)
- CommonJS require 사용
- core/ 모듈에서 React import
