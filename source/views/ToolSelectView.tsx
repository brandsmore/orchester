import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { detectRuntimes } from '../core/detector.js';
import { normalizeToolId } from '../core/detector.js';
import { theme, runtimeIcon } from '../core/theme.js';
import { Header } from './Header.js';
import { t } from '../core/i18n.js';
import type { ToolId } from '../types.js';

interface ToolSelectViewProps {
  profileName: string;
  defaultTool: string;
  onConfirm: (tools: ToolId[]) => void;
  onCancel: () => void;
}

const ALL_TOOL_IDS: ToolId[] = ['claude', 'codex', 'gemini', 'cursor', 'antigravity', 'opencode'];

export function ToolSelectView({ profileName, defaultTool, onConfirm, onCancel }: ToolSelectViewProps) {
  const runtimes = useMemo(() => detectRuntimes(), []);
  const defaultToolId = normalizeToolId(defaultTool);

  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState<Set<ToolId>>(() => new Set([defaultToolId]));

  const items = useMemo(() => {
    return ALL_TOOL_IDS.map(id => {
      const runtime = runtimes.find(r => r.id === id);
      return {
        id,
        name: runtime?.name ?? id,
        installed: runtime?.installed ?? false,
      };
    });
  }, [runtimes]);

  useInput((input, key) => {
    if (key.upArrow) {
      setCursor(c => Math.max(0, c - 1));
    }
    if (key.downArrow) {
      setCursor(c => Math.min(items.length - 1, c + 1));
    }
    if (input === ' ') {
      const item = items[cursor];
      if (!item) return;
      setSelected(prev => {
        const next = new Set(prev);
        if (next.has(item.id)) {
          next.delete(item.id);
        } else {
          next.add(item.id);
        }
        return next;
      });
    }
    if (key.return) {
      if (selected.size === 0) return; // min 1
      onConfirm(Array.from(selected));
    }
    if (key.escape) {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column" padding={1} width="100%">
      <Header subtitle={t('toolSelect.title')} />

      <Box marginTop={1} paddingX={1}>
        <Text bold>{profileName}</Text>
        <Text dimColor>{'  '}{t('toolSelect.default')}: {runtimeIcon(defaultToolId)} {defaultToolId}</Text>
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
        {items.map((item, i) => {
          const isCurrent = i === cursor;
          const isSelected = selected.has(item.id);
          const pointer = isCurrent ? '>' : ' ';
          const checkbox = isSelected ? '[x]' : '[ ]';

          return (
            <Box key={item.id}>
              <Text color={isCurrent ? theme.brand : undefined}>
                {pointer} {checkbox} {runtimeIcon(item.id)} {item.name}
              </Text>
              {!item.installed && (
                <Text dimColor>{'  '}{t('toolSelect.notInstalled')}</Text>
              )}
              {item.id === defaultToolId && (
                <Text color={theme.info}>{'  '}*</Text>
              )}
            </Box>
          );
        })}

        {selected.size === 0 && (
          <Box marginTop={1}>
            <Text color={theme.warning}>{t('toolSelect.minOne')}</Text>
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
          <Text color={theme.accent}>Space</Text> {t('toolSelect.hint')}  <Text color={theme.accent}>Enter</Text> {t('footer.confirm')}  <Text color={theme.accent}>Esc</Text> {t('footer.cancel')}
        </Text>
      </Box>
    </Box>
  );
}
