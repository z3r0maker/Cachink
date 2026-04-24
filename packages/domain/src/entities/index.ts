/**
 * Entity schemas barrel.
 *
 * Every Phase 1 entity from CLAUDE.md §9 has a Zod schema and an inferred
 * TypeScript type here. Drizzle table definitions in `@cachink/data/schema`
 * mirror these shapes 1:1; the Zod schemas are the canonical source.
 */

export * from './_audit.js';
export * from './_fields.js';
export * from './_ulid-field.js';
export * from './business.js';
export * from './app-config.js';
export * from './sale.js';
export * from './expense.js';
export * from './product.js';
export * from './inventory-movement.js';
export * from './employee.js';
export * from './client.js';
export * from './client-payment.js';
export * from './day-close.js';
