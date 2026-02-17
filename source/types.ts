// agent orchester v0.2 — Type definitions

/** Install type for links and profiles */
export type InstallType = 'symlink' | 'plugin' | 'hybrid';

/** Plugin command for manual execution */
export interface PluginCommand {
  command: string;
  label: string;
  action: 'install' | 'uninstall';
}

/** Persisted state in ~/.orchester/state.json */
export interface State {
  activeProfile: string | null;
  lastSwitched: string | null;
}

/** A single symlink managed by orchester */
export interface Link {
  source: string;
  target: string;
}

/** Link definition in manifest.yaml */
export interface LinkDef {
  source: string;
  target: string;
  installType?: 'symlink' | 'plugin';
  pluginCommand?: string;
  pluginLabel?: string;
}

/** Parsed manifest.yaml for a profile */
export interface Manifest {
  name: string;
  description: string;
  tags: string[];
  tool: string;
  links: LinkDef[];
  installType?: InstallType;
}

/** Diff item for preview */
export interface DiffItem {
  type: 'add' | 'remove';
  source: string;
  target: string;
  installType?: 'symlink' | 'plugin';
  pluginCommand?: string;
  pluginLabel?: string;
}

/** Diff data for preview view */
export interface DiffData {
  from: string | null;
  to: string | null;
  items: DiffItem[];
}

/** Profile list item for TUI */
export interface ProfileListItem {
  name: string;
  description: string;
  tags: string[];
  focus?: string[];
  active: boolean;
  installType?: InstallType;
}

/** Switch result */
export interface SwitchResult {
  success: boolean;
  linksCreated: number;
  linksRemoved: number;
  createdLinks?: LinkDef[];
  removedLinks?: LinkDef[];
  pluginCommands?: PluginCommand[];
  error?: string;
}

/** Registry entry for a known orchestration tool */
export interface RegistryEntry {
  name: string;
  description: string;
  repo: string;
  tags: string[];
  focus?: string[];
  stars: string;
  profileDir: string;
  installType?: InstallType;
  manifest: Omit<Manifest, 'name' | 'description' | 'tags'> & {
    name: string;
    description: string;
    tags: string[];
  };
}

/** Install progress */
export interface InstallProgress {
  status: 'idle' | 'cloning' | 'configuring' | 'done' | 'error';
  message: string;
  entry: RegistryEntry | null;
}

/** App view states */
export type AppView = 'splash' | 'init' | 'list' | 'preview' | 'result' | 'install' | 'usage';
