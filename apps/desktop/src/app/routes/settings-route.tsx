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
import type { Business } from '@cachink/domain';
import {
  APP_CONFIG_KEYS,
  SettingsHub,
  SettingsIndicadores,
  SettingsNegocio,
  SettingsSistema,
  SettingsTasasIsr,
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
  type SettingsSection,
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

function useSettingsHandlers(
  navigateGlobal: (p: string) => void,
): {
  reRunWizard: () => void;
  notificationsChange: (next: boolean) => void;
  checkUpdates: () => void;
  statusLabel: string | undefined;
} {
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
        navigateGlobal('/wizard');
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

const SECTION_TITLE_KEYS: Record<SettingsSection, string> = {
  negocio: 'settings.negocioCard',
  'tasas-isr': 'settings.tasasIsrCard',
  sistema: 'settings.sistemaCard',
  'tipos-de-pago': 'settings.tiposDePagoCard',
  indicadores: 'settings.indicadoresCard',
};

interface SettingsSubContentProps {
  subRoute: SettingsSection | null;
  mode: ReturnType<typeof useMode>;
  business: Business | null;
  role: ReturnType<typeof useRole>;
  notificationsEnabled: boolean | null;
  crashReportingEnabled: boolean | null;
  handlers: ReturnType<typeof useSettingsHandlers>;
  lanDetails: ReturnType<typeof useLanDetails>;
  cloudNav: ReturnType<typeof useCloudNavigation>;
  setSubRoute: (s: SettingsSection | null) => void;
}

function SettingsSistemaSubRoute(p: SettingsSubContentProps): ReactElement {
  return (
    <SettingsSistema settingsProps={{
      mode: p.mode, business: p.business,
      onReRunWizard: p.handlers.reRunWizard,
      notificationsEnabled: p.notificationsEnabled ?? undefined,
      onNotificationsChange: p.handlers.notificationsChange,
      feedback: {
        appVersion: APP_VERSION, platform: platformKey(),
        role: roleLabel(p.role), crashReportingEnabled: p.crashReportingEnabled === true,
        breadcrumbs: [],
      },
      onCheckForUpdates: p.handlers.checkUpdates,
      checkForUpdatesStatus: p.handlers.statusLabel,
      lanDetails: p.lanDetails ?? undefined,
      onOpenAdvancedBackend: p.mode === 'cloud' ? p.cloudNav.openAdvancedBackend : undefined,
    }} />
  );
}

function SettingsSubContent(p: SettingsSubContentProps): ReactElement {
  switch (p.subRoute) {
    case 'negocio': return <SettingsNegocio mode={p.mode} business={p.business} />;
    case 'tasas-isr': return <SettingsTasasIsr />;
    case 'indicadores': return <SettingsIndicadores />;
    case 'sistema': return <SettingsSistemaSubRoute {...p} />;
    default:
      return (
        <SettingsHub
          business={p.business}
          onNavigate={p.setSubRoute}
        />
      );
  }
}

export function SettingsRoute(): ReactElement {
  const mode = useMode();
  const business = useCurrentBusiness().data ?? null;
  const role = useRole();
  const notificationsEnabled = useNotificationsEnabled();
  const crashReportingEnabled = useCrashReportingEnabled();
  const lanDetails = useLanDetails({ stopHostServer: () => stopLanServer() });
  const cloudNav = useCloudNavigation();
  const navigate = useDesktopNavigate();
  const handlers = useSettingsHandlers(navigate);
  const { t } = useTranslation();
  const [subRoute, setSubRoute] = useState<SettingsSection | null>(null);
  const title = subRoute
    ? t(SECTION_TITLE_KEYS[subRoute] as 'settings.negocioCard')
    : t('settings.hubTitle');
  const handleBack = (): void => {
    if (subRoute !== null) { setSubRoute(null); return; }
    navigate('/');
  };
  return (
    <DesktopAppShellWrapper activeTabKey="ajustes" title={title} onBack={handleBack}>
      <SettingsSubContent
        subRoute={subRoute} mode={mode} business={business} role={role}
        notificationsEnabled={notificationsEnabled}
        crashReportingEnabled={crashReportingEnabled} handlers={handlers}
        lanDetails={lanDetails} cloudNav={cloudNav} setSubRoute={setSubRoute}
      />
    </DesktopAppShellWrapper>
  );
}
