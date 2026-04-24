/**
 * Drizzle SQLite schema for Cachink — one file per Phase 1 entity from
 * CLAUDE.md §9. Each table mirrors its Zod schema in
 * `@cachink/domain/entities` 1:1; the Zod schemas remain the canonical
 * source and validate every write at the app layer.
 *
 * SQLite-specific notes:
 *   - `monto_centavos` / `*_centavos` columns use `{ mode: 'bigint' }` so
 *     the CLAUDE.md §2 principle 8 (no floats for money) holds end-to-end.
 *   - Drizzle `text(..., { enum: [...] })` enforces enum membership only at
 *     the TypeScript level; runtime enforcement lives in the Zod schemas.
 *   - `activo` on `recurring_expenses` uses `{ mode: 'boolean' }` to map
 *     `0/1` SQLite INTEGER ↔ TS `boolean` automatically.
 */

export * from './_audit.js';
export * from './businesses.js';
export * from './app-config.js';
export * from './sales.js';
export * from './expenses.js';
export * from './products.js';
export * from './inventory-movements.js';
export * from './employees.js';
export * from './clients.js';
export * from './client-payments.js';
export * from './day-closes.js';
export * from './recurring-expenses.js';
