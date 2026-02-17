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
            {result.createdLinks && result.createdLinks.filter(l => l.installType !== 'plugin').length > 0 && (
              <Box flexDirection="column" marginTop={1} paddingLeft={2}>
                {result.createdLinks.filter(l => l.installType !== 'plugin').map((link, i) => (
                  <Text key={i} dimColor>
                    <Text color={theme.success}>+ </Text>
                    <Text>{link.source}</Text>
                    <Text dimColor> → </Text>
                    <Text>{link.target}</Text>
                  </Text>
                ))}
              </Box>
            )}
            {result.removedLinks && result.removedLinks.filter(l => l.installType !== 'plugin').length > 0 && (
              <Box flexDirection="column" marginTop={1} paddingLeft={2}>
                {result.removedLinks.filter(l => l.installType !== 'plugin').map((link, i) => (
                  <Text key={i} dimColor>
                    <Text color={theme.error}>- </Text>
                    <Text>{link.target}</Text>
                  </Text>
                ))}
              </Box>
            )}
            {result.pluginCommands && result.pluginCommands.length > 0 && (
              <Box
                borderStyle="single"
                borderColor={theme.info}
                flexDirection="column"
                paddingX={2}
                paddingY={0}
                marginTop={1}
              >
                <Text bold color={theme.info}>{'🔌 Plugin Commands (run in Claude Code)'}</Text>
                {result.pluginCommands.filter(c => c.action === 'install').map((cmd, i) => (
                  <Box key={`pi-${i}`} flexDirection="column" paddingLeft={2}>
                    <Text color={theme.success}>{'+ '}{cmd.label}</Text>
                    <Text dimColor>{'  $ '}{cmd.command}</Text>
                  </Box>
                ))}
                {result.pluginCommands.filter(c => c.action === 'uninstall').map((cmd, i) => (
                  <Box key={`pu-${i}`} flexDirection="column" paddingLeft={2}>
                    <Text color={theme.error}>{'- '}{cmd.label}</Text>
                    <Text dimColor>{'  $ '}{cmd.command}</Text>
                  </Box>
                ))}
              </Box>
            )}
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
