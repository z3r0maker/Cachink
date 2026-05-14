/**
 * PinCodeInput — OTP-style 6-digit masked PIN entry.
 *
 * Uses the hidden-input pattern: one invisible TamaguiInput captures
 * keystrokes, six visual View boxes render masked dots (●).
 * Auto-fires onComplete when all 6 digits are entered.
 *
 * Neobrutalist styling: 2px solid black borders, 12px radius, hard
 * focus ring (2.5px). Red borders when `error` is set.
 */

import { useRef, useEffect, type ReactElement } from 'react';
import { View, Text } from '@tamagui/core';
import { Input as TamaguiInput } from '@tamagui/input';
import { colors, radii, typography } from '../../theme';

export interface PinCodeInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** Fires when all 6 digits are entered. */
  readonly onComplete?: (pin: string) => void;
  /** Red border on all boxes when set. */
  readonly error?: boolean;
  readonly testID?: string;
}

const PIN_LENGTH = 6;
const BOX_SIZE = 44;
const BOX_HEIGHT = 48;
const BOX_GAP = 8;
const BORDER_WIDTH = 2;
const BORDER_WIDTH_ACTIVE = 2.5;
const DOT_FONT_SIZE = 24;
const BOX_RADIUS = radii[2]; // 12

/** Strip non-digits and clamp to PIN_LENGTH characters. */
function sanitize(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, PIN_LENGTH);
}

/** Determine which box is "active" (cursor position). */
function activeIndex(valueLength: number): number {
  return Math.min(valueLength, PIN_LENGTH - 1);
}

function DigitBox(props: {
  readonly filled: boolean;
  readonly active: boolean;
  readonly error: boolean;
}): ReactElement {
  const borderColor = props.error ? colors.red : colors.black;
  const borderWidth = props.active && !props.error ? BORDER_WIDTH_ACTIVE : BORDER_WIDTH;

  return (
    <View
      width={BOX_SIZE}
      height={BOX_HEIGHT}
      borderColor={borderColor}
      borderWidth={borderWidth}
      borderRadius={BOX_RADIUS}
      backgroundColor={colors.white}
      alignItems="center"
      justifyContent="center"
      borderStyle="solid"
    >
      {props.filled && (
        <Text
          fontSize={DOT_FONT_SIZE}
          color={colors.black}
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          lineHeight={DOT_FONT_SIZE}
        >
          ●
        </Text>
      )}
    </View>
  );
}

export function PinCodeInput(props: PinCodeInputProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasError = props.error === true;
  const cursorIndex = activeIndex(props.value.length);

  const handleChange = (raw: string): void => {
    const clean = sanitize(raw);
    props.onChange(clean);
  };

  useEffect(() => {
    if (props.value.length === PIN_LENGTH) {
      props.onComplete?.(props.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire only when value changes
  }, [props.value]);

  const focusInput = (): void => {
    inputRef.current?.focus();
  };

  return (
    <View testID={props.testID} onPress={focusInput}>
      {/* Hidden input — captures all keystrokes */}
      <TamaguiInput
        ref={inputRef as never}
        value={props.value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={PIN_LENGTH}
        autoFocus
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

      {/* Visual boxes */}
      <View flexDirection="row" gap={BOX_GAP} justifyContent="center">
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <DigitBox
            key={i}
            filled={i < props.value.length}
            active={i === cursorIndex}
            error={hasError}
          />
        ))}
      </View>
    </View>
  );
}
