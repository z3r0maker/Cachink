/**
 * Expo Router entry for /settings/sistema.
 *
 * Mirrors the legacy settings.tsx wiring — injects all SettingsProps
 * so SettingsSistema can render the existing tail components.
 */

import { useState, type ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import {
  APP_CONFIG_KEYS,
  SettingsSistema,
  useAppConfigRepository,
  useCheckForUpdates,
  useCrashReportingEnabled,
  useCurrentBusiness,
  useMode,
  useNotificationsEnabled,
  useRole,
  useSetMode,
  useSetNotificationsEnabled,
  useTranslation,
} from '@cachink/ui';
import { useLanDetails } from '@cachink/ui/sync';
import { AppShellWrapper } from '../../shell/app-shell-wrapper';
import { useCloudNavigation } from '../../shell/cloud-navigation';
import { useMobileUpdateAdapter } from '../../shell/use-update-adapter';

const APP_VERSION = '0.1.0';

function platformKey(): 'ios' | 'android' | 'desktop-mac' | 'desktop-windows' {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

function roleLabel(role: 'operativo' | 'director' | null): 'Operativo' | 'Director' | null {
  if (role === 'operativo') return 'Operativo';
  if (role === 'director') return 'Director';
  return null;
}

function useSettingsHandlers(): {
  reRunWizard: () => void;
  notificationsChange: (next: boolean) => void;
  checkUpdates: () => void;
  statusLabel: string | undefined;
} {
  const router = useRouter();
  const appConfig = useAppConfigRepository();
  const setMode = useSetMode();
  const setNotificationsEnabled = useSetNotificationsEnabled();
  const updateAdapter = useMobileUpdateAdapter();
  const updates = useCheckForUpdates(updateAdapter);
  const [statusLabel, setStatusLabel] = useState<string | undefined>();
  return {
    reRunWizard: () => {
      void appConfig.delete(APP_CONFIG_KEYS.mode).then(() => {
        setMode(null);
        router.replace('/wizard');
      });
    },
    notificationsChange: (next: boolean) => {
      void appConfig
        .set(APP_CONFIG_KEYS.notificationsEnabled, next ? 'true' : 'false')
        .then(() => setNotificationsEnabled(next));
    },
    checkUpdates: () => {
      setStatusLabel('Buscando…');
      void updates.check().then(() => setStatusLabel(updates.status));
    },
    statusLabel,
  };
}

export default function SistemaRoute(): ReactElement {
  const router = useRouter();
  const mode = useMode();
  const business = useCurrentBusiness().data ?? null;
  const role = useRole();
  const notificationsEnabled = useNotificationsEnabled();
  const crashReportingEnabled = useCrashReportingEnabled();
  const lanDetails = useLanDetails();
  const cloudNav = useCloudNavigation();
  const handlers = useSettingsHandlers();
  const { t } = useTranslation();

  return (
    <AppShellWrapper
      activeTabKey="ajustes"
      title={t('settings.sistemaCard')}
      onBack={() => router.back()}
    >
      <SettingsSistema
        settingsProps={{
          mode,
          business,
          onReRunWizard: handlers.reRunWizard,
          notificationsEnabled,
          onNotificationsChange: handlers.notificationsChange,
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
          onOpenAdvancedBackend: mode === 'cloud' ? cloudNav.openAdvancedBackend : undefined,
        }}
      />
    </AppShellWrapper>
  );
}
