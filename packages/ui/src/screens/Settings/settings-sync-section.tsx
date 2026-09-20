/**
 * Sincronización (A-12): the same status the top-bar pill shows, a big
 * "Actualizar", and the way into "No enviados" when something was refused.
 */

import type { ReactElement } from 'react';
import { Btn } from '../../components/index';
import { useCloudSync } from '../../app/cloud-sync-bridge';
import { useTranslation } from '../../i18n/index';
import { pillView } from '../../sync/cloud-sync-status';
import { SettingsRow, SettingsSection } from './settings-section';

export function SettingsSyncSection(props: { readonly onOpenRejected: () => void }): ReactElement {
  const { t } = useTranslation();
  const { state, syncNow } = useCloudSync();
  const view = pillView(state);
  const status = t(view.labelKey as never, { count: view.count, time: view.time } as never);
  const waitingForHuman = state.counts.rejected + state.counts.retrying;
  return (
    <SettingsSection title={t('settings.sincronizacion')} testID="settings-sync">
      <SettingsRow label={t('settings.estado')} value={status} testID="settings-sync-status" />
      <Btn
        variant="dark"
        onPress={syncNow}
        loading={state.phase === 'syncing'}
        fullWidth
        testID="settings-sync-now"
      >
        {t('syncPill.update')}
      </Btn>
      {waitingForHuman > 0 && (
        <Btn variant="ghost" onPress={props.onOpenRejected} fullWidth testID="settings-no-enviados">
          {t('settings.noEnviados', { count: waitingForHuman })}
        </Btn>
      )}
    </SettingsSection>
  );
}
