/**
 * Expo Router entry for /settings (P1C-M1-T04, Slice 9 wire-up).
 *
 * Slice 9.6 additions:
 *   - T10 — pass FeedbackAction props (appVersion / platform / role /
 *     crash-reporting consent) so "Enviar comentarios" works.
 *   - T11 — wire `useCheckForUpdates(useMobileUpdateAdapter())` into
 *     the Settings "Buscar actualizaciones" row.
 */

import { useState, type ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import {
  APP_CONFIG_KEYS,
  Settings,
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
import { AppShellWrapper } from '../shell/app-shell-wrapper';
import { useCloudNavigation } from '../shell/cloud-navigation';
import { useMobileUpdateAdapter } from '../shell/use-update-adapter';

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

/**
 * UI-AUDIT-1 Issue 2 — Expo Router history-pop with a defensive
 * `/` fallback when the user landed on Settings via a deep-link or
 * cold-start (no history entry to pop).
 */
function useBackToParent(): () => void {
  const router = useRouter();
  return () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/' as never);
  };
}

export default function SettingsRoute(): ReactElement {
  const mode = useMode();
  const business = useCurrentBusiness().data ?? null;
  const role = useRole();
  const notificationsEnabled = useNotificationsEnabled();
  const crashReportingEnabled = useCrashReportingEnabled();
  const lanDetails = useLanDetails();
  const cloudNav = useCloudNavigation();
  const handlers = useSettingsHandlers();
  const handleBack = useBackToParent();
  const { t } = useTranslation();

  return (
    <AppShellWrapper activeTabKey="ajustes" title={t('settings.title')} onBack={handleBack}>
      <Settings
        mode={mode}
        business={business}
        onReRunWizard={handlers.reRunWizard}
        notificationsEnabled={notificationsEnabled}
        onNotificationsChange={handlers.notificationsChange}
        feedback={{
          appVersion: APP_VERSION,
          platform: platformKey(),
          role: roleLabel(role),
          crashReportingEnabled: crashReportingEnabled === true,
          breadcrumbs: [],
        }}
        onCheckForUpdates={handlers.checkUpdates}
        checkForUpdatesStatus={handlers.statusLabel}
        lanDetails={lanDetails ?? undefined}
        onOpenAdvancedBackend={mode === 'cloud' ? cloudNav.openAdvancedBackend : undefined}
      />
    </AppShellWrapper>
  );
}
