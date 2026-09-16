/** Recovery form field sub-components. */

import type { ReactElement } from 'react';
import { Text } from '@tamagui/core';
import { PasswordField } from '../../components/index';
import { Input } from '../../components/Input/input';
import { colors, fontSizes, typography } from '../../theme';
import type { useTranslation } from '../../i18n/index';

type T = ReturnType<typeof useTranslation>['t'];

export interface RecoveryFormState {
  recoveryPassword: string;
  setRecoveryPassword: (v: string) => void;
  newPin: string;
  setNewPin: (v: string) => void;
  confirmPin: string;
  setConfirmPin: (v: string) => void;
  mismatch: boolean;
  valid: boolean;
}

export function RecoveryPasswordSection({
  form,
  t,
}: {
  form: RecoveryFormState;
  t: T;
}): ReactElement {
  return (
    <>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.lg}
        color={colors.black}
      >
        {t('recovery.passwordTitle')}
      </Text>
      <PasswordField
        value={form.recoveryPassword}
        onChange={form.setRecoveryPassword}
        label={t('recovery.password')}
        testID="recovery-password"
      />
    </>
  );
}

export function RecoveryPinFields({ form, t }: { form: RecoveryFormState; t: T }): ReactElement {
  return (
    <>
      <Input
        type="number"
        value={form.newPin}
        onChange={(v) => form.setNewPin(v.slice(0, 6))}
        label={t('recovery.newPin')}
        testID="recovery-new-pin"
        placeholder="000000"
      />
      <Input
        type="number"
        value={form.confirmPin}
        onChange={(v) => form.setConfirmPin(v.slice(0, 6))}
        label={t('recovery.confirmPin')}
        testID="recovery-confirm-pin"
        placeholder="000000"
      />
      {form.mismatch && (
        <Text fontSize={fontSizes.xs} color={colors.redText}>
          {t('changePin.mismatch')}
        </Text>
      )}
    </>
  );
}
