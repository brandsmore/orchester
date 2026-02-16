import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { detectRuntimes } from '../core/detector.js';
import { loadState } from '../core/state.js';
import type { DetectedRuntime } from '../core/detector.js';

interface SplashViewProps {
  onDone: () => void;
}

// Layered switch icon — universal orchestration feel
const LOGO = [
  '  ┌─────────┐ ',
  '  │ ◆  ◇  ◆ │ ',
  '  │ ◇  ◆  ◇ │ ',
  '  │ ◆  ◇  ◆ │ ',
  '  └─────────┘ ',
  '   ═══╤═══    ',
  '      │       ',
  '    ──┴──     ',
];

type SplashPhase = 'logo' | 'detect' | 'ready';

export function SplashView({ onDone }: SplashViewProps) {
  const [phase, setPhase] = useState<SplashPhase>('logo');
  const [runtimes, setRuntimes] = useState<DetectedRuntime[]>([]);
  const [activeProfile, setActiveProfile] = useState<string | null>(null);
  const [dots, setDots] = useState('');

  // Animated dots
  useEffect(() => {
    if (phase !== 'detect') return;
    const timer = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 300);
    return () => clearInterval(timer);
  }, [phase]);

  // Phase progression
  useEffect(() => {
    const t1 = setTimeout(() => {
      setPhase('detect');
    }, 400);

    const t2 = setTimeout(() => {
      const detected = detectRuntimes();
      setRuntimes(detected);
      const state = loadState();
      setActiveProfile(state.activeProfile);
      setPhase('ready');
    }, 1200);

    const t3 = setTimeout(() => {
      onDone();
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  const installedRuntimes = runtimes.filter(r => r.installed);

  return (
    <Box flexDirection="column" padding={1}>
      {/* Logo + Title */}
      <Box>
        <Box flexDirection="column">
          {LOGO.map((line, i) => (
            <Text key={i} color="#b48ead">{line}</Text>
          ))}
        </Box>

        <Box flexDirection="column" marginLeft={1} justifyContent="center">
          <Box>
            <Text bold color="#b48ead">orchester</Text>
            <Text dimColor> v0.1.0</Text>
          </Box>
          <Text dimColor>Orchestration Profile Manager</Text>
          {activeProfile ? (
            <Text>
              <Text dimColor>Profile: </Text>
              <Text color="#a3be8c" bold>{activeProfile}</Text>
            </Text>
          ) : (
            <Text dimColor>Profile: none (vanilla)</Text>
          )}
          <Text dimColor>{process.cwd().replace(process.env['HOME'] || '', '~')}</Text>
        </Box>
      </Box>

      {/* Detection status */}
      <Box marginTop={1} flexDirection="column">
        {phase === 'logo' && (
          <Text dimColor>  </Text>
        )}

        {phase === 'detect' && (
          <Text>
            <Text color="#ebcb8b">  ◌ </Text>
            <Text dimColor>Scanning runtimes{dots}</Text>
          </Text>
        )}

        {phase === 'ready' && (
          <Text>
            <Text color="#a3be8c">  ✓ </Text>
            <Text dimColor>
              {installedRuntimes.length > 0
                ? installedRuntimes.map(r => `${r.id}${r.version ? ` v${r.version}` : ''}`).join(' · ')
                : 'No runtimes detected'
              }
            </Text>
          </Text>
        )}
      </Box>
    </Box>
  );
}
