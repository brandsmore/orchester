import React, { useState, useCallback, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { Spinner, Alert, StatusMessage } from '@inkjs/ui';
import { getRegistryWithStatus, installProfile, installFromUrl, uninstallProfile } from '../core/registry.js';
import { detectActiveOrchestration } from '../core/detector.js';
import { theme } from '../core/theme.js';
import { Header } from './Header.js';
import { t } from '../core/i18n.js';
import type { RegistryEntry } from '../types.js';

interface InstallViewProps {
  onDone: () => void;
}

type InstallState = 'select' | 'blocked' | 'installing' | 'done' | 'error' | 'inputUrl' | 'confirmReinstall' | 'confirmDelete';

export function InstallView({ onDone }: InstallViewProps) {
  const [state, setState] = useState<InstallState>('select');
  const [cursor, setCursor] = useState(0);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [blockedEntry, setBlockedEntry] = useState<RegistryEntry | null>(null);
  const [reinstallEntry, setReinstallEntry] = useState<RegistryEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<(RegistryEntry & { installed: boolean; custom?: boolean }) | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const entries = useMemo(() => getRegistryWithStatus(), [refreshKey]);
  const activeTools = useMemo(() => detectActiveOrchestration(), []);

  const handleSelect = useCallback((entry: RegistryEntry & { installed: boolean }) => {
    const isOnSystem = activeTools.some(t => t.name === entry.name);
    if (isOnSystem) {
      setBlockedEntry(entry);
      setState('blocked');
    } else if (entry.installed) {
      setReinstallEntry(entry);
      setState('confirmReinstall');
    } else {
      doInstall(entry);
    }
  }, [activeTools]);

  const doInstall = useCallback(async (entry: RegistryEntry) => {
    setState('installing');
    try {
      await installProfile(entry, (msg) => setProgress(msg));
      setRefreshKey(k => k + 1);
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState('error');
    }
  }, []);

  const doInstallUrl = useCallback(async (url: string) => {
    setState('installing');
    try {
      await installFromUrl(url, (msg) => setProgress(msg));
      setRefreshKey(k => k + 1);
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState('error');
    }
  }, []);

  useInput((input, key) => {
    // URL input mode
    if (state === 'inputUrl') {
      if (key.escape) {
        setState('select');
        setUrlInput('');
        return;
      }
      if (key.return) {
        const url = urlInput.trim();
        if (url && (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('git@'))) {
          setUrlInput('');
          doInstallUrl(url);
        }
        return;
      }
      if (key.backspace || key.delete) {
        setUrlInput(u => u.slice(0, -1));
        return;
      }
      if (input && !key.ctrl && !key.meta) {
        setUrlInput(u => u + input);
      }
      return;
    }

    if (state === 'select') {
      if (key.upArrow) {
        setCursor(c => Math.max(0, c - 1));
      }
      if (key.downArrow) {
        setCursor(c => Math.min(entries.length - 1, c + 1));
      }
      if (key.return) {
        const entry = entries[cursor];
        if (entry) handleSelect(entry);
      }
      if (input === 'a') {
        setState('inputUrl');
        setUrlInput('');
      }
      if (input === 'd') {
        const entry = entries[cursor];
        if (entry && (entry.installed || entry.custom)) {
          setDeleteEntry(entry);
          setState('confirmDelete');
        }
      }
      if (key.escape) {
        onDone();
      }
      return;
    }

    if (state === 'confirmDelete') {
      if (input === 'y' && deleteEntry) {
        uninstallProfile(deleteEntry.name);
        setDeleteEntry(null);
        setRefreshKey(k => k + 1);
        setCursor(c => Math.min(c, entries.length - 2));
        setState('select');
      }
      if (input === 'n' || key.escape) {
        setState('select');
        setDeleteEntry(null);
      }
      return;
    }

    if (state === 'confirmReinstall') {
      if (input === 'y' && reinstallEntry) {
        setReinstallEntry(null);
        doInstall(reinstallEntry);
      }
      if (input === 'n' || key.escape) {
        setState('select');
        setReinstallEntry(null);
      }
      return;
    }

    if (key.escape) {
      if (state === 'blocked') {
        setState('select');
        setBlockedEntry(null);
      } else {
        onDone();
      }
    }
    if ((state === 'done' || state === 'error' || state === 'blocked') && key.return) {
      if (state === 'blocked') {
        setState('select');
        setBlockedEntry(null);
      } else {
        onDone();
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1} width="100%">
      <Header subtitle={t('header.install')} />

      {state === 'select' && (
        <Box flexDirection="column" marginTop={1} width="100%">
          {activeTools.length > 0 && (
            <Box marginBottom={1} width="100%">
              <Alert variant="warning" title={t('install.activeOnSystem')}>
                {t('install.activeWarning', { tools: activeTools.map(at => at.name).join(', ') })}
              </Alert>
            </Box>
          )}

          <Box
            borderStyle="single"
            borderColor={theme.muted}
            flexDirection="column"
            paddingX={2}
            paddingY={0}
            width="100%"
          >
            <Box marginBottom={0}>
              <Text bold>{t('install.selectRegistry')}</Text>
              <Text dimColor>  {t('install.legend')}</Text>
            </Box>

            {entries.map((e, i) => {
              const isOnSystem = activeTools.some(at => at.name === e.name);
              const isCurrent = i === cursor;
              const isInstalled = e.installed;

              // Determine colors
              let nameColor: string = 'white';
              let dimLine = false;
              if (isInstalled) {
                nameColor = theme.installed;
              } else if (isOnSystem) {
                nameColor = theme.onSystem;
              }
              if (!isCurrent && !isInstalled && !isOnSystem) {
                dimLine = true;
              }

              const prefix = isInstalled ? '✓' : isOnSystem ? '●' : ' ';
              const pointer = isCurrent ? '❯' : ' ';

              return (
                <Box key={e.name}>
                  <Text color={isCurrent ? theme.brand : undefined}>
                    {pointer}{' '}
                  </Text>
                  <Text color={isInstalled ? theme.installed : isOnSystem ? theme.onSystem : undefined} bold={isInstalled}>
                    {prefix}
                  </Text>
                  <Text>{' '}</Text>
                  <Text color={nameColor} bold={isCurrent || isInstalled} dimColor={dimLine}>
                    {e.name}
                  </Text>
                  <Text dimColor={!isCurrent}>
                    {'  '}★ {e.stars}{'  '}{e.description}
                  </Text>
                  {isOnSystem && (
                    <Text color={theme.onSystem} dimColor={!isCurrent}>{'  '}[on system]</Text>
                  )}
                  {isInstalled && !isOnSystem && (
                    <Text color={theme.installed} dimColor={!isCurrent}>{'  '}[installed]</Text>
                  )}
                  {e.custom && (
                    <Text color={theme.custom} dimColor={!isCurrent}>{'  '}[custom]</Text>
                  )}
                </Box>
              );
            })}
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
              <Text color={theme.accent}>↑↓</Text> {t('help.keyNavigate')}  <Text color={theme.accent}>Enter</Text> {t('footer.select')}  <Text color={theme.accent}>a</Text> {t('install.addUrl')}  <Text color={theme.accent}>d</Text> {t('install.delete')}  <Text color={theme.accent}>Esc</Text> {t('footer.backToList')}
            </Text>
          </Box>
        </Box>
      )}

      {state === 'inputUrl' && (
        <Box flexDirection="column" marginTop={1} width="100%">
          <Box
            borderStyle="round"
            borderColor={theme.brand}
            flexDirection="column"
            paddingX={2}
            paddingY={1}
            width="100%"
          >
            <Text bold color={theme.brand}>{t('install.addFromUrl')}</Text>
            <Text dimColor>{t('install.addUrlHint')}</Text>
            <Box marginTop={1}>
              <Text color={theme.brand}>{'❯ '}</Text>
              <Text>{urlInput}</Text>
              <Text color={theme.brand}>█</Text>
            </Box>
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
              <Text color={theme.accent}>Enter</Text> {t('install.clone')}  <Text color={theme.accent}>Esc</Text> {t('footer.cancel')}
            </Text>
          </Box>
        </Box>
      )}

      {state === 'confirmDelete' && deleteEntry && (
        <Box flexDirection="column" marginTop={1} width="100%">
          <Box
            borderStyle="round"
            borderColor={theme.error}
            flexDirection="column"
            paddingX={2}
            paddingY={1}
            width="100%"
          >
            <Text bold color={theme.error}>{deleteEntry.name}</Text>
            <Text>{t('install.deleteConfirm')}</Text>
            {deleteEntry.custom && (
              <Text dimColor>{t('install.deleteCustomNote')}</Text>
            )}
            {!deleteEntry.custom && deleteEntry.installed && (
              <Text dimColor>{t('install.deleteBuiltinNote')}</Text>
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
              <Text color={theme.accent}>y</Text> {t('install.delete')}  <Text color={theme.accent}>n</Text> {t('footer.cancel')}
            </Text>
          </Box>
        </Box>
      )}

      {state === 'confirmReinstall' && reinstallEntry && (
        <Box flexDirection="column" marginTop={1} width="100%">
          <Box
            borderStyle="round"
            borderColor={theme.warning}
            flexDirection="column"
            paddingX={2}
            paddingY={1}
            width="100%"
          >
            <Text bold color={theme.warning}>{reinstallEntry.name}</Text>
            <Text>{t('install.alreadyInstalled')}</Text>
            <Box marginTop={1}>
              <Text>{t('install.reinstallConfirm')}</Text>
            </Box>
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
              <Text color={theme.accent}>y</Text> {t('install.reinstall')}  <Text color={theme.accent}>n</Text> {t('footer.cancel')}
            </Text>
          </Box>
        </Box>
      )}

      {state === 'blocked' && blockedEntry && (
        <Box flexDirection="column" marginTop={1} width="100%">
          <Alert variant="error" title={t('install.blocked', { name: blockedEntry.name })}>
            {t('install.cannotOverwrite')}
          </Alert>

          <Box
            borderStyle="single"
            borderColor={theme.muted}
            flexDirection="column"
            paddingX={2}
            paddingY={0}
            marginTop={1}
            width="100%"
          >
            <Text dimColor bold>{t('install.evidence')}</Text>
            {activeTools
              .filter(at => at.name === blockedEntry.name)
              .flatMap(at => at.evidence)
              .map((ev, i) => (
                <Text key={`ev-${i}`} dimColor>  → {ev}</Text>
              ))}
          </Box>

          <Box marginTop={1} paddingX={1}>
            <Text dimColor>{t('install.uninstallFirst')}</Text>
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
              <Text color={theme.accent}>Enter</Text> {t('footer.back')}  <Text color={theme.accent}>Esc</Text> {t('footer.back')}
            </Text>
          </Box>
        </Box>
      )}

      {state === 'installing' && (
        <Box
          borderStyle="round"
          borderColor={theme.warning}
          flexDirection="column"
          paddingX={2}
          paddingY={1}
          marginTop={1}
          width="100%"
        >
          <Spinner label={progress || t('install.installing')} />
        </Box>
      )}

      {state === 'done' && (
        <Box flexDirection="column" marginTop={1} width="100%">
          <Box
            borderStyle="round"
            borderColor={theme.success}
            flexDirection="column"
            paddingX={2}
            paddingY={0}
            width="100%"
          >
            <StatusMessage variant="success">{progress}</StatusMessage>
            <Text dimColor>{t('install.downloaded')}</Text>
            {activeTools.length > 0 && (
              <Text dimColor>
                {t('install.replaceWarning', { tools: activeTools.map(at => at.name).join(', ') })}
              </Text>
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
              <Text color={theme.accent}>Enter</Text> {t('footer.backToList')}
            </Text>
          </Box>
        </Box>
      )}

      {state === 'error' && (
        <Box flexDirection="column" marginTop={1} width="100%">
          <Alert variant="error" title={t('install.failed')}>
            {error}
          </Alert>

          <Box
            borderStyle="single"
            borderColor={theme.muted}
            paddingX={2}
            paddingY={0}
            marginTop={1}
            width="100%"
          >
            <Text dimColor>
              <Text color={theme.accent}>Enter</Text> {t('footer.backToList')}
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
