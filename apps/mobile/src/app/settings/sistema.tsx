/**
 * Expo Router entry for /settings/sistema.
 *
 * Mirrors the legacy settings.tsx wiring — injects all SettingsProps
 * so SettingsSistema can render the existing tail components.
 */

import { useState, type ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import { Share } from 'react-native';
import {
  APP_CONFIG_KEYS,
  BugReportSheet,
  SettingsSistema,
  useAppConfigRepository,
  useCachinkSoundEnabled,
  useCheckForUpdates,
  useCrashReportingEnabled,
  useCurrentBusiness,
  useMode,
  useNotificationsEnabled,
  useRole,
  useSetCachinkSoundEnabled,
  useSetCrashReportingEnabled,
  useSetMode,
  useSetNotificationsEnabled,
  useTranslation,
} from '@cachink/ui';
import { useLanDetails } from '@cachink/ui/sync';
import { AppShellWrapper } from '../../shell/app-shell-wrapper';
import { useMobileUpdateAdapter } from '../../shell/use-update-adapter';

const APP_VERSION = Application.nativeApplicationVersion ?? '0.0.0';

function platformKey(): 'ios' | 'android' | 'desktop-mac' | 'desktop-windows' {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

function roleLabel(role: 'operativo' | 'director' | null): 'Operativo' | 'Director' | null {
  if (role === 'operativo') return 'Operativo';
  if (role === 'director') return 'Director';
  return null;
}

type BoolSetting = (next: boolean) => void;

/** The three persisted boolean toggles — split out to keep each hook under 40 lines. */
function useToggleHandlers(appConfig: ReturnType<typeof useAppConfigRepository>): {
  notificationsChange: BoolSetting;
  cachinkSoundChange: BoolSetting;
  crashReportingChange: BoolSetting;
} {
  const setNotificationsEnabled = useSetNotificationsEnabled();
  const setCachinkSoundEnabled = useSetCachinkSoundEnabled();
  const setCrashReportingEnabled = useSetCrashReportingEnabled();
  const persist = (key: string, next: boolean, apply: BoolSetting): void => {
    void appConfig.set(key, next ? 'true' : 'false').then(() => apply(next));
  };
  return {
    notificationsChange: (next) =>
      persist(APP_CONFIG_KEYS.notificationsEnabled, next, setNotificationsEnabled),
    cachinkSoundChange: (next) =>
      persist(APP_CONFIG_KEYS.cachinkSoundEnabled, next, setCachinkSoundEnabled),
    crashReportingChange: (next) =>
      persist(APP_CONFIG_KEYS.crashReportingEnabled, next, setCrashReportingEnabled),
  };
}

function useSettingsHandlers(): {
  reRunWizard: () => void;
  notificationsChange: BoolSetting;
  cachinkSoundChange: BoolSetting;
  crashReportingChange: BoolSetting;
  checkUpdates: () => void;
  statusLabel: string | undefined;
} {
  const router = useRouter();
  const appConfig = useAppConfigRepository();
  const setMode = useSetMode();
  const toggles = useToggleHandlers(appConfig);
  const updateAdapter = useMobileUpdateAdapter();
  const updates = useCheckForUpdates(updateAdapter);
  const [statusLabel, setStatusLabel] = useState<string | undefined>();
  return {
    ...toggles,
    reRunWizard: () => {
      void appConfig.delete(APP_CONFIG_KEYS.mode).then(() => {
        setMode(null);
        router.replace('/wizard');
      });
    },
    checkUpdates: () => {
      setStatusLabel('Buscando…');
      void updates.check().then(() => setStatusLabel(updates.status));
    },
    statusLabel,
  };
}

function useSistemaProps(): {
  settingsProps: React.ComponentProps<typeof SettingsSistema>['settingsProps'];
  title: string;
} {
  const mode = useMode();
  const business = useCurrentBusiness().data ?? null;
  const role = useRole();
  const notificationsEnabled = useNotificationsEnabled();
  const cachinkSoundEnabled = useCachinkSoundEnabled();
  const crashReportingEnabled = useCrashReportingEnabled();
  const lanDetails = useLanDetails();
  const handlers = useSettingsHandlers();
  const { t } = useTranslation();

  return {
    title: t('settings.sistemaCard'),
    settingsProps: {
      mode,
      business,
      onReRunWizard: handlers.reRunWizard,
      notificationsEnabled,
      onNotificationsChange: handlers.notificationsChange,
      cachinkSoundEnabled,
      onCachinkSoundChange: handlers.cachinkSoundChange,
      crashReportingEnabled: crashReportingEnabled === true,
      onCrashReportingChange: handlers.crashReportingChange,
      feedback: {
        appVersion: APP_VERSION,
        platform: platformKey(),
        role: roleLabel(role),
        crashReportingEnabled: crashReportingEnabled === true,
        breadcrumbs: [],
      },
      onCheckForUpdates: handlers.checkUpdates,
      checkForUpdatesStatus: handlers.statusLabel,
      lanDetails: lanDetails ?? undefined,
    },
  };
}

export default function SistemaRoute(): ReactElement {
  const router = useRouter();
  const { title, settingsProps } = useSistemaProps();
  const [bugReportVisible, setBugReportVisible] = useState(false);
  const crashReportingEnabled = useCrashReportingEnabled();

  const propsWithBugReport = {
    ...settingsProps,
    onOpenBugReport: () => setBugReportVisible(true),
  };

  return (
    <AppShellWrapper activeTabKey="ajustes" title={title} onBack={() => router.back()}>
      <SettingsSistema settingsProps={propsWithBugReport} />
      <BugReportSheet
        visible={bugReportVisible}
        onClose={() => setBugReportVisible(false)}
        onShare={(json, filename) => {
          void Share.share({ message: json, title: filename });
        }}
        consentEnabled={crashReportingEnabled === true}
      />
    </AppShellWrapper>
  );
}
