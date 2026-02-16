import React, { useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { StatusMessage } from '@inkjs/ui';
import { getAllUsage, formatTokens, miniBar } from '../core/usage.js';
import { theme, runtimeIcon } from '../core/theme.js';
import { Header } from './Header.js';
import { t } from '../core/i18n.js';
import type { RuntimeUsage } from '../core/usage.js';

interface UsageViewProps {
  onDone: () => void;
}

export function UsageView({ onDone }: UsageViewProps) {
  const usages = useMemo(() => getAllUsage(), []);

  useInput((_input, key) => {
    if (key.escape || key.return) {
      onDone();
    }
  });

  const maxTokens = Math.max(...usages.map(u => u.totalTokens), 1);
  const totalAll = usages.reduce((sum, u) => sum + u.totalTokens, 0);

  return (
    <Box flexDirection="column" padding={1} width="100%">
      {/* Header */}
      <Header subtitle={t('usage.title')} />

      {/* Summary bar */}
      <Box
        borderStyle="single"
        borderColor={theme.muted}
        flexDirection="column"
        paddingX={2}
        paddingY={0}
        marginTop={1}
        width="100%"
      >
        <Text bold>{t('usage.totalTokens')} <Text color={theme.brand}>{formatTokens(totalAll)}</Text></Text>
      </Box>

      {/* Per-runtime cards */}
      {usages.map((u) => (
        <RuntimeCard key={u.id} usage={u} maxTokens={maxTokens} />
      ))}

      {/* Footer */}
      <Box
        borderStyle="single"
        borderColor={theme.muted}
        paddingX={2}
        paddingY={0}
        marginTop={1}
        width="100%"
      >
        <Text dimColor>
          <Text color={theme.accent}>Enter</Text> / <Text color={theme.accent}>Esc</Text> {t('footer.backToList')}
        </Text>
      </Box>
    </Box>
  );
}

function RuntimeCard({ usage, maxTokens }: { usage: RuntimeUsage; maxTokens: number }) {
  const color = usage.available ? theme.success : theme.muted;
  const statusIcon = usage.available ? runtimeIcon(usage.id) : '○';

  return (
    <Box
      borderStyle="single"
      borderColor={color}
      flexDirection="column"
      paddingX={2}
      paddingY={0}
      marginTop={1}
      width="100%"
    >
      {/* Runtime name + status */}
      <Box>
        <Text color={color} bold>{statusIcon} {usage.name}</Text>
        {!usage.available && usage.note && (
          <Text dimColor>  — {usage.note}</Text>
        )}
      </Box>

      {usage.available && (
        <Box flexDirection="column">
          {/* Token bar */}
          <Box marginTop={0}>
            <Text dimColor>  {t('usage.tokens')}  </Text>
            <Text color={theme.bar}>{miniBar(usage.totalTokens, maxTokens, 24)}</Text>
            <Text> {formatTokens(usage.totalTokens)}</Text>
          </Box>

          {/* Breakdown */}
          <Box gap={2} paddingLeft={2}>
            <Text dimColor>in: {formatTokens(usage.inputTokens)}</Text>
            <Text dimColor>out: {formatTokens(usage.outputTokens)}</Text>
            {usage.cacheTokens > 0 && (
              <Text dimColor>cache: {formatTokens(usage.cacheTokens)}</Text>
            )}
          </Box>

          {/* Sessions / Messages */}
          <Box gap={2} paddingLeft={2}>
            <Text dimColor>{t('usage.sessions')}: {usage.sessions}</Text>
            <Text dimColor>{t('usage.messages')}: {usage.messages}</Text>
          </Box>

          {/* Daily chart (last 7 days) */}
          {usage.daily.length > 0 && (
            <Box flexDirection="column" marginTop={0} paddingLeft={2}>
              <Text dimColor bold>{t('usage.last7days')}</Text>
              {usage.daily.slice(0, 7).map(d => {
                const dayMax = Math.max(...usage.daily.map(dd => dd.tokens), 1);
                return (
                  <Box key={d.date} gap={1}>
                    <Text dimColor>{d.date.slice(5)}</Text>
                    <Text color={theme.bar}>{miniBar(d.tokens, dayMax, 16)}</Text>
                    <Text dimColor>{formatTokens(d.tokens)}</Text>
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Models */}
          {Object.keys(usage.models).length > 0 && (
            <Box flexDirection="column" paddingLeft={2}>
              <Text dimColor bold>{t('usage.models')}</Text>
              {Object.entries(usage.models).map(([model, mu]) => (
                <Text key={model} dimColor>
                  {'  '}{model}: in {formatTokens(mu.inputTokens)} / out {formatTokens(mu.outputTokens)}
                </Text>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
