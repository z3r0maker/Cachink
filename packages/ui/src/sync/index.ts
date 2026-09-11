/**
 * Public surface for `@xangarro/ui/sync`. The LAN + Cloud bridges each
 * lazy-load their respective package — see `lan-bridge.ts` and
 * `cloud-bridge.ts` for the rationale (CLAUDE.md §7 / ADR-029 / ADR-035).
 */

export * from './lan-bridge.js';
export {
  LanSyncContext,
  LanSyncProvider,
  useLanSyncContext,
  type LanSyncContextValue,
  type LanSyncProviderProps,
} from './lan-sync-context.js';
export { useLanBridgeCallbacks, type UseLanBridgeCallbacksResult } from './lan-bridge-callbacks.js';
export { pairWithLanServer, LanPairError, type PairWithLanServerArgs } from './lan-pair.js';
export { useLanHandle } from './use-lan-handle.js';
export { useLanDetails, type LanDetails, type UseLanDetailsArgs } from './use-lan-details.js';
