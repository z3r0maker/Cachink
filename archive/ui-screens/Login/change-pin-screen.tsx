/**
 * ChangePinScreen — forced PIN change on first login.
 *
 * Shown when `mustChangePin: true` after login. The user must
 * set a new 6-digit PIN before they can use the app.
 *
 * ADR-049: PIN for daily login.
 */

import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn } from '../../components/index';
import { Input } from '../../components/Input/input';
import { FloatingCoinsBackground, SafeAreaSpacer } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';

export interface ChangePinScreenProps {
  readonly userName: string;
  readonly onSubmit: (currentPin: string, newPin: string) => void;
  readonly error: string | null;
  readonly submitting: boolean;
  readonly testID?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

function ValidationHint(props: {
  readonly show: boolean;
  readonly text: string;
}): ReactElement | null {
  if (!props.show) return null;
  return (
    <Text fontFamily={typography.fontFamily} fontSize={fontSizes.xs} color={colors.redText}>
      {props.text}
    </Text>
  );
}

function ChangePinHeader({ t, userName }: { t: T; userName: string }): ReactElement {
  return (
    <>
      <SafeAreaSpacer />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={fontSizes.xl4}
        color={colors.black}
      >
        {t('changePin.title')}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontSize={fontSizes.md}
        color={colors.gray600}
        textAlign="center"
        maxWidth={320}
      >
        {t('changePin.subtitle', { name: userName })}
      </Text>
    </>
  );
}

interface ChangePinFieldsProps {
  current: string;
  setCurrent: (v: string) => void;
  newPin: string;
  setNewPin: (v: string) => void;
  confirm: string;
  setConfirm: (v: string) => void;
  mismatch: boolean;
  tooShort: boolean;
  error: string | null;
  t: T;
}

function ChangePinFormFields(props: ChangePinFieldsProps): ReactElement {
  return (
    <>
      <Input
        type="number"
        value={props.current}
        onChange={(v) => props.setCurrent(v.slice(0, 6))}
        label={props.t('changePin.current')}
        testID="current-pin"
      />
      <Input
        type="number"
        value={props.newPin}
        onChange={(v) => props.setNewPin(v.slice(0, 6))}
        label={props.t('changePin.newPin')}
        testID="new-pin"
      />
      <ValidationHint show={props.tooShort} text={props.t('changePin.tooShort')} />
      <Input
        type="number"
        value={props.confirm}
        onChange={(v) => props.setConfirm(v.slice(0, 6))}
        label={props.t('changePin.confirm')}
        testID="confirm-pin"
      />
      <ValidationHint show={props.mismatch} text={props.t('changePin.mismatch')} />
      {props.error !== null && (
        <Text fontFamily={typography.fontFamily} fontSize={fontSizes.sm} color={colors.redText}>
          {props.error}
        </Text>
      )}
    </>
  );
}

function useChangePinForm(submitting: boolean) {
  const [current, setCurrent] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const mismatch = confirm.length > 0 && newPin !== confirm;
  const tooShort = newPin.length > 0 && !/^\d{6}$/.test(newPin);
  const canSubmit =
    /^\d{6}$/.test(current) && /^\d{6}$/.test(newPin) && newPin === confirm && !submitting;
  return {
    current,
    setCurrent,
    newPin,
    setNewPin,
    confirm,
    setConfirm,
    mismatch,
    tooShort,
    canSubmit,
  };
}

export function ChangePinScreen(props: ChangePinScreenProps): ReactElement {
  const { t } = useTranslation();
  const form = useChangePinForm(props.submitting);
  return (
    <FloatingCoinsBackground testID={props.testID ?? 'change-pin'}>
      <View flex={1} alignItems="center" justifyContent="center" padding={24} gap={16}>
        <ChangePinHeader t={t} userName={props.userName} />
        <View width="100%" maxWidth={320} gap={12}>
          <ChangePinFormFields {...form} error={props.error} t={t} />
          <Btn
            variant="dark"
            onPress={() => props.onSubmit(form.current, form.newPin)}
            fullWidth
            disabled={!form.canSubmit}
            loading={props.submitting}
            testID="change-pin-submit"
          >
            {t('changePin.submit')}
          </Btn>
        </View>
      </View>
    </FloatingCoinsBackground>
  );
}
