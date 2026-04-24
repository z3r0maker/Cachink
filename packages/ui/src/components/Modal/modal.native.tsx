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
 * border), and `alignSelf="center"` + `flex-end`-anchored overlay
 * differ from the desktop variant — this is the platform delta the
 * extension pattern from CLAUDE.md §5.3 exists to express.
 */
import type { ReactElement, ReactNode } from 'react';
import { Dialog } from '@tamagui/dialog';
import { View } from '@tamagui/core';
import { colors, radii } from '../../theme';
import { ModalHeader } from './modal-header';
import type { ModalProps } from './modal';

/** Top of the §8.3 radii scale — matches the mock's 24 intent. */
const SHEET_RADIUS = radii[7]; // 22
/** Universal overlay color — not a brand token, same as every other app's backdrop. */
const BACKDROP = 'rgba(0,0,0,0.5)';

const SHEET_STYLE = {
  position: 'fixed',
  bottom: 0,
  left: '50%',
  transform: 'translateX(-50%)',
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
      style={{ position: 'fixed', inset: 0 }}
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
      alignSelf="center"
      style={SHEET_STYLE}
    >
      {props.children}
    </Dialog.Content>
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
          <GrabHandle />
          <ModalHeader title={props.title} emoji={props.emoji} onClose={props.onClose} />
          {props.children}
        </SheetContent>
      </Dialog.Portal>
    </Dialog>
  );
}
