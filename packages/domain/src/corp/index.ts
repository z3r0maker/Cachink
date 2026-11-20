/**
 * MEXIA's command center rules (ADR-125 §4–§5), imported as
 * `@xangarro/domain/corp`. Kept out of the package root: the portal has no
 * business with a company's ledger, and these names would only crowd it.
 */
export * from './ledger/index.js';
export * from './socios/index.js';
export * from './agenda/index.js';
export * from './expediente/index.js';
export * from './corporativo/index.js';
export * from './facturas/index.js';
export * from './resultados/index.js';
export * from './caja/index.js';
export * from './balance/index.js';
export * from './limites/index.js';
export * from './servicios/index.js';
export * from './impuestos/index.js';
export * from './cierre/index.js';
export * from './presupuesto/index.js';
export * from './contador/index.js';
export * from './tablero/index.js';
export * from './trimestre/index.js';
