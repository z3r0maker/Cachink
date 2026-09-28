/**
 * Chip — El Mostrador's filter and radio chip (docs/design/el-mostrador.md
 * §2; the caja's `mostrador.css.ts` `chip`): a white pill with the quiet
 * edge that turns black with yellow text when chosen. **Never yellow-filled**:
 * yellow on a chip reads as a button (CLAUDE.md §7).
 *
 * 44 px tall, so the pill itself is the target. `marked` gives the unchosen
 * chip a black edge, as the cancel dialog's motivos have.
 */
import type { ReactElement } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { Text } from '@tamagui/core';
import {
  borderColors,
  borderWidths,
  colors,
  portalFontSizes,
  shadows,
  shapeRadii,
  typography,
} from '../../theme';
import { impactLight } from '../../haptics/index';

export interface ChipProps {
  readonly label: string;
  readonly selected: boolean;
  readonly onPress: () => void;
  /** `radio` inside a single-choice group (the default), `checkbox` for filters that stack. */
  readonly role?: 'radio' | 'checkbox';
  /** A black edge while unchosen (the cancel dialog's motivos). */
  readonly marked?: boolean;
  readonly disabled?: boolean;
  readonly testID?: string;
}

function chipStyle(p: ChipProps, pressed: boolean): ViewStyle {
  const edge = p.selected || p.marked === true;
  return {
    minHeight: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: shapeRadii.pill,
    borderWidth: edge ? borderWidths.thin : borderWidths.quiet,
    borderColor: edge ? colors.black : borderColors.quiet,
    backgroundColor: p.selected ? colors.black : colors.white,
    opacity: p.disabled === true ? 0.5 : 1,
    ...(pressed
      ? { transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: shadows.pressed }
      : null),
  };
}

export function Chip(props: ChipProps): ReactElement {
  const role = props.role ?? 'radio';
  return (
    <Pressable
      testID={props.testID}
      role={role}
      aria-checked={props.selected}
      aria-disabled={props.disabled === true}
      aria-label={props.label}
      disabled={props.disabled}
      onPress={() => {
        impactLight();
        props.onPress();
      }}
      style={({ pressed }) => chipStyle(props, pressed)}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.extraBold}
        fontSize={portalFontSizes.md}
        color={props.selected ? colors.yellow : colors.black}
        numberOfLines={1}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}
