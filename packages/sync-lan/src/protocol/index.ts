/**
 * Public surface for the LAN sync wire protocol (ADR-029).
 *
 * Both ends of the sync relationship — the Rust server in
 * `apps/desktop/src-tauri/` and the JS client in
 * `packages/sync-lan/src/client/` — validate every payload against the Zod
 * schemas re-exported here.
 */

export * from './constants.js';
export * from './wire.js';
export * from './codec.js';
