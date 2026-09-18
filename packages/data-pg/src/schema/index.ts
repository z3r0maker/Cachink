/**
 * The cloud schema.
 *
 * Synced tables mirror the device's SQLite schema column-for-column — see
 * `tests/drift.test.ts`. Portal-only tables live in `portal.ts` and never cross
 * the wire (ADR-060).
 */
export * from './_columns';
export * from './tenant';
export * from './catalog';
export * from './ledger';
export * from './caja';
export * from './portal';
export * from './onboarding';
export * from './sync';
export * from './billing';
