/**
 * Scanner — shared contract for the platform-extension barcode scanner
 * (ADR-022). This file is the source of truth for props + types;
 * platform-specific rendering lives in `./scanner.native.tsx` (mobile,
 * expo-camera) and `./scanner.web.tsx` (desktop, BarcodeDetector).
 *
 * Per CLAUDE.md §5.3 the default export delegates to the web variant
 * so Vite-based tools (Vitest, Storybook, Tauri) resolve correctly
 * without extra config. Metro picks `./scanner.native.tsx` on mobile.
 */

import type { ReactNode } from 'react';

export type BarcodeMode = 'single' | 'continuous';

export interface ScannerProps {
  /** Controlled open state. */
  readonly open: boolean;
  /** Fires on dismiss (backdrop, Escape, Close Btn). */
  readonly onClose: () => void;
  /** Fires once per detected barcode code. */
  readonly onScan: (code: string) => void;
  /**
   * `single` closes after the first scan; `continuous` keeps the
   * scanner open. Inventario flows use `single`. Defaults to `single`.
   */
  readonly mode?: BarcodeMode;
  /**
   * Optional content rendered above the scanner view — a hint, a
   * "type manually" Btn, etc.
   */
  readonly header?: ReactNode;
  /** Forwarded to the root View so E2E tests can anchor to it. */
  readonly testID?: string;
}

// Default export for Vite/Tauri/Vitest. Metro picks `./scanner.native.tsx`.
export { Scanner } from './scanner.web';
