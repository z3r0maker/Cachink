/**
 * Settings tail rows — extracted from settings.tsx so that file stays
 * under the 200-line budget (CLAUDE.md §4.4). Each row renders a single
 * Btn or Card; pure UI driven by props.
 */

import type { ReactElement } from 'react';
import { Btn } from '../../components/index';
import type { useTranslation } from '../../i18n/index';
import { ExportarDatosAction } from './exportar-datos-action';
import { FeedbackAction } from './feedback-action';
import { LanDetailsCard } from './lan-details-card';
import { NotificationsToggle } from './notifications-toggle';
import type { SettingsProps } from './settings';

type T = ReturnType<typeof useTranslation>['t'];

export function LanSection({
  lan,
}: {
  lan: NonNullable<SettingsProps['lanDetails']>;
}): ReactElement {
  return (
    <LanDetailsCard
      serverUrl={lan.serverUrl}
      connectedDevices={lan.connectedDevices}
      isHost={lan.isHost}
      onUnpair={lan.onUnpair}
      onStopHostServer={lan.onStopHostServer}
    />
  );
}

// Audit M-1 follow-up (UI-AUDIT-1, Issue 3): the legacy `<View
// marginTop={4|8}>` overrides on each tail row created an inconsistent
// vertical rhythm — `Settings`'s parent `<View gap={20}>` already
// drives row spacing. Drop the per-row marginTop overrides and let the
// parent gap own the rhythm uniformly.
export function AdvancedBackendRow({ onOpen, t }: { onOpen: () => void; t: T }): ReactElement {
  return (
    <Btn variant="ghost" onPress={onOpen} fullWidth testID="settings-open-advanced-backend">
      {t('settings.openAdvancedBackend')}
    </Btn>
  );
}

export function CheckForUpdatesRow({
  onPress,
  status,
  t,
}: {
  onPress: () => void;
  status?: string;
  t: T;
}): ReactElement {
  const label = status
    ? `${t('settings.checkForUpdatesCta')} — ${status}`
    : t('settings.checkForUpdatesCta');
  return (
    <Btn variant="ghost" onPress={onPress} fullWidth testID="settings-check-for-updates">
      {label}
    </Btn>
  );
}

function SettingsCloudAndUpdatesRows({ props, t }: { props: SettingsProps; t: T }): ReactElement {
  return (
    <>
      {props.feedback && <FeedbackAction {...props.feedback} />}
      {props.onCheckForUpdates && (
        <CheckForUpdatesRow
          onPress={props.onCheckForUpdates}
          status={props.checkForUpdatesStatus}
          t={t}
        />
      )}
      {props.mode === 'cloud' && props.onOpenAdvancedBackend && (
        <AdvancedBackendRow onOpen={props.onOpenAdvancedBackend} t={t} />
      )}
    </>
  );
}

export function SettingsTail({ props, t }: { props: SettingsProps; t: T }): ReactElement {
  return (
    <>
      {(props.showNotificationsToggle ?? true) && props.onNotificationsChange && (
        <NotificationsToggle
          enabled={props.notificationsEnabled ?? true}
          onChange={props.onNotificationsChange}
        />
      )}
      {(props.showExportAction ?? true) && (
        <ExportarDatosAction businessName={props.business?.nombre} />
      )}
      <SettingsCloudAndUpdatesRows props={props} t={t} />
      {/*
       * Audit M-1 follow-up (UI-AUDIT-1, Issue 3): drop the legacy
       * `<View marginTop={8}>` wrapper — `Settings`'s parent
       * `<View gap={20}>` drives row spacing uniformly.
       */}
      <Btn variant="soft" onPress={props.onReRunWizard} fullWidth testID="settings-re-run-wizard">
        {t('settings.reRunWizard')}
      </Btn>
    </>
  );
}
