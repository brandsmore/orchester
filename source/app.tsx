import React from 'react';
import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import { useOrch } from './hooks/useOrch.js';
import { theme } from './core/theme.js';
import { Header } from './views/Header.js';
import { SplashView } from './views/SplashView.js';
import { InitView } from './views/InitView.js';
import { ProfileList } from './views/ProfileList.js';
import { DiffPreview } from './views/DiffPreview.js';
import { ResultView } from './views/ResultView.js';
import { InstallView } from './views/InstallView.js';
import { UsageView } from './views/UsageView.js';
import { ToolSelectView } from './views/ToolSelectView.js';

export function App() {
  const {
    view,
    profiles,
    selectedProfile,
    diffData,
    switchResult,
    loading,
    selectProfile,
    confirmToolSelection,
    confirmSwitch,
    backToList,
    finishInit,
    finishSplash,
    goToInstall,
    goToUsage,
  } = useOrch();

  if (loading && view !== 'init' && view !== 'splash') {
    return (
      <Box flexDirection="column" padding={1} width="100%">
        <Header />
        <Box marginTop={1} paddingX={1}>
          <Spinner label="Loading..." />
        </Box>
      </Box>
    );
  }

  switch (view) {
    case 'splash':
      return <SplashView onDone={finishSplash} />;

    case 'init':
      return <InitView onFinish={finishInit} />;

    case 'list':
      return (
        <ProfileList
          profiles={profiles}
          onSelect={selectProfile}
          onInstall={goToInstall}
          onUsage={goToUsage}
        />
      );

    case 'usage':
      return <UsageView onDone={backToList} />;

    case 'install':
      return <InstallView onDone={backToList} />;

    case 'toolSelect':
      if (!selectedProfile) return null;
      {
        const profile = profiles.find(p => p.name === selectedProfile);
        return (
          <ToolSelectView
            profileName={selectedProfile}
            defaultTool={profile?.tool ?? 'claude-code'}
            onConfirm={confirmToolSelection}
            onCancel={backToList}
          />
        );
      }

    case 'preview':
      if (!diffData) return null;
      return (
        <DiffPreview
          diffData={diffData}
          onConfirm={confirmSwitch}
          onCancel={backToList}
        />
      );

    case 'result':
      if (!switchResult) return null;
      return (
        <ResultView
          result={switchResult}
          profileName={selectedProfile}
          onDone={backToList}
        />
      );

    default:
      return null;
  }
}
