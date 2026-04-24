/**
 * Drizzle SQLite schema for Cachink — one file per Phase 1 entity from
 * CLAUDE.md §9. Each table mirrors its Zod schema in
 * `@cachink/domain/entities` 1:1; the Zod schemas remain the canonical
 * source and validate every write at the app layer.
 *
 * SQLite-specific notes:
 *   - `*_centavos` columns use `numeric(..., { mode: 'bigint' })` so the
 *     CLAUDE.md §2 principle 8 (no floats for money) holds end-to-end.
 *     Drizzle 0.45 exposes bigint-mode only on numeric columns for SQLite.
 *   - Drizzle `text(..., { enum: [...] })` enforces enum membership only at
 *     the TypeScript level; runtime enforcement lives in the Zod schemas.
 *   - `activo` on `recurring_expenses` uses `{ mode: 'boolean' }` to map
 *     `0/1` SQLite INTEGER ↔ TS `boolean` automatically.
 *
 * Imports here use no `.js` extension so Drizzle Kit's CJS loader can
 * resolve them; the rest of the codebase uses NodeNext-style `.js`
 * imports resolved by the Bundler moduleResolution setting.
 */

export * from './_audit';
export * from './businesses';
export * from './app-config';
export * from './sales';
export * from './expenses';
export * from './products';
export * from './inventory-movements';
export * from './employees';
export * from './clients';
export * from './client-payments';
export * from './day-closes';
export * from './recurring-expenses';
