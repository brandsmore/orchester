import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import type { ToolId } from '../types.js';

/** Tool-specific config directory mappings */
export const TOOL_CONFIG_DIRS: Record<string, Record<string, string>> = {
  claude: { agents: '$HOME/.claude/agents/', skills: '$HOME/.claude/skills/', hooks: '$HOME/.claude/hooks/', plugins: '$HOME/.claude/plugins/', commands: '$HOME/.claude/commands/', prompts: '$HOME/.claude/prompts/' },
  codex: { agents: '$HOME/.codex/agents/', skills: '$HOME/.codex/skills/', hooks: '$HOME/.codex/hooks/', commands: '$HOME/.codex/commands/', prompts: '$HOME/.codex/prompts/' },
  gemini: { agents: '$HOME/.gemini/agents/', skills: '$HOME/.gemini/skills/', hooks: '$HOME/.gemini/hooks/', commands: '$HOME/.gemini/commands/' },
  cursor: { skills: '$HOME/.cursor/skills/', rules: '$HOME/.cursor/rules/', docs: '$HOME/.cursor/docs/' },
  antigravity: { agents: '$HOME/.antigravity/agents/', skills: '$HOME/.gemini/antigravity/skills/', extensions: '$HOME/.antigravity/extensions/' },
  opencode: { agents: '$HOME/.config/opencode/agents/', skills: '$HOME/.config/opencode/skills/', hooks: '$HOME/.config/opencode/hooks/', commands: '$HOME/.config/opencode/commands/' },
};

/** Normalize tool name to ToolId (e.g. 'claude-code' → 'claude') */
export function normalizeToolId(tool: string): ToolId {
  const map: Record<string, ToolId> = {
    'claude-code': 'claude',
    'claude': 'claude',
    'codex-cli': 'codex',
    'codex': 'codex',
    'gemini-cli': 'gemini',
    'gemini': 'gemini',
    'cursor': 'cursor',
    'antigravity': 'antigravity',
    'opencode': 'opencode',
  };
  return map[tool.toLowerCase()] ?? 'claude';
}

export interface DetectedRuntime {
  id: string;
  name: string;
  installed: boolean;
  version: string | null;
  configDir: string;
}

export interface DetectedTool {
  name: string;
  location: string;
  type: string;
  toolId: string;
  fileCount: number;
}

/** Check if a binary exists in PATH */
function whichSync(bin: string): string | null {
  try {
    return execSync(`which ${bin} 2>/dev/null`, { encoding: 'utf-8' }).trim() || null;
  } catch {
    return null;
  }
}

/** Get version from a CLI tool */
function getVersion(bin: string, flag = '--version'): string | null {
  try {
    const out = execSync(`${bin} ${flag} 2>/dev/null`, { encoding: 'utf-8', timeout: 5000 }).trim();
    // Extract version number pattern
    const match = out.match(/(\d+\.\d+[\.\d]*)/);
    return match ? match[1]! : out.slice(0, 20);
  } catch {
    return null;
  }
}

/** Detect installed AI coding CLI/IDE runtimes */
export function detectRuntimes(): DetectedRuntime[] {
  const home = os.homedir();

  const runtimes: DetectedRuntime[] = [
    {
      id: 'claude',
      name: 'Claude Code',
      installed: whichSync('claude') !== null,
      version: whichSync('claude') ? getVersion('claude') : null,
      configDir: path.join(home, '.claude'),
    },
    {
      id: 'codex',
      name: 'Codex CLI',
      installed: whichSync('codex') !== null,
      version: whichSync('codex') ? getVersion('codex') : null,
      configDir: path.join(home, '.codex'),
    },
    {
      id: 'gemini',
      name: 'Gemini CLI',
      installed: whichSync('gemini') !== null,
      version: whichSync('gemini') ? getVersion('gemini') : null,
      configDir: path.join(home, '.gemini'),
    },
    {
      id: 'cursor',
      name: 'Cursor',
      installed: whichSync('cursor') !== null || fs.existsSync(path.join(home, '.cursor')),
      version: null,
      configDir: path.join(home, '.cursor'),
    },
    {
      id: 'antigravity',
      name: 'Antigravity',
      installed: whichSync('antigravity') !== null || fs.existsSync(path.join(home, '.antigravity')),
      version: null,
      configDir: path.join(home, '.antigravity'),
    },
    {
      id: 'opencode',
      name: 'OpenCode',
      installed: whichSync('opencode') !== null || fs.existsSync(path.join(home, '.config', 'opencode')),
      version: whichSync('opencode') ? getVersion('opencode') : null,
      configDir: path.join(home, '.config', 'opencode'),
    },
  ];

  return runtimes;
}

/** Count files in a directory (non-recursive) */
function countFiles(dir: string): number {
  try {
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir).filter(f => {
      const full = path.join(dir, f);
      return !f.startsWith('.') && (fs.statSync(full).isFile() || fs.statSync(full).isDirectory());
    }).length;
  } catch {
    return 0;
  }
}

/** Expand $HOME in TOOL_CONFIG_DIRS paths */
function expandHome(p: string): string {
  return p.replace(/\$HOME/g, os.homedir());
}

/** Scan all tool config directories from TOOL_CONFIG_DIRS */
export function detectExistingTools(): DetectedTool[] {
  const tools: DetectedTool[] = [];

  for (const [toolId, dirs] of Object.entries(TOOL_CONFIG_DIRS)) {
    for (const [type, rawDir] of Object.entries(dirs)) {
      const dir = expandHome(rawDir).replace(/\/$/, '');
      if (!fs.existsSync(dir)) continue;

      const entries = fs.readdirSync(dir).filter(f => !f.startsWith('.'));
      if (entries.length > 0) {
        tools.push({
          name: type,
          location: dir,
          type,
          toolId,
          fileCount: entries.length,
        });
      }
    }
  }

  return tools;
}

/** Read installed_plugins.json to get actually installed plugins */
function readInstalledPlugins(): Array<{ name: string; version: string; installPath: string }> {
  const home = os.homedir();
  const pluginsFile = path.join(home, '.claude', 'plugins', 'installed_plugins.json');

  try {
    if (!fs.existsSync(pluginsFile)) return [];
    const data = fs.readJsonSync(pluginsFile) as {
      plugins?: Record<string, Array<{ version?: string; installPath?: string }>>;
    };
    if (!data.plugins) return [];

    const results: Array<{ name: string; version: string; installPath: string }> = [];
    for (const [key, installs] of Object.entries(data.plugins)) {
      // key format: "bkit@bkit-marketplace"
      const name = key.split('@')[0]!;
      for (const install of installs) {
        results.push({
          name,
          version: install.version ?? 'unknown',
          installPath: install.installPath ?? '',
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

/** Scan for agents that match known tool patterns */
function scanAgentsFor(agentsDir: string, patterns: string[]): string[] {
  try {
    if (!fs.existsSync(agentsDir)) return [];
    const entries = fs.readdirSync(agentsDir);
    return entries.filter(e => {
      const lower = e.toLowerCase();
      return patterns.some(p => lower.includes(p));
    });
  } catch {
    return [];
  }
}

/** Known tool signatures — detect which orchestration layer is active */
export function detectActiveOrchestration(): Array<{ name: string; evidence: string[] }> {
  const home = os.homedir();
  const results: Array<{ name: string; evidence: string[] }> = [];

  const installedPlugins = readInstalledPlugins();
  const agentsDir = path.join(home, '.claude', 'agents');
  const skillsDir = path.join(home, '.claude', 'skills');
  const hooksDir = path.join(home, '.claude', 'hooks');
  const commandsDir = path.join(home, '.claude', 'commands');

  // ── bkit detection ──
  const bkitEvidence: string[] = [];
  const bkitPlugin = installedPlugins.find(p => p.name === 'bkit');
  if (bkitPlugin) {
    bkitEvidence.push(`plugin: bkit v${bkitPlugin.version} (${bkitPlugin.installPath})`);
  }
  const bkitAgents = scanAgentsFor(agentsDir, ['bkit']);
  if (bkitAgents.length > 0) {
    bkitEvidence.push(`~/.claude/agents/ (${bkitAgents.length} bkit agents)`);
  }
  if (bkitEvidence.length > 0) {
    results.push({ name: 'bkit', evidence: bkitEvidence });
  }

  // ── omc detection (oh-my-claudecode) ──
  const omcEvidence: string[] = [];
  const omcPlugin = installedPlugins.find(p =>
    p.name === 'omc' || p.name === 'oh-my-claudecode'
  );
  if (omcPlugin) {
    omcEvidence.push(`plugin: ${omcPlugin.name} v${omcPlugin.version}`);
  }
  const omcAgents = scanAgentsFor(agentsDir, ['omc', 'oh-my', 'autopilot', 'swarm']);
  if (omcAgents.length > 0) {
    omcEvidence.push(`~/.claude/agents/ (${omcAgents.length} omc-style agents)`);
  }
  if (omcEvidence.length > 0) {
    results.push({ name: 'omc', evidence: omcEvidence });
  }

  // ── ecc detection (everything-claude-code) ──
  const eccEvidence: string[] = [];
  const eccPlugin = installedPlugins.find(p =>
    p.name === 'ecc' || p.name === 'everything-claude-code'
  );
  if (eccPlugin) {
    eccEvidence.push(`plugin: ${eccPlugin.name} v${eccPlugin.version}`);
  }
  if (fs.existsSync(commandsDir) && countFiles(commandsDir) > 5) {
    eccEvidence.push(`~/.claude/commands/ (${countFiles(commandsDir)} commands)`);
  }
  if (fs.existsSync(agentsDir) && countFiles(agentsDir) > 20) {
    eccEvidence.push(`~/.claude/agents/ (${countFiles(agentsDir)} agents — large collection)`);
  }
  if (eccEvidence.length > 0) {
    results.push({ name: 'ecc', evidence: eccEvidence });
  }

  // ── oh-my-codex (omx) detection ──
  const omxEvidence: string[] = [];
  const codexDir = path.join(home, '.codex');
  const omxDir = path.join(codexDir, '.omx');
  if (fs.existsSync(omxDir)) {
    omxEvidence.push(`~/.codex/.omx/ directory`);
  }
  const omxBin = whichSync('oh-my-codex');
  if (omxBin) {
    omxEvidence.push(`binary: ${omxBin}`);
  }
  // Check config.toml for omx markers
  const codexConfig = path.join(codexDir, 'config.toml');
  try {
    if (fs.existsSync(codexConfig)) {
      const configContent = fs.readFileSync(codexConfig, 'utf-8');
      if (configContent.includes('oh-my-codex') || configContent.includes('omx_state')) {
        omxEvidence.push(`config.toml contains omx config`);
      }
    }
  } catch { /* ignore */ }
  const codexPromptsDir = path.join(codexDir, 'prompts');
  if (fs.existsSync(codexPromptsDir) && countFiles(codexPromptsDir) >= 5) {
    omxEvidence.push(`~/.codex/prompts/ (${countFiles(codexPromptsDir)} prompts)`);
  }
  if (omxEvidence.length > 0) {
    results.push({ name: 'oh-my-codex', evidence: omxEvidence });
  }

  // ── oh-my-opencode detection ──
  const omocEvidence: string[] = [];
  const opencodeAgentsDir = path.join(home, '.config', 'opencode', 'agents');
  const opencodeHooksDir = path.join(home, '.config', 'opencode', 'hooks');
  // Check for oh-my-opencode specific patterns (sisyphus, prometheus, metis agents)
  const omocAgents = scanAgentsFor(opencodeAgentsDir, ['sisyphus', 'prometheus', 'metis', 'oh-my']);
  if (omocAgents.length > 0) {
    omocEvidence.push(`~/.config/opencode/agents/ (${omocAgents.length} omoc agents)`);
  }
  // Check npm global install
  const omocBin = whichSync('oh-my-opencode');
  if (omocBin) {
    omocEvidence.push(`binary: ${omocBin}`);
  }
  // Check if opencode hooks directory has many hooks (oh-my-opencode installs 25+)
  if (fs.existsSync(opencodeHooksDir) && countFiles(opencodeHooksDir) >= 10) {
    omocEvidence.push(`~/.config/opencode/hooks/ (${countFiles(opencodeHooksDir)} hooks)`);
  }
  if (omocEvidence.length > 0) {
    results.push({ name: 'oh-my-opencode', evidence: omocEvidence });
  }

  // ── wshobson/agents detection ──
  const wshobsonPlugin = installedPlugins.find(p =>
    p.name === 'wshobson-agents' || p.name === 'agents'
  );
  if (wshobsonPlugin) {
    results.push({
      name: 'wshobson-agents',
      evidence: [`plugin: ${wshobsonPlugin.name} v${wshobsonPlugin.version}`],
    });
  }

  // ── Any other installed plugins we don't have specific detection for ──
  for (const plugin of installedPlugins) {
    const alreadyDetected = results.some(r =>
      r.name === plugin.name ||
      (plugin.name === 'bkit' && r.name === 'bkit') ||
      (plugin.name === 'omc' && r.name === 'omc')
    );
    if (!alreadyDetected) {
      results.push({
        name: plugin.name,
        evidence: [`plugin: ${plugin.name} v${plugin.version}`],
      });
    }
  }

  return results;
}
