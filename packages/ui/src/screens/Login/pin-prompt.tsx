/**
 * PinPrompt — inline PIN entry for QuickSwitchScreen.
 *
 * Renders below the user avatar grid when a user is selected.
 * Shows the user's name, a 6-digit PIN field, and a submit button.
 *
 * ADR-049: PIN for daily login.
 */

import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { UserId } from '@cachink/domain';
import { Btn, PinCodeInput } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface PinPromptProps {
  readonly userId: UserId;
  readonly userName: string;
  readonly onSubmit: (pin: string) => void;
  readonly onForgotPin?: () => void;
  readonly error: string | null;
  readonly submitting: boolean;
}

interface PinButtonsProps {
  readonly onSubmit: () => void;
  readonly onForgotPin?: () => void;
  readonly submitting: boolean;
  readonly pinEmpty: boolean;
}

function PinButtons(props: PinButtonsProps): ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <Btn
        variant="dark"
        onPress={props.onSubmit}
        fullWidth
        disabled={props.submitting || props.pinEmpty}
        testID="login-submit"
      >
        {t('login.submit')}
      </Btn>
      {props.onForgotPin !== undefined && (
        <Btn variant="ghost" onPress={props.onForgotPin} fullWidth testID="forgot-pin-link">
          {t('login.forgotPin')}
        </Btn>
      )}
    </>
  );
}

export function PinPrompt(props: PinPromptProps): ReactElement {
  const [pin, setPin] = useState('');
  const handleSubmit = () => (pin.length > 0 ? props.onSubmit(pin) : undefined);
  return (
    <View width="100%" maxWidth={320} gap={12} alignItems="center" testID="pin-prompt">
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={16}
        color={colors.black}
      >
        {props.userName}
      </Text>
      <PinCodeInput
        value={pin}
        onChange={setPin}
        onComplete={props.onSubmit}
        error={props.error !== null}
        testID="pin-input"
      />
      {props.error !== null && (
        <Text fontFamily={typography.fontFamily} fontSize={13} color={colors.red}>
          {props.error}
        </Text>
      )}
      <PinButtons
        onSubmit={handleSubmit}
        onForgotPin={props.onForgotPin}
        submitting={props.submitting}
        pinEmpty={pin.length === 0}
      />
    </View>
  );
}
