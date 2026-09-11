/**
 * Sub-route switch for the desktop Settings screen.
 *
 * Extracted from settings-route.tsx to keep that file under the
 * 200-line budget (CLAUDE.md §7) once the Director tool grid
 * (review item #7) added props to the hub branch.
 */

import type { ReactElement } from 'react';
import type { Business } from '@cachink/domain';
import {
  SettingsHub,
  SettingsIndicadores,
  SettingsNegocio,
  SettingsSistema,
  SettingsTasasIsr,
  type SettingsSection,
} from '@cachink/ui';
// Only referenced through `ReturnType<typeof …>` below — value imports
// would trip @typescript-eslint/consistent-type-imports.
import type { directorSettingsNavItems, useMode, useRole } from '@cachink/ui';
import type { useLanDetails } from '@cachink/ui/sync';
import type { useCloudNavigation } from '../../shell/cloud-navigation';
import type { useSettingsHandlers } from './settings-route';
import { APP_VERSION, platformKey, roleLabel } from './settings-route';

export interface SettingsSubContentProps {
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
  onOpenBugReport: () => void;
  /** Director-only tool grid absorbed from the retired Otros tab. */
  navItems: ReturnType<typeof directorSettingsNavItems> | undefined;
  onNavigateTool: (path: string) => void;
}

function SettingsSistemaSubRoute(p: SettingsSubContentProps): ReactElement {
  return (
    <SettingsSistema
      settingsProps={{
        mode: p.mode,
        business: p.business,
        onReRunWizard: p.handlers.reRunWizard,
        notificationsEnabled: p.notificationsEnabled ?? undefined,
        onNotificationsChange: p.handlers.notificationsChange,
        crashReportingEnabled: p.crashReportingEnabled === true,
        onCrashReportingChange: p.handlers.crashReportingChange,
        onOpenBugReport: p.onOpenBugReport,
        feedback: {
          appVersion: APP_VERSION,
          platform: platformKey(),
          role: roleLabel(p.role),
          crashReportingEnabled: p.crashReportingEnabled === true,
          breadcrumbs: [],
        },
        onCheckForUpdates: p.handlers.checkUpdates,
        checkForUpdatesStatus: p.handlers.statusLabel,
        lanDetails: p.lanDetails ?? undefined,
        onOpenAdvancedBackend: p.mode === 'cloud' ? p.cloudNav.openAdvancedBackend : undefined,
      }}
    />
  );
}

export function SettingsSubContent(p: SettingsSubContentProps): ReactElement {
  switch (p.subRoute) {
    case 'negocio':
      return <SettingsNegocio mode={p.mode} business={p.business} />;
    case 'tasas-isr':
      return <SettingsTasasIsr />;
    case 'indicadores':
      return <SettingsIndicadores />;
    case 'sistema':
      return <SettingsSistemaSubRoute {...p} />;
    default:
      return (
        <SettingsHub
          business={p.business}
          onNavigate={p.setSubRoute}
          navItems={p.navItems}
          onNavigateTool={p.onNavigateTool}
        />
      );
  }
}
