/**
 * The header's left side (the web caja's `headerFor`): on the caja's own
 * screens, which caja this is and whose business; on a detail screen, the
 * way back instead.
 *
 * - `CajaBadge`: the black tile with the yellow register glyph, the caja's
 *   name and the business under it.
 * - `BackButton`: a 44 px chevron with its label («Ventas», «Mi turno»).
 */

import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { ICONS } from '@xangarro/caja';
import { GLYPHS, MText, PathIcon } from '../../components/index';
import { colors, radii } from '../../theme';

const BACK = {
  minHeight: 44,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  paddingRight: 8,
  flexShrink: 1,
} as const;

/** The black tile with the yellow register glyph (header, rail, sidebar). */
export function CajaTile(props: { readonly size: number; readonly glyph: number }): ReactElement {
  return (
    <View
      width={props.size}
      height={props.size}
      borderRadius={props.size > 32 ? radii[1] : radii[0]}
      backgroundColor={colors.black}
      alignItems="center"
      justifyContent="center"
    >
      <PathIcon d={ICONS.caja} size={props.glyph} strokeWidth={2.2} color={colors.yellow} />
    </View>
  );
}

export function CajaBadge(props: {
  readonly caja: string;
  readonly negocio: string | null;
}): ReactElement {
  return (
    <View
      testID="caja-badge"
      flex={1}
      minWidth={0}
      flexDirection="row"
      alignItems="center"
      gap={10}
    >
      <CajaTile size={36} glyph={18} />
      <View flex={1} minWidth={0}>
        <MText testID="caja-badge-nombre" size="body" weight="extraBold" numberOfLines={1}>
          {props.caja}
        </MText>
        {props.negocio ? (
          <MText size="xs" weight="semibold" color={colors.gray600} numberOfLines={1}>
            {props.negocio}
          </MText>
        ) : null}
      </View>
    </View>
  );
}

export function BackButton(props: {
  readonly onPress: () => void;
  readonly label: string;
  /** The accessible name when it says more than the label («Volver a ventas»). */
  readonly ariaLabel?: string;
}): ReactElement {
  return (
    <View flex={1} minWidth={0} flexDirection="row">
      <Pressable
        testID="top-bar-back"
        role="button"
        aria-label={props.ariaLabel ?? props.label}
        onPress={props.onPress}
        style={BACK}
      >
        <PathIcon d={GLYPHS.chevronLeft} size={20} strokeWidth={2.5} />
        <MText size="body" weight="extraBold" numberOfLines={1}>
          {props.label}
        </MText>
      </Pressable>
    </View>
  );
}
