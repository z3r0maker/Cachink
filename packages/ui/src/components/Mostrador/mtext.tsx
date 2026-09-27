/**
 * The small vocabulary every El Mostrador surface on the phone repeats:
 *
 * - `MText`: Plus Jakarta Sans on the portal type scale, black and bold
 *   unless told otherwise (`size` is a `portalFontSizes` key).
 * - `InicialesBadge`: a person's initials in a yellow circle with the black
 *   edge (the turno card, the lock screen, the rail).
 * - `GlyphSquare`: a 44 px pressable square with the thin black edge around
 *   one glyph («Bloquear la caja»).
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { Text, View, type GetProps } from '@tamagui/core';
import {
  borderWidths,
  colors,
  portalFontSizes,
  radii,
  shapeRadii,
  typography,
  type PortalFontSize,
} from '../../theme';
import { PathIcon } from '../PathIcon/path-icon';

type Weight = keyof typeof typography.weights;

export type MTextProps = Omit<GetProps<typeof Text>, 'fontSize' | 'fontWeight'> & {
  readonly size?: keyof typeof portalFontSizes;
  readonly weight?: Weight;
};

export function MText({ size = 'md', weight = 'bold', color, ...rest }: MTextProps): ReactElement {
  const fontSize: PortalFontSize = portalFontSizes[size];
  return (
    <Text
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights[weight]}
      fontSize={fontSize}
      color={color ?? colors.black}
      {...rest}
    />
  );
}

export function InicialesBadge(props: {
  readonly iniciales: string;
  /** Edge length in px: 34 (sidebar), 36 (lock screen), 40 (rail). */
  readonly size: number;
  readonly label?: string;
}): ReactElement {
  return (
    <View
      width={props.size}
      height={props.size}
      alignItems="center"
      justifyContent="center"
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.yellow}
      aria-label={props.label}
    >
      <MText size="sm" weight="extraBold">
        {props.iniciales}
      </MText>
    </View>
  );
}

export function GlyphSquare(props: {
  readonly d: string;
  readonly label: string;
  readonly onPress: () => void;
  readonly testID: string;
}): ReactElement {
  return (
    <Pressable
      testID={props.testID}
      role="button"
      aria-label={props.label}
      onPress={props.onPress}
      style={{
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radii[2],
        borderWidth: borderWidths.thin,
        borderColor: colors.black,
        backgroundColor: colors.white,
      }}
    >
      <PathIcon d={props.d} size={18} strokeWidth={2.4} />
    </Pressable>
  );
}
