import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Spinner, StatusMessage } from '@inkjs/ui';
import { detectConfigs, createVanillaSnapshot } from '../core/vanilla.js';
import { getOrchDir, getProfilesDir } from '../core/state.js';
import { theme } from '../core/theme.js';
import { Header } from './Header.js';
import { t } from '../core/i18n.js';
import fs from 'fs-extra';

interface InitViewProps {
  onFinish: () => void;
}

export function InitView({ onFinish }: InitViewProps) {
  const [step, setStep] = useState<'detecting' | 'snapshotting' | 'done'>('detecting');
  const configs = detectConfigs();

  useEffect(() => {
    const run = async () => {
      fs.ensureDirSync(getOrchDir());
      fs.ensureDirSync(getProfilesDir());

      setStep('snapshotting');
      await new Promise(r => setTimeout(r, 300));
      createVanillaSnapshot();

      setStep('done');
      await new Promise(r => setTimeout(r, 500));
      onFinish();
    };

    run();
  }, [onFinish]);

  return (
    <Box flexDirection="column" padding={1} width="100%">
      <Header subtitle={t('header.firstRun')} />

      <Box
        borderStyle="single"
        borderColor={theme.muted}
        flexDirection="column"
        paddingX={2}
        paddingY={0}
        marginTop={1}
        width="100%"
      >
        <Text bold>{t('init.detected')}</Text>
        {configs.map(c => (
          <Text key={c.label}>
            {c.exists ? '  ✓ ' : '  · '}
            <Text color={c.exists ? theme.success : theme.muted}>{c.label}</Text>
          </Text>
        ))}
      </Box>

      <Box marginTop={1} paddingX={1}>
        {step === 'detecting' && <Spinner label={t('init.detecting')} />}
        {step === 'snapshotting' && <Spinner label={t('init.snapshotting')} />}
        {step === 'done' && (
          <StatusMessage variant="success">
            {t('init.done')}
          </StatusMessage>
        )}
      </Box>
    </Box>
  );
}
