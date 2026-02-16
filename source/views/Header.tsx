import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../core/theme.js';

interface HeaderProps {
  subtitle?: string;
  version?: boolean;
  features?: string[];
}

// Animated brand symbol frames
const FRAMES = ['◆◇◆', '◇◆◇', '◆◇◆', '◇◆◇'];

export function Header({ subtitle, version, features }: HeaderProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame(f => (f + 1) % FRAMES.length);
    }, 800);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box
      borderStyle="round"
      borderColor={theme.brand}
      paddingX={2}
      paddingY={1}
      width="100%"
      flexDirection="column"
    >
      <Box>
        <Text color={theme.brand}>{FRAMES[frame]} </Text>
        <Text bold color={theme.brand}>orchester</Text>
        {version && <Text dimColor> v0.1</Text>}
      </Box>
      {subtitle && <Text dimColor>{subtitle}</Text>}
      {features && features.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          {features.map((f, i) => (
            <Text key={i} dimColor>  {f}</Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
