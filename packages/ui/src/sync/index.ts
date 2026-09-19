/**
 * Public surface for `@xangarro/ui/sync`: cloud sync state and scheduling
 * (A-07). The LAN bridges were retired in A-18; `packages/sync-lan` stays in
 * the workspace but nothing in the app imports it.
 */

export {
  INITIAL_CLOUD_SYNC_STATE,
  pillView,
  type CloudSyncPhase,
  type CloudSyncState,
  type PillTone,
  type PillView,
} from './cloud-sync-status.js';
export { SyncScheduler, PUSH_DEBOUNCE_MS, PULL_INTERVAL_MS } from './sync-scheduler.js';
