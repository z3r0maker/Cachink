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
 * - Children are now wrapped in `<KeyboardAvoidingView>` so the soft
 *   keyboard doesn't cover the input the user is typing into. Closes
 *   audit Blocker 1.9 across every modal call site (the wrap lives in
 *   the primitive, so every Modal-based form benefits without code
 *   changes).
 */
import type { ReactElement, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { Dialog } from '@tamagui/dialog';
import { View } from '@tamagui/core';
import { colors, radii } from '../../theme';
import { ModalHeader } from './modal-header';
import type { ModalProps } from './modal';

/** Top of the §8.3 radii scale — matches the mock's 24 intent. */
const SHEET_RADIUS = radii[7]; // 22
/** Universal overlay color — not a brand token, same as every other app's backdrop. */
const BACKDROP = 'rgba(0,0,0,0.5)';

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
      borderRadius={4}
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
      paddingBottom={36}
      width="100%"
      maxWidth={480}
      maxHeight="93vh"
      // Bottom-anchored sheet with auto horizontal margins.
      // `position: 'absolute'` on RN — same effect as 'fixed' inside
      // the Portal-mounted root view.
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      marginHorizontal="auto"
      style={SHEET_STYLE}
    >
      {props.children}
    </Dialog.Content>
  );
}

/**
 * `<KeyboardAvoidingView>` shifts the sheet content up when the soft
 * keyboard mounts so the focused input stays visible. iOS and Android
 * handle this differently — `behavior='padding'` is the right answer
 * on iOS (the keyboard slides up under the view, padding pushes the
 * content above it), `behavior='height'` on Android (the OS resizes
 * the window). Both are off the default ('undefined') because the
 * default does nothing.
 */
function KeyboardAware({ children }: { children: ReactNode }): ReactElement {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ width: '100%' }}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

export function Modal(props: ModalProps): ReactElement {
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
        <SheetContent testID={props.testID}>
          <KeyboardAware>
            <GrabHandle />
            <ModalHeader
              title={props.title}
              subtitle={props.subtitle}
              leftAvatar={props.leftAvatar}
              emoji={props.emoji}
              onClose={props.onClose}
            />
            {props.children}
          </KeyboardAware>
        </SheetContent>
      </Dialog.Portal>
    </Dialog>
  );
}
