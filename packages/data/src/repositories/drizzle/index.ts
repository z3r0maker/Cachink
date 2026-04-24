/**
 * Drizzle repository implementations barrel.
 *
 * Entity-specific repositories land here during Phase 1B-M4 (one per entity
 * from CLAUDE.md §9). Each implementation takes a {@link CachinkDatabase}
 * + a {@link DeviceId} in its constructor and satisfies the matching
 * interface exported from `../index.js`.
 */

export type { CachinkDatabase, CachinkSchema } from './_db.js';
export * from './sales-repository.js';
export * from './businesses-repository.js';
export * from './app-config-repository.js';
export * from './expenses-repository.js';
export * from './products-repository.js';
export * from './inventory-movements-repository.js';
