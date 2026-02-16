import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import yaml from 'js-yaml';
import { getProfilesDir, getOrchDir } from './state.js';
import type { RegistryEntry } from '../types.js';

/**
 * Known orchestration tools registry.
 * Each entry defines how to clone + configure a profile.
 */
export const REGISTRY: RegistryEntry[] = [
  {
    name: 'omc',
    description: '5 modes, 32 agents, 31+ skills, HUD',
    repo: 'https://github.com/anthropics/claude-code-tooling',
    tags: ['agents', 'orchestration', 'multi-mode'],
    stars: '2.1K',
    profileDir: 'omc',
    manifest: {
      name: 'omc',
      description: '5 modes, 32 agents, 31+ skills, HUD',
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
    description: 'agents + skills + hooks + commands comprehensive starter kit',
    repo: 'https://github.com/anthropics/claude-code-tooling',
    tags: ['starter-kit', 'comprehensive', 'production-ready'],
    stars: '44.7K',
    profileDir: 'ecc',
    manifest: {
      name: 'ecc',
      description: 'agents + skills + hooks + commands comprehensive starter kit',
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
    description: 'PDCA-based AI native development workflow',
    repo: 'https://github.com/anthropics/claude-code-tooling',
    tags: ['pdca', 'workflow', 'development'],
    stars: '-',
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
    description: '73 plugins, 112 agents, plugin marketplace',
    repo: 'https://github.com/wshobson/agents',
    tags: ['plugins', 'marketplace', 'agents'],
    stars: '28.7K',
    profileDir: 'wshobson-agents',
    manifest: {
      name: 'wshobson-agents',
      description: '73 plugins, 112 agents, plugin marketplace',
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
    description: 'Sisyphus orchestrator, 25+ hooks, multi-agent workflows',
    repo: 'https://github.com/code-yeongyu/oh-my-opencode',
    tags: ['opencode', 'orchestration', 'multi-agent'],
    stars: '-',
    profileDir: 'oh-my-opencode',
    manifest: {
      name: 'oh-my-opencode',
      description: 'Sisyphus orchestrator, 25+ hooks, multi-agent workflows',
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
    name: 'claude-orchestra',
    description: '40+ agents organizational chart structure',
    repo: 'https://github.com/mgesteban/claude-code-agents-orchestra',
    tags: ['agents', 'org-chart', 'structure'],
    stars: '37',
    profileDir: 'claude-orchestra',
    manifest: {
      name: 'claude-orchestra',
      description: '40+ agents organizational chart structure',
      tags: ['agents', 'org-chart', 'structure'],
      tool: 'claude-code',
      links: [
        { source: 'files/agents/', target: '$HOME/.claude/agents/' },
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
        // Map to default Claude Code targets
        const targetMap: Record<string, string> = {
          agents: '$HOME/.claude/agents/',
          skills: '$HOME/.claude/skills/',
          hooks: '$HOME/.claude/hooks/',
          plugins: '$HOME/.claude/plugins/',
          commands: '$HOME/.claude/commands/',
          prompts: '$HOME/.claude/prompts/',
        };
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

    // Step 4: Write manifest.yaml
    onProgress(`Writing manifest...`);
    const manifestData = {
      name: entry.manifest.name,
      description: entry.manifest.description,
      tags: entry.manifest.tags,
      tool: entry.manifest.tool,
      links: links.length > 0 ? links : entry.manifest.links,
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
        const targetMap: Record<string, string> = {
          agents: '$HOME/.claude/agents/',
          skills: '$HOME/.claude/skills/',
          hooks: '$HOME/.claude/hooks/',
          plugins: '$HOME/.claude/plugins/',
          commands: '$HOME/.claude/commands/',
          prompts: '$HOME/.claude/prompts/',
        };
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
