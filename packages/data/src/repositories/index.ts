/**
 * Repository interfaces. Concrete Drizzle implementations live under
 * `./drizzle/`; test-only in-memory implementations live in
 * `@cachink/testing`. Both satisfy the same TypeScript interface exported
 * from each `*-repository.ts` file.
 */
export * from './sales-repository.js';
export * from './businesses-repository.js';
export * from './app-config-repository.js';
export * from './expenses-repository.js';
export * from './products-repository.js';
export * from './inventory-movements-repository.js';
export * from './employees-repository.js';
export * from './drizzle/index.js';
