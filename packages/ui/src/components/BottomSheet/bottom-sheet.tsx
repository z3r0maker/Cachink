/**
 * BottomSheet — where a web side panel lands on the phone (El Mostrador §4,
 * the phone boards' frame rules): the scrim, then a white sheet anchored to
 * the bottom with the top corners rounded and the thick black edge on top and
 * sides, a 40 × 5 grabber, the head (eyebrow, title, 44 px close), a body
 * that scrolls and a footer that stays put with the actions.
 *
 * It slides up in 280 ms and fades instead under Reduce Motion
 * (`useEnterMotion`). Tapping the scrim, the close square, Escape or the
 * Android back button calls `onClose`.
 */
import type { ReactElement, ReactNode } from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dialog } from '@tamagui/dialog';
import { View } from '@tamagui/core';
import { borderColors, borderWidths, colors, radii, shapeRadii } from '../../theme';
import { useTranslation } from '../../i18n/index';
import { useEnterMotion } from '../motion/use-enter-motion';
import { OverlayHead, PINNED, Scrim } from '../Overlay/overlay-parts';

/**
 * The boards draw 24; the ladder tops out at 22 and a new radius goes into
 * `@xangarro/tokens` first (§12), so the sheet takes the top step.
 */
const SHEET_RADIUS = radii[7];

export interface BottomSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly eyebrow?: string;
  readonly children: ReactNode;
  /** The actions, pinned under the scrolling body. */
  readonly footer?: ReactNode;
  /** Overrides «Cerrar» as the close square's accessible name. */
  readonly closeLabel?: string;
  readonly testID?: string;
}

function Grabber(): ReactElement {
  return (
    <View
      testID="bottom-sheet-grabber"
      alignSelf="center"
      width={40}
      height={5}
      marginTop={10}
      marginBottom={6}
      borderRadius={shapeRadii.pill}
      backgroundColor={colors.gray200}
    />
  );
}

function Footer({ children, inset }: { children: ReactNode; inset: number }): ReactElement {
  return (
    <View
      testID="bottom-sheet-footer"
      paddingHorizontal={16}
      paddingTop={12}
      paddingBottom={Math.max(12, inset)}
      borderTopWidth={borderWidths.quiet}
      borderTopColor={borderColors.quiet}
      backgroundColor={colors.white}
    >
      {children}
    </View>
  );
}

const FRAME = {
  maxHeight: '100%',
  backgroundColor: colors.white,
  borderColor: colors.black,
  borderTopWidth: borderWidths.thick,
  borderLeftWidth: borderWidths.thick,
  borderRightWidth: borderWidths.thick,
  borderTopLeftRadius: SHEET_RADIUS,
  borderTopRightRadius: SHEET_RADIUS,
  overflow: 'hidden',
} as const;

function Sheet(props: BottomSheetProps & { readonly id: string }): ReactElement {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const motion = useEnterMotion('slide');
  const hasFooter = props.footer !== undefined && props.footer !== null;
  return (
    <Animated.View style={[FRAME, motion]}>
      <Grabber />
      <View paddingHorizontal={16} paddingBottom={10}>
        <OverlayHead
          eyebrow={props.eyebrow}
          title={props.title}
          onClose={props.onClose}
          closeLabel={props.closeLabel ?? t('shell.cerrar')}
          testID={props.id}
        />
      </View>
      <ScrollView
        testID={`${props.id}-body`}
        style={{ flexShrink: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: hasFooter ? 16 : Math.max(16, insets.bottom),
        }}
        keyboardShouldPersistTaps="handled"
      >
        {props.children}
      </ScrollView>
      {hasFooter ? <Footer inset={insets.bottom}>{props.footer}</Footer> : null}
    </Animated.View>
  );
}

export function BottomSheet(props: BottomSheetProps): ReactElement {
  const id = props.testID ?? 'bottom-sheet';
  return (
    <Dialog modal open={props.open} onOpenChange={(next) => (next ? undefined : props.onClose())}>
      <Dialog.Portal>
        <Scrim onPress={props.onClose} testID={`${id}-scrim`} />
        <Dialog.Content
          key="sheet"
          unstyled
          testID={id}
          position={PINNED}
          left={0}
          right={0}
          bottom={0}
          maxHeight="92%"
          backgroundColor="transparent"
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Sheet {...props} id={id} />
          </KeyboardAvoidingView>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
