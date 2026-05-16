/**
 * PinCodeInput — OTP-style 6-digit masked PIN entry.
 *
 * Two modes: hidden-input (system keyboard) or inline numpad (`useNumpad`).
 * Error feedback: shake animation + notificationError haptic.
 */

import { useRef, useEffect, forwardRef, type ReactElement } from 'react';
import { Animated } from 'react-native';
import { View } from '@tamagui/core';
import { Input as TamaguiInput } from '@tamagui/input';
import { impactLight, notificationError } from '../../haptics/index';
import { Numpad } from '../Numpad/index';
import { DigitBox } from './digit-box';
import { useShakeAnimation } from './use-shake-animation';

export interface PinCodeInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onComplete?: (pin: string) => void;
  readonly error?: boolean;
  readonly disabled?: boolean;
  /** Use inline numpad instead of system keyboard. Default false. */
  readonly useNumpad?: boolean;
  readonly testID?: string;
}

const PIN_LENGTH = 6;
const BOX_GAP = 8;
const FOCUS_DELAY_MS = 100;
const DISABLED_OPACITY = 0.6;

function sanitize(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, PIN_LENGTH);
}

function activeIndex(len: number): number {
  return Math.min(len, PIN_LENGTH - 1);
}

/** Emit haptic + fire onChange/onComplete for a new digit value. */
function commitValue(
  next: string,
  prev: string,
  onChange: (v: string) => void,
  onComplete?: (pin: string) => void,
): void {
  if (next.length > prev.length) impactLight();
  onChange(next);
  if (next.length === PIN_LENGTH) onComplete?.(next);
}

function useErrorShake(hasError: boolean): Animated.Value {
  const { translateX, triggerShake } = useShakeAnimation();
  useEffect(() => {
    if (hasError) { triggerShake(); notificationError(); }
  }, [hasError, triggerShake]);
  return translateX;
}

function useAutoFocus(
  ref: React.RefObject<HTMLInputElement | null>,
  disabled: boolean,
  numpad: boolean,
): void {
  useEffect(() => {
    if (disabled || numpad) return;
    const t = setTimeout(() => ref.current?.focus(), FOCUS_DELAY_MS);
    return () => clearTimeout(t);
  }, [ref, disabled, numpad]);
}

export function PinCodeInput(props: PinCodeInputProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const off = props.disabled === true;
  const numpad = props.useNumpad === true;
  const shakeX = useErrorShake(props.error === true);

  useAutoFocus(inputRef, off, numpad);

  const handleChange = (raw: string): void => {
    if (off) return;
    commitValue(sanitize(raw), props.value, props.onChange, props.onComplete);
  };

  const handleNumpad = (key: string): void => {
    if (off) return;
    if (key === 'backspace') { props.onChange(props.value.slice(0, -1)); return; }
    if (key !== '.') commitValue(sanitize(props.value + key), props.value, props.onChange, props.onComplete);
  };

  return (
    <View testID={props.testID} onPress={() => !off && !numpad && inputRef.current?.focus()} opacity={off ? DISABLED_OPACITY : 1} gap={16}>
      {!numpad && <HiddenInput ref={inputRef} value={props.value} onChangeText={handleChange} disabled={off} testID={props.testID} />}
      <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
        <DigitBoxRow value={props.value} disabled={off} error={props.error === true} />
      </Animated.View>
      {numpad && <NumpadSection disabled={off} onPress={handleNumpad} />}
    </View>
  );
}

// --- Small extracted sub-components ---

function DigitBoxRow({ value, disabled, error }: { value: string; disabled: boolean; error: boolean }): ReactElement {
  const cursor = activeIndex(value.length);
  return (
    <View flexDirection="row" gap={BOX_GAP} justifyContent="center">
      {Array.from({ length: PIN_LENGTH }, (_, i) => (
        <DigitBox key={i} filled={i < value.length} active={!disabled && i === cursor} error={error} />
      ))}
    </View>
  );
}

function NumpadSection({ disabled, onPress }: { disabled: boolean; onPress: (k: string) => void }): ReactElement {
  return (
    <View opacity={disabled ? DISABLED_OPACITY : 1} pointerEvents={disabled ? 'none' : 'auto'}>
      <Numpad onPress={onPress} allowDecimal={false} testID="pin-numpad" />
    </View>
  );
}

const HiddenInput = forwardRef<HTMLInputElement, { value: string; onChangeText: (r: string) => void; disabled: boolean; testID?: string }>(
  function HiddenInput(props, ref) {
    return (
      <TamaguiInput
        ref={ref as never}
        value={props.value}
        onChangeText={props.onChangeText}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={PIN_LENGTH}
        autoFocus={!props.disabled}
        pointerEvents={props.disabled ? 'none' : 'auto'}
        testID={props.testID ? `${props.testID}-field` : 'pin-input-field'}
        caretHidden
        position="absolute"
        opacity={0.01}
        width={1}
        height={1}
        borderWidth={0}
        padding={0}
        aria-hidden
      />
    );
  },
);
