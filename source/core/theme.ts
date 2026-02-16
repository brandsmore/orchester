// orchester — Nord-inspired purple theme
// Consistent color palette across all views

export const theme = {
  // Brand
  brand: '#b48ead',       // Nordic purple — primary brand color

  // Semantic
  success: '#a3be8c',     // Soft green
  warning: '#ebcb8b',     // Warm yellow
  error: '#bf616a',       // Muted red
  info: '#81a1c1',        // Blue-gray

  // UI
  accent: '#d8dee9',      // Light gray — key hints, emphasis
  muted: 'gray',          // Dim text, borders
  bar: '#b48ead',         // Charts, progress bars

  // Profile status
  installed: '#a3be8c',   // Green — installed
  onSystem: '#ebcb8b',    // Yellow — active on system
  custom: '#b48ead',      // Purple — custom entries
} as const;

// Icons — Unicode symbols for TUI branding
export const icons = {
  // Runtimes
  claude: '⬡',       // hexagon — Anthropic
  codex: '◈',        // diamond in square — OpenAI
  gemini: '✦',       // star — Google
  cursor: '▢',       // square — Cursor
  antigravity: '◉',  // bullseye
  opencode: '⬢',     // filled hexagon

  // Tool types
  agents: '🤖',
  skills: '⚡',
  hooks: '🔗',
  plugins: '🧩',
  commands: '⌘',

  // Features
  switch: '⇄',       // profile switching
  symlink: '🔒',     // safe isolation
  snapshot: '📸',     // vanilla backup
  registry: '📦',    // package registry
  usage: '📊',       // token dashboard
  detect: '🔍',      // runtime detection
  diff: '📋',        // change preview
  lang: '🌐',        // i18n

  // Status
  active: '●',
  inactive: '○',
  installed: '✓',
  missing: '✗',
  star: '★',
  arrow: '→',
  pointer: '❯',
} as const;

/** Get runtime icon by id */
export function runtimeIcon(id: string): string {
  return (icons as Record<string, string>)[id] ?? '◇';
}

/** Get tool type icon */
export function toolIcon(type: string): string {
  return (icons as Record<string, string>)[type] ?? '◇';
}
