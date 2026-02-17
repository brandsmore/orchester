import fs from 'fs-extra';
import path from 'node:path';
import yaml from 'js-yaml';
import type { Manifest } from '../types.js';

/**
 * Parse manifest.yaml from a profile directory.
 */
export function parseManifest(profileDir: string): Manifest {
  const manifestPath = path.join(profileDir, 'manifest.yaml');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`manifest.yaml not found in ${profileDir}`);
  }

  const raw = fs.readFileSync(manifestPath, 'utf-8');
  const data = yaml.load(raw) as Record<string, unknown>;

  if (!data || typeof data !== 'object') {
    throw new Error(`Invalid manifest.yaml in ${profileDir}`);
  }

  const name = String(data['name'] ?? path.basename(profileDir));
  const description = String(data['description'] ?? '');
  const tags = Array.isArray(data['tags']) ? data['tags'].map(String) : [];
  const tool = String(data['tool'] ?? 'claude-code');

  const installType = typeof data['installType'] === 'string' ? data['installType'] as Manifest['installType'] : undefined;

  const rawLinks = Array.isArray(data['links']) ? data['links'] : [];
  const links = rawLinks.map((l: unknown) => {
    const link = l as Record<string, string>;
    return {
      source: String(link['source'] ?? ''),
      target: String(link['target'] ?? ''),
      ...(link['installType'] ? { installType: link['installType'] as 'symlink' | 'plugin' } : {}),
      ...(link['pluginCommand'] ? { pluginCommand: String(link['pluginCommand']) } : {}),
      ...(link['pluginLabel'] ? { pluginLabel: String(link['pluginLabel']) } : {}),
    };
  }).filter(l => l.source && l.target);

  return { name, description, tags, tool, links, ...(installType ? { installType } : {}) };
}

/**
 * List all profile directories under ~/.orchester/profiles/
 */
export function listProfileDirs(profilesRoot: string): string[] {
  if (!fs.existsSync(profilesRoot)) {
    return [];
  }

  return fs.readdirSync(profilesRoot)
    .filter(entry => {
      const full = path.join(profilesRoot, entry);
      return fs.statSync(full).isDirectory() &&
        fs.existsSync(path.join(full, 'manifest.yaml'));
    })
    .map(entry => path.join(profilesRoot, entry));
}
