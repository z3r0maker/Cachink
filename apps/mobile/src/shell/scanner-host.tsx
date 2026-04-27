/**
 * MobileScannerHost + `openScannerForResult` — mobile-only imperative
 * wrapper around the shared `<Scanner>` component (Slice 9, Phase B1).
 *
 * The LAN pairing flow calls `onOpenScanner(): Promise<string | null>`
 * from the `LanJoinScreen`. On desktop, `BarcodeDetector` is invoked
 * synchronously inside `scanner.web.tsx`; on mobile `expo-camera`
 * renders inside a Modal which means the scan result arrives on a
 * callback, not from a synchronous call.
 *
 * Pattern:
 *   - Module-scoped Zustand store owns the open/closed state + the
 *     pending promise resolver.
 *   - `openScannerForResult()` sets state to open and returns a
 *     promise; the resolver fires when the `<Scanner>` onScan or
 *     onClose callback runs.
 *   - `<MobileScannerHost />` is mounted once (inside AppProviders so
 *     it has access to Tamagui + i18n). It reads the store and renders
 *     `<Scanner>` when open.
 *   - The hook and the host component share state through the store,
 *     not through React context — the hook runs inside AppProviders'
 *     GatedBridges, while the host renders alongside `<Stack/>`. Both
 *     live inside the same provider tree but are siblings, so a
 *     module-level store is the simplest shared channel.
 *
 * App-shell only per CLAUDE.md §5.6 — this file is mobile-specific
 * (it depends on the mobile build of `<Scanner>`, which Metro
 * resolves to `scanner.native.tsx`). It does NOT belong in
 * `packages/ui`.
 */

import { useCallback, type ReactElement } from 'react';
import { create } from 'zustand';
import { Scanner } from '@cachink/ui';

interface ScannerStoreState {
  readonly open: boolean;
  readonly resolver: ((value: string | null) => void) | null;
  readonly setOpen: (value: {
    open: boolean;
    resolver: ((value: string | null) => void) | null;
  }) => void;
}

const useScannerStore = create<ScannerStoreState>((set) => ({
  open: false,
  resolver: null,
  setOpen: (value) => set(value),
}));

/**
 * Opens the mobile Scanner modal and resolves with the first scanned
 * code (or `null` if the user dismissed the modal). Safe to call from
 * inside a React render path (it only fires on event handlers).
 */
export function openScannerForResult(): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    useScannerStore.getState().setOpen({ open: true, resolver: resolve });
  });
}

function resolveAndClose(store: ScannerStoreState, code: string | null): void {
  const r = store.resolver;
  store.setOpen({ open: false, resolver: null });
  r?.(code);
}

/**
 * Mounted once at the mobile shell root (inside <AppProviders>). Reads
 * the scanner store and renders the shared `<Scanner>` when open.
 */
export function MobileScannerHost(): ReactElement {
  const open = useScannerStore((s) => s.open);

  const handleScan = useCallback((code: string) => {
    resolveAndClose(useScannerStore.getState(), code);
  }, []);

  const handleClose = useCallback(() => {
    resolveAndClose(useScannerStore.getState(), null);
  }, []);

  return (
    <Scanner
      open={open}
      onScan={handleScan}
      onClose={handleClose}
      mode="single"
      testID="mobile-lan-scanner"
    />
  );
}
