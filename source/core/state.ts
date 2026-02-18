import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import type { State, ToolId } from '../types.js';

const ORCH_DIR = path.join(os.homedir(), '.orchester');
const LEGACY_DIR = path.join(os.homedir(), '.orch');
const STATE_PATH = path.join(ORCH_DIR, 'state.json');

/** Migrate from ~/.orch to ~/.orchester if needed */
function migrateIfNeeded(): void {
  if (fs.existsSync(LEGACY_DIR) && !fs.existsSync(ORCH_DIR)) {
    fs.moveSync(LEGACY_DIR, ORCH_DIR);
  }
}

// Run once on import
migrateIfNeeded();

const DEFAULT_STATE: State = {
  activeProfile: null,
  lastSwitched: null,
  activeTools: [],
};

export function loadState(): State {
  try {
    if (fs.existsSync(STATE_PATH)) {
      const state = fs.readJsonSync(STATE_PATH) as State;
      if (!state.activeTools) state.activeTools = [];
      return state;
    }
  } catch {
    // corrupted state, return default
  }
  return { ...DEFAULT_STATE };
}

export function saveState(state: State): void {
  fs.ensureDirSync(ORCH_DIR);
  fs.writeJsonSync(STATE_PATH, state, { spaces: 2 });
}

export function getActiveProfile(): string | null {
  return loadState().activeProfile;
}

export function setActiveProfile(name: string | null, tools?: ToolId[]): void {
  const state = loadState();
  state.activeProfile = name;
  state.lastSwitched = new Date().toISOString();
  state.activeTools = tools ?? [];
  saveState(state);
}

export function getOrchDir(): string {
  return ORCH_DIR;
}

export function getProfilesDir(): string {
  return path.join(ORCH_DIR, 'profiles');
}

export function getVanillaDir(): string {
  return path.join(ORCH_DIR, 'vanilla');
}
