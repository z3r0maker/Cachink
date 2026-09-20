/**
 * @xangarro/application — Use-case layer.
 *
 * Use-cases orchestrate domain logic + repositories. They depend on
 * repository **interfaces** (from @xangarro/data) and receive concrete
 * implementations via constructor injection at the composition root of
 * each app. See CLAUDE.md §4.3.
 *
 * Every use-case is a class implementing `UseCase<TInput, TOutput>`
 * with a single `execute(input)` method. Input is re-validated with
 * Zod at the boundary (defence-in-depth against UI mistakes).
 */

export * from './_use-case.js';
export * from './registrar-venta/index.js';
export * from './cancelar-ticket/index.js';
export * from './registrar-ticket/index.js';
export * from './registrar-egreso/index.js';
export * from './registrar-movimiento-inventario/index.js';
export * from './registrar-pago-cliente/index.js';
export * from './cerrar-corte-de-dia/index.js';
export * from './procesar-gasto-recurrente/index.js';
export * from './descartar-gasto-recurrente/index.js';
export * from './generar-informe-mensual/index.js';
export * from './exportar-datos/index.js';
// Audit Round 2 J — partial-update use cases (powers swipe-to-edit).
export * from './editar-venta/index.js';
export * from './editar-egreso/index.js';
export * from './editar-producto/index.js';
export * from './crear-producto/index.js';
export * from './crear-cliente/index.js';
export * from './editar-cliente/index.js';
export * from './capturar-inventario-inicial/index.js';
export * from './solicitar-importacion-asistida/index.js';
export * from './guardar-saldos-iniciales/index.js';
export * from './archivar-producto/index.js';
export * from './guardar-negocio/index.js';
export * from './archivar-negocio/index.js';
export * from './empleados/index.js';
export * from './avisos/index.js';
export * from './find-frequent-productos/index.js';
// Phase 1 — User Management + Auth
export * from './autenticar-usuario/index.js';
export * from './operadores/index.js';
export * from './compute-entitlement/index.js';
export * from './apply-push/index.js';
// Phase 3 — Feature Flags
export * from './toggle-feature-flag/index.js';
// Phase 6 — Caja
export * from './abrir-caja/index.js';
export * from './cerrar-caja/index.js';
export * from './depositar-caja/index.js';
export * from './retirar-caja/index.js';
// Phase 9 — Cancelaciones
export * from './cancelar-venta/index.js';
// Phase 18 — Conversion
export * from './ejecutar-conversion/index.js';
// Track N — signup + "Platícanos de ti" (P-03, N-12 … N-15)
export * from './onboarding/index.js';
export * from './metas/index.js';
export * from './record-quota/index.js';
