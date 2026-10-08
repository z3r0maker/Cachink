/**
 * MEXIA's command center rules (ADR-124 §4–§5), imported as
 * `@xangarro/domain/corp`. Kept out of the package root: the portal has no
 * business with a company's ledger, and these names would only crowd it.
 */
export * from './ledger/index.js';
export * from './socios/index.js';
export * from './agenda/index.js';
