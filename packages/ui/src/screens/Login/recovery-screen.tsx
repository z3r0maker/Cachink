/** RecoveryScreen — 3-layer PIN recovery (ADR-049). */

import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { UserId } from '@cachink/domain';
import { Btn, FloatingCoinsBackground, SafeAreaSpacer } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';
import {
  RecoveryPasswordSection,
  RecoveryPinFields,
  type RecoveryFormState,
} from './recovery-form-fields';

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

function useRecoveryForm(): RecoveryFormState {
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

function RecoveryActions(props: {
  onBack: () => void;
  onFactoryReset: () => void;
  factoryResetSubmitting?: boolean;
  t: T;
}): ReactElement {
  return (
    <View marginTop={24} gap={8}>
      <Btn variant="ghost" onPress={props.onBack} fullWidth testID="recovery-back">
        {props.t('recovery.back')}
      </Btn>
      <Btn
        variant="danger"
        onPress={props.onFactoryReset}
        loading={props.factoryResetSubmitting}
        fullWidth
        testID="recovery-factory-reset"
      >
        {props.t('recovery.factoryReset')}
      </Btn>
    </View>
  );
}

function EmailHint({ email, t }: { email: string; t: T }): ReactElement {
  return (
    <View marginTop={16}>
      <Text
        fontFamily={typography.fontFamily}
        fontSize={fontSizes.sm}
        color={colors.gray600}
        textAlign="center"
      >
        {t('recovery.emailHint', { email })}
      </Text>
    </View>
  );
}

function SubmitButton(props: {
  onPress: () => void;
  valid: boolean;
  submitting: boolean;
  t: T;
}): ReactElement {
  return (
    <Btn
      variant="dark"
      onPress={props.onPress}
      fullWidth
      disabled={!props.valid}
      loading={props.submitting}
      testID="recovery-submit"
    >
      {props.t('recovery.submit')}
    </Btn>
  );
}

function RecoveryFormCard(props: {
  screenProps: RecoveryScreenProps;
  form: RecoveryFormState;
  t: T;
}): ReactElement {
  const { screenProps, form, t } = props;
  const handleSubmit = () => screenProps.onRecoverWithPassword(form.recoveryPassword, form.newPin);
  return (
    <View width="100%" maxWidth={320} gap={12}>
      <RecoveryPasswordSection form={form} t={t} />
      <RecoveryPinFields form={form} t={t} />
      {screenProps.error && (
        <Text fontSize={fontSizes.xs} color={colors.redText}>
          {screenProps.error}
        </Text>
      )}
      <SubmitButton
        onPress={handleSubmit}
        valid={form.valid}
        submitting={screenProps.submitting}
        t={t}
      />
      {screenProps.maskedEmail && <EmailHint email={screenProps.maskedEmail} t={t} />}
      <RecoveryActions
        onBack={screenProps.onBack}
        onFactoryReset={screenProps.onFactoryReset}
        factoryResetSubmitting={screenProps.factoryResetSubmitting}
        t={t}
      />
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
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={fontSizes.xl4}
          color={colors.black}
        >
          {t('recovery.title')}
        </Text>
        <RecoveryFormCard screenProps={props} form={form} t={t} />
      </View>
    </FloatingCoinsBackground>
  );
}
