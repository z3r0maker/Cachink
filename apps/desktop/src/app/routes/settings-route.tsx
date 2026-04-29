/**
 * Desktop route adapter for /settings. Mirrors
 * `apps/mobile/src/app/settings.tsx`. The wizard-rerun flow uses the
 * state router's `navigate('/wizard')` (GatedNavigation's wizard gate
 * short-circuits once mode === null).
 *
 * Slice 9.6 additions: FeedbackAction (T10) + useCheckForUpdates (T11)
 * wiring.
 */

import { useState, type ReactElement } from 'react';
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
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';
import { useDesktopNavigate } from '../desktop-router-context';
import { useDesktopUpdateAdapter } from '../../shell/use-update-adapter';
import { useCloudNavigation } from '../../shell/cloud-navigation';
import { stopLanServer } from '../../shell/lan-host-bridge';

const APP_VERSION = '0.1.0';

function platformKey(): 'desktop-mac' | 'desktop-windows' {
  if (typeof navigator !== 'undefined' && /Win/i.test(navigator.platform)) {
    return 'desktop-windows';
  }
  return 'desktop-mac';
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
  const navigate = useDesktopNavigate();
  const appConfig = useAppConfigRepository();
  const setMode = useSetMode();
  const setNotificationsEnabled = useSetNotificationsEnabled();
  const updateAdapter = useDesktopUpdateAdapter();
  const updates = useCheckForUpdates(updateAdapter);
  const [statusLabel, setStatusLabel] = useState<string | undefined>();
  return {
    reRunWizard: () => {
      void appConfig.delete(APP_CONFIG_KEYS.mode).then(() => {
        setMode(null);
        navigate('/wizard');
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

export function SettingsRoute(): ReactElement {
  const mode = useMode();
  const business = useCurrentBusiness().data ?? null;
  const role = useRole();
  const notificationsEnabled = useNotificationsEnabled();
  const crashReportingEnabled = useCrashReportingEnabled();
  const lanDetails = useLanDetails({ stopHostServer: () => stopLanServer() });
  const cloudNav = useCloudNavigation();
  const handlers = useSettingsHandlers();
  const navigate = useDesktopNavigate();
  const { t } = useTranslation();

  // UI-AUDIT-1 Issue 2 — Settings is reached via the TopBar cog from
  // any tabbed route. Desktop's state-router has no history stack, so
  // we route to `/` (Director Home for Director, /ventas fallback for
  // Operativo) — that's the parent surface the user came from.
  const handleBack = (): void => navigate('/');

  return (
    <DesktopAppShellWrapper
      activeTabKey="ajustes"
      title={t('settings.title')}
      onBack={handleBack}
    >
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
    </DesktopAppShellWrapper>
  );
}
