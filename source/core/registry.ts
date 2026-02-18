import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import yaml from 'js-yaml';
import { getProfilesDir, getOrchDir } from './state.js';
import { TOOL_CONFIG_DIRS, normalizeToolId } from './detector.js';
import type { RegistryEntry } from '../types.js';

/**
 * Known orchestration tools registry.
 * Each entry defines how to clone + configure a profile.
 */
export const REGISTRY: RegistryEntry[] = [
  {
    name: 'omc',
    displayName: 'Oh My ClaudeCode',
    description: '28 agents, 37 skills, Team mode, multi-agent orchestration',
    repo: 'https://github.com/Yeachan-Heo/oh-my-claudecode',
    tags: ['agents', 'orchestration', 'multi-mode'],
    focus: ['Fullstack', 'Multi-agent', 'Swarm', 'Autopilot'],
    stars: '6.4K',
    profileDir: 'omc',
    manifest: {
      name: 'omc',
      description: '28 agents, 37 skills, Team mode, multi-agent orchestration',
      tags: ['agents', 'orchestration', 'multi-mode'],
      tool: 'claude-code',
      links: [
        { source: 'files/agents/', target: '$HOME/.claude/agents/' },
        { source: 'files/skills/', target: '$HOME/.claude/skills/' },
        { source: 'files/hooks/', target: '$HOME/.claude/hooks/' },
      ],
    },
  },
  {
    name: 'ecc',
    displayName: 'Everything Claude Code',
    description: '13 agents, 30+ skills, hooks + commands, hackathon winner',
    repo: 'https://github.com/affaan-m/everything-claude-code',
    tags: ['starter-kit', 'comprehensive', 'production-ready'],
    focus: ['Backend', 'DB', 'TDD', 'Security', 'Django', 'Spring', 'Go'],
    stars: '44.7K',
    profileDir: 'ecc',
    manifest: {
      name: 'ecc',
      description: '13 agents, 30+ skills, hooks + commands, hackathon winner',
      tags: ['starter-kit', 'comprehensive', 'production-ready'],
      tool: 'claude-code',
      links: [
        { source: 'files/agents/', target: '$HOME/.claude/agents/' },
        { source: 'files/skills/', target: '$HOME/.claude/skills/' },
        { source: 'files/hooks/', target: '$HOME/.claude/hooks/' },
      ],
    },
  },
  {
    name: 'bkit',
    displayName: 'bkit Claude Code',
    description: 'PDCA-based AI native development workflow',
    repo: 'https://github.com/popup-studio-ai/bkit-claude-code',
    tags: ['pdca', 'workflow', 'development'],
    focus: ['Pipeline', '9-Phase', 'Enterprise', 'Mobile', 'Desktop'],
    stars: '91',
    profileDir: 'bkit',
    manifest: {
      name: 'bkit',
      description: 'PDCA-based AI native development workflow',
      tags: ['pdca', 'workflow', 'development'],
      tool: 'claude-code',
      links: [
        { source: 'files/agents/', target: '$HOME/.claude/agents/' },
        { source: 'files/skills/', target: '$HOME/.claude/skills/' },
        { source: 'files/plugins/', target: '$HOME/.claude/plugins/' },
      ],
    },
  },
  {
    name: 'wshobson-agents',
    displayName: 'Wshobson Agents',
    description: '73 plugins, 112 agents, 146 skills, plugin marketplace',
    repo: 'https://github.com/wshobson/agents',
    tags: ['plugins', 'marketplace', 'agents'],
    focus: ['Plugin', 'Cloud', 'Blockchain', 'IoT', 'AI/ML'],
    stars: '28.7K',
    profileDir: 'wshobson-agents',
    manifest: {
      name: 'wshobson-agents',
      description: '73 plugins, 112 agents, 146 skills, plugin marketplace',
      tags: ['plugins', 'marketplace', 'agents'],
      tool: 'claude-code',
      links: [
        { source: 'files/agents/', target: '$HOME/.claude/agents/' },
        { source: 'files/skills/', target: '$HOME/.claude/skills/' },
      ],
    },
  },
  {
    name: 'oh-my-opencode',
    displayName: 'Oh My OpenCode',
    description: 'Sisyphus orchestrator, multi-agent workflows for OpenCode',
    repo: 'https://github.com/code-yeongyu/oh-my-opencode',
    tags: ['opencode', 'orchestration', 'multi-agent'],
    focus: ['OpenCode', 'Orchestration', 'Mythical Agents'],
    stars: '31.6K',
    profileDir: 'oh-my-opencode',
    manifest: {
      name: 'oh-my-opencode',
      description: 'Sisyphus orchestrator, multi-agent workflows for OpenCode',
      tags: ['opencode', 'orchestration', 'multi-agent'],
      tool: 'opencode',
      links: [
        { source: 'files/agents/', target: '$HOME/.config/opencode/agents/' },
        { source: 'files/hooks/', target: '$HOME/.config/opencode/hooks/' },
        { source: 'files/skills/', target: '$HOME/.config/opencode/skills/' },
      ],
    },
  },
  {
    name: 'oh-my-codex',
    displayName: 'Oh My Codex',
    description: 'Agent roles, workflow skills, MCP state management for Codex CLI',
    repo: 'https://github.com/ohmycodex/oh-my-codex',
    tags: ['codex', 'orchestration', 'agents', 'prompts'],
    focus: ['Codex CLI', 'Architect', 'Executor', 'Planner'],
    stars: '-',
    profileDir: 'oh-my-codex',
    manifest: {
      name: 'oh-my-codex',
      description: 'Agent roles, workflow skills, MCP state management for Codex CLI',
      tags: ['codex', 'orchestration', 'agents', 'prompts'],
      tool: 'codex',
      links: [
        { source: 'files/agents/', target: '$HOME/.codex/agents/' },
        { source: 'files/prompts/', target: '$HOME/.codex/prompts/' },
        { source: 'files/hooks/', target: '$HOME/.codex/hooks/' },
      ],
    },
  },
  {
    name: 'claude-orchestra',
    displayName: 'Claude Code Agents Orchestra',
    description: '47 agents, 10 teams, organizational chart structure',
    repo: 'https://github.com/0ldh/claude-code-agents-orchestra',
    tags: ['agents', 'org-chart', 'structure'],
    focus: ['Org-chart', 'QA', 'Architecture', 'DevOps', 'i18n'],
    stars: '32',
    profileDir: 'claude-orchestra',
    manifest: {
      name: 'claude-orchestra',
      description: '47 agents, 10 teams, organizational chart structure',
      tags: ['agents', 'org-chart', 'structure'],
      tool: 'claude-code',
      links: [
        { source: 'files/agents/', target: '$HOME/.claude/agents/' },
      ],
    },
  },
  {
    name: 'superpowers',
    displayName: 'Superpowers',
    description: 'Agentic skills framework, TDD workflow, multi-tool support',
    repo: 'https://github.com/obra/superpowers',
    tags: ['skills', 'tdd', 'workflow', 'multi-tool'],
    focus: ['TDD', 'Design', 'Planning', 'Code Review', 'Cursor'],
    stars: '53.5K',
    profileDir: 'superpowers',
    installType: 'hybrid',
    manifest: {
      name: 'superpowers',
      description: 'Agentic skills framework, TDD workflow, multi-tool support',
      tags: ['skills', 'tdd', 'workflow', 'multi-tool'],
      tool: 'claude-code',
      installType: 'hybrid',
      links: [
        { source: 'files/agents/', target: '$HOME/.claude/agents/' },
        { source: 'files/skills/', target: '$HOME/.claude/skills/' },
        { source: 'files/hooks/', target: '$HOME/.claude/hooks/' },
        { source: 'files/commands/', target: '$HOME/.claude/commands/' },
        {
          source: 'superpowers-plugin',
          target: '$HOME/.claude/plugins/superpowers',
          installType: 'plugin',
          pluginCommand: '/plugin install obra/superpowers',
          pluginLabel: 'Superpowers Plugin',
        },
      ],
    },
  },
];

/** Check if a profile is already installed */
export function isInstalled(name: string): boolean {
  const profileDir = path.join(getProfilesDir(), name);
  return fs.existsSync(path.join(profileDir, 'manifest.yaml'));
}

/**
 * Discover Claude Code config files within a cloned directory.
 * Searches common locations for agents/, skills/, hooks/, etc.
 */
function discoverFiles(root: string): { dir: string; found: string[] } {
  const found: string[] = [];

  // Search for well-known directories at various levels
  const searchDirs = ['agents', 'skills', 'hooks', 'plugins', 'commands', 'prompts'];
  const ruleFiles = ['CLAUDE.md', 'AGENTS.md', 'rules.md'];

  // Check if this is a monorepo — look for packages/ directory
  const candidates = [root];
  const packagesDir = path.join(root, 'packages');
  if (fs.existsSync(packagesDir)) {
    const pkgs = fs.readdirSync(packagesDir).map(p => path.join(packagesDir, p));
    candidates.push(...pkgs);
  }
  // Also check src/, .claude/
  for (const sub of ['src', '.claude', 'config']) {
    const p = path.join(root, sub);
    if (fs.existsSync(p)) candidates.push(p);
  }

  // Find the best candidate that has config files
  let bestDir = root;
  let bestCount = 0;

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate) || !fs.statSync(candidate).isDirectory()) continue;
    let count = 0;
    for (const dir of searchDirs) {
      if (fs.existsSync(path.join(candidate, dir))) count++;
    }
    for (const file of ruleFiles) {
      if (fs.existsSync(path.join(candidate, file))) count++;
    }
    if (count > bestCount) {
      bestCount = count;
      bestDir = candidate;
    }
  }

  // Collect what we found in the best directory
  for (const dir of searchDirs) {
    if (fs.existsSync(path.join(bestDir, dir))) found.push(dir);
  }
  for (const file of ruleFiles) {
    if (fs.existsSync(path.join(bestDir, file))) found.push(file);
  }

  return { dir: bestDir, found };
}

/**
 * Install a profile from the registry.
 * Steps:
 *  1. git clone repo to temp
 *  2. Discover and copy relevant files to ~/.orchester/profiles/<name>/files/
 *  3. Write manifest.yaml with discovered link targets
 */
export async function installProfile(
  entry: RegistryEntry,
  onProgress: (msg: string) => void,
): Promise<void> {
  const profilesDir = getProfilesDir();
  const profileDir = path.join(profilesDir, entry.profileDir);
  const filesDir = path.join(profileDir, 'files');
  const tmpDir = path.join(os.tmpdir(), `orchester-install-${entry.name}-${Date.now()}`);

  try {
    fs.ensureDirSync(profilesDir);

    // Step 1: Clone
    onProgress(`Cloning ${entry.repo}...`);

    execSync(`git clone --depth 1 "${entry.repo}" "${tmpDir}"`, {
      stdio: 'pipe',
      timeout: 120000,
    });

    // Step 2: Discover files
    onProgress(`Scanning for config files...`);
    const { dir: sourceRoot, found } = discoverFiles(tmpDir);

    if (found.length === 0) {
      throw new Error(`No agents/skills/hooks found in ${entry.repo}`);
    }

    onProgress(`Found: ${found.join(', ')}`);

    // Step 3: Copy discovered files
    onProgress(`Copying ${found.length} items to profile...`);
    fs.ensureDirSync(filesDir);

    const links: Array<{ source: string; target: string }> = [];

    for (const item of found) {
      const src = path.join(sourceRoot, item);
      const dest = path.join(filesDir, item);

      if (fs.statSync(src).isDirectory()) {
        fs.copySync(src, dest);
        const toolId = normalizeToolId(entry.manifest.tool);
        const targetMap = TOOL_CONFIG_DIRS[toolId] ?? TOOL_CONFIG_DIRS['claude']!;
        if (targetMap[item]) {
          links.push({ source: `files/${item}/`, target: targetMap[item] });
        }
      } else {
        fs.copySync(src, dest);
        if (item === 'CLAUDE.md') {
          links.push({ source: `files/${item}`, target: '$PROJECT/CLAUDE.md' });
        }
      }
    }

    // Step 4: Merge plugin links from registry manifest
    const pluginLinks = entry.manifest.links.filter(l => l.installType === 'plugin');
    const finalLinks = links.length > 0 ? [...links, ...pluginLinks] : entry.manifest.links;

    // Step 5: Write manifest.yaml
    onProgress(`Writing manifest...`);
    const manifestData: Record<string, unknown> = {
      name: entry.manifest.name,
      description: entry.manifest.description,
      tags: entry.manifest.tags,
      tool: entry.manifest.tool,
      links: finalLinks,
      ...(entry.manifest.installType ? { installType: entry.manifest.installType } : {}),
    };
    fs.writeFileSync(
      path.join(profileDir, 'manifest.yaml'),
      yaml.dump(manifestData),
      'utf-8',
    );

    onProgress(`Done! ${entry.name} installed (${found.length} items)`);
  } finally {
    // Cleanup temp
    fs.removeSync(tmpDir);
  }
}

/** Get registry entries with installed status */
export function getRegistryWithStatus(): Array<RegistryEntry & { installed: boolean; custom?: boolean }> {
  const custom = loadCustomRegistry();
  const all = [...REGISTRY, ...custom];
  return all.map(entry => ({
    ...entry,
    installed: isInstalled(entry.name),
    custom: custom.some(c => c.name === entry.name),
  }));
}

// ── Custom Registry ──

const CUSTOM_REGISTRY_PATH = path.join(getOrchDir(), 'custom-registry.json');

/** Load user-added custom registry entries */
export function loadCustomRegistry(): RegistryEntry[] {
  try {
    if (!fs.existsSync(CUSTOM_REGISTRY_PATH)) return [];
    const data = fs.readJsonSync(CUSTOM_REGISTRY_PATH) as RegistryEntry[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Save a custom registry entry */
export function saveCustomEntry(entry: RegistryEntry): void {
  const entries = loadCustomRegistry();
  const existing = entries.findIndex(e => e.name === entry.name);
  if (existing >= 0) {
    entries[existing] = entry;
  } else {
    entries.push(entry);
  }
  fs.ensureDirSync(getOrchDir());
  fs.writeJsonSync(CUSTOM_REGISTRY_PATH, entries, { spaces: 2 });
}

/** Remove a custom registry entry */
export function removeCustomEntry(name: string): void {
  const entries = loadCustomRegistry().filter(e => e.name !== name);
  fs.writeJsonSync(CUSTOM_REGISTRY_PATH, entries, { spaces: 2 });
}

/** Uninstall a profile (remove profile dir). If custom, also remove from registry. */
export function uninstallProfile(name: string): { removed: boolean; wasCustom: boolean } {
  const profileDir = path.join(getProfilesDir(), name);
  const wasCustom = loadCustomRegistry().some(e => e.name === name);

  let removed = false;
  if (fs.existsSync(profileDir)) {
    fs.removeSync(profileDir);
    removed = true;
  }

  if (wasCustom) {
    removeCustomEntry(name);
  }

  return { removed, wasCustom };
}

/**
 * Install a profile from a Git URL.
 * Auto-discovers config files and creates a registry entry.
 */
export async function installFromUrl(
  repoUrl: string,
  onProgress: (msg: string) => void,
): Promise<RegistryEntry> {
  // Extract name from URL: https://github.com/user/repo → repo
  const urlName = repoUrl.replace(/\.git$/, '').split('/').pop() || 'custom';
  const profilesDir = getProfilesDir();
  const profileDir = path.join(profilesDir, urlName);
  const filesDir = path.join(profileDir, 'files');
  const tmpDir = path.join(os.tmpdir(), `orchester-install-${urlName}-${Date.now()}`);

  try {
    fs.ensureDirSync(profilesDir);

    // Step 1: Clone
    onProgress(`Cloning ${repoUrl}...`);
    execSync(`git clone --depth 1 "${repoUrl}" "${tmpDir}"`, {
      stdio: 'pipe',
      timeout: 120000,
    });

    // Step 2: Discover files
    onProgress(`Scanning for config files...`);
    const { dir: sourceRoot, found } = discoverFiles(tmpDir);

    if (found.length === 0) {
      throw new Error(`No agents/skills/hooks found in ${repoUrl}`);
    }

    onProgress(`Found: ${found.join(', ')}`);

    // Step 3: Copy discovered files
    onProgress(`Copying ${found.length} items to profile...`);
    fs.ensureDirSync(filesDir);

    const links: Array<{ source: string; target: string }> = [];

    for (const item of found) {
      const src = path.join(sourceRoot, item);
      const dest = path.join(filesDir, item);

      if (fs.statSync(src).isDirectory()) {
        fs.copySync(src, dest);
        const targetMap = TOOL_CONFIG_DIRS['claude']!;
        if (targetMap[item]) {
          links.push({ source: `files/${item}/`, target: targetMap[item] });
        }
      } else {
        fs.copySync(src, dest);
        if (item === 'CLAUDE.md') {
          links.push({ source: `files/${item}`, target: '$PROJECT/CLAUDE.md' });
        }
      }
    }

    // Step 4: Build entry
    const description = `${found.join(', ')} (custom)`;
    const entry: RegistryEntry = {
      name: urlName,
      description,
      repo: repoUrl,
      tags: ['custom', ...found.filter(f => ['agents', 'skills', 'hooks', 'plugins', 'commands'].includes(f))],
      stars: '-',
      profileDir: urlName,
      manifest: {
        name: urlName,
        description,
        tags: ['custom'],
        tool: 'claude-code',
        links,
      },
    };

    // Step 5: Write manifest.yaml
    onProgress(`Writing manifest...`);
    fs.writeFileSync(
      path.join(profileDir, 'manifest.yaml'),
      yaml.dump({
        name: entry.manifest.name,
        description: entry.manifest.description,
        tags: entry.manifest.tags,
        tool: entry.manifest.tool,
        links: entry.manifest.links,
      }),
      'utf-8',
    );

    // Step 6: Save to custom registry
    saveCustomEntry(entry);

    onProgress(`Done! ${urlName} installed (${found.length} items)`);
    return entry;
  } finally {
    fs.removeSync(tmpDir);
  }
}
