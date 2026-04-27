/**
 * Modal — desktop / web (Tauri) variant.
 *
 * Renders a centered dialog over a tinted backdrop. Built on
 * `@tamagui/dialog`, which provides focus trap, ESC-to-close, ARIA roles,
 * scroll lock, and a portal host for free — we only write the visual
 * shell that expresses the Cachink brand.
 *
 * Vite-based tools (Vitest, Storybook, Tauri) resolve this file via the
 * default import chain `./modal.tsx → ./modal.web.tsx`. Metro ignores it
 * and picks `./modal.native.tsx` on mobile.
 *
 * The centered layout, max-width 480, and all-four-corners 22-radius
 * differ from the mobile bottom-sheet — this is the platform delta the
 * extension pattern from CLAUDE.md §5.3 exists to express.
 */
import type { ReactElement, ReactNode } from 'react';
import { Dialog } from '@tamagui/dialog';
import { colors, radii, shadows } from '../../theme';
import { ModalHeader } from './modal-header';
import type { ModalProps } from './modal';

/** Top of the §8.3 radii scale — matches the mock's 24 intent. */
const MODAL_RADIUS = radii[7]; // 22
/** Universal overlay color — not a brand token, same as every other app's backdrop. */
const BACKDROP = 'rgba(0,0,0,0.5)';

// Inline styles only carry purely-presentational values that don't fight
// Tamagui's defaults. Positioning props are passed as Tamagui props below
// so they're emitted as atomic CSS classes and override Dialog.Content's
// default `position: 'relative'`.
const CONTENT_STYLE = {
  boxShadow: shadows.hero,
  overflowY: 'auto',
} as const;

interface CenteredContentProps {
  readonly testID?: string;
  readonly children: ReactNode;
}

function CenteredContent(props: CenteredContentProps): ReactElement {
  return (
    <Dialog.Content
      testID={props.testID ?? 'modal'}
      key="modal-content"
      backgroundColor={colors.white}
      borderColor={colors.black}
      borderWidth={2.5}
      borderRadius={MODAL_RADIUS}
      padding={24}
      paddingBottom={32}
      width={480}
      maxWidth="92vw"
      maxHeight="86vh"
      // Modern transform-free centering: a fixed-positioned element with
      // inset:0 + margin:auto + an explicit width and content-based height
      // sits in the visual centre of the viewport. Beats the default
      // `position:'relative'` from Dialog.Content because every value here
      // is a Tamagui prop — same specificity layer, last write wins.
      position="fixed"
      top={0}
      right={0}
      bottom={0}
      left={0}
      margin="auto"
      // height auto + bottom:0 would stretch the box; pin it to its content.
      // `height: 'fit-content'` is web-only — that's fine, this file only
      // runs on Vite / Tauri / Storybook (Metro picks `modal.native.tsx`).
      height="fit-content"
      style={CONTENT_STYLE}
    >
      {props.children}
    </Dialog.Content>
  );
}

function Backdrop({ onClose }: { onClose: () => void }): ReactElement {
  return (
    <Dialog.Overlay
      testID="modal-backdrop"
      key="modal-backdrop"
      onPress={onClose}
      backgroundColor={BACKDROP}
      cursor="pointer"
      // Fill the viewport so a click anywhere outside the content dismisses.
      style={{ position: 'fixed', inset: 0 }}
    />
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
        <CenteredContent testID={props.testID}>
          <ModalHeader
            title={props.title}
            subtitle={props.subtitle}
            leftAvatar={props.leftAvatar}
            emoji={props.emoji}
            onClose={props.onClose}
          />
          {props.children}
        </CenteredContent>
      </Dialog.Portal>
    </Dialog>
  );
}
