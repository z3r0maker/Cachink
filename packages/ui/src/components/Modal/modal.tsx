/**
 * Modal — the Cachink bottom-sheet / centered-dialog primitive.
 *
 * First primitive using the platform-extension pattern from CLAUDE.md §5.3.
 * This file is the source of truth for props and types; platform-specific
 * rendering lives in `./modal.native.tsx` (RN bottom-sheet) and
 * `./modal.web.tsx` (Tauri + web centered dialog). Both platforms export the
 * same `Modal` name and consume this exact props contract.
 *
 * The default `Modal` export here delegates to the web variant so Vite-based
 * tools (Vitest, Storybook, Tauri) resolve correctly without extra config.
 * Metro (mobile) auto-picks `./modal.native.tsx` and never loads this file.
 */
import type { ReactNode } from 'react';

export interface ModalProps {
  /** Whether the modal is visible. Controlled. */
  readonly open: boolean;
  /** Fires when the user dismisses (backdrop tap, ESC, X button). */
  readonly onClose: () => void;
  /** Header title. Optional — some modals only show content. */
  readonly title?: string;
  /** Emoji shown in a yellow-bordered box next to the title. */
  readonly emoji?: string;
  /** Modal body. Forms, lists, anything. */
  readonly children: ReactNode;
  /** Forwarded to the content root so E2E tests can anchor to it. */
  readonly testID?: string;
}

// Default export for Vite/Tauri/Vitest. Metro picks `./modal.native.tsx`.
export { Modal } from './modal.web';
