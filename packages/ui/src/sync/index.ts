/**
 * Public surface for `@cachink/ui/sync`. The LAN + Cloud bridges each
 * lazy-load their respective package — see `lan-bridge.ts` and
 * `cloud-bridge.ts` for the rationale (CLAUDE.md §7 / ADR-029 / ADR-035).
 */

export * from './lan-bridge.js';
export * from './cloud-bridge.js';
export {
  LanSyncContext,
  LanSyncProvider,
  useLanSyncContext,
  type LanSyncContextValue,
  type LanSyncProviderProps,
} from './lan-sync-context.js';
export { useLanBridgeCallbacks, type UseLanBridgeCallbacksResult } from './lan-bridge-callbacks.js';
export { useByoBackend, type UseByoBackendResult } from './use-byo-backend.js';
export { pairWithLanServer, LanPairError, type PairWithLanServerArgs } from './lan-pair.js';
export { useLanHandle } from './use-lan-handle.js';
export { useLanDetails, type LanDetails, type UseLanDetailsArgs } from './use-lan-details.js';
export { useCloudBridges, type UseCloudBridgesArgs } from './use-cloud-bridges.js';
export { useCloudAuthHandle, setCloudHandle } from './cloud-handle-registry.js';
export {
  CloudInnerScreenHost,
  useCloudNavigation,
  type CloudInnerScreen,
  type UseCloudNavigationResult,
} from './cloud-inner-screen-host.js';
