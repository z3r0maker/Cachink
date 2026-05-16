/**
 * Numpad — 3×4 grid of big tappable buttons for POS cash entry.
 *
 * Designed for one-handed operation by standing operators. Each button
 * is a large Pressable with haptic feedback. The grid is:
 *   1  2  3
 *   4  5  6
 *   7  8  9
 *   .  0  ⌫
 *
 * Reused across checkout efectivo, caja deposit/withdraw, and
 * potentially future quantity input screens.
 */

import type { ReactElement } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { Text, View } from '@tamagui/core';
import { colors, radii, typography } from '../../theme';
import { impactLight } from '../../haptics/index';

export interface NumpadProps {
  /** Called when a digit, '.', or backspace is pressed. */
  readonly onPress: (key: NumpadKey) => void;
  /** Whether decimal point is allowed. Default true. */
  readonly allowDecimal?: boolean;
  /** Button size in px. Defaults to 72 (tablet). Pass 56 for phones. */
  readonly buttonSize?: number;
  readonly testID?: string;
}

export type NumpadKey =
  | '0' | '1' | '2' | '3' | '4' | '5'
  | '6' | '7' | '8' | '9' | '.' | 'backspace';

const ROWS: readonly (readonly NumpadKey[])[] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'backspace'],
] as const;

function keyLabel(key: NumpadKey): string {
  if (key === 'backspace') return '⌫';
  return key;
}

export function Numpad(props: NumpadProps): ReactElement {
  const allowDecimal = props.allowDecimal ?? true;
  const size = props.buttonSize ?? 72;

  return (
    <View
      gap={8}
      alignItems="center"
      testID={props.testID ?? 'numpad'}
    >
      {ROWS.map((row, ri) => (
        <View
          key={ri}
          flexDirection="row"
          gap={8}
          justifyContent="center"
        >
          {row.map((key) => {
            const disabled = key === '.' && !allowDecimal;
            return (
              <NumpadButton
                key={key}
                label={keyLabel(key)}
                size={size}
                disabled={disabled}
                onPress={() => {
                  if (!disabled) {
                    impactLight();
                    props.onPress(key);
                  }
                }}
                testID={`numpad-${key}`}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

// --- Sub-component ---

interface NumpadButtonProps {
  readonly label: string;
  readonly size: number;
  readonly disabled?: boolean;
  readonly onPress: () => void;
  readonly testID?: string;
}

function NumpadButton(props: NumpadButtonProps): ReactElement {
  const fontSize = props.size >= 72 ? 28 : 24;
  const baseStyle: ViewStyle = {
    width: props.size,
    height: props.size,
    borderRadius: radii[2],
    borderWidth: 2,
    borderColor: colors.black,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: props.disabled ? 0.3 : 1,
  };

  return (
    <Pressable
      style={({ pressed }) => [
        baseStyle,
        pressed && { backgroundColor: colors.gray100 },
      ]}
      onPress={props.onPress}
      disabled={props.disabled}
      testID={props.testID}
      accessibilityRole="button"
      accessibilityLabel={props.label}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold.toString()}
        fontSize={fontSize}
        color={colors.black}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}
