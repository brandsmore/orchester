// orchester — Runtime usage data aggregator
// Reads local usage data from Claude Code, Codex CLI, etc.

import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';

export interface RuntimeUsage {
  id: string;
  name: string;
  available: boolean;
  /** Total tokens (input + output) */
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;
  /** Number of sessions */
  sessions: number;
  /** Number of messages */
  messages: number;
  /** Daily breakdown (last 7 days) */
  daily: DailyUsage[];
  /** Model breakdown */
  models: Record<string, { inputTokens: number; outputTokens: number }>;
  /** Note if data unavailable */
  note?: string;
}

export interface DailyUsage {
  date: string;
  tokens: number;
  messages: number;
  sessions: number;
}

// ── Claude Code ──

interface ClaudeStatsCache {
  version?: number;
  dailyActivity?: Array<{
    date: string;
    messageCount: number;
    sessionCount: number;
    toolCallCount: number;
  }>;
  dailyModelTokens?: Array<{
    date: string;
    tokensByModel: Record<string, number>;
  }>;
  modelUsage?: Record<string, {
    inputTokens?: number;
    outputTokens?: number;
    cacheReadInputTokens?: number;
    cacheCreationInputTokens?: number;
  }>;
}

function readClaudeUsage(): RuntimeUsage {
  const home = os.homedir();
  const statsPath = path.join(home, '.claude', 'stats-cache.json');

  const usage: RuntimeUsage = {
    id: 'claude',
    name: 'Claude Code',
    available: false,
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheTokens: 0,
    sessions: 0,
    messages: 0,
    daily: [],
    models: {},
  };

  try {
    if (!fs.existsSync(statsPath)) {
      usage.note = 'stats-cache.json not found';
      return usage;
    }

    const data = fs.readJsonSync(statsPath) as ClaudeStatsCache;
    usage.available = true;

    // Model usage totals
    if (data.modelUsage) {
      for (const [model, mu] of Object.entries(data.modelUsage)) {
        const inp = mu.inputTokens ?? 0;
        const out = mu.outputTokens ?? 0;
        const cacheRead = mu.cacheReadInputTokens ?? 0;
        const cacheCreate = mu.cacheCreationInputTokens ?? 0;
        usage.inputTokens += inp;
        usage.outputTokens += out;
        usage.cacheTokens += cacheRead + cacheCreate;
        usage.models[model] = { inputTokens: inp, outputTokens: out };
      }
      usage.totalTokens = usage.inputTokens + usage.outputTokens;
    }

    // Daily activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().slice(0, 10);

    if (data.dailyActivity) {
      for (const day of data.dailyActivity) {
        if (day.date >= cutoff) {
          usage.daily.push({
            date: day.date,
            tokens: 0, // will fill from dailyModelTokens
            messages: day.messageCount,
            sessions: day.sessionCount,
          });
          usage.messages += day.messageCount;
          usage.sessions += day.sessionCount;
        }
      }
    }

    if (data.dailyModelTokens) {
      for (const day of data.dailyModelTokens) {
        if (day.date >= cutoff) {
          const dayTokens = Object.values(day.tokensByModel).reduce((a, b) => a + b, 0);
          const existing = usage.daily.find(d => d.date === day.date);
          if (existing) {
            existing.tokens = dayTokens;
          }
        }
      }
    }

    // Sort daily by date desc
    usage.daily.sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    usage.note = 'Failed to parse stats-cache.json';
  }

  return usage;
}

// ── Codex CLI ──

interface CodexTokenEvent {
  total_token_usage?: {
    input_tokens?: number;
    cached_input_tokens?: number;
    output_tokens?: number;
    reasoning_output_tokens?: number;
    total_tokens?: number;
  };
  model_context_window?: number;
}

function readCodexUsage(): RuntimeUsage {
  const home = os.homedir();
  const sessionsDir = path.join(home, '.codex', 'sessions');

  const usage: RuntimeUsage = {
    id: 'codex',
    name: 'Codex CLI',
    available: false,
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheTokens: 0,
    sessions: 0,
    messages: 0,
    daily: [],
    models: {},
  };

  try {
    if (!fs.existsSync(sessionsDir)) {
      usage.note = 'No sessions directory';
      return usage;
    }

    usage.available = true;
    const dailyMap = new Map<string, DailyUsage>();

    // Walk year/month/day directories
    const years = fs.readdirSync(sessionsDir).filter(f => /^\d{4}$/.test(f));
    for (const year of years) {
      const yearDir = path.join(sessionsDir, year);
      if (!fs.statSync(yearDir).isDirectory()) continue;

      const months = fs.readdirSync(yearDir).filter(f => /^\d{1,2}$/.test(f));
      for (const month of months) {
        const monthDir = path.join(yearDir, month);
        if (!fs.statSync(monthDir).isDirectory()) continue;

        const days = fs.readdirSync(monthDir).filter(f => /^\d{1,2}$/.test(f));
        for (const day of days) {
          const dayDir = path.join(monthDir, day);
          if (!fs.statSync(dayDir).isDirectory()) continue;

          const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          const files = fs.readdirSync(dayDir).filter(f => f.endsWith('.jsonl'));

          for (const file of files) {
            usage.sessions++;
            const filePath = path.join(dayDir, file);
            try {
              const content = fs.readFileSync(filePath, 'utf-8');
              const lines = content.split('\n').filter(l => l.trim());

              for (const line of lines) {
                try {
                  const entry = JSON.parse(line) as {
                    type?: string;
                    payload?: { type?: string; info?: CodexTokenEvent };
                  };

                  if (entry.type === 'event_msg' && entry.payload?.type === 'token_count' && entry.payload.info) {
                    const tu = entry.payload.info.total_token_usage;
                    if (tu) {
                      // Use last token_count per session (cumulative)
                      // We'll just add them all — it's the running total per turn
                    }
                  }

                  if (entry.type === 'event_msg' && entry.payload?.type === 'user_message') {
                    usage.messages++;
                  }
                } catch {
                  // skip malformed line
                }
              }

              // Get the last token_count event in the file (cumulative total for session)
              let lastTokens: CodexTokenEvent['total_token_usage'] | null = null;
              for (let i = lines.length - 1; i >= 0; i--) {
                try {
                  const entry = JSON.parse(lines[i]!) as {
                    type?: string;
                    payload?: { type?: string; info?: CodexTokenEvent };
                  };
                  if (entry.type === 'event_msg' && entry.payload?.type === 'token_count' && entry.payload.info?.total_token_usage) {
                    lastTokens = entry.payload.info.total_token_usage;
                    break;
                  }
                } catch {
                  // skip
                }
              }

              if (lastTokens) {
                const inp = (lastTokens.input_tokens ?? 0);
                const cached = (lastTokens.cached_input_tokens ?? 0);
                const out = (lastTokens.output_tokens ?? 0) + (lastTokens.reasoning_output_tokens ?? 0);
                usage.inputTokens += inp;
                usage.outputTokens += out;
                usage.cacheTokens += cached;
                usage.totalTokens += inp + out;

                if (!dailyMap.has(dateStr)) {
                  dailyMap.set(dateStr, { date: dateStr, tokens: 0, messages: 0, sessions: 0 });
                }
                const d = dailyMap.get(dateStr)!;
                d.tokens += inp + out;
                d.sessions++;
              }
            } catch {
              // skip unreadable file
            }
          }
        }
      }
    }

    // Last 7 days filter
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().slice(0, 10);

    usage.daily = Array.from(dailyMap.values())
      .filter(d => d.date >= cutoff)
      .sort((a, b) => b.date.localeCompare(a.date));

    // Model info
    usage.models['gpt-5-codex'] = { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens };
  } catch {
    usage.note = 'Failed to read sessions';
  }

  return usage;
}

// ── Gemini CLI (no local data) ──

function readGeminiUsage(): RuntimeUsage {
  return {
    id: 'gemini',
    name: 'Gemini CLI',
    available: false,
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheTokens: 0,
    sessions: 0,
    messages: 0,
    daily: [],
    models: {},
    note: 'No local usage data. Check Google AI Studio dashboard.',
  };
}

// ── Antigravity (no local data) ──

function readAntigravityUsage(): RuntimeUsage {
  return {
    id: 'antigravity',
    name: 'Antigravity',
    available: false,
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheTokens: 0,
    sessions: 0,
    messages: 0,
    daily: [],
    models: {},
    note: 'No local usage data. Check Codeium dashboard.',
  };
}

// ── OpenCode ──

function readOpenCodeUsage(): RuntimeUsage {
  const home = os.homedir();
  const configDir = path.join(home, '.config', 'opencode');
  const dataDir = path.join(home, '.local', 'share', 'opencode');

  const usage: RuntimeUsage = {
    id: 'opencode',
    name: 'OpenCode',
    available: false,
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheTokens: 0,
    sessions: 0,
    messages: 0,
    daily: [],
    models: {},
  };

  // OpenCode stores sessions in ~/.local/share/opencode/sessions/
  const sessionsDir = path.join(dataDir, 'sessions');
  try {
    if (!fs.existsSync(sessionsDir) && !fs.existsSync(configDir)) {
      usage.note = 'OpenCode not installed';
      return usage;
    }

    if (!fs.existsSync(sessionsDir)) {
      usage.available = fs.existsSync(configDir);
      usage.note = 'No session data found. Check opencode.ai dashboard.';
      return usage;
    }

    usage.available = true;

    // Count session files
    const sessionFiles = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.json') || f.endsWith('.jsonl'));
    usage.sessions = sessionFiles.length;

    if (usage.sessions === 0) {
      usage.note = 'No session data found.';
    }
  } catch {
    usage.note = 'Failed to read OpenCode data';
  }

  return usage;
}

// ── Cursor (no local data) ──

function readCursorUsage(): RuntimeUsage {
  return {
    id: 'cursor',
    name: 'Cursor',
    available: false,
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheTokens: 0,
    sessions: 0,
    messages: 0,
    daily: [],
    models: {},
    note: 'No local usage data. Check Cursor Settings > Usage.',
  };
}

// ── Public API ──

export function getAllUsage(): RuntimeUsage[] {
  return [
    readClaudeUsage(),
    readCodexUsage(),
    readOpenCodeUsage(),
    readGeminiUsage(),
    readAntigravityUsage(),
    readCursorUsage(),
  ];
}

/** Format token count for display */
export function formatTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Simple bar chart string */
export function miniBar(value: number, max: number, width: number = 20): string {
  if (max === 0) return '░'.repeat(width);
  const filled = Math.round((value / max) * width);
  return '█'.repeat(Math.min(filled, width)) + '░'.repeat(Math.max(width - filled, 0));
}
