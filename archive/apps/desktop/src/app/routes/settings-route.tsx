/**
 * Desktop route adapter for /settings. Renders the SettingsHub as the
 * top-level screen, with sub-routes for negocio, tasas-isr, and
 * sistema managed via local state.
 *
 * Empleados moved to a top-level /empleados route (see empleados-route.tsx).
 *
 * Slice 9.6 additions: FeedbackAction (T10) + useCheckForUpdates (T11)
 * wiring (preserved in the sistema sub-screen).
 */

import { useState, type ReactElement } from 'react';
import {
  APP_CONFIG_KEYS,
  BugReportSheet,
  directorSettingsNavItems,
  useAppConfigRepository,
  useCheckForUpdates,
  useFeatureFlags,
  useCrashReportingEnabled,
  useCurrentBusiness,
  useMode,
  useNotificationsEnabled,
  useRole,
  useSetCrashReportingEnabled,
  useSetMode,
  useSetNotificationsEnabled,
  useTranslation,
  type SettingsSection,
} from '@cachink/ui';
import { useLanDetails } from '@cachink/ui/sync';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';
import { useDesktopNavigate } from '../desktop-router-context';
import { useDesktopUpdateAdapter } from '../../shell/use-update-adapter';
import { useCloudNavigation } from '../../shell/cloud-navigation';
import { stopLanServer } from '../../shell/lan-host-bridge';
import { SettingsSubContent } from './settings-sub-content';

export const APP_VERSION = (() => {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    return env?.VITE_APP_VERSION ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
})();

export function platformKey(): 'desktop-mac' | 'desktop-windows' {
  if (typeof navigator !== 'undefined' && /Win/i.test(navigator.platform)) {
    return 'desktop-windows';
  }
  return 'desktop-mac';
}

export function roleLabel(role: 'operativo' | 'director' | null): 'Operativo' | 'Director' | null {
  if (role === 'operativo') return 'Operativo';
  if (role === 'director') return 'Director';
  return null;
}

export function useSettingsHandlers(navigateGlobal: (p: string) => void): {
  reRunWizard: () => void;
  notificationsChange: (next: boolean) => void;
  crashReportingChange: (next: boolean) => void;
  checkUpdates: () => void;
  statusLabel: string | undefined;
} {
  const appConfig = useAppConfigRepository();
  const setMode = useSetMode();
  const setNotificationsEnabled = useSetNotificationsEnabled();
  const setCrashReportingEnabled = useSetCrashReportingEnabled();
  const updateAdapter = useDesktopUpdateAdapter();
  const updates = useCheckForUpdates(updateAdapter);
  const [statusLabel, setStatusLabel] = useState<string | undefined>();
  return {
    reRunWizard: () => {
      void appConfig.delete(APP_CONFIG_KEYS.mode).then(() => {
        setMode(null);
        navigateGlobal('/wizard');
      });
    },
    notificationsChange: (next: boolean) => {
      void appConfig
        .set(APP_CONFIG_KEYS.notificationsEnabled, next ? 'true' : 'false')
        .then(() => setNotificationsEnabled(next));
    },
    crashReportingChange: (next: boolean) => {
      void appConfig
        .set(APP_CONFIG_KEYS.crashReportingEnabled, next ? 'true' : 'false')
        .then(() => setCrashReportingEnabled(next));
    },
    checkUpdates: () => {
      setStatusLabel('Buscando…');
      void updates.check().then(() => setStatusLabel(updates.status));
    },
    statusLabel,
  };
}

const SECTION_TITLE_KEYS: Record<SettingsSection, string> = {
  negocio: 'settings.negocioCard',
  'tasas-isr': 'settings.tasasIsrCard',
  sistema: 'settings.sistemaCard',
  'tipos-de-pago': 'settings.tiposDePagoCard',
  indicadores: 'settings.indicadoresCard',
};

/**
 * The hooks SettingsRoute depends on, pulled out so the component body
 * stays inside the 40-line budget (CLAUDE.md §7).
 */
function useSettingsRouteState() {
  const navigate = useDesktopNavigate();
  const role = useRole();
  return {
    navigate,
    role,
    mode: useMode(),
    business: useCurrentBusiness().data ?? null,
    flags: useFeatureFlags(),
    notificationsEnabled: useNotificationsEnabled(),
    crashReportingEnabled: useCrashReportingEnabled(),
    lanDetails: useLanDetails({ stopHostServer: () => stopLanServer() }),
    cloudNav: useCloudNavigation(),
    handlers: useSettingsHandlers(navigate),
    t: useTranslation().t,
  };
}

/** Sub-route selection plus the derived title/back behavior for the hub. */
function useSubRouteNav(navigate: (p: string) => void): {
  subRoute: SettingsSection | null;
  setSubRoute: (s: SettingsSection | null) => void;
  title: string;
  handleBack: () => void;
} {
  const { t } = useTranslation();
  const [subRoute, setSubRoute] = useState<SettingsSection | null>(null);
  const title = subRoute
    ? t(SECTION_TITLE_KEYS[subRoute] as 'settings.negocioCard')
    : t('settings.hubTitle');
  const handleBack = (): void => {
    if (subRoute !== null) {
      setSubRoute(null);
      return;
    }
    navigate('/');
  };
  return { subRoute, setSubRoute, title, handleBack };
}

export function SettingsRoute(): ReactElement {
  const s = useSettingsRouteState();
  const nav = useSubRouteNav(s.navigate);
  const [bugReportVisible, setBugReportVisible] = useState(false);
  return (
    <DesktopAppShellWrapper activeTabKey="ajustes" title={nav.title} onBack={nav.handleBack}>
      <SettingsSubContent
        subRoute={nav.subRoute}
        mode={s.mode}
        business={s.business}
        role={s.role}
        notificationsEnabled={s.notificationsEnabled}
        crashReportingEnabled={s.crashReportingEnabled}
        handlers={s.handlers}
        lanDetails={s.lanDetails}
        cloudNav={s.cloudNav}
        setSubRoute={nav.setSubRoute}
        onOpenBugReport={() => setBugReportVisible(true)}
        navItems={s.role === 'director' ? directorSettingsNavItems(s.flags) : undefined}
        onNavigateTool={s.navigate}
      />
      <DesktopBugReportSheet
        visible={bugReportVisible}
        onClose={() => setBugReportVisible(false)}
        consentEnabled={s.crashReportingEnabled === true}
      />
    </DesktopAppShellWrapper>
  );
}

/** Browser download shim for the bug-report JSON (no native share sheet). */
function DesktopBugReportSheet(props: {
  visible: boolean;
  onClose: () => void;
  consentEnabled: boolean;
}): ReactElement {
  return (
    <BugReportSheet
      visible={props.visible}
      onClose={props.onClose}
      onShare={(json, filename) => {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }}
      consentEnabled={props.consentEnabled}
    />
  );
}
