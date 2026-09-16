/**
 * Expo Router entry for /settings — device-only Configuración (A-12):
 * Cuenta, Sincronización, Dispositivo, Datos. Business settings live in the
 * portal. This route wires the persisted device toggles, the update check,
 * the bug-report sheet and the dev-only database reset.
 */

import { useState, type ReactElement } from 'react';
import { Share, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  APP_CONFIG_KEYS,
  BugReportSheet,
  ResetDemoAction,
  SettingsScreen,
  useAppConfigRepository,
  useCachinkSoundEnabled,
  useCheckForUpdates,
  useCrashReportingEnabled,
  useNotificationsEnabled,
  useSetCachinkSoundEnabled,
  useSetCrashReportingEnabled,
  useSetNotificationsEnabled,
  useTranslation,
  type DeviceSettings,
} from '@xangarro/ui';
import { nativeResetDatabase } from '@xangarro/ui/database/reset-native';
import { AppShellWrapper } from '../../shell/app-shell-wrapper';
import { useMobileUpdateAdapter } from '../../shell/use-update-adapter';

function reloadApp(): void {
  // In dev, DevSettings.reload() restarts the JS bundle
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DevSettings } = require('react-native');
  DevSettings.reload();
}

/** Persist a device toggle, then update the in-memory store. */
function usePersistedToggle(
  key: string,
  value: boolean,
  apply: (next: boolean) => void,
): [boolean, (next: boolean) => void] {
  const appConfig = useAppConfigRepository();
  return [
    value,
    (next) => void appConfig.set(key, next ? 'true' : 'false').then(() => apply(next)),
  ];
}

function useUpdateCheck(): { check: () => void; status: string | undefined } {
  const updates = useCheckForUpdates(useMobileUpdateAdapter());
  const [status, setStatus] = useState<string | undefined>();
  return {
    check: () => {
      setStatus('Buscando…');
      void updates.check().then(() => setStatus(updates.status));
    },
    status,
  };
}

function useDeviceSettings(onReportProblem: () => void): DeviceSettings {
  const K = APP_CONFIG_KEYS;
  const [sound, onSound] = usePersistedToggle(
    K.cachinkSoundEnabled,
    useCachinkSoundEnabled(),
    useSetCachinkSoundEnabled(),
  );
  const [notif, onNotif] = usePersistedToggle(
    K.notificationsEnabled,
    useNotificationsEnabled(),
    useSetNotificationsEnabled(),
  );
  const [crash, onCrash] = usePersistedToggle(
    K.crashReportingEnabled,
    useCrashReportingEnabled() === true,
    useSetCrashReportingEnabled(),
  );
  const updates = useUpdateCheck();
  return {
    soundEnabled: sound,
    onSoundChange: onSound,
    notificationsEnabled: notif,
    onNotificationsChange: onNotif,
    crashReportingEnabled: crash,
    onCrashReportingChange: onCrash,
    onReportProblem,
    onCheckForUpdates: updates.check,
    checkForUpdatesStatus: updates.status,
  };
}

const devFooter =
  typeof __DEV__ !== 'undefined' && __DEV__ ? (
    <View style={{ gap: 16 }}>
      <ResetDemoAction resetDatabase={nativeResetDatabase} onReload={reloadApp} />
    </View>
  ) : null;

export default function SettingsRoute(): ReactElement {
  const router = useRouter();
  const { t } = useTranslation();
  const [bugReportVisible, setBugReportVisible] = useState(false);
  const device = useDeviceSettings(() => setBugReportVisible(true));
  return (
    <AppShellWrapper
      activeTabKey="ajustes"
      title={t('settings.hubTitle')}
      onBack={() => router.back()}
    >
      <SettingsScreen
        device={device}
        onOpenRejected={() => router.push('/no-enviados' as never)}
        footer={devFooter}
      />
      <BugReportSheet
        visible={bugReportVisible}
        onClose={() => setBugReportVisible(false)}
        onShare={(json, filename) => {
          void Share.share({ message: json, title: filename });
        }}
        consentEnabled={device.crashReportingEnabled}
      />
    </AppShellWrapper>
  );
}
