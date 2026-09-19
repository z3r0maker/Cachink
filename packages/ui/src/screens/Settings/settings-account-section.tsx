/**
 * Cuenta (A-12): which business and plan this device belongs to, where the
 * business is managed, and "Desvincular este dispositivo" — which forgets the
 * device's identity but keeps every record on it.
 */

import { useState, type ReactElement } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Btn, ConfirmDialog } from '../../components/index';
import { useActivationContext } from '../../activation/activation-context';
import { forgetDevice } from '../../activation/forget-device';
import { useAppConfigRepository } from '../../app/repository-provider';
import { useEntitlement } from '../../entitlement/use-entitlement';
import { useCurrentBusiness } from '../../hooks/use-current-business';
import { useTranslation } from '../../i18n/index';
import { SettingsNote, SettingsRow, SettingsSection } from './settings-section';

function useUnlink(): { open: boolean; ask: () => void; cancel: () => void; confirm: () => void } {
  const [open, setOpen] = useState(false);
  const { config } = useActivationContext();
  const appConfig = useAppConfigRepository();
  const queryClient = useQueryClient();
  return {
    open,
    ask: () => setOpen(true),
    cancel: () => setOpen(false),
    confirm: () => {
      setOpen(false);
      void forgetDevice({ appConfig, tokenStore: config.tokenStore, queryClient });
    },
  };
}

export function SettingsAccountSection(): ReactElement {
  const { t } = useTranslation();
  const business = useCurrentBusiness().data;
  const entitlement = useEntitlement();
  const { config } = useActivationContext();
  const unlink = useUnlink();
  const plan = entitlement ? t(`settings.plans.${entitlement.plan}` as never) : '—';
  return (
    <SettingsSection title={t('settings.cuenta')} testID="settings-account">
      <SettingsRow
        label={t('settings.negocio')}
        value={business?.nombre ?? '—'}
        testID="settings-business-name"
      />
      <SettingsRow label={t('settings.plan')} value={plan} testID="settings-plan" />
      <SettingsRow label={t('settings.dispositivo')} value={config.deviceInfo.name} />
      <SettingsNote text={t('settings.portalHint')} />
      <Btn variant="ghost" onPress={unlink.ask} fullWidth testID="settings-unlink">
        {t('settings.unlink')}
      </Btn>
      <ConfirmDialog
        open={unlink.open}
        onClose={unlink.cancel}
        onConfirm={unlink.confirm}
        title={t('settings.unlinkConfirmTitle')}
        description={t('settings.unlinkConfirmBody')}
        confirmLabel={t('settings.unlinkConfirm')}
        tone="danger"
      />
    </SettingsSection>
  );
}
