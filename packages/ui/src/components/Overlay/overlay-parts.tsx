/**
 * The parts the bottom sheet and the centred dialog share (El Mostrador §4):
 * the scrim, the 44 px close square and the eyebrow + title head. Internal to
 * `BottomSheet` and `Dialog`; not exported from the package barrel.
 *
 * Both overlays sit on `@tamagui/dialog`, which supplies the focus trap,
 * Escape / Android back, the portal and `role="dialog"` (§4: never hand-roll
 * them).
 */
import type { ReactElement } from 'react';
import { Platform, Pressable } from 'react-native';
import { Dialog } from '@tamagui/dialog';
import { View } from '@tamagui/core';
import {
  borderColors,
  borderWidths,
  colors,
  portalFontSizes,
  radii,
  typography,
} from '../../theme';
import { Eyebrow } from '../Panel/panel';
import { GLYPHS } from '../PathIcon/glyphs';
import { PathIcon } from '../PathIcon/path-icon';

/**
 * The overlay pins to the viewport: `fixed` on the web (the portal is not a
 * positioned box), `absolute` in React Native's full-screen portal host.
 */
export const PINNED = (Platform.OS === 'web' ? 'fixed' : 'absolute') as 'absolute';

export function Scrim(props: {
  readonly onPress: () => void;
  readonly testID: string;
}): ReactElement {
  return (
    <Dialog.Overlay
      key="scrim"
      testID={props.testID}
      onPress={props.onPress}
      backgroundColor={colors.scrim}
      position={PINNED}
      top={0}
      right={0}
      bottom={0}
      left={0}
    />
  );
}

export function CloseSquare(props: {
  readonly onPress: () => void;
  readonly label: string;
  readonly testID: string;
  /** A black edge (a dialog's close); the sheet's is quiet. */
  readonly strong?: boolean;
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
        borderWidth: props.strong === true ? borderWidths.thin : borderWidths.quiet,
        borderColor: props.strong === true ? colors.black : borderColors.quiet,
        backgroundColor: colors.white,
      }}
    >
      <PathIcon d={GLYPHS.close} size={18} strokeWidth={2.4} />
    </Pressable>
  );
}

export interface OverlayHeadProps {
  readonly eyebrow?: string;
  readonly title: string;
  readonly onClose: () => void;
  readonly closeLabel: string;
  readonly testID: string;
  readonly strongClose?: boolean;
}

/** Eyebrow over a 22 px title, the close square on the right. */
export function OverlayHead(props: OverlayHeadProps): ReactElement {
  return (
    <View flexDirection="row" alignItems="flex-start" gap={12}>
      <View flex={1} minWidth={0} gap={2} paddingTop={2}>
        {props.eyebrow ? <Eyebrow>{props.eyebrow}</Eyebrow> : null}
        <Dialog.Title
          unstyled
          testID={`${props.testID}-title`}
          // The font token, not the family string: an unstyled title is an
          // H2 that only takes Tamagui's font tokens.
          fontFamily="$body"
          fontWeight={typography.weights.extraBold}
          fontSize={portalFontSizes.xl2}
          lineHeight={27}
          letterSpacing={-0.5}
          color={colors.black}
        >
          {props.title}
        </Dialog.Title>
      </View>
      <CloseSquare
        onPress={props.onClose}
        label={props.closeLabel}
        testID={`${props.testID}-close`}
        strong={props.strongClose}
      />
    </View>
  );
}
