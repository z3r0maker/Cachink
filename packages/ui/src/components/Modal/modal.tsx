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
  /**
   * Optional muted line beneath the title (e.g. `"24 abr · 10:48"`).
   * Matches the design mocks' transactional-modal subtitle (mock 3,
   * April 2026 review). Renders only when provided.
   */
  readonly subtitle?: string;
  /**
   * Optional ReactNode rendered in the same slot as `emoji`. Use this
   * when a richer element (e.g. `<InitialsAvatar>`) replaces the emoji
   * box — for instance the role-initials avatar in NuevaVenta.
   * Mutually exclusive with `emoji`; if both are passed, `leftAvatar`
   * wins.
   */
  readonly leftAvatar?: ReactNode;
  /**
   * @deprecated Pass `leftAvatar={<InitialsAvatar … />}` or omit the
   * left slot entirely. Kept for back-compat with existing callers
   * (NuevoEgreso, etc.) — will be removed in a follow-up after every
   * call site migrates.
   */
  readonly emoji?: string;
  /** Modal body. Forms, lists, anything. */
  readonly children: ReactNode;
  /** Forwarded to the content root so E2E tests can anchor to it. */
  readonly testID?: string;
}

// Default export for Vite/Tauri/Vitest. Metro picks `./modal.native.tsx`.
export { Modal } from './modal.web';
