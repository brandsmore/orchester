import React, { useMemo, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { detectRuntimes, detectExistingTools, normalizeToolId } from '../core/detector.js';
import { theme, runtimeIcon, toolIcon } from '../core/theme.js';
import { Header } from './Header.js';
import { t, getLocale, setLocale, getLocales, getLocaleLabel } from '../core/i18n.js';
import { parseManifest } from '../core/manifest.js';
import { getProfilesDir } from '../core/state.js';
import { getRegistryWithStatus } from '../core/registry.js';
import path from 'node:path';
import type { Locale } from '../core/i18n.js';
import type { ProfileListItem, InstallType, Manifest } from '../types.js';

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
  const [showDetail, setShowDetail] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [, forceUpdate] = useState(0);

  const runtimes = useMemo(() => detectRuntimes(), []);
  const existingTools = useMemo(() => detectExistingTools(), []);

  // Install type icon helper
  const installTypeIcon = (type?: InstallType): string => {
    if (type === 'hybrid') return ' 🔀';
    if (type === 'plugin') return ' 🔌';
    return '';
  };

  // Profile options + none option
  const options = useMemo(() => [
    ...profiles.map(p => ({
      label: p.displayName ?? p.name,
      name: p.name,
      description: p.description,
      tags: p.tags,
      active: p.active,
      value: p.name,
      tool: p.tool,
      installType: p.installType,
    })),
    {
      label: 'none',
      name: 'none',
      description: t('list.noneOption'),
      tags: [] as string[],
      active: !profiles.some(p => p.active),
      value: '__none__',
      tool: undefined as string | undefined,
      installType: undefined as InstallType | undefined,
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

    // Detail overlay
    if (showDetail) {
      if (key.escape || key.return || input === 'd') {
        setShowDetail(false);
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
    if (input === 'd') {
      const opt = options[cursor];
      if (opt && opt.value !== '__none__') {
        setShowDetail(true);
      }
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
          <Text dimColor>  📦 <Text color={theme.accent}>Profile</Text>    {t('help.profile')}</Text>
          <Text dimColor>  📥 <Text color={theme.accent}>Install</Text>    {t('help.install')}</Text>
          <Text dimColor>  ⇄  <Text color={theme.accent}>Activate</Text>   {t('help.activate')}</Text>
          <Text dimColor>  📸 <Text color={theme.accent}>Vanilla</Text>    {t('help.vanilla')}</Text>
          <Text> </Text>
          <Text bold>{t('help.keybindings')}</Text>
          <Text dimColor>  <Text color={theme.accent}>Enter</Text>   {t('help.keySelect')}</Text>
          <Text dimColor>  <Text color={theme.accent}>↑ ↓</Text>     {t('help.keyNavigate')}</Text>
          <Text dimColor>  <Text color={theme.accent}>i</Text>       {t('help.keyInstall')}</Text>
          <Text dimColor>  <Text color={theme.accent}>d</Text>       {t('help.keyDetail')}</Text>
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

  // Detail overlay
  if (showDetail) {
    const opt = options[cursor];
    const profileName = opt?.value;

    let manifest: Manifest | null = null;
    if (profileName && profileName !== '__none__') {
      try {
        manifest = parseManifest(path.join(getProfilesDir(), profileName));
      } catch {
        // profile manifest unreadable
      }
    }

    const registry = getRegistryWithStatus();
    const regEntry = registry.find(r => r.name === profileName);
    const toolId = manifest ? normalizeToolId(manifest.tool) : 'claude';

    return (
      <Box flexDirection="column" padding={1} width="100%">
        <Header subtitle={t('detail.title')} />

        <Box
          borderStyle="round"
          borderColor={theme.brand}
          flexDirection="column"
          paddingX={2}
          paddingY={1}
          marginTop={1}
          width="100%"
        >
          {/* Name + Active badge */}
          <Box>
            <Text bold color={theme.brand}>{regEntry?.displayName ?? manifest?.name ?? profileName}</Text>
            {regEntry?.displayName && <Text dimColor>{' '}({manifest?.name ?? profileName})</Text>}
            {opt?.active && <Text color={theme.success} bold>{' '}(ACTIVE)</Text>}
          </Box>

          {/* Description */}
          {manifest?.description && (
            <Text dimColor>  {manifest.description}</Text>
          )}

          <Text> </Text>

          {/* Runtime / Install type */}
          <Box>
            <Text color={theme.accent}>{t('detail.runtime')} </Text>
            <Text>{runtimeIcon(toolId)} {toolId}</Text>
            {manifest?.installType && (
              <Text dimColor>{'  '}{t('detail.installType')} {manifest.installType}</Text>
            )}
          </Box>

          {/* Repo + Stars */}
          {regEntry && (
            <Box>
              <Text color={theme.accent}>{t('detail.repo')} </Text>
              <Text dimColor>{regEntry.repo}</Text>
              <Text>{'  '}</Text>
              <Text color={theme.warning}>★ {regEntry.stars}</Text>
            </Box>
          )}

          {/* Tags */}
          {manifest && manifest.tags.length > 0 && (
            <Box>
              <Text color={theme.accent}>{t('detail.tags')} </Text>
              <Text dimColor>{manifest.tags.join(', ')}</Text>
            </Box>
          )}

          {/* Focus areas */}
          {regEntry?.focus && regEntry.focus.length > 0 && (
            <Box>
              <Text color={theme.accent}>{t('detail.focus')} </Text>
              <Text color={theme.info}>{regEntry.focus.join(' · ')}</Text>
            </Box>
          )}

          <Text> </Text>

          {/* Links */}
          <Text bold color={theme.accent}>{t('detail.links')}</Text>
          {manifest && manifest.links.length > 0 ? (
            manifest.links.map((link, i) => (
              <Box key={i}>
                <Text dimColor>  {link.installType === 'plugin' ? '🔌' : '🔗'} </Text>
                <Text>{link.source}</Text>
                <Text dimColor> → </Text>
                <Text>{link.target}</Text>
              </Box>
            ))
          ) : (
            <Text dimColor>  {t('detail.noLinks')}</Text>
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
                {runtimeIcon(r.id)} {r.id} {r.installed ? '✓' : '✗'}
              </Text>
            </Text>
          ))}
        </Box>
        {existingTools.length > 0 && (() => {
          // Group by toolId
          const grouped = new Map<string, typeof existingTools>();
          for (const tool of existingTools) {
            const key = tool.toolId;
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push(tool);
          }
          return Array.from(grouped.entries()).map(([tid, items]) => (
            <Box key={tid}>
              <Text dimColor>{runtimeIcon(tid)} {tid}  </Text>
              {items.map((tool, i) => (
                <Text key={`${tool.type}-${tool.location}`}>
                  {i > 0 ? '  ' : ''}
                  <Text dimColor>{toolIcon(tool.type)} {tool.type}({tool.fileCount})</Text>
                </Text>
              ))}
            </Box>
          ));
        })()}
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
              const pointer = isCurrent ? '❯' : ' ';
              const showAbbr = opt.label !== opt.name;

              return (
                <Box key={opt.value}>
                  <Text color={isCurrent ? theme.brand : undefined}>
                    {pointer}{' '}
                  </Text>
                  {isActive ? (
                    <Text color={theme.success} bold backgroundColor="#2e3440"> ✔ ACTIVE </Text>
                  ) : (
                    <Text color={theme.muted}>{'○'}</Text>
                  )}
                  <Text>{' '}</Text>
                  <Text color={isCurrent ? 'white' : undefined} bold={isCurrent || isActive} dimColor={!isCurrent && !isActive}>
                    {opt.label}{installTypeIcon(opt.installType)}
                  </Text>
                  {showAbbr && (
                    <Text dimColor> ({opt.name})</Text>
                  )}
                  {opt.tool && normalizeToolId(opt.tool) !== 'claude' && (
                    <Text dimColor={!isCurrent}> {runtimeIcon(normalizeToolId(opt.tool))} {normalizeToolId(opt.tool)}</Text>
                  )}
                  {opt.description && (
                    <Text dimColor={!isCurrent}>
                      {'  '}{opt.description}
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
          <Text color={theme.accent}>↑↓</Text> {t('help.keyNavigate')}  <Text color={theme.accent}>Enter</Text> {t('footer.select')}  <Text color={theme.accent}>d</Text> {t('footer.detail')}  <Text color={theme.accent}>i</Text> {t('footer.install')}  <Text color={theme.accent}>u</Text> {t('footer.usage')}  <Text color={theme.accent}>h</Text> {t('footer.help')}  <Text color={theme.accent}>l</Text> lang  <Text color={theme.accent}>q</Text> {t('footer.quit')}
        </Text>
      </Box>
    </Box>
  );
}
