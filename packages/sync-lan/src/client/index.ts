/**
 * Public client surface for `@cachink/sync-lan/client`.
 *
 * UI-layer consumers (`packages/ui/src/sync/lan-bridge.ts`) import
 * `createLanSyncClient` via a dynamic `import()` so the LAN sync bundle
 * isn't loaded in Local or Cloud modes.
 */

export * from './types.js';
export * from './lan-sync-client.js';
export * from './push-queue.js';
export * from './pull-loop.js';
export * from './ws-subscription.js';
export * from './upsert-lww.js';
