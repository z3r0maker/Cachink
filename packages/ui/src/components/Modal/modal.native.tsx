/**
 * Modal — mobile (React Native) variant.
 *
 * Renders a bottom-sheet anchored to the bottom edge of the screen with
 * a small grab handle on top — matches the mock's `Modal` layout almost
 * exactly (mock `cachink-v3.jsx` line 104). Built on `@tamagui/dialog`,
 * the same primitive the web variant uses, so focus trap, ESC handling,
 * ARIA roles, and portal wiring come for free.
 *
 * Metro auto-picks this file on mobile via React Native's `.native.tsx`
 * resolution. Vite-based tools resolve `./modal.tsx → ./modal.web.tsx`
 * and never load this file.
 *
 * The top-corners-only radius, 2.5-px black top/side borders (no bottom
 * border), and bottom-anchored / `marginHorizontal:auto`-centered sheet
 * differ from the desktop variant — this is the platform delta the
 * extension pattern from CLAUDE.md §5.3 exists to express.
 *
 * ## Audit M-1 PR 3 fixes
 *
 * - `position: 'fixed'` was passed to Tamagui's Dialog.Content style
 *   prop, which is invalid on React Native (RN only accepts
 *   `'absolute'` or `'relative'`). On web the value resolved correctly
 *   (every test target except RN-on-device); on iOS / Android it was
 *   silently dropped, leaving the sheet to render in the document
 *   flow. Replaced with `position: 'absolute'` — same screen-edge
 *   anchoring inside the Dialog.Portal mount. Closes audit Blocker
 *   1.10.
 * - The sheet lifts itself by the soft keyboard's height
 *   (`useKeyboardHeight`) so the keyboard doesn't cover the input the user
 *   is typing into (audit Blocker 1.9, every Modal call site). A
 *   `<KeyboardAvoidingView>` did this first but mis-measured inside the
 *   absolutely positioned portal sheet on iPad, leaving the whole sheet
 *   under the keyboard (A-16).
 */
import type { ReactElement, ReactNode } from 'react';
import { FlatList, Keyboard, View as RNView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dialog } from '@tamagui/dialog';
import { View } from '@tamagui/core';
import { colors, radii, shapeRadii } from '../../theme';
import { ModalHeader } from './modal-header';
import { useKeyboardHeight } from '../../hooks/use-keyboard-height';
import type { ModalProps } from './modal';

/** Top of the §8.3 radii scale — matches the mock's 24 intent. */
const SHEET_RADIUS = radii[7]; // 22
/** Universal overlay color — not a brand token, same as every other app's backdrop. */
const BACKDROP = colors.scrim;

// As above, only non-positional presentational values stay in `style`.
const SHEET_STYLE = {
  overflowY: 'auto',
} as const;

function GrabHandle(): ReactElement {
  return (
    <View
      testID="modal-grab-handle"
      width={48}
      height={4}
      backgroundColor={colors.gray200}
      borderRadius={shapeRadii.markLg}
      alignSelf="center"
      marginBottom={12}
    />
  );
}

function Backdrop({ onClose }: { onClose: () => void }): ReactElement {
  return (
    <Dialog.Overlay
      testID="modal-backdrop"
      key="modal-backdrop"
      onPress={onClose}
      backgroundColor={BACKDROP}
      // Anchor the content to the bottom edge — the bottom-sheet layout.
      justifyContent="flex-end"
      // `position: 'absolute'` (was `'fixed'` — RN doesn't accept that
      // value and silently dropped it on iOS/Android). The Dialog.Portal
      // mounts at the root so 'absolute' produces the same full-screen
      // overlay on RN as 'fixed' does on web.
      style={{ position: 'absolute', inset: 0 }}
    />
  );
}

interface SheetContentProps {
  readonly testID?: string;
  readonly children: ReactNode;
  readonly paddingBottom: number;
  /** Lifts the sheet above the soft keyboard. */
  readonly bottom: number;
  /** Tallest the sheet may be (the space above the keyboard when it is up). */
  readonly maxHeight: number | `${number}%`;
}

function SheetContent(props: SheetContentProps): ReactElement {
  return (
    <Dialog.Content
      testID={props.testID ?? 'modal'}
      key="modal-content"
      backgroundColor={colors.white}
      borderColor={colors.black}
      borderTopWidth={2.5}
      borderLeftWidth={2.5}
      borderRightWidth={2.5}
      borderTopLeftRadius={SHEET_RADIUS}
      borderTopRightRadius={SHEET_RADIUS}
      paddingTop={20}
      paddingHorizontal={20}
      paddingBottom={props.paddingBottom}
      width="100%"
      // Bottom-anchored full-width sheet on mobile. No maxWidth —
      // phones should always use the full width. No marginHorizontal
      // auto — RN doesn't centre absolute children with auto margins
      // (they default to 0, causing left-alignment). maxHeight uses
      // a percentage string instead of 'vh' which RN ignores.
      maxHeight={props.maxHeight}
      position="absolute"
      bottom={props.bottom}
      left={0}
      right={0}
      style={SHEET_STYLE}
    >
      {props.children}
    </Dialog.Content>
  );
}

/**
 * Sheet body: a tap no control claims hides the keyboard. Without it the only
 * way to hide the keyboard is a tap outside the sheet, which closes the sheet
 * and drops what the user typed. Plain responder props, not a Touchable
 * wrapper, so children keep their own accessibility elements.
 */
function DismissKeyboardOnTap({ children }: { children: ReactNode }): ReactElement {
  return (
    <RNView
      style={{ width: '100%', flexShrink: 1 }}
      onStartShouldSetResponder={() => true}
      onResponderRelease={() => Keyboard.dismiss()}
    >
      {children}
    </RNView>
  );
}

/** Rows for the body list: none — the content renders as the list header. */
const NO_ROWS: readonly never[] = [];

/**
 * Scrollable sheet body. A FlatList with the content as its header, not a
 * ScrollView: sheet content includes VirtualizedList-backed controls (the
 * react-native-wheely wheels), and nesting those in a plain ScrollView breaks
 * their windowing and raises a LogBox error that covers the screen.
 */
function SheetBody({ children }: { children: ReactNode }): ReactElement {
  return (
    <FlatList
      testID="modal-scroll"
      style={{ flexShrink: 1 }}
      data={NO_ROWS}
      renderItem={null}
      ListHeaderComponent={<>{children}</>}
      keyboardShouldPersistTaps="handled"
    />
  );
}

/**
 * Where the sheet sits. With the keyboard up it rests on the keyboard (no
 * home-indicator inset) and may only use the space above it; the body scrolls
 * so the header stays in view.
 */
function useSheetLayout(): {
  bottom: number;
  paddingBottom: number;
  maxHeight: number | `${number}%`;
} {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const keyboardHeight = useKeyboardHeight();
  if (keyboardHeight === 0) {
    return { bottom: 0, paddingBottom: Math.max(36, insets.bottom + 16), maxHeight: '90%' };
  }
  return {
    bottom: keyboardHeight,
    paddingBottom: 20,
    maxHeight: height - keyboardHeight - insets.top - 8,
  };
}

export function Modal(props: ModalProps): ReactElement {
  const layout = useSheetLayout();
  return (
    <Dialog
      modal
      open={props.open}
      onOpenChange={(next) => {
        if (!next) props.onClose();
      }}
    >
      <Dialog.Portal>
        <Backdrop onClose={props.onClose} />
        <SheetContent
          testID={props.testID}
          paddingBottom={layout.paddingBottom}
          bottom={layout.bottom}
          maxHeight={layout.maxHeight}
        >
          <DismissKeyboardOnTap>
            <GrabHandle />
            <ModalHeader
              title={props.title}
              subtitle={props.subtitle}
              leftAvatar={props.leftAvatar}
              emoji={props.emoji}
              onClose={props.onClose}
            />
            <SheetBody>{props.children}</SheetBody>
          </DismissKeyboardOnTap>
        </SheetContent>
      </Dialog.Portal>
    </Dialog>
  );
}
