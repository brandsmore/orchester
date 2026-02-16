import React, { useMemo, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { detectRuntimes, detectExistingTools } from '../core/detector.js';
import { theme } from '../core/theme.js';
import { Header } from './Header.js';
import { t, getLocale, setLocale, getLocales, getLocaleLabel } from '../core/i18n.js';
import type { Locale } from '../core/i18n.js';
import type { ProfileListItem } from '../types.js';

interface ProfileListProps {
  profiles: ProfileListItem[];
  onSelect: (name: string | null) => void;
  onInstall: () => void;
  onUsage: () => void;
}

export function ProfileList({ profiles, onSelect, onInstall, onUsage }: ProfileListProps) {
  const { exit } = useApp();
  const [showHelp, setShowHelp] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [, forceUpdate] = useState(0);

  const runtimes = useMemo(() => detectRuntimes(), []);
  const existingTools = useMemo(() => detectExistingTools(), []);

  // Profile options + none option
  const options = useMemo(() => [
    ...profiles.map(p => ({
      label: p.name,
      description: p.description,
      tags: p.tags,
      active: p.active,
      value: p.name,
    })),
    {
      label: 'none',
      description: t('list.noneOption'),
      tags: [] as string[],
      active: !profiles.some(p => p.active),
      value: '__none__',
    },
  ], [profiles]);

  useInput((input, key) => {
    // Language selector
    if (showLang) {
      const locales = getLocales();
      const idx = parseInt(input, 10) - 1;
      if (idx >= 0 && idx < locales.length) {
        setLocale(locales[idx]!);
        forceUpdate(n => n + 1);
        setShowLang(false);
      }
      if (key.escape) {
        setShowLang(false);
      }
      return;
    }

    // Help overlay
    if (showHelp) {
      if (key.escape || key.return || input === 'h') {
        setShowHelp(false);
      }
      return;
    }

    // Main list navigation
    if (key.upArrow) {
      setCursor(c => Math.max(0, c - 1));
    }
    if (key.downArrow) {
      setCursor(c => Math.min(options.length - 1, c + 1));
    }
    if (key.return) {
      const opt = options[cursor];
      if (opt) {
        onSelect(opt.value === '__none__' ? null : opt.value);
      }
    }
    if (input === 'q') {
      exit();
    }
    if (input === 'i') {
      onInstall();
    }
    if (input === 'h') {
      setShowHelp(true);
    }
    if (input === 'l') {
      setShowLang(true);
    }
    if (input === 'u') {
      onUsage();
    }
  });

  // Language selector overlay
  if (showLang) {
    const locales = getLocales();
    const current = getLocale();
    return (
      <Box flexDirection="column" padding={1} width="100%">
        <Header subtitle={t('lang.title')} />

        <Box
          borderStyle="round"
          borderColor={theme.accent}
          flexDirection="column"
          paddingX={2}
          paddingY={1}
          marginTop={1}
          width="100%"
        >
          {locales.map((loc, i) => (
            <Text key={loc}>
              <Text color={loc === current ? theme.brand : theme.accent} bold={loc === current}>
                {loc === current ? '● ' : '  '}{i + 1}. {getLocaleLabel(loc)}
              </Text>
            </Text>
          ))}
        </Box>

        <Box
          borderStyle="single"
          borderColor={theme.muted}
          paddingX={2}
          paddingY={0}
          marginTop={1}
          width="100%"
        >
          <Text dimColor>1-{locales.length} {t('footer.select')}  <Text color={theme.accent}>Esc</Text> {t('footer.cancel')}</Text>
        </Box>
      </Box>
    );
  }

  // Help overlay
  if (showHelp) {
    return (
      <Box flexDirection="column" padding={1} width="100%">
        <Header subtitle={t('header.help')} />

        <Box
          borderStyle="round"
          borderColor={theme.accent}
          flexDirection="column"
          paddingX={2}
          paddingY={1}
          marginTop={1}
          width="100%"
        >
          <Text bold>{t('help.whatIs')}</Text>
          <Text dimColor>  {t('help.whatIsDesc1')}</Text>
          <Text dimColor>  {t('help.whatIsDesc2')}</Text>
          <Text dimColor>  {t('help.whatIsDesc3')}</Text>
          <Text> </Text>
          <Text bold>{t('help.concepts')}</Text>
          <Text dimColor>  <Text color={theme.accent}>Profile</Text>    {t('help.profile')}</Text>
          <Text dimColor>  <Text color={theme.accent}>Install</Text>    {t('help.install')}</Text>
          <Text dimColor>  <Text color={theme.accent}>Activate</Text>   {t('help.activate')}</Text>
          <Text dimColor>  <Text color={theme.accent}>Vanilla</Text>    {t('help.vanilla')}</Text>
          <Text> </Text>
          <Text bold>{t('help.keybindings')}</Text>
          <Text dimColor>  <Text color={theme.accent}>Enter</Text>   {t('help.keySelect')}</Text>
          <Text dimColor>  <Text color={theme.accent}>↑ ↓</Text>     {t('help.keyNavigate')}</Text>
          <Text dimColor>  <Text color={theme.accent}>i</Text>       {t('help.keyInstall')}</Text>
          <Text dimColor>  <Text color={theme.accent}>h</Text>       {t('help.keyHelp')}</Text>
          <Text dimColor>  <Text color={theme.accent}>u</Text>       {t('help.keyUsage')}</Text>
          <Text dimColor>  <Text color={theme.accent}>l</Text>       {t('help.keyLang')}</Text>
          <Text dimColor>  <Text color={theme.accent}>q</Text>       {t('help.keyQuit')}</Text>
        </Box>

        <Box
          borderStyle="single"
          borderColor={theme.muted}
          paddingX={2}
          paddingY={0}
          marginTop={1}
          width="100%"
        >
          <Text dimColor>{t('help.pressClose')}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1} width="100%">
      {/* Header */}
      <Header version subtitle={t('header.profileManager')} features={[t('header.feat1'), t('header.feat2'), t('header.feat3')]} />

      {/* System Info Bar */}
      <Box
        borderStyle="single"
        borderColor={theme.muted}
        flexDirection="column"
        paddingX={2}
        paddingY={0}
        marginTop={1}
        width="100%"
      >
        <Box>
          <Text dimColor>{t('list.runtimes')}  </Text>
          {runtimes.map((r, i) => (
            <Text key={r.id}>
              {i > 0 ? '  ' : ''}
              <Text color={r.installed ? theme.success : theme.muted}>
                {r.id} {r.installed ? '✓' : '✗'}
              </Text>
            </Text>
          ))}
        </Box>
        {existingTools.length > 0 && (
          <Box>
            <Text dimColor>{t('list.system')}    </Text>
            {existingTools.map((tool, i) => (
              <Text key={`${tool.type}-${tool.location}`}>
                {i > 0 ? '  ' : ''}
                <Text dimColor>{tool.type}({tool.fileCount})</Text>
              </Text>
            ))}
          </Box>
        )}
      </Box>

      {/* Main Content */}
      <Box
        flexDirection="column"
        marginTop={1}
        width="100%"
      >
        {profiles.length === 0 ? (
          <Box
            borderStyle="round"
            borderColor={theme.warning}
            flexDirection="column"
            paddingX={2}
            paddingY={1}
            width="100%"
          >
            <Text bold>{t('list.welcome')}</Text>
            <Text> </Text>
            <Text dimColor>{t('list.noProfiles')}</Text>
            <Text dimColor>{t('list.pressInstall', { key: 'i' })}</Text>
            <Text dimColor>{t('list.pressHelp', { key: 'h' })}</Text>
          </Box>
        ) : (
          <Box
            borderStyle="single"
            borderColor={theme.muted}
            flexDirection="column"
            paddingX={2}
            paddingY={0}
            width="100%"
          >
            <Box marginBottom={0}>
              <Text bold>{t('list.selectProfile')}</Text>
            </Box>
            {options.map((opt, i) => {
              const isCurrent = i === cursor;
              const isActive = opt.active;
              const isNone = opt.value === '__none__';
              const pointer = isCurrent ? '❯' : ' ';
              const marker = isActive ? '●' : '○';

              return (
                <Box key={opt.value}>
                  <Text color={isCurrent ? theme.brand : undefined}>
                    {pointer}{' '}
                  </Text>
                  <Text color={isActive ? theme.success : undefined} bold={isActive}>
                    {marker}
                  </Text>
                  <Text>{' '}</Text>
                  <Text color={isCurrent ? 'white' : undefined} bold={isCurrent || isActive} dimColor={!isCurrent && !isActive}>
                    {opt.label}
                  </Text>
                  {opt.description && !isNone && (
                    <Text dimColor={!isCurrent}>
                      {'  '}{opt.description}
                    </Text>
                  )}
                  {isNone && (
                    <Text dimColor={!isCurrent}>
                      {'  '}{opt.description}
                    </Text>
                  )}
                  {opt.tags.length > 0 && (
                    <Text dimColor={!isCurrent}>
                      {'  '}[{opt.tags.join(', ')}]
                    </Text>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

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
          <Text color={theme.accent}>↑↓</Text> {t('help.keyNavigate')}  <Text color={theme.accent}>Enter</Text> {t('footer.select')}  <Text color={theme.accent}>i</Text> {t('footer.install')}  <Text color={theme.accent}>u</Text> {t('footer.usage')}  <Text color={theme.accent}>h</Text> {t('footer.help')}  <Text color={theme.accent}>l</Text> lang  <Text color={theme.accent}>q</Text> {t('footer.quit')}
        </Text>
      </Box>
    </Box>
  );
}
