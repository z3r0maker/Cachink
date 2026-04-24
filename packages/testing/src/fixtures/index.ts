/**
 * Fixture builders barrel. Each entity's `make<Entity>` / `makeNew<Entity>`
 * helpers land here during Phase 1B-M4 (Commits 2-10). The builders keep
 * valid-by-default field values in one place so tests stay focused on the
 * behaviour under test rather than re-deriving ULIDs + timestamps.
 */

export * from './sale.js';
export * from './business.js';
export * from './expense.js';
export * from './product.js';
export * from './inventory-movement.js';
export * from './employee.js';
export * from './client.js';
