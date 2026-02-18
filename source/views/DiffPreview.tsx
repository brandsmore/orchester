import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Badge, StatusMessage } from '@inkjs/ui';
import { theme, runtimeIcon } from '../core/theme.js';
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

  const symlinkRemove = removeItems.filter(i => (i.installType ?? 'symlink') === 'symlink');
  const pluginRemove = removeItems.filter(i => i.installType === 'plugin');
  const symlinkAdd = addItems.filter(i => (i.installType ?? 'symlink') === 'symlink');
  const pluginAdd = addItems.filter(i => i.installType === 'plugin');

  return (
    <Box flexDirection="column" padding={1} width="100%">
      <Header subtitle={t('header.switchPreview')} />

      <Box marginTop={1} paddingX={1} gap={1}>
        <Badge color="red">{diffData.from ?? 'vanilla'}</Badge>
        <Text bold color={theme.warning}> → </Text>
        <Badge color="green">{diffData.to ?? 'vanilla'}</Badge>
      </Box>

      {diffData.targetTools && diffData.targetTools.length > 0 && (
        <Box paddingX={1} marginTop={0}>
          <Text dimColor>{t('diff.targets')} </Text>
          {diffData.targetTools.map((toolId, i) => (
            <Text key={toolId}>
              {i > 0 ? ', ' : ''}
              <Text color={theme.info}>{runtimeIcon(toolId)} {toolId}</Text>
            </Text>
          ))}
        </Box>
      )}

      <Box
        borderStyle="single"
        borderColor={theme.muted}
        flexDirection="column"
        paddingX={2}
        paddingY={0}
        marginTop={1}
        width="100%"
      >
        {symlinkRemove.length > 0 && (
          <Box flexDirection="column">
            <Text bold color={theme.error}>{t('diff.remove')}</Text>
            {symlinkRemove.map((item, i) => (
              <Text key={`rm-${i}`} color={theme.error}>
                {'  ✗ '}{item.target}
              </Text>
            ))}
          </Box>
        )}

        {symlinkAdd.length > 0 && (
          <Box flexDirection="column" marginTop={symlinkRemove.length > 0 ? 1 : 0}>
            <Text bold color={theme.success}>{t('diff.apply')}</Text>
            {symlinkAdd.map((item, i) => (
              <Text key={`add-${i}`} color={theme.success}>
                {'  ✓ '}{item.target} ← {item.source}
              </Text>
            ))}
          </Box>
        )}

        {(pluginRemove.length > 0 || pluginAdd.length > 0) && (
          <Box flexDirection="column" marginTop={symlinkRemove.length > 0 || symlinkAdd.length > 0 ? 1 : 0}>
            <Text bold color={theme.info}>{'🔌 Plugin Commands (manual)'}</Text>
            {pluginRemove.map((item, i) => (
              <Text key={`prm-${i}`} color={theme.error}>
                {'  ✗ '}{item.pluginLabel ?? item.source}{item.pluginCommand ? ` — ${item.pluginCommand}` : ''}
              </Text>
            ))}
            {pluginAdd.map((item, i) => (
              <Text key={`padd-${i}`} color={theme.success}>
                {'  ✓ '}{item.pluginLabel ?? item.source}{item.pluginCommand ? ` — ${item.pluginCommand}` : ''}
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
