/**
 * Barrel for repository contract-test factories. Populated as each entity's
 * contract lands in Phase 1B-M4 (Commits 2-10).
 *
 * Each factory exports `describe<Entity>RepositoryContract(implName, makeRepo)`
 * so the same assertions run against both the in-memory and Drizzle impls.
 */

export * from './_shared.js';
