/**
 * @cachink/testing — shared test utilities for the monorepo.
 *
 * Three surfaces:
 *   1. In-memory repository implementations (used by use-case tests).
 *   2. Fixture builders for entity types (default-valid values in one place).
 *   3. Contract-test factories (shared assertions run against every
 *      repository implementation, both Drizzle and in-memory).
 */

export * from './in-memory-sales-repository.js';
export * from './in-memory-businesses-repository.js';
export * from './in-memory-app-config-repository.js';
export * from './in-memory-expenses-repository.js';
export * from './in-memory-products-repository.js';
export * from './fixtures/index.js';
export * from './contract/index.js';
