/**
 * The caja's shared logic (ADR-118): what the web caja and the phone compute
 * from the same rows, so both show the same numbers. Pure TypeScript: no
 * React, DOM, storage or database. Each screen's read models live under its
 * own subpath (`@xangarro/caja/inicio`, `/turno`, `/cierre`...).
 */
export * from './estado';
export * from './rutas';
export * from './shell';
export * from './fixtures';
export * from './vocabulario';
export * from './comun/dueno';
export * from './comun/fechas';
export * from './comun/frases';
export * from './comun/hoy-no';
export * from './comun/product-icons';
export * from './comun/search';
export * from './comun/stat';
