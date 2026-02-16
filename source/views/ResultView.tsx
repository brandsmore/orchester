import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Alert, StatusMessage } from '@inkjs/ui';
import { theme } from '../core/theme.js';
import { Header } from './Header.js';
import { t } from '../core/i18n.js';
import type { SwitchResult } from '../types.js';

interface ResultViewProps {
  result: SwitchResult;
  profileName: string | null;
  onDone: () => void;
}

export function ResultView({ result, profileName, onDone }: ResultViewProps) {
  useInput((_input, key) => {
    if (key.return || key.escape) {
      onDone();
    }
  });

  return (
    <Box flexDirection="column" padding={1} width="100%">
      <Header subtitle={t('header.switchResult')} />

      <Box marginTop={1} width="100%">
        {result.success ? (
          <Box
            borderStyle="round"
            borderColor={theme.success}
            flexDirection="column"
            paddingX={2}
            paddingY={0}
            width="100%"
          >
            <StatusMessage variant="success">{t('result.success')}</StatusMessage>
            <Box flexDirection="column" marginTop={0} paddingLeft={2}>
              <Text>{t('result.active')} <Text bold color={theme.success}>{profileName ?? 'vanilla (none)'}</Text></Text>
              <Text dimColor>{t('result.linksCreated')} {result.linksCreated}</Text>
              <Text dimColor>{t('result.linksRemoved')} {result.linksRemoved}</Text>
            </Box>
          </Box>
        ) : (
          <Box flexDirection="column" width="100%">
            <Alert variant="error" title={t('result.failed')}>
              {result.error ?? 'Unknown error'}
            </Alert>
            <Box marginTop={1} paddingX={1}>
              <StatusMessage variant="warning">
                {t('result.vanillaRestored')}
              </StatusMessage>
            </Box>
          </Box>
        )}
      </Box>

      <Box
        borderStyle="single"
        borderColor={theme.muted}
        paddingX={2}
        paddingY={0}
        marginTop={1}
        width="100%"
      >
        <Text dimColor>
          <Text color={theme.accent}>Enter</Text> / <Text color={theme.accent}>Esc</Text> {t('footer.continue')}
        </Text>
      </Box>
    </Box>
  );
}
