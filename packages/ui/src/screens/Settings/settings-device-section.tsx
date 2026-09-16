/**
 * Dispositivo + Datos (A-12): the settings that belong to this phone —
 * sale sound, notifications, crash reports, reporting a problem, checking
 * for updates — and exporting what the device holds.
 */

import type { ReactElement } from 'react';
import { Btn } from '../../components/index';
import { useCurrentBusiness } from '../../hooks/use-current-business';
import { useTranslation } from '../../i18n/index';
import { CachinkSoundToggle } from './cachink-sound-toggle';
import { CrashReportingToggle } from './crash-reporting-toggle';
import { ExportarDatosAction } from './exportar-datos-action';
import { NotificationsToggle } from './notifications-toggle';
import { SettingsNote, SettingsSection } from './settings-section';

export interface DeviceSettings {
  readonly soundEnabled: boolean;
  readonly onSoundChange: (next: boolean) => void;
  readonly notificationsEnabled: boolean;
  readonly onNotificationsChange: (next: boolean) => void;
  readonly crashReportingEnabled: boolean;
  readonly onCrashReportingChange: (next: boolean) => void;
  readonly onReportProblem: () => void;
  readonly onCheckForUpdates?: () => void;
  readonly checkForUpdatesStatus?: string;
}

export function SettingsDeviceSection(props: { readonly device: DeviceSettings }): ReactElement {
  const { t } = useTranslation();
  const d = props.device;
  const updatesLabel = d.checkForUpdatesStatus
    ? `${t('settings.checkForUpdatesCta')} — ${d.checkForUpdatesStatus}`
    : t('settings.checkForUpdatesCta');
  return (
    <SettingsSection title={t('settings.dispositivoSection')} testID="settings-device">
      <CachinkSoundToggle enabled={d.soundEnabled} onChange={d.onSoundChange} />
      <NotificationsToggle enabled={d.notificationsEnabled} onChange={d.onNotificationsChange} />
      <CrashReportingToggle enabled={d.crashReportingEnabled} onChange={d.onCrashReportingChange} />
      <Btn variant="ghost" onPress={d.onReportProblem} fullWidth testID="settings-open-bug-report">
        {t('settings.reportBugCta')}
      </Btn>
      {d.onCheckForUpdates && (
        <Btn
          variant="ghost"
          onPress={d.onCheckForUpdates}
          fullWidth
          testID="settings-check-for-updates"
        >
          {updatesLabel}
        </Btn>
      )}
    </SettingsSection>
  );
}

export function SettingsDataSection(): ReactElement {
  const { t } = useTranslation();
  const business = useCurrentBusiness().data;
  return (
    <SettingsSection title={t('settings.datos')} testID="settings-data">
      <ExportarDatosAction businessName={business?.nombre} />
      <SettingsNote text={t('settings.exportHint')} />
    </SettingsSection>
  );
}
