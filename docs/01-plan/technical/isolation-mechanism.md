# Technical Spec: 격리 메커니즘 (Isolation Mechanism)

> OPM/orch의 핵심 아키텍처. 오케스트레이션 프로파일 간 완전 격리를 보장한다.
> Version: 1.1 | Date: 2026-02-16
> v0.1 MVP 범위: `orch-v0.1.plan.md` 참조
> 런타임별 상세 특성: `runtime-profiles.md` 참조

---

## 0. 버전별 적용 범위

| 항목 | v0.1 (MVP) | v0.2+ |
|------|:----------:|:-----:|
| Symlink 격리 (디렉토리/파일) | **O** | O |
| MCP Namespace 격리 | X | **O** |
| 런타임 | Claude Code 전용 | 멀티 런타임 |
| 자동 런타임 감지 | X | O |
| prerequisites 체크 | X | O |
| TUI 3-Step UX | **O** | O |
| 다국어 지원 (i18n) | **O** (en/ko/ja/zh) | O (추가 언어) |
| doctor / auto-fix | X | v0.3 |

> 아래 문서에서 `[v0.2+]`로 표시된 항목은 v0.1에 포함되지 않음.

---

## 1. 설계 원칙

```
절대 규칙:
─────────────────────────────────────────────────
1. 사용자 원본 파일을 직접 수정(merge)하지 않는다.
2. 모든 적용은 symlink 또는 namespace 방식으로만 한다.
3. 프로파일 전환 시 이전 프로파일의 흔적이 0개 남아야 한다.
4. 언제든 `orch use none`으로 설치 전 상태로 복귀할 수 있어야 한다.
5. 전환 중 실패 시 "반쯤 전환된 상태"가 절대 남지 않는다.
─────────────────────────────────────────────────
```

### 왜 merge가 위험한가

```
시나리오: OMC 설치 → bkit 설치 → OMC 제거
─────────────────────────────────────────────────
1. OMC install  → CLAUDE.md에 OMC 규칙 merge
2. bkit install → CLAUDE.md에 bkit 규칙 merge
3. OMC remove   → CLAUDE.md에서 OMC 부분만 제거?
   → 어디까지가 OMC 것이고 어디까지가 bkit 것인지 구분 불가
   → CLAUDE.md 전체를 날리거나, 잔여물이 남거나
   → 결국 수동 복구만 가능
─────────────────────────────────────────────────
```

---

## 2. 격리 방식 3가지

| 방식 | 대상 | 원리 |
|------|------|------|
| **Symlink (디렉토리)** | agents/, skills/, hooks/ | 디렉토리 통째로 심볼릭 링크 교체 |
| **Symlink (파일)** | CLAUDE.md, AGENTS.md, GEMINI.md | 파일 통째로 심볼릭 링크 교체 |
| **Namespace** | .mcp.json, gemini settings.json | `__orch_<profile>__` 접두사로 키 격리 |

---

## 3. 핵심 개념: Install vs Activate (2-Phase 모델)

orch는 프로파일의 **다운로드(Install)**와 **적용(Activate)**을 명확히 분리한다.
이 분리가 격리 안전성의 핵심이다.

```
Phase 1: INSTALL
─────────────────────────────────────────────────
  동작: git clone → ~/.orch/profiles/<name>/ 에 복사
  영향: 없음. 시스템 설정 파일 일체 변경 없음.
  안전: 여러 프로파일을 동시에 Install 해둘 수 있음.

Phase 2: ACTIVATE
─────────────────────────────────────────────────
  동작: 프로파일 목록에서 선택 → symlink 교체
  영향: ~/.claude/agents/, skills/ 등이 새 프로파일로 전환됨.
  제약: 한 번에 1개만 활성 (Single Active 원칙).

분리 이유:
  1. Install 자체가 안전 — 현재 작업 환경에 영향 없음
  2. 전환 전에 DiffPreview로 변경사항 확인 가능
  3. 여러 프로파일을 미리 준비하고 필요할 때 전환

충돌 보호:
  시스템에 이미 활성화된 도구 (installed_plugins.json 감지)는
  Install 자체를 차단. 원본 소스에서 먼저 제거 후 orch로 관리하도록 유도.
```

---

## 4. 동작별 상세 로직

### 4.1 `orch init` — 바닐라 스냅샷 생성

최초 1회 실행. 현재 파일시스템 상태를 "원본"으로 보존.
TUI에서 `npx orch` 첫 실행 시 자동으로 수행 (`<InitView>` 컴포넌트).

#### v0.1 로직 (Claude Code 전용)

```
orch init (v0.1):
═══════════════════════════════════════════════════════════════

TUI 표시: <InitView>
  "orch를 처음 실행합니다."
  "현재 설정을 원본(vanilla)으로 저장합니다."

Step 1: 디렉토리 구조 생성
  mkdir -p ~/.orch/profiles
  mkdir -p ~/.orch/vanilla

Step 2: Claude Code 설정 감지 및 표시
  targets = [
    { path: "~/.claude/agents/",     name: "agents" },
    { path: "~/.claude/skills/",     name: "skills" },
    { path: "~/.claude/hooks/",      name: "hooks" },
    { path: "$PROJECT/CLAUDE.md",    name: "CLAUDE.md" }
  ]

  TUI 표시:
    "감지된 설정:"
    for target in targets:
      if exists(target.path):
        if isDirectory(target.path):
          count = countFiles(target.path)
          display("  {target.path}  ({count} files)")
        else:
          display("  {target.path}  (exists)")

Step 3: 바닐라 스냅샷 저장
  mkdir -p ~/.orch/vanilla/claude/
  for target in targets:
    if exists(target.path):
      if isDirectory(target.path):
        cp -r target.path → ~/.orch/vanilla/claude/{target.name}/
      else:
        cp target.path → ~/.orch/vanilla/claude/{target.name}

  TUI 표시: Progress bar → "vanilla 스냅샷 저장 완료"

Step 4: state.json 초기화
  write ~/.orch/state.json:
  {
    "version": "0.1",
    "initialized": "<timestamp>",
    "activeProfile": null,
    "vanilla": {
      "agents":    "~/.orch/vanilla/claude/agents/",
      "skills":    "~/.orch/vanilla/claude/skills/",
      "hooks":     "~/.orch/vanilla/claude/hooks/",
      "CLAUDE.md": "~/.orch/vanilla/claude/CLAUDE.md"
    },
    "activeLinks": []
  }

→ 완료 후 자동으로 <ProfileList>로 이동
```

#### [v0.2+] 전체 로직 (멀티 런타임)

```
orch init (v0.2+):
═══════════════════════════════════════════════════════════════

Step 1: 디렉토리 구조 생성
  mkdir -p ~/.orch/profiles
  mkdir -p ~/.orch/vanilla
  mkdir -p ~/.orch/backups
  mkdir -p ~/.orch/registry

Step 2: 설치된 런타임 자동 감지
  for runtime in [claude, codex, gemini, cursor, antigravity]:
    binary = { claude: "claude", codex: "codex", gemini: "gemini",
               cursor: "cursor", antigravity: "agy" }
    result = which(binary[runtime])
    if result:
      detected[runtime] = {
        installed: true,
        version: exec(`${binary} --version`),
        binaryPath: result
      }

Step 3: 감지된 런타임별 바닐라 스냅샷 저장
  for runtime in detected:
    mkdir -p ~/.orch/vanilla/{runtime}/
    targets = getRuntimeTargets(runtime)
    for target in targets:
      if exists(target.path):
        if isDirectory(target.path):
          cp -r target.path → ~/.orch/vanilla/{runtime}/{target.name}/
        else:
          cp target.path → ~/.orch/vanilla/{runtime}/{target.name}

Step 4: state.json 초기화
  write ~/.orch/state.json:
  {
    "version": "1.0",
    "initialized": "<timestamp>",
    "activeProfile": null,
    "detectedRuntimes": { ... },
    "vanilla": { claude: {...}, codex: {...}, gemini: {...}, cursor: {...} },
    "activeLinks": [],
    "activeMcpKeys": []
  }
```

### [v0.2+] 런타임별 스냅샷 대상 목록

> 각 런타임의 상세 설정 구조, 포맷, 제약사항은 `runtime-profiles.md` 참조.

| 런타임 | 스냅샷 대상 | 경로 |
|--------|------------|------|
| **claude** | 에이전트 | `~/.claude/agents/` |
| | 스킬 | `~/.claude/skills/` |
| | 커맨드 | `~/.claude/commands/` |
| | 훅 설정 | `~/.claude/settings.json` (hooks 섹션만) |
| | 규칙 | `$PROJECT/CLAUDE.md` |
| | MCP | `~/.mcp.json` |
| **codex** | 에이전트 | `~/.codex/agents/` |
| | 스킬 | `~/.codex/skills/` |
| | 프롬프트 | `~/.codex/prompts/` |
| | 규칙 | `$PROJECT/AGENTS.md` |
| **gemini** | 규칙 | `$PROJECT/GEMINI.md` |
| | 설정 | `~/.gemini/settings.json` |
| **cursor** | 규칙 | `$PROJECT/.cursor/rules/` |
| | MCP | `$PROJECT/.cursor/mcp.json` |
| **antigravity** | 규칙 | `$PROJECT/GEMINI.md` |
| | 에이전트 | `$PROJECT/.agent/skills/` |
| | 워크플로우 | `$PROJECT/.agent/workflows/` |
| | MCP | `$PROJECT/.vscode/mcp.json` |

---

### 4.2 프로파일 전환 — TUI UX + 4단계 원자적 전환

#### v0.1 TUI 3-Step UX 흐름

```
TUI 전환 흐름 (v0.1):
═══════════════════════════════════════════════════════════════

Step 1: <ProfileList> — 뭔지 알 수 있게
─────────────────────────────────────────
  프로파일 목록을 이름 + 설명 + 태그와 함께 표시.
  데이터 출처: 각 프로파일의 manifest.yaml

  profiles = scanProfiles("~/.orch/profiles/")
  for profile in profiles:
    manifest = parseYaml(profile.path + "/manifest.yaml")
    display:
      name:        manifest.name
      description: manifest.description
      tags:        manifest.tags
      stats:       countLinks(manifest.links)  // "5 modes, 32 agents" 등
      active:      state.activeProfile === manifest.name

  특수 항목:
    "none" — 원본 상태로 복원 (vanilla)
    → 항상 목록 마지막에 표시

  사용자 인터랙션:
    [↑/↓] 선택     [Enter] 상세보기/전환     [q] 종료


Step 2: <DiffPreview> — 뭐가 바뀌는지
─────────────────────────────────────────
  선택한 프로파일과 현재 상태의 차이를 미리 보여줌.
  사용자가 Enter 전에 변경사항을 확인할 수 있음.

  diff = buildDiffPreview(state.activeProfile, selectedProfile)

  diff 구성:
    removed[]:   현재 프로파일에서 제거될 링크 목록
      { target: "~/.claude/agents/", source: "omc/agents/", action: "unlink" }

    added[]:     새 프로파일에서 생성될 링크 목록
      { target: "~/.claude/agents/", source: "bkit/agents/", action: "link" }

    restored[]:  none 선택 시 vanilla에서 복원될 항목
      { target: "~/.claude/agents/", source: "vanilla 원본" }

  사용자 인터랙션:
    [Enter] 전환 실행     [Esc] <ProfileList>로 돌아감


Step 3: <ResultView> — 뭘 했는지
─────────────────────────────────────────
  전환 실행 후 결과 표시.

  성공 시:
    "omc 비활성화 (3 links removed)"
    "bkit 활성화 (4 links created)"
    "Active: bkit"

  실패 시:
    "bkit 활성화 실패"
    "원인: {에러 메시지}"
    "바닐라 상태로 자동 복원되었습니다."

  사용자 인터랙션:
    [Enter] <ProfileList>로 돌아감     [q] 종료
```

#### 4단계 원자적 전환 프로세스 (core/switcher.ts)

TUI Step 2에서 Enter 누르면 아래 4-Phase가 실행됨.

```
orch use omc:
═══════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────┐
│ Phase 1: VALIDATE (검증)                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 프로파일 존재 확인                                       │
│     path = ~/.orch/profiles/omc/manifest.yaml                │
│     if !exists(path): Error("프로파일 'omc' 없음")           │
│                                                              │
│  2. manifest.yaml 파싱                                       │
│     manifest = parseYaml(path)                               │
│                                                              │
│  ── v0.1: 여기까지만 ──                                     │
│  3. [v0.2+] 지원 런타임 ∩ 설치된 런타임                     │
│     supported = manifest.runtimes.supported                  │
│     detected  = state.detectedRuntimes                       │
│     available = intersection(supported, detected)            │
│     if available.length == 0: Error(...)                     │
│                                                              │
│  4. [v0.2+] prerequisites 체크                               │
│     for bin in manifest.prerequisites.binaries:              │
│       if !which(bin): Error(...)                             │
│     for env in manifest.prerequisites.env:                   │
│       if !process.env[env]: Error(...)                       │
│                                                              │
│  5. 대상 경로 쓰기 권한 체크                                 │
│     for link in manifest.links:                              │
│       if !writable(dirname(link.target)):                    │
│         Error(`쓰기 권한 없음: ${link.target}`)              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                            │
                     모두 통과 ✓
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ Phase 2: DEACTIVATE (현재 프로파일 비활성화)                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  if state.activeProfile == null:                             │
│    → Phase 3으로 바로 이동 (이미 바닐라 상태)                │
│                                                              │
│  // 1. 심볼릭 링크 제거                                      │
│  for link in state.activeLinks:                              │
│    targetPath = link.target                                  │
│    if isSymlink(targetPath):                                 │
│      linkTarget = readlink(targetPath)                       │
│      if linkTarget.startsWith("~/.orch/profiles/"):          │
│        rm(targetPath)                // orch가 만든 링크만 제거
│        log(`제거: ${targetPath}`)                            │
│      else:                                                   │
│        warn(`orch 외부 링크, 스킵: ${targetPath}`)           │
│    else:                                                     │
│      warn(`심볼릭 링크가 아님, 스킵: ${targetPath}`)         │
│                                                              │
│  // 2. MCP 네임스페이스 키 제거                              │
│  for mcpFile in getAffectedMcpFiles(state.activeMcpKeys):    │
│    config = JSON.parse(read(mcpFile))                        │
│    for key in state.activeMcpKeys:                           │
│      delete config.mcpServers[key]                           │
│    write(mcpFile, JSON.stringify(config, null, 2))           │
│                                                              │
│  // 3. 상태 초기화                                           │
│  state.activeProfile = null                                  │
│  state.activeLinks = []                                      │
│  state.activeMcpKeys = []                                    │
│  saveState()                                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ Phase 3: ACTIVATE (새 프로파일 활성화)                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  newLinks = []                                               │
│  newMcpKeys = []                                             │
│                                                              │
│  try {                                                       │
│                                                              │
│  // v0.1: 단일 런타임(claude), manifest.links 배열 직접 순회 │
│  // v0.2+: 런타임별 links[runtime] 맵 순회                  │
│  // 1. 심볼릭 링크 생성                                      │
│  for linkDef in manifest.links:  // v0.1: 단순 배열          │
│                                                              │
│      source = resolve(profileDir, linkDef.source)            │
│      target = expandVars(linkDef.target) // $HOME, $PROJECT  │
│                                                              │
│      if linkDef.strategy == "symlink":                       │
│        // 대상 경로 처리                                     │
│        if exists(target):                                    │
│          if isSymlink(target):                                │
│            rm(target)          // 기존 심볼릭 링크 제거       │
│          else:                                               │
│            // 실제 파일/디렉토리 — vanilla 확인              │
│            vanillaKey = getVanillaKey(runtime, linkDef)       │
│            if !state.vanilla[runtime][vanillaKey]:            │
│              // vanilla에 없으면 지금 백업                    │
│              backup(target, vanillaDir)                       │
│              state.vanilla[runtime][vanillaKey] = vanillaPath │
│            rm(target)          // 원본 제거 (vanilla에 보존됨)│
│                                                              │
│        // 심볼릭 링크 생성                                   │
│        symlink(source, target)                               │
│        newLinks.push({ source, target, type: "symlink" })    │
│                                                              │
│      // ── v0.1에서는 아래 strategy 미지원 ──                │
│      else if linkDef.strategy == "namespace":  // [v0.2+]    │
│        // MCP 네임스페이스 주입 (아래 3.3 참조)              │
│        keys = injectMcpNamespace(target, profileName, source)│
│        newMcpKeys.push(...keys)                              │
│                                                              │
│      else if linkDef.strategy == "copy":       // [v0.2+]    │
│        // Cursor .mdc 등 변환이 필요한 경우                  │
│        content = read(source)                                │
│        if linkDef.transform:                                 │
│          content = transform(content, linkDef.transform)     │
│        write(target, content)                                │
│        newLinks.push({ source, target, type: "copy" })       │
│                                                              │
│  } catch (error) {                                           │
│    // Phase 3 실패 → 롤백 (아래 3.5 참조)                   │
│    rollbackPhase3(newLinks, newMcpKeys)                      │
│    restoreVanilla()                                          │
│    throw error                                               │
│  }                                                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ Phase 4: VERIFY (검증)                                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  errors = []                                                 │
│                                                              │
│  for link in newLinks:                                       │
│    if link.type == "symlink":                                │
│      if !isSymlink(link.target):                             │
│        errors.push(`심볼릭 링크 아님: ${link.target}`)       │
│      else:                                                   │
│        resolved = readlink(link.target)                      │
│        if !exists(resolved):                                 │
│          errors.push(`링크 대상 없음: ${resolved}`)          │
│    else if link.type == "copy":                              │
│      if !exists(link.target):                                │
│        errors.push(`파일 없음: ${link.target}`)              │
│                                                              │
│  for key in newMcpKeys:                                      │
│    // MCP 설정에 키가 정상 존재하는지 확인                   │
│    if !mcpKeyExists(key):                                    │
│      errors.push(`MCP 키 없음: ${key}`)                     │
│                                                              │
│  if errors.length > 0:                                       │
│    rollbackPhase3(newLinks, newMcpKeys)                      │
│    restoreVanilla()                                          │
│    throw VerifyError(errors)                                 │
│                                                              │
│  // 성공! 상태 확정                                          │
│  state.activeProfile = profileName                           │
│  state.activeLinks = newLinks                                │
│  state.activeMcpKeys = newMcpKeys                            │
│  saveState()                                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### 4.3 [v0.2+] MCP 네임스페이스 격리 — 상세

> v0.1에서는 MCP 격리 미지원. symlink 교체만 수행.

```
MCP 격리 원리:
═══════════════════════════════════════════════════════════════

문제:
  MCP 설정은 symlink로 통째 교체 불가.
  사용자가 직접 설정한 MCP 서버(postgres, filesystem 등)가 유실됨.

해법:
  프로파일 MCP 서버 키에 `__orch_<profileName>__` 접두사를 붙여서
  사용자 원본 키와 물리적으로 구분.
  전환 시 접두사가 붙은 키만 제거/추가.
```

#### 주입 (Inject)

```
프로파일의 files/mcp.json:
{
  "mcpServers": {
    "github-mcp": { "command": "npx", "args": ["@mcp/github"] },
    "memory":     { "command": "npx", "args": ["@mcp/memory"] }
  }
}

대상 ~/.mcp.json (주입 전):
{
  "mcpServers": {
    "postgres":   { "command": "..." },     ← 사용자 원본
    "filesystem": { "command": "..." }      ← 사용자 원본
  }
}

대상 ~/.mcp.json (주입 후):
{
  "mcpServers": {
    "postgres":                  { "command": "..." },  ← 건드리지 않음
    "filesystem":                { "command": "..." },  ← 건드리지 않음
    "__orch_omc__github-mcp":    { "command": "npx", "args": ["@mcp/github"] },
    "__orch_omc__memory":        { "command": "npx", "args": ["@mcp/memory"] }
  }
}

state.json에 기록:
  activeMcpKeys: ["__orch_omc__github-mcp", "__orch_omc__memory"]
```

#### 전환 (Switch)

```
orch use bkit (omc → bkit 전환):

Step 1: omc 키 제거
  delete "__orch_omc__github-mcp"
  delete "__orch_omc__memory"

Step 2: bkit 키 주입
  add "__orch_bkit__context7": { ... }
  add "__orch_bkit__exa":      { ... }

결과:
{
  "mcpServers": {
    "postgres":                  { ... },  ← 원본 그대로
    "filesystem":                { ... },  ← 원본 그대로
    "__orch_bkit__context7":     { ... },  ← bkit 것만 존재
    "__orch_bkit__exa":          { ... }   ← omc 것은 완전 제거됨
  }
}
```

#### 완전 제거 (orch use none)

```
모든 __orch_*__ 키 제거:

{
  "mcpServers": {
    "postgres":   { ... },  ← 원본
    "filesystem": { ... }   ← 원본
  }
}

→ orch 설치 전과 100% 동일
```

#### Gemini CLI 특수 처리

Gemini CLI는 MCP를 `~/.gemini/settings.json`의 `mcpServers` 키 안에 저장.
동일한 namespace 로직 적용, 단 파일 경로만 다름.

```
대상: ~/.gemini/settings.json
namespaceKey: mcpServers       // manifest.yaml에서 지정

{
  "mcpServers": {
    "user-server":                    { ... },  ← 사용자 원본
    "__orch_omc__github-mcp":         { ... }   ← orch 관리
  },
  "otherSettings": { ... }            ← 건드리지 않음
}
```

#### 핵심 함수 (TypeScript)

```typescript
// ── MCP 네임스페이스 조작 ──

const ORCH_PREFIX = '__orch_';

function injectMcpNamespace(
  mcpFilePath: string,
  profileName: string,
  profileMcpPath: string,
  namespaceKey?: string        // gemini: "mcpServers"
): string[] {
  const profileMcp = JSON.parse(fs.readFileSync(profileMcpPath, 'utf-8'));
  const targetConfig = JSON.parse(fs.readFileSync(mcpFilePath, 'utf-8'));

  // namespaceKey가 지정되면 해당 키 하위에서 작업
  const container = namespaceKey
    ? (targetConfig[namespaceKey] ??= {})
    : (targetConfig.mcpServers ??= {});

  const injectedKeys: string[] = [];
  const servers = profileMcp.mcpServers || profileMcp;

  for (const [name, server] of Object.entries(servers)) {
    const namespacedKey = `${ORCH_PREFIX}${profileName}__${name}`;
    container[namespacedKey] = server;
    injectedKeys.push(namespacedKey);
  }

  fs.writeFileSync(mcpFilePath, JSON.stringify(targetConfig, null, 2));
  return injectedKeys;
}

function removeMcpNamespace(
  mcpFilePath: string,
  keys: string[]
): void {
  const config = JSON.parse(fs.readFileSync(mcpFilePath, 'utf-8'));

  // mcpServers 또는 중첩 키에서 검색하여 제거
  function removeFromObject(obj: Record<string, any>): void {
    for (const key of Object.keys(obj)) {
      if (keys.includes(key)) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        removeFromObject(obj[key]);
      }
    }
  }

  removeFromObject(config);
  fs.writeFileSync(mcpFilePath, JSON.stringify(config, null, 2));
}

function removeAllOrchKeys(mcpFilePath: string): void {
  const config = JSON.parse(fs.readFileSync(mcpFilePath, 'utf-8'));

  function purgeOrchKeys(obj: Record<string, any>): void {
    for (const key of Object.keys(obj)) {
      if (key.startsWith(ORCH_PREFIX)) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        purgeOrchKeys(obj[key]);
      }
    }
  }

  purgeOrchKeys(config);
  fs.writeFileSync(mcpFilePath, JSON.stringify(config, null, 2));
}
```

---

### 4.4 `none` 선택 — 바닐라 복원

TUI에서 `none` 선택 시 `<DiffPreview>`에 복원 항목 표시 후 실행.

```
none 선택 로직:
═══════════════════════════════════════════════════════════════

TUI: <DiffPreview>
  제거 섹션: 현재 프로파일의 모든 링크
  복원 섹션: vanilla에서 복원될 항목

Step 1: 현재 프로파일 비활성화
  → Phase 2 (DEACTIVATE) 실행
  → 모든 symlink 제거
  → [v0.2+] 모든 __orch_*__ MCP 키 제거

Step 2: 바닐라 스냅샷 복원
  // v0.1: state.vanilla는 flat 구조 (단일 런타임)
  for [key, vanillaPath] in state.vanilla:

      target = resolveOriginalPath(runtime, key)
      // 예: claude + "agents" → ~/.claude/agents/
      // 예: claude + "CLAUDE.md" → $PROJECT/CLAUDE.md

      if exists(vanillaPath):
        if isDirectory(vanillaPath):
          cp -r vanillaPath → target
        else:
          cp vanillaPath → target
        log(`복원: ${target}`)

      else:
        // vanilla에 없음 = 원래 없었던 것
        // 현재 target이 존재하면 제거 (orch가 만든 잔여물)
        if exists(target) && isOrchArtifact(target):
          rm(target)

Step 3: 상태 초기화
  state.activeProfile = null
  state.activeLinks = []
  state.activeMcpKeys = []
  saveState()

결과: orch init 실행 전과 동일한 파일시스템 상태
```

---

### 4.5 실패 시 복구 — 원자적 보장

```
전환 중 실패 시나리오와 복구:
═══════════════════════════════════════════════════════════════

케이스 1: Phase 1 (VALIDATE) 실패
  → 아무것도 변경되지 않음
  → 에러 메시지만 표시
  → 현재 상태 그대로 유지

케이스 2: Phase 2 (DEACTIVATE) 중 실패
  → 이전 프로파일의 일부 링크만 제거된 상태
  → 복구: state.activeLinks 기반으로 남은 링크 정리
  → 최종: vanilla 복원
  → 상태: activeProfile = null (안전한 상태)

케이스 3: Phase 3 (ACTIVATE) 중 실패 ← 가장 위험
  → 새 프로파일의 일부 링크만 생성된 상태
  → 복구 로직:

  function rollbackPhase3(
    newLinks: Link[],
    newMcpKeys: string[]
  ): void {
    // 1. 방금 생성한 심볼릭 링크 제거
    for (const link of newLinks) {
      if (exists(link.target)) {
        if (link.type === 'symlink' && isSymlink(link.target)) {
          rm(link.target);
        } else if (link.type === 'copy') {
          rm(link.target);
        }
      }
    }

    // 2. 방금 주입한 MCP 키 제거
    for (const key of newMcpKeys) {
      // 해당 키가 포함된 MCP 파일 찾아서 제거
      removeMcpKey(key);
    }

    // 3. vanilla 복원
    restoreVanilla();
  }

케이스 4: Phase 4 (VERIFY) 실패
  → 링크는 생성되었지만 유효하지 않음
  → Phase 3 롤백과 동일하게 처리
  → 최종: vanilla 복원

결론: 어떤 Phase에서 실패해도 최종 상태는 둘 중 하나:
  A) 새 프로파일 완전 활성화 (Phase 4 통과 시)
  B) 바닐라 상태 (실패 시)

  "반쯤 전환된 상태"는 존재하지 않음.
```

---

## 5. 상태 다이어그램

```
                     orch init
                        │
                        ▼
               ┌──── VANILLA ────┐
               │  activeProfile   │
               │  = null          │
               │  원본 보존됨     │
               └────┬────────┬───┘
                    │        │
           use omc  │        │ use none (이미 vanilla)
                    │        │  → no-op
                    ▼        │
               ┌── OMC ─────┐
               │  symlinks:   │
               │   agents/→omc│
               │   CLAUDE→omc │
               │  mcp:        │
               │   __orch_omc_│
               └─┬──────┬──┬─┘
                 │      │  │
        use bkit │      │  │ use none
                 │      │  │
                 ▼      │  ▼
            ┌─ BKIT ─┐  │  ┌── VANILLA ──┐
            │ agents/  │  │  │ 원본 복원    │
            │  →bkit   │  │  │ orch 흔적 0  │
            │ CLAUDE   │  │  └─────────────┘
            │  →bkit   │  │
            │ __orch_  │  │
            │  bkit__  │  │
            └─┬────┬──┘  │
              │    │     │
     use ecc  │    │     │ use none
              │    │     │
              ▼    │     ▼
         ┌─ ECC ┐ │  ┌── VANILLA ──┐
         │  ...  │ │  │ 원본 복원    │
         └──┬───┘ │  └─────────────┘
            │     │
            │     │ use omc (다시 돌아와도 OK)
            │     ▼
            │  ┌── OMC ─────┐
            │  │  깨끗한 상태 │
            │  │  이전 흔적 0 │
            │  └─────────────┘
            │
            │ use none
            ▼
         ┌── VANILLA ──┐
         │ 원본 복원    │
         └─────────────┘

어떤 경로로 순회해도:
  • use <profile>: 이전 것 완전 제거 → 새 것만 적용
  • use none: 모든 것 제거 → 바닐라 복원
  • 같은 프로파일 재적용: idempotent (동일 결과)
  • 실패 시: 자동으로 VANILLA 복귀
```

---

## 6. 엣지 케이스 처리

### 5.1 사용자가 orch 외부에서 파일을 수동 변경한 경우

```
상황: orch use omc 상태에서 사용자가 직접 ~/.claude/agents/ 심볼릭 링크를 삭제

대응:
  v0.1: 다음 전환 시 자동 복구 (deactivate에서 누락 감지 → skip)
  [v0.3+] orch doctor → "agents/ 심볼릭 링크 없음. Auto-fix로 복구"
```

### 5.2 프로파일이 동일 경로를 대상으로 하는 경우

```
상황: OMC와 ECC 모두 ~/.claude/agents/를 대상으로 함

대응:
  Single Active 원칙으로 자연 해결.
  한 번에 1개 프로파일만 활성이므로,
  agents/는 항상 현재 활성 프로파일의 것만 가리킴.
```

### 5.3 orch init 후 사용자가 원본 파일을 변경한 경우

```
상황: orch init으로 vanilla 스냅샷 저장 후,
      사용자가 직접 CLAUDE.md를 수정

대응:
  vanilla 스냅샷은 init 시점의 상태.
  사용자가 이후 수정한 내용은 vanilla에 반영되지 않음.

  해법:
  orch vanilla update → 현재 바닐라 상태가 아닌 파일을 감지하고
                         vanilla 스냅샷 갱신 여부를 묻는다.
  (v1.1에서 구현)
```

### 5.4 $PROJECT 경로가 프로파일마다 다른 경우

```
상황: 프로젝트 A에서는 omc, 프로젝트 B에서는 bkit을 쓰고 싶음

대응:
  state.json에 프로젝트 경로별 활성 프로파일 기록:
  {
    "activeProfile": "omc",
    "projectBindings": {
      "/Users/me/project-a": "omc",
      "/Users/me/project-b": "bkit"
    }
  }

  orch use omc --project ~/project-a
  orch use bkit --project ~/project-b

  프로젝트 레벨 파일(CLAUDE.md, AGENTS.md 등)은 해당 프로젝트에만 적용.
  글로벌 파일(~/.claude/agents/ 등)은 마지막 use 기준.
  (v1.1에서 구현)
```

### 5.5 여러 MCP 파일이 관여하는 경우

```
상황: claude는 ~/.mcp.json, cursor는 .cursor/mcp.json, gemini는 ~/.gemini/settings.json

대응:
  activeMcpKeys에 파일 경로도 함께 기록:
  {
    "activeMcpKeys": [
      { "file": "~/.mcp.json",              "key": "__orch_omc__github" },
      { "file": ".cursor/mcp.json",         "key": "__orch_omc__github" },
      { "file": "~/.gemini/settings.json",  "key": "__orch_omc__github" }
    ]
  }

  전환 시 각 파일에서 해당 키만 정확히 제거.
```

---

## 7. 보안 고려사항

| 항목 | 대응 |
|------|------|
| API 키 노출 | manifest.yaml에 직접 저장 금지. `$ENV_VAR` 참조만 허용 |
| 심볼릭 링크 공격 | readlink로 대상이 `~/.orch/profiles/` 내부인지 검증 |
| 악의적 프로파일 | install 시 post 스크립트 실행 전 사용자 확인 필수 |
| 바닐라 변조 | `~/.orch/vanilla/`은 0600 권한으로 보호 |

---

## 8. 성능 기준

| 동작 | 목표 | 측정 방식 |
|------|------|-----------|
| TUI 첫 렌더링 | < 1초 | `npx orch` → 프로파일 목록 표시 |
| 프로파일 전환 (4-Phase) | < 3초 | Validate→Deactivate→Activate→Verify |
| vanilla 복원 (none) | < 2초 | deactivate + 스냅샷 복원 |
| DiffPreview 생성 | < 500ms | manifest 파싱 + 비교 |
| symlink 생성 1건 | < 10ms | fs.symlinkSync 기준 |
| [v0.2+] MCP 키 주입 1건 | < 50ms | JSON parse + write 기준 |
| [v0.3+] doctor 전체 체크 | < 5초 | 모든 체크 항목 순회 |
