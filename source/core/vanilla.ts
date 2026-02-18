import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { getVanillaDir } from './state.js';

/** Config paths to detect & snapshot (multi-tool) */
function getDetectionPaths(): Array<{ source: string; label: string }> {
  const home = os.homedir();
  const cwd = process.cwd();

  return [
    // Claude Code
    { source: path.join(home, '.claude', 'agents'), label: '~/.claude/agents/' },
    { source: path.join(home, '.claude', 'skills'), label: '~/.claude/skills/' },
    { source: path.join(home, '.claude', 'hooks'), label: '~/.claude/hooks/' },
    // Codex CLI
    { source: path.join(home, '.codex', 'agents'), label: '~/.codex/agents/' },
    // Gemini CLI
    { source: path.join(home, '.gemini', 'agents'), label: '~/.gemini/agents/' },
    // Cursor
    { source: path.join(home, '.cursor', 'agents'), label: '~/.cursor/agents/' },
    // OpenCode
    { source: path.join(home, '.config', 'opencode', 'agents'), label: '~/.config/opencode/agents/' },
    // Project
    { source: path.join(cwd, 'CLAUDE.md'), label: '$PROJECT/CLAUDE.md' },
  ];
}

export interface DetectedConfig {
  path: string;
  label: string;
  exists: boolean;
}

/** Detect which Claude Code configs exist */
export function detectConfigs(): DetectedConfig[] {
  return getDetectionPaths().map(({ source, label }) => ({
    path: source,
    label,
    exists: fs.existsSync(source),
  }));
}

/** Create vanilla snapshot of current Claude Code configs */
export function createVanillaSnapshot(): void {
  const vanillaDir = getVanillaDir();
  fs.ensureDirSync(vanillaDir);

  const configs = detectConfigs().filter(c => c.exists);

  for (const config of configs) {
    const stat = fs.statSync(config.path);
    const relativeName = path.basename(config.path);
    const dest = path.join(vanillaDir, relativeName);

    if (stat.isDirectory()) {
      fs.copySync(config.path, dest, { overwrite: true });
    } else {
      fs.copyFileSync(config.path, dest);
    }
  }
}

/** Restore vanilla snapshot */
export function restoreVanilla(): void {
  const vanillaDir = getVanillaDir();
  if (!fs.existsSync(vanillaDir)) {
    return;
  }

  const entries = fs.readdirSync(vanillaDir);
  const paths = getDetectionPaths();

  for (const entry of entries) {
    const src = path.join(vanillaDir, entry);
    const target = paths.find(p => path.basename(p.source) === entry);
    if (!target) continue;

    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.copySync(src, target.source, { overwrite: true });
    } else {
      fs.copyFileSync(src, target.source);
    }
  }
}

/** Check if vanilla snapshot exists */
export function hasVanilla(): boolean {
  const vanillaDir = getVanillaDir();
  return fs.existsSync(vanillaDir) && fs.readdirSync(vanillaDir).length > 0;
}
