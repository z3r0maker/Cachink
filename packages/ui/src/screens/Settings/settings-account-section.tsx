/**
 * Esta caja (A-12, MvAjustes): which business this device belongs to, and
 * «Desvincular esta caja», whose sheet asks whether to keep the records on
 * the phone or wipe them (MvDesvincularBorrar). No plan row: the app never
 * names plans, prices or the portal (ADR-069).
 */

import { useState, type ReactElement } from 'react';
import { Btn } from '../../components/index';
import { useActivationContext } from '../../activation/activation-context';
import { useCurrentBusiness } from '../../hooks/use-current-business';
import { useTranslation } from '../../i18n/index';
import { DesvincularSheet } from './desvincular-sheet';
import { SettingsNote, SettingsRow, SettingsSection } from './settings-section';

export function SettingsAccountSection(props: {
  readonly onOpenRejected: () => void;
  /** Restarts the app after «Desvincular y borrar». */
  readonly restartApp?: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const business = useCurrentBusiness().data;
  const { config } = useActivationContext();
  const [open, setOpen] = useState(false);
  return (
    <SettingsSection title={t('settings.cuenta')} testID="settings-account">
      <SettingsRow
        label={t('settings.negocio')}
        value={business?.nombre ?? '—'}
        testID="settings-business-name"
      />
      <SettingsRow label={t('settings.dispositivo')} value={config.deviceInfo.name} />
      <SettingsNote text={t('settings.portalHint')} />
      <Btn variant="destructive" onPress={() => setOpen(true)} fullWidth testID="settings-unlink">
        {t('settings.unlink')}
      </Btn>
      {open ? (
        <DesvincularSheet
          open
          onClose={() => setOpen(false)}
          onOpenRejected={() => {
            setOpen(false);
            props.onOpenRejected();
          }}
          reiniciar={props.restartApp}
        />
      ) : null}
    </SettingsSection>
  );
}
