#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import { App } from './app.js';
import { initLocale } from './core/i18n.js';

// Initialize locale before rendering
initLocale();

const cli = meow(
  `
  Usage
    $ orchester

  Options
    --help     Show help
    --version  Show version

  Description
    AI coding tool orchestration profile manager.
    Switch between orchestration layers (oh-my-claudecode, bkit, etc.)
    with symlink-based profile isolation.
`,
  {
    importMeta: import.meta,
  },
);

void cli;

render(<App />);
