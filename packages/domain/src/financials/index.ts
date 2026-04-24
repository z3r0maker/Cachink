/**
 * NIF financial calculations (CLAUDE.md §10). Every function is pure —
 * no IO, no dates computed internally, inputs are plain arrays of the
 * already-filtered entity shapes. Callers pre-filter by period.
 */

export * from './_periodo.js';
export * from './estado-resultados.js';
export * from './balance-general.js';
export * from './flujo-efectivo.js';
export * from './corte-de-dia.js';
