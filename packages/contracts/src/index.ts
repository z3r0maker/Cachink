/**
 * `@xangarro/contracts` — the frozen interface between the phone (Track A)
 * and the cloud (Track B). Spec: docs/plan/02-contracts.md. Each C-task adds
 * one module here; nothing in this package may import React, SQLite, or a
 * transport.
 */

export * from './errors.js';
export * from './transport.js';
export * from './tokens.js';
export * from './scope.js';
export * from './wire.js';
export * from './entitlement.js';
export * from './activate.js';
export * from './sync-push.js';
export * from './sync-pull.js';
