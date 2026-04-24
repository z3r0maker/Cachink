/**
 * Barrel for repository contract-test factories. Populated as each entity's
 * contract lands in Phase 1B-M4 (Commits 2-10).
 *
 * Each factory exports `describe<Entity>RepositoryContract(implName, makeRepo)`
 * so the same assertions run against both the in-memory and Drizzle impls.
 */

export * from './_shared.js';
export * from './sales-repository.js';
export * from './businesses-repository.js';
export * from './app-config-repository.js';
export * from './expenses-repository.js';
export * from './products-repository.js';
export * from './inventory-movements-repository.js';
export * from './employees-repository.js';
export * from './clients-repository.js';
export * from './client-payments-repository.js';
export * from './day-closes-repository.js';
export * from './recurring-expenses-repository.js';
