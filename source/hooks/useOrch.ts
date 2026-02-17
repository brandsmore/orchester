import { useState, useEffect, useCallback } from 'react';
import { loadState, getProfilesDir } from '../core/state.js';
import { parseManifest, listProfileDirs } from '../core/manifest.js';
import { hasVanilla } from '../core/vanilla.js';
import { buildDiffPreview, switchProfile } from '../core/switcher.js';
import { getRegistryWithStatus } from '../core/registry.js';
import type { AppView, ProfileListItem, DiffData, SwitchResult, InstallType } from '../types.js';

/** Infer install type from manifest links */
function inferInstallType(manifest: { links: Array<{ installType?: string }> }): InstallType {
  const hasPlugin = manifest.links.some(l => l.installType === 'plugin');
  const hasSymlink = manifest.links.some(l => (l.installType ?? 'symlink') === 'symlink');
  if (hasPlugin && hasSymlink) return 'hybrid';
  if (hasPlugin) return 'plugin';
  return 'symlink';
}

export function useOrch() {
  const [view, setView] = useState<AppView>('splash');
  const [profiles, setProfiles] = useState<ProfileListItem[]>([]);
  const [activeProfile, setActiveProfile] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [switchResult, setSwitchResult] = useState<SwitchResult | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfiles = useCallback(() => {
    const state = loadState();
    setActiveProfile(state.activeProfile);

    const profilesDir = getProfilesDir();
    const dirs = listProfileDirs(profilesDir);

    const registry = getRegistryWithStatus();

    const items = dirs.map(dir => {
      try {
        const manifest = parseManifest(dir);
        const registryEntry = registry.find(r => r.name === manifest.name);
        const installType = manifest.installType ?? registryEntry?.installType ?? inferInstallType(manifest);
        const item: ProfileListItem = {
          name: manifest.name,
          description: manifest.description,
          tags: manifest.tags,
          focus: registryEntry?.focus,
          active: manifest.name === state.activeProfile,
          ...(installType !== 'symlink' ? { installType } : {}),
        };
        return item;
      } catch {
        return null;
      }
    }).filter((item): item is ProfileListItem => item !== null);

    setProfiles(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const selectProfile = useCallback((name: string | null) => {
    setSelectedProfile(name);
    const diff = buildDiffPreview(activeProfile, name);
    setDiffData(diff);
    setView('preview');
  }, [activeProfile]);

  const confirmSwitch = useCallback(() => {
    const result = switchProfile(activeProfile, selectedProfile);
    setSwitchResult(result);
    setView('result');
  }, [activeProfile, selectedProfile]);

  const backToList = useCallback(() => {
    loadProfiles();
    setView('list');
    setDiffData(null);
    setSwitchResult(null);
    setSelectedProfile(null);
  }, [loadProfiles]);

  const finishInit = useCallback(() => {
    loadProfiles();
    setView('list');
  }, [loadProfiles]);

  const goToInstall = useCallback(() => {
    setView('install');
  }, []);

  const goToUsage = useCallback(() => {
    setView('usage');
  }, []);

  const finishSplash = useCallback(() => {
    loadProfiles();
    // If no vanilla snapshot, go to init; otherwise list
    if (!hasVanilla()) {
      setView('init');
    } else {
      setView('list');
    }
  }, [loadProfiles]);

  return {
    view,
    profiles,
    activeProfile,
    selectedProfile,
    diffData,
    switchResult,
    loading,
    selectProfile,
    confirmSwitch,
    backToList,
    finishInit,
    finishSplash,
    goToInstall,
    goToUsage,
  };
}
