/**
 * PinPrompt — inline PIN entry for QuickSwitchScreen.
 *
 * Shows the user's name, a 6-digit PIN field (inline numpad), and
 * action buttons. Uses LoadingOverlay during submission.
 *
 * ADR-049: PIN for daily login.
 */

import { useState, useEffect, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { UserId } from '@cachink/domain';
import { Btn, PinCodeInput, LoadingOverlay } from '../../components/index';
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

/** Hook: manages PIN state + auto-clear on error. */
function usePinState(error: string | null): {
  pin: string;
  setPin: (v: string) => void;
  submitted: boolean;
  markSubmitted: () => void;
} {
  const [pin, setPin] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const markSubmitted = (): void => setSubmitted(true);

  useEffect(() => {
    if (error !== null) { setPin(''); setSubmitted(false); }
  }, [error]);

  return { pin, setPin, submitted, markSubmitted };
}

function PinButtons(props: {
  readonly onSubmit: () => void;
  readonly onForgotPin?: () => void;
  readonly submitting: boolean;
  readonly pinEmpty: boolean;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <Btn variant="dark" onPress={props.onSubmit} fullWidth disabled={props.pinEmpty || props.submitting} loading={props.submitting} testID="login-submit">
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
  const { t } = useTranslation();
  const { pin, setPin, submitted, markSubmitted } = usePinState(props.error);
  const showOverlay = submitted || props.submitting;

  const handleComplete = (p: string): void => { markSubmitted(); props.onSubmit(p); };
  const handleSubmit = (): void => { if (pin.length > 0) handleComplete(pin); };

  return (
    <View width="100%" maxWidth={320} gap={12} alignItems="center" testID="pin-prompt">
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.semibold} fontSize={16} color={colors.black}>
        {props.userName}
      </Text>
      <PinCodeInput value={pin} onChange={setPin} onComplete={handleComplete} error={props.error !== null} disabled={showOverlay} useNumpad testID="pin-input" />
      {props.error !== null && (
        <Text fontFamily={typography.fontFamily} fontSize={13} color={colors.red}>{props.error}</Text>
      )}
      <PinButtons onSubmit={handleSubmit} onForgotPin={props.onForgotPin} submitting={showOverlay} pinEmpty={pin.length === 0} />
      <LoadingOverlay visible={showOverlay} message={t('login.verifying')} testID="pin-loading-overlay" />
    </View>
  );
}
