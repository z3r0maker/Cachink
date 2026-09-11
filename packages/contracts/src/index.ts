/**
 * `@xangarro/contracts` — the frozen interface between the phone (Track A)
 * and the cloud (Track B). Spec: docs/plan/02-contracts.md. Each C-task adds
 * one module here; nothing in this package may import React, SQLite, or a
 * transport.
 */

export * from './errors.js';
