/**
 * @cachink/testing — shared test utilities for the monorepo.
 *
 * The main barrel is safe to import from runtime code (e.g., a
 * `MockRepositoryProvider` for component tests). It exposes:
 *   1. In-memory repository implementations (used by use-case tests).
 *   2. Fixture builders for entity types (default-valid values in one place).
 *   3. A `MockRepositoryProvider` React component for component tests.
 *
 * Contract-test factories live in a separate entry point,
 * `@cachink/testing/contract`, because they import `vitest` at module
 * load time and must never leak into a runtime bundle. Any `*.test.ts`
 * file that exercises a repository contract imports from that subpath.
 * See ADR-033.
 */

export * from './in-memory-sales-repository.js';
export * from './in-memory-businesses-repository.js';
export * from './in-memory-app-config-repository.js';
export * from './in-memory-expenses-repository.js';
export * from './in-memory-products-repository.js';
export * from './in-memory-inventory-movements-repository.js';
export * from './in-memory-employees-repository.js';
export * from './in-memory-clients-repository.js';
export * from './in-memory-client-payments-repository.js';
export * from './in-memory-day-closes-repository.js';
export * from './in-memory-recurring-expenses-repository.js';
export * from './fixtures/index.js';
export * from './mock-repository-provider.js';
// `TEST_DEVICE_ID` is a shared runtime constant used by both the in-memory
// tests inside this package and downstream contract tests. Re-exported
// here so the main barrel stays the single import target for runtime
// test helpers — contract factories still live under
// `@cachink/testing/contract` (see `./contract/index.ts`).
export { TEST_DEVICE_ID } from './contract/_shared.js';
