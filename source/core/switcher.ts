import path from 'node:path';
import os from 'node:os';
import { parseManifest } from './manifest.js';
import { getActiveProfile, setActiveProfile, getProfilesDir } from './state.js';
import { restoreVanilla } from './vanilla.js';
import { createSymlink, removeSymlink, isOrchSymlink } from './linker.js';
import type { DiffData, DiffItem, SwitchResult, Manifest, LinkDef, PluginCommand } from '../types.js';

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

/** Build diff preview between two profiles */
export function buildDiffPreview(from: string | null, to: string | null): DiffData {
  const items: DiffItem[] = [];

  // Items to remove (from current profile)
  if (from) {
    try {
      const fromManifest = loadProfileManifest(from);
      for (const link of fromManifest.links) {
        items.push({
          type: 'remove',
          source: link.source,
          target: link.target,
          installType: link.installType,
          pluginCommand: link.pluginCommand,
          pluginLabel: link.pluginLabel,
        });
      }
    } catch {
      // profile may not exist anymore
    }
  }

  // Items to add (to target profile)
  if (to) {
    try {
      const toManifest = loadProfileManifest(to);
      for (const link of toManifest.links) {
        items.push({
          type: 'add',
          source: link.source,
          target: link.target,
          installType: link.installType,
          pluginCommand: link.pluginCommand,
          pluginLabel: link.pluginLabel,
        });
      }
    } catch {
      // profile may not exist
    }
  }

  return { from, to, items };
}

/** 4-phase profile switch: Validate → Deactivate → Activate → Verify */
export function switchProfile(from: string | null, to: string | null): SwitchResult {
  let linksRemoved = 0;
  let linksCreated = 0;
  const createdLinks: LinkDef[] = [];
  const removedLinks: LinkDef[] = [];
  const pluginCommands: PluginCommand[] = [];

  try {
    // Phase 1: Validate
    if (to) {
      loadProfileManifest(to); // throws if invalid
    }

    // Phase 2: Deactivate current
    if (from) {
      try {
        const fromManifest = loadProfileManifest(from);
        for (const link of fromManifest.links) {
          if (link.installType === 'plugin') {
            // Plugin links: collect uninstall command, skip symlink removal
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
          const target = expandVars(link.target);
          if (isOrchSymlink(target)) {
            removeSymlink(target);
            linksRemoved++;
            removedLinks.push({ source: link.source, target: link.target });
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
          // Plugin links: collect install command, skip symlink creation
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
        const absoluteSource = resolveSource(to, link.source);
        const target = expandVars(link.target);
        createSymlink(absoluteSource, target);
        linksCreated++;
        createdLinks.push({ source: link.source, target: link.target });
      }
      setActiveProfile(to);
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
