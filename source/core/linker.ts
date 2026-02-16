import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import type { Link } from '../types.js';

/** Expand ~ to home directory */
function expandPath(p: string): string {
  if (p.startsWith('~/') || p === '~') {
    return path.join(os.homedir(), p.slice(2));
  }
  return p;
}

/** Create a symlink from source to target */
export function createSymlink(source: string, target: string): void {
  const expandedSource = expandPath(source);
  const expandedTarget = expandPath(target);

  if (!fs.existsSync(expandedSource)) {
    throw new Error(`Source does not exist: ${expandedSource}`);
  }

  // Ensure parent directory exists
  fs.ensureDirSync(path.dirname(expandedTarget));

  // Remove existing file/link at target
  try {
    const lstat = fs.lstatSync(expandedTarget);
    if (lstat) {
      fs.removeSync(expandedTarget);
    }
  } catch {
    // doesn't exist, that's fine
  }

  fs.symlinkSync(expandedSource, expandedTarget);
}

/** Remove a symlink (only if it is a symlink) */
export function removeSymlink(target: string): void {
  const expandedTarget = expandPath(target);

  try {
    const lstat = fs.lstatSync(expandedTarget);
    if (lstat.isSymbolicLink()) {
      fs.unlinkSync(expandedTarget);
    }
  } catch {
    // target doesn't exist, nothing to do
  }
}

/** Check if a path is a symlink created by orchester */
export function isOrchSymlink(target: string): boolean {
  const expandedTarget = expandPath(target);

  try {
    const lstat = fs.lstatSync(expandedTarget);
    if (!lstat.isSymbolicLink()) return false;

    const realPath = fs.readlinkSync(expandedTarget);
    // orchester-managed symlinks point into ~/.orchester/profiles/
    return realPath.includes('.orchester/profiles/') || realPath.includes('.orchester' + path.sep + 'profiles');
  } catch {
    return false;
  }
}

/** List all active orchester-managed symlinks by scanning known targets */
export function listActiveLinks(targets: string[]): Link[] {
  const links: Link[] = [];

  for (const target of targets) {
    const expandedTarget = expandPath(target);
    try {
      const lstat = fs.lstatSync(expandedTarget);
      if (lstat.isSymbolicLink()) {
        const source = fs.readlinkSync(expandedTarget);
        if (source.includes('.orchester/profiles/') || source.includes('.orchester' + path.sep + 'profiles')) {
          links.push({ source, target: expandedTarget });
        }
      }
    } catch {
      // not a link or doesn't exist
    }
  }

  return links;
}
