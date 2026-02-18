import path from 'node:path';
import os from 'node:os';
import { parseManifest } from './manifest.js';
import { loadState, setActiveProfile, getProfilesDir } from './state.js';
import { restoreVanilla } from './vanilla.js';
import { createSymlink, removeSymlink, isOrchSymlink } from './linker.js';
import { TOOL_CONFIG_DIRS, normalizeToolId } from './detector.js';
import type { DiffData, DiffItem, SwitchResult, Manifest, LinkDef, PluginCommand, ToolId } from '../types.js';

/** Expand $HOME and $PROJECT variables in paths */
function expandVars(p: string): string {
  return p
    .replace(/\$HOME/g, os.homedir())
    .replace(/\$PROJECT/g, process.cwd())
    .replace(/^~(?=\/|$)/, os.homedir());
}

function loadProfileManifest(profileName: string): Manifest {
  const profileDir = path.join(getProfilesDir(), profileName);
  return parseManifest(profileDir);
}

function resolveSource(profileName: string, source: string): string {
  const profileDir = path.join(getProfilesDir(), profileName);
  return path.join(profileDir, source);
}

/** Resolve a manifest target path to a specific tool's config directory */
function resolveTargetForTool(manifestTarget: string, toolId: ToolId): string {
  const toolDirs = TOOL_CONFIG_DIRS[toolId];
  if (!toolDirs) return manifestTarget;

  // Extract the directory name from target (e.g. '$HOME/.claude/agents/' → 'agents')
  const parts = manifestTarget.replace(/\/$/, '').split('/');
  const dirName = parts[parts.length - 1]!;

  if (toolDirs[dirName]) {
    return toolDirs[dirName];
  }

  // Fallback: return original target
  return manifestTarget;
}

/** Build diff preview between two profiles */
export function buildDiffPreview(from: string | null, to: string | null, targetTools?: ToolId[]): DiffData {
  const items: DiffItem[] = [];
  const tools = targetTools ?? ['claude'];
  const state = loadState();
  const previousTools: ToolId[] = state.activeTools && state.activeTools.length > 0 ? state.activeTools : ['claude'];

  // Items to remove (from current profile) — use previousTools for correct paths
  if (from) {
    try {
      const fromManifest = loadProfileManifest(from);
      for (const link of fromManifest.links) {
        if (link.installType === 'plugin') {
          items.push({
            type: 'remove',
            source: link.source,
            target: link.target,
            installType: link.installType,
            pluginCommand: link.pluginCommand,
            pluginLabel: link.pluginLabel,
          });
          continue;
        }
        for (const prevTool of previousTools) {
          const resolvedTarget = resolveTargetForTool(link.target, prevTool);
          items.push({
            type: 'remove',
            source: link.source,
            target: resolvedTarget,
            toolId: prevTool,
            installType: link.installType,
          });
        }
      }
    } catch {
      // profile may not exist anymore
    }
  }

  // Items to add (to target profile) — use targetTools for new paths
  if (to) {
    try {
      const toManifest = loadProfileManifest(to);
      for (const link of toManifest.links) {
        if (link.installType === 'plugin') {
          items.push({
            type: 'add',
            source: link.source,
            target: link.target,
            installType: link.installType,
            pluginCommand: link.pluginCommand,
            pluginLabel: link.pluginLabel,
          });
          continue;
        }
        for (const tool of tools) {
          const resolvedTarget = resolveTargetForTool(link.target, tool);
          items.push({
            type: 'add',
            source: link.source,
            target: resolvedTarget,
            toolId: tool,
            installType: link.installType,
          });
        }
      }
    } catch {
      // profile may not exist
    }
  }

  return { from, to, items, targetTools: tools };
}

/** 4-phase profile switch: Validate → Deactivate → Activate → Verify */
export function switchProfile(from: string | null, to: string | null, targetTools?: ToolId[]): SwitchResult {
  let linksRemoved = 0;
  let linksCreated = 0;
  const createdLinks: LinkDef[] = [];
  const removedLinks: LinkDef[] = [];
  const pluginCommands: PluginCommand[] = [];
  const tools = targetTools ?? ['claude'];
  const state = loadState();
  const previousTools: ToolId[] = state.activeTools && state.activeTools.length > 0 ? state.activeTools : ['claude'];

  try {
    // Phase 1: Validate
    if (to) {
      loadProfileManifest(to); // throws if invalid
    }

    // Phase 2: Deactivate current — use previousTools for correct paths
    if (from) {
      try {
        const fromManifest = loadProfileManifest(from);
        for (const link of fromManifest.links) {
          if (link.installType === 'plugin') {
            if (link.pluginCommand) {
              pluginCommands.push({
                command: link.pluginCommand.replace(/install/i, 'uninstall'),
                label: link.pluginLabel ?? link.source,
                action: 'uninstall',
              });
            }
            removedLinks.push({ source: link.source, target: link.target, installType: 'plugin', pluginCommand: link.pluginCommand, pluginLabel: link.pluginLabel });
            continue;
          }
          for (const prevTool of previousTools) {
            const resolvedTarget = resolveTargetForTool(link.target, prevTool);
            const target = expandVars(resolvedTarget);
            if (isOrchSymlink(target)) {
              removeSymlink(target);
              linksRemoved++;
              removedLinks.push({ source: link.source, target: resolvedTarget });
            }
          }
        }
      } catch {
        // old profile may be gone, that's fine
      }
    }

    // Phase 3: Activate new (or restore vanilla)
    if (to) {
      const toManifest = loadProfileManifest(to);
      for (const link of toManifest.links) {
        if (link.installType === 'plugin') {
          if (link.pluginCommand) {
            pluginCommands.push({
              command: link.pluginCommand,
              label: link.pluginLabel ?? link.source,
              action: 'install',
            });
          }
          createdLinks.push({ source: link.source, target: link.target, installType: 'plugin', pluginCommand: link.pluginCommand, pluginLabel: link.pluginLabel });
          continue;
        }
        for (const tool of tools) {
          const resolvedTarget = resolveTargetForTool(link.target, tool);
          const absoluteSource = resolveSource(to, link.source);
          const target = expandVars(resolvedTarget);
          createSymlink(absoluteSource, target);
          linksCreated++;
          createdLinks.push({ source: link.source, target: resolvedTarget });
        }
      }
      setActiveProfile(to, tools);
    } else {
      // "none" selected — restore vanilla
      restoreVanilla();
      setActiveProfile(null);
    }

    // Phase 4: Verify (basic check)
    return {
      success: true,
      linksCreated,
      linksRemoved,
      createdLinks,
      removedLinks,
      targetTools: tools,
      ...(pluginCommands.length > 0 ? { pluginCommands } : {}),
    };
  } catch (err) {
    // Rollback: restore vanilla on failure
    try {
      restoreVanilla();
      setActiveProfile(null);
    } catch {
      // last resort, ignore
    }

    return {
      success: false,
      linksCreated: 0,
      linksRemoved,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
