/**
 * Module-level registry for the active `CloudAuthHandle` (Slice 9.6
 * T14 — password-reset wiring).
 *
 * The shell's `useCloudBridges` produces the handle once via
 * `initCloudAuth`. The `<CloudInnerScreenHost />` overlay (Cloud
 * onboarding sub-screens) needs the same handle to call
 * `resetPassword`, but it lives in a sibling component tree from the
 * gate that consumes `bridges` via props.
 *
 * Rather than threading the handle through React Context (which would
 * require hoisting context provisioning into `<AppProviders>` and
 * coupling the bridges hook to a sibling provider), we publish the
 * handle into a tiny module-level store. `useCloudBridges` calls
 * `setCloudHandle(...)` whenever the lazy `initCloudAuth` resolves;
 * `useCloudAuthHandle()` reads the latest value reactively.
 *
 * Singleton-ish, but the only writer is `useCloudBridges` (singleton
 * inside `<AppProviders>`), so concurrent writes don't happen in
 * practice.
 */

import { useSyncExternalStore } from 'react';
import type { CloudAuthHandle } from './cloud-bridge';

let current: CloudAuthHandle | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): CloudAuthHandle | null {
  return current;
}

/** Called by `useCloudBridges` after `initCloudAuth` resolves. */
export function setCloudHandle(handle: CloudAuthHandle | null): void {
  if (current === handle) return;
  current = handle;
  for (const fn of listeners) fn();
}

/** Reactive read of the active cloud auth handle (or null). */
export function useCloudAuthHandle(): CloudAuthHandle | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
