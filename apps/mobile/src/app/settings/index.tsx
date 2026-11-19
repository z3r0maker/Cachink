/**
 * Expo Router entry for /settings — device-only Ajustes (A-12, MvAjustes):
 * Esta caja, Sincronización, En este teléfono, Privacidad y términos. Business settings live in the
 * portal. This route wires the persisted device toggles, the update check,
 * the bug-report sheet, the restart after «Desvincular y borrar» and the
 * dev-only database reset.
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
  useBugReportSender,
  useCrashReportingEnabled,
  useNotificationsEnabled,
  useSetCrashReportingEnabled,
  useSetNotificationsEnabled,
  useTranslation,
  type DeviceSettings,
} from '@xangarro/ui';
import { nativeResetDatabase } from '@xangarro/ui/database/reset-native';
import { AppShellWrapper, useBackTo } from '../../shell/app-shell-wrapper';
import { restartApp } from '../../shell/restart-app';
import { useMobileDeviceContext } from '../../shell/use-device-context';

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

function useDeviceSettings(onReportProblem: () => void): DeviceSettings {
  const K = APP_CONFIG_KEYS;
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
  // No «Buscar actualizaciones» (R1, approved 2026-11-19): the builds take no
  // over-the-air update yet, and the button printed its raw status.
  return {
    notificationsEnabled: notif,
    onNotificationsChange: onNotif,
    crashReportingEnabled: crash,
    onCrashReportingChange: onCrash,
    onReportProblem,
  };
}

const devFooter =
  typeof __DEV__ !== 'undefined' && __DEV__ ? (
    <View style={{ gap: 16 }}>
      <ResetDemoAction resetDatabase={nativeResetDatabase} onReload={restartApp} />
    </View>
  ) : null;

export default function SettingsRoute(): ReactElement {
  const router = useRouter();
  const { t } = useTranslation();
  const back = useBackTo('/turno');
  const [bugReportVisible, setBugReportVisible] = useState(false);
  const device = useDeviceSettings(() => setBugReportVisible(true));
  // With consent on, a linked phone sends the report through the device API
  // (N-81); otherwise, and as the fallback, it is shared as a file.
  const bugReportSender = useBugReportSender();
  const deviceContext = useMobileDeviceContext();
  return (
    <AppShellWrapper title={t('shell.turno.ajustes')} onBack={back}>
      <SettingsScreen
        device={device}
        onOpenRejected={() => router.push('/pendientes' as never)}
        restartApp={restartApp}
        footer={devFooter}
      />
      <BugReportSheet
        visible={bugReportVisible}
        onClose={() => setBugReportVisible(false)}
        onShare={(json, filename) => {
          void Share.share({ message: json, title: filename });
        }}
        consentEnabled={device.crashReportingEnabled}
        remote={bugReportSender}
        deviceContext={deviceContext}
      />
    </AppShellWrapper>
  );
}
