/**
 * RecoveryScreen — 3-layer PIN recovery.
 *
 * 1. Recovery password → resets PIN
 * 2. Email info display (future: email reset flow)
 * 3. Factory reset → wipe app data
 *
 * ADR-049: Password for recovery, PIN as the new credential.
 */

import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { UserId } from '@cachink/domain';
import { Btn, PasswordField } from '../../components/index';
import { Input } from '../../components/Input/input';
import { FloatingCoinsBackground, SafeAreaSpacer } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface RecoveryScreenProps {
  readonly userId: UserId;
  readonly maskedEmail: string | null;
  readonly onRecoverWithPassword: (recoveryPassword: string, newPin: string) => void;
  readonly onFactoryReset: () => void;
  readonly factoryResetSubmitting?: boolean;
  readonly onBack: () => void;
  readonly error: string | null;
  readonly submitting: boolean;
  readonly testID?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

function useRecoveryForm() {
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const mismatch = confirmPin.length > 0 && newPin !== confirmPin;
  const valid = recoveryPassword.length >= 6 && /^\d{6}$/.test(newPin) && newPin === confirmPin;
  return {
    recoveryPassword,
    setRecoveryPassword,
    newPin,
    setNewPin,
    confirmPin,
    setConfirmPin,
    mismatch,
    valid,
  };
}

function RecoveryActions({
  onBack,
  onFactoryReset,
  factoryResetSubmitting,
  t,
}: {
  onBack: () => void;
  onFactoryReset: () => void;
  factoryResetSubmitting?: boolean;
  t: T;
}): ReactElement {
  return (
    <View marginTop={24} gap={8}>
      <Btn variant="ghost" onPress={onBack} fullWidth testID="recovery-back">
        {t('recovery.back')}
      </Btn>
      <Btn
        variant="danger"
        onPress={onFactoryReset}
        loading={factoryResetSubmitting}
        fullWidth
        testID="recovery-factory-reset"
      >
        {t('recovery.factoryReset')}
      </Btn>
    </View>
  );
}

function RecoveryPasswordSection({ form, t }: { form: ReturnType<typeof useRecoveryForm>; t: T }): ReactElement {
  return (
    <>
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.bold} fontSize={16} color={colors.black}>
        {t('recovery.passwordTitle')}
      </Text>
      <PasswordField
        value={form.recoveryPassword} onChange={form.setRecoveryPassword}
        label={t('recovery.password')} testID="recovery-password"
      />
    </>
  );
}

function RecoveryPinFields({ form, t }: { form: ReturnType<typeof useRecoveryForm>; t: T }): ReactElement {
  return (
    <>
      <Input type="number" value={form.newPin} onChange={(v) => form.setNewPin(v.slice(0, 6))}
        label={t('recovery.newPin')} testID="recovery-new-pin" placeholder="000000" />
      <Input type="number" value={form.confirmPin} onChange={(v) => form.setConfirmPin(v.slice(0, 6))}
        label={t('recovery.confirmPin')} testID="recovery-confirm-pin" placeholder="000000" />
      {form.mismatch && <Text fontSize={12} color={colors.red}>{t('changePin.mismatch')}</Text>}
    </>
  );
}

function RecoveryFormCard({ props, form, t }: {
  props: RecoveryScreenProps; form: ReturnType<typeof useRecoveryForm>; t: T;
}): ReactElement {
  return (
    <View width="100%" maxWidth={320} gap={12}>
      <RecoveryPasswordSection form={form} t={t} />
      <RecoveryPinFields form={form} t={t} />
      {props.error && <Text fontSize={12} color={colors.red}>{props.error}</Text>}
      <Btn variant="dark" onPress={() => props.onRecoverWithPassword(form.recoveryPassword, form.newPin)}
        fullWidth disabled={!form.valid} loading={props.submitting} testID="recovery-submit">
        {t('recovery.submit')}
      </Btn>
      {props.maskedEmail && (
        <View marginTop={16}>
          <Text fontFamily={typography.fontFamily} fontSize={13} color={colors.gray600} textAlign="center">
            {t('recovery.emailHint', { email: props.maskedEmail })}
          </Text>
        </View>
      )}
      <RecoveryActions onBack={props.onBack} onFactoryReset={props.onFactoryReset}
        factoryResetSubmitting={props.factoryResetSubmitting} t={t} />
    </View>
  );
}

export function RecoveryScreen(props: RecoveryScreenProps): ReactElement {
  const { t } = useTranslation();
  const form = useRecoveryForm();
  return (
    <FloatingCoinsBackground testID={props.testID ?? 'recovery-screen'}>
      <View flex={1} alignItems="center" justifyContent="center" padding={24} gap={16}>
        <SafeAreaSpacer />
        <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.black} fontSize={28} color={colors.black}>
          {t('recovery.title')}
        </Text>
        <RecoveryFormCard props={props} form={form} t={t} />
      </View>
    </FloatingCoinsBackground>
  );
}
