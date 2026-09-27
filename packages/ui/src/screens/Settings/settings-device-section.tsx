/**
 * Dispositivo (A-12): the settings that belong to this phone — sale sound,
 * notifications, crash reports, reporting a problem, checking for updates.
 * Exporting the business's data is the owner's, in the portal.
 */

import type { ReactElement } from 'react';
import { Btn } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { SaleSoundToggle } from './sale-sound-toggle';
import { CrashReportingToggle } from './crash-reporting-toggle';
import { NotificationsToggle } from './notifications-toggle';
import { SettingsSection } from './settings-section';

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
      <SaleSoundToggle enabled={d.soundEnabled} onChange={d.onSoundChange} />
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
