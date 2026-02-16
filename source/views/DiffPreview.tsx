import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Badge, StatusMessage } from '@inkjs/ui';
import { theme } from '../core/theme.js';
import { Header } from './Header.js';
import { t } from '../core/i18n.js';
import type { DiffData } from '../types.js';

interface DiffPreviewProps {
  diffData: DiffData;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DiffPreview({ diffData, onConfirm, onCancel }: DiffPreviewProps) {
  useInput((input, key) => {
    if (key.return) {
      onConfirm();
    }
    if (key.escape) {
      onCancel();
    }
  });

  const removeItems = diffData.items.filter(i => i.type === 'remove');
  const addItems = diffData.items.filter(i => i.type === 'add');

  return (
    <Box flexDirection="column" padding={1} width="100%">
      <Header subtitle={t('header.switchPreview')} />

      <Box marginTop={1} paddingX={1} gap={1}>
        <Badge color="red">{diffData.from ?? 'vanilla'}</Badge>
        <Text bold color={theme.warning}> → </Text>
        <Badge color="green">{diffData.to ?? 'vanilla'}</Badge>
      </Box>

      <Box
        borderStyle="single"
        borderColor={theme.muted}
        flexDirection="column"
        paddingX={2}
        paddingY={0}
        marginTop={1}
        width="100%"
      >
        {removeItems.length > 0 && (
          <Box flexDirection="column">
            <Text bold color={theme.error}>{t('diff.remove')}</Text>
            {removeItems.map((item, i) => (
              <Text key={`rm-${i}`} color={theme.error}>
                {'  ✗ '}{item.target}
              </Text>
            ))}
          </Box>
        )}

        {addItems.length > 0 && (
          <Box flexDirection="column" marginTop={removeItems.length > 0 ? 1 : 0}>
            <Text bold color={theme.success}>{t('diff.apply')}</Text>
            {addItems.map((item, i) => (
              <Text key={`add-${i}`} color={theme.success}>
                {'  ✓ '}{item.target} ← {item.source}
              </Text>
            ))}
          </Box>
        )}

        {diffData.items.length === 0 && (
          <StatusMessage variant="warning">{t('diff.noChanges')}</StatusMessage>
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
          <Text color={theme.accent}>Enter</Text> {t('footer.confirm')}  <Text color={theme.accent}>Esc</Text> {t('footer.cancel')}
        </Text>
      </Box>
    </Box>
  );
}
