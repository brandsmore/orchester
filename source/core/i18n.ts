import os from 'node:os';
import fs from 'fs-extra';
import path from 'node:path';

export type Locale = 'en' | 'ko' | 'ja' | 'zh';

const ORCH_DIR = path.join(os.homedir(), '.orchester');
const CONFIG_PATH = path.join(ORCH_DIR, 'config.json');

// ── Messages ──

const messages: Record<Locale, Record<string, string>> = {
  en: {
    // Header
    'header.profileManager': 'Profile Manager',
    'header.help': 'Help',
    'header.firstRun': 'First Run Setup',
    'header.switchPreview': 'Switch Preview',
    'header.switchResult': 'Switch Result',
    'header.install': 'Install Profile',

    // Header features
    'header.feat1': '◇ Switch orchestration layers in one keystroke',
    'header.feat2': '◇ Symlink isolation — no file overwrites',
    'header.feat3': '◇ Supports Claude, Codex, Gemini, Cursor & more',

    // ProfileList
    'list.selectProfile': 'Select a profile:',
    'list.noneOption': 'none — Restore vanilla (no orchestration)',
    'list.runtimes': 'Runtimes',
    'list.system': 'System',
    'list.welcome': 'Welcome to orchester!',
    'list.noProfiles': 'No profiles installed yet.',
    'list.pressInstall': 'Press {key} to browse and install from the registry,',
    'list.pressHelp': 'or {key} for help.',

    // Help
    'help.whatIs': 'What is orchester?',
    'help.whatIsDesc1': 'Orchestration Profile Manager for AI coding tools.',
    'help.whatIsDesc2': 'Switch between different orchestration layers',
    'help.whatIsDesc3': '(bkit, omc, ecc, etc.) with symlink isolation.',
    'help.concepts': 'Concepts',
    'help.profile': 'A set of agents, skills, hooks, commands',
    'help.install': 'Download a profile from registry (no side effects)',
    'help.activate': 'Apply a profile via symlinks (replaces current)',
    'help.vanilla': 'Your original config, saved on first run',
    'help.keybindings': 'Keybindings',
    'help.keySelect': 'Select / Confirm',
    'help.keyNavigate': 'Navigate list',
    'help.keyInstall': 'Install from registry',
    'help.keyHelp': 'Toggle this help',
    'help.keyUsage': 'Runtime usage',
    'help.keyLang': 'Change language',
    'help.keyQuit': 'Quit',
    'help.pressClose': 'Press any key to close',

    // Footer
    'footer.select': 'select',
    'footer.install': 'install',
    'footer.usage': 'usage',
    'footer.help': 'help',
    'footer.quit': 'quit',
    'footer.confirm': 'confirm',
    'footer.cancel': 'cancel',
    'footer.back': 'back',
    'footer.continue': 'to continue',
    'footer.backToList': 'back to profile list',

    // InitView
    'init.detected': 'Detected Claude Code configs:',
    'init.detecting': 'Detecting configs...',
    'init.snapshotting': 'Creating vanilla snapshot...',
    'init.done': 'Vanilla snapshot saved to ~/.orchester/vanilla/',

    // DiffPreview
    'diff.remove': 'Remove:',
    'diff.apply': 'Apply:',
    'diff.noChanges': 'No changes to apply.',

    // ResultView
    'result.success': 'Switch successful',
    'result.failed': 'Switch failed',
    'result.active': 'Active:',
    'result.linksCreated': 'Links created:',
    'result.linksRemoved': 'Links removed:',
    'result.vanillaRestored': 'Vanilla state restored automatically',

    // InstallView
    'install.selectRegistry': 'Select from registry',
    'install.legend': '✓ = orchester profile  ● = on system',
    'install.activeOnSystem': 'Active on system',
    'install.activeWarning': '{tools} — Installing won\'t affect your current setup. Activating later will replace the active layer.',
    'install.blocked': '{name} is already on your system',
    'install.cannotOverwrite': 'orchester cannot overwrite an active installation.',
    'install.evidence': 'Evidence:',
    'install.uninstallFirst': 'To manage it with orchester, first uninstall from its original source, then install via orchester.',
    'install.installing': 'Installing...',
    'install.downloaded': 'Profile downloaded. To activate, select it from the profile list.',
    'install.replaceWarning': 'Activating will replace current: {tools}',
    'install.failed': 'Install failed',
    'install.addUrl': 'add URL',
    'install.addFromUrl': 'Add from Git URL',
    'install.addUrlHint': 'Paste a Git repository URL (https://github.com/user/repo)',
    'install.clone': 'clone & install',
    'install.alreadyInstalled': 'This profile is already installed.',
    'install.reinstallConfirm': 'Reinstall? (overwrites existing)',
    'install.reinstall': 'reinstall',
    'install.delete': 'delete',
    'install.deleteConfirm': 'Delete this profile?',
    'install.deleteCustomNote': 'Profile files and custom registry entry will be removed.',
    'install.deleteBuiltinNote': 'Profile files will be removed. You can reinstall from registry.',

    // Usage
    'usage.title': 'Runtime Usage',
    'usage.totalTokens': 'Total tokens (all runtimes):',
    'usage.tokens': 'Tokens',
    'usage.sessions': 'Sessions',
    'usage.messages': 'Messages',
    'usage.last7days': 'Last 7 days:',
    'usage.models': 'Models:',

    // Language
    'lang.title': 'Language / 언어',
    'lang.current': 'Current: {lang}',
  },

  ko: {
    'header.profileManager': '프로파일 관리자',
    'header.help': '도움말',
    'header.firstRun': '초기 설정',
    'header.switchPreview': '전환 미리보기',
    'header.switchResult': '전환 결과',
    'header.install': '프로파일 설치',

    'header.feat1': '◇ 한 키로 오케스트레이션 레이어 전환',
    'header.feat2': '◇ Symlink 격리 — 파일 덮어쓰기 없음',
    'header.feat3': '◇ Claude, Codex, Gemini, Cursor 등 지원',

    'list.selectProfile': '프로파일을 선택하세요:',
    'list.noneOption': 'none — 바닐라 복원 (오케스트레이션 없음)',
    'list.runtimes': '런타임',
    'list.system': '시스템',
    'list.welcome': 'orchester에 오신 것을 환영합니다!',
    'list.noProfiles': '설치된 프로파일이 없습니다.',
    'list.pressInstall': '{key}을 눌러 레지스트리에서 설치하거나,',
    'list.pressHelp': '{key}을 눌러 도움말을 확인하세요.',

    'help.whatIs': 'orchester란?',
    'help.whatIsDesc1': 'AI 코딩 도구를 위한 오케스트레이션 프로파일 관리자입니다.',
    'help.whatIsDesc2': 'symlink 격리 방식으로 서로 다른 오케스트레이션 레이어를',
    'help.whatIsDesc3': '(bkit, omc, ecc 등) 전환할 수 있습니다.',
    'help.concepts': '핵심 개념',
    'help.profile': 'agents, skills, hooks, commands 묶음',
    'help.install': '레지스트리에서 프로파일 다운로드 (부작용 없음)',
    'help.activate': 'symlink로 프로파일 적용 (현재 설정 대체)',
    'help.vanilla': '첫 실행 시 저장된 원본 설정',
    'help.keybindings': '키바인딩',
    'help.keySelect': '선택 / 확인',
    'help.keyNavigate': '목록 탐색',
    'help.keyInstall': '레지스트리에서 설치',
    'help.keyHelp': '도움말 토글',
    'help.keyUsage': '사용량 보기',
    'help.keyLang': '언어 변경',
    'help.keyQuit': '종료',
    'help.pressClose': '아무 키나 누르면 닫힙니다',

    'footer.select': '선택',
    'footer.install': '설치',
    'footer.usage': '사용량',
    'footer.help': '도움말',
    'footer.quit': '종료',
    'footer.confirm': '확인',
    'footer.cancel': '취소',
    'footer.back': '뒤로',
    'footer.continue': '계속',
    'footer.backToList': '프로파일 목록으로',

    'init.detected': '감지된 Claude Code 설정:',
    'init.detecting': '설정 감지 중...',
    'init.snapshotting': '바닐라 스냅샷 생성 중...',
    'init.done': '바닐라 스냅샷이 ~/.orchester/vanilla/에 저장되었습니다.',

    'diff.remove': '제거:',
    'diff.apply': '적용:',
    'diff.noChanges': '적용할 변경사항이 없습니다.',

    'result.success': '전환 성공',
    'result.failed': '전환 실패',
    'result.active': '활성:',
    'result.linksCreated': '생성된 링크:',
    'result.linksRemoved': '제거된 링크:',
    'result.vanillaRestored': '바닐라 상태가 자동으로 복원되었습니다',

    'install.selectRegistry': '레지스트리에서 선택',
    'install.legend': '✓ = orchester 프로파일  ● = 시스템에 존재',
    'install.activeOnSystem': '시스템에 활성',
    'install.activeWarning': '{tools} — 설치해도 현재 설정에 영향을 주지 않습니다. 나중에 활성화하면 현재 레이어가 교체됩니다.',
    'install.blocked': '{name}은(는) 이미 시스템에 설치되어 있습니다',
    'install.cannotOverwrite': 'orchester는 활성 설치를 덮어쓸 수 없습니다.',
    'install.evidence': '근거:',
    'install.uninstallFirst': 'orchester로 관리하려면 먼저 원본 소스에서 제거한 후, orchester를 통해 설치하세요.',
    'install.installing': '설치 중...',
    'install.downloaded': '프로파일이 다운로드되었습니다. 활성화하려면 프로파일 목록에서 선택하세요.',
    'install.replaceWarning': '활성화하면 현재 설정이 교체됩니다: {tools}',
    'install.failed': '설치 실패',
    'install.addUrl': 'URL 추가',
    'install.addFromUrl': 'Git URL로 추가',
    'install.addUrlHint': 'Git 저장소 URL을 입력하세요 (https://github.com/user/repo)',
    'install.clone': '클론 & 설치',
    'install.alreadyInstalled': '이미 설치된 프로파일입니다.',
    'install.reinstallConfirm': '재설치 하시겠습니까? (기존 파일 덮어쓰기)',
    'install.reinstall': '재설치',
    'install.delete': '삭제',
    'install.deleteConfirm': '이 프로파일을 삭제하시겠습니까?',
    'install.deleteCustomNote': '프로파일 파일과 커스텀 레지스트리 항목이 제거됩니다.',
    'install.deleteBuiltinNote': '프로파일 파일이 제거됩니다. 레지스트리에서 다시 설치할 수 있습니다.',

    'usage.title': '런타임 사용량',
    'usage.totalTokens': '전체 토큰 (모든 런타임):',
    'usage.tokens': '토큰',
    'usage.sessions': '세션',
    'usage.messages': '메시지',
    'usage.last7days': '최근 7일:',
    'usage.models': '모델:',

    'lang.title': 'Language / 언어',
    'lang.current': '현재: {lang}',
  },

  ja: {
    'header.profileManager': 'プロファイル管理',
    'header.help': 'ヘルプ',
    'header.firstRun': '初回セットアップ',
    'header.switchPreview': '切替プレビュー',
    'header.switchResult': '切替結果',
    'header.install': 'プロファイルインストール',

    'header.feat1': '◇ ワンキーでオーケストレーションレイヤーを切替',
    'header.feat2': '◇ Symlink分離 — ファイル上書きなし',
    'header.feat3': '◇ Claude, Codex, Gemini, Cursor等に対応',

    'list.selectProfile': 'プロファイルを選択:',
    'list.noneOption': 'none — バニラに復元（オーケストレーションなし）',
    'list.runtimes': 'ランタイム',
    'list.system': 'システム',
    'list.welcome': 'orchesterへようこそ！',
    'list.noProfiles': 'インストール済みのプロファイルがありません。',
    'list.pressInstall': '{key}でレジストリからインストール、',
    'list.pressHelp': '{key}でヘルプを表示。',

    'help.whatIs': 'orchesterとは？',
    'help.whatIsDesc1': 'AIコーディングツール向けオーケストレーションプロファイル管理ツール。',
    'help.whatIsDesc2': 'symlink分離方式で異なるオーケストレーションレイヤーを',
    'help.whatIsDesc3': '（bkit、omc、eccなど）切り替えることができます。',
    'help.concepts': '基本概念',
    'help.profile': 'agents、skills、hooks、commandsのセット',
    'help.install': 'レジストリからプロファイルをダウンロード（副作用なし）',
    'help.activate': 'symlinkでプロファイルを適用（現在の設定を置換）',
    'help.vanilla': '初回実行時に保存された元の設定',
    'help.keybindings': 'キーバインド',
    'help.keySelect': '選択 / 確認',
    'help.keyNavigate': 'リスト移動',
    'help.keyInstall': 'レジストリからインストール',
    'help.keyHelp': 'ヘルプ切替',
    'help.keyUsage': '使用量を表示',
    'help.keyLang': '言語変更',
    'help.keyQuit': '終了',
    'help.pressClose': '任意のキーで閉じる',

    'footer.select': '選択',
    'footer.install': 'インストール',
    'footer.usage': '使用量',
    'footer.help': 'ヘルプ',
    'footer.quit': '終了',
    'footer.confirm': '確認',
    'footer.cancel': 'キャンセル',
    'footer.back': '戻る',
    'footer.continue': '続行',
    'footer.backToList': 'プロファイル一覧へ',

    'init.detected': '検出されたClaude Code設定:',
    'init.detecting': '設定を検出中...',
    'init.snapshotting': 'バニラスナップショット作成中...',
    'init.done': 'バニラスナップショットを~/.orchester/vanilla/に保存しました。',

    'diff.remove': '削除:',
    'diff.apply': '適用:',
    'diff.noChanges': '適用する変更がありません。',

    'result.success': '切替成功',
    'result.failed': '切替失敗',
    'result.active': 'アクティブ:',
    'result.linksCreated': '作成リンク:',
    'result.linksRemoved': '削除リンク:',
    'result.vanillaRestored': 'バニラ状態が自動的に復元されました',

    'install.selectRegistry': 'レジストリから選択',
    'install.legend': '✓ = orchesterプロファイル  ● = システム上',
    'install.activeOnSystem': 'システム上でアクティブ',
    'install.activeWarning': '{tools} — インストールしても現在の設定に影響しません。後でアクティブ化すると現在のレイヤーが置換されます。',
    'install.blocked': '{name}はすでにシステムにインストールされています',
    'install.cannotOverwrite': 'orchesterはアクティブなインストールを上書きできません。',
    'install.evidence': '根拠:',
    'install.uninstallFirst': 'orchesterで管理するには、まず元のソースからアンインストールし、orchesterでインストールしてください。',
    'install.installing': 'インストール中...',
    'install.downloaded': 'プロファイルがダウンロードされました。アクティブ化するにはプロファイル一覧から選択してください。',
    'install.replaceWarning': 'アクティブ化すると現在の設定が置換されます: {tools}',
    'install.failed': 'インストール失敗',
    'install.addUrl': 'URL追加',
    'install.addFromUrl': 'Git URLから追加',
    'install.addUrlHint': 'Gitリポジトリ URL を入力 (https://github.com/user/repo)',
    'install.clone': 'クローン＆インストール',
    'install.alreadyInstalled': 'このプロファイルは既にインストール済みです。',
    'install.reinstallConfirm': '再インストールしますか？（既存ファイルを上書き）',
    'install.reinstall': '再インストール',
    'install.delete': '削除',
    'install.deleteConfirm': 'このプロファイルを削除しますか？',
    'install.deleteCustomNote': 'プロファイルとカスタムレジストリエントリが削除されます。',
    'install.deleteBuiltinNote': 'プロファイルが削除されます。レジストリから再インストール可能です。',

    'usage.title': 'ランタイム使用量',
    'usage.totalTokens': '合計トークン（全ランタイム）:',
    'usage.tokens': 'トークン',
    'usage.sessions': 'セッション',
    'usage.messages': 'メッセージ',
    'usage.last7days': '過去7日間:',
    'usage.models': 'モデル:',

    'lang.title': 'Language / 言語',
    'lang.current': '現在: {lang}',
  },

  zh: {
    'header.profileManager': '配置文件管理器',
    'header.help': '帮助',
    'header.firstRun': '首次设置',
    'header.switchPreview': '切换预览',
    'header.switchResult': '切换结果',
    'header.install': '安装配置文件',

    'header.feat1': '◇ 一键切换编排层',
    'header.feat2': '◇ Symlink隔离 — 无文件覆盖',
    'header.feat3': '◇ 支持 Claude, Codex, Gemini, Cursor 等',

    'list.selectProfile': '选择配置文件:',
    'list.noneOption': 'none — 恢复原始状态（无编排）',
    'list.runtimes': '运行时',
    'list.system': '系统',
    'list.welcome': '欢迎使用 orchester！',
    'list.noProfiles': '尚未安装任何配置文件。',
    'list.pressInstall': '按 {key} 从注册表浏览并安装，',
    'list.pressHelp': '或按 {key} 查看帮助。',

    'help.whatIs': '什么是 orchester？',
    'help.whatIsDesc1': '面向AI编程工具的编排配置文件管理器。',
    'help.whatIsDesc2': '通过 symlink 隔离方式在不同编排层之间切换',
    'help.whatIsDesc3': '（bkit、omc、ecc等）。',
    'help.concepts': '核心概念',
    'help.profile': 'agents、skills、hooks、commands 的集合',
    'help.install': '从注册表下载配置文件（无副作用）',
    'help.activate': '通过 symlink 应用配置文件（替换当前设置）',
    'help.vanilla': '首次运行时保存的原始配置',
    'help.keybindings': '快捷键',
    'help.keySelect': '选择 / 确认',
    'help.keyNavigate': '列表导航',
    'help.keyInstall': '从注册表安装',
    'help.keyHelp': '切换帮助',
    'help.keyUsage': '查看使用量',
    'help.keyLang': '更改语言',
    'help.keyQuit': '退出',
    'help.pressClose': '按任意键关闭',

    'footer.select': '选择',
    'footer.install': '安装',
    'footer.usage': '使用量',
    'footer.help': '帮助',
    'footer.quit': '退出',
    'footer.confirm': '确认',
    'footer.cancel': '取消',
    'footer.back': '返回',
    'footer.continue': '继续',
    'footer.backToList': '返回配置文件列表',

    'init.detected': '检测到的 Claude Code 配置:',
    'init.detecting': '检测配置中...',
    'init.snapshotting': '创建原始快照中...',
    'init.done': '原始快照已保存至 ~/.orchester/vanilla/',

    'diff.remove': '删除:',
    'diff.apply': '应用:',
    'diff.noChanges': '没有需要应用的更改。',

    'result.success': '切换成功',
    'result.failed': '切换失败',
    'result.active': '当前:',
    'result.linksCreated': '已创建链接:',
    'result.linksRemoved': '已删除链接:',
    'result.vanillaRestored': '原始状态已自动恢复',

    'install.selectRegistry': '从注册表选择',
    'install.legend': '✓ = orchester配置文件  ● = 系统上存在',
    'install.activeOnSystem': '系统上已激活',
    'install.activeWarning': '{tools} — 安装不会影响当前设置。稍后激活将替换当前层。',
    'install.blocked': '{name} 已安装在您的系统上',
    'install.cannotOverwrite': 'orchester 无法覆盖已激活的安装。',
    'install.evidence': '证据:',
    'install.uninstallFirst': '要用 orchester 管理，请先从原始来源卸载，然后通过 orchester 安装。',
    'install.installing': '安装中...',
    'install.downloaded': '配置文件已下载。要激活，请从配置文件列表中选择。',
    'install.replaceWarning': '激活将替换当前设置: {tools}',
    'install.failed': '安装失败',
    'install.addUrl': '添加URL',
    'install.addFromUrl': '从Git URL添加',
    'install.addUrlHint': '输入Git仓库URL (https://github.com/user/repo)',
    'install.clone': '克隆并安装',
    'install.alreadyInstalled': '此配置文件已安装。',
    'install.reinstallConfirm': '重新安装？（覆盖现有文件）',
    'install.reinstall': '重新安装',
    'install.delete': '删除',
    'install.deleteConfirm': '删除此配置文件？',
    'install.deleteCustomNote': '配置文件和自定义注册表条目将被删除。',
    'install.deleteBuiltinNote': '配置文件将被删除。可以从注册表重新安装。',

    'usage.title': '运行时使用量',
    'usage.totalTokens': '总令牌（所有运行时）:',
    'usage.tokens': '令牌',
    'usage.sessions': '会话',
    'usage.messages': '消息',
    'usage.last7days': '最近7天:',
    'usage.models': '模型:',

    'lang.title': 'Language / 语言',
    'lang.current': '当前: {lang}',
  },
};

// ── Locale detection & persistence ──

let currentLocale: Locale = 'en';

/** Detect system locale */
function detectSystemLocale(): Locale {
  const env = process.env['LANG'] || process.env['LC_ALL'] || process.env['LC_MESSAGES'] || '';
  const lower = env.toLowerCase();
  if (lower.startsWith('ko')) return 'ko';
  if (lower.startsWith('ja')) return 'ja';
  if (lower.startsWith('zh')) return 'zh';
  return 'en';
}

/** Load saved locale from config, or detect from system */
export function initLocale(): Locale {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const config = fs.readJsonSync(CONFIG_PATH) as { locale?: string };
      if (config.locale && config.locale in messages) {
        currentLocale = config.locale as Locale;
        return currentLocale;
      }
    }
  } catch {
    // ignore
  }
  currentLocale = detectSystemLocale();
  return currentLocale;
}

/** Save locale to config */
export function setLocale(locale: Locale): void {
  currentLocale = locale;
  try {
    fs.ensureDirSync(ORCH_DIR);
    let config: Record<string, unknown> = {};
    if (fs.existsSync(CONFIG_PATH)) {
      config = fs.readJsonSync(CONFIG_PATH) as Record<string, unknown>;
    }
    config.locale = locale;
    fs.writeJsonSync(CONFIG_PATH, config, { spaces: 2 });
  } catch {
    // best effort
  }
}

/** Get current locale */
export function getLocale(): Locale {
  return currentLocale;
}

/** Get all available locales */
export function getLocales(): Locale[] {
  return ['en', 'ko', 'ja', 'zh'];
}

/** Locale display names */
export function getLocaleLabel(locale: Locale): string {
  const labels: Record<Locale, string> = {
    en: 'English',
    ko: '한국어',
    ja: '日本語',
    zh: '中文',
  };
  return labels[locale];
}

/** Translate a key with optional interpolation */
export function t(key: string, params?: Record<string, string>): string {
  let msg = messages[currentLocale]?.[key] ?? messages.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      msg = msg.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }
  return msg;
}
