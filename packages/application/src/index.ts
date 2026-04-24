/**
 * @cachink/application — Use-case layer.
 *
 * Use-cases orchestrate domain logic + repositories. They depend on
 * repository **interfaces** (from @cachink/data) and receive concrete
 * implementations via constructor injection at the composition root of
 * each app. See CLAUDE.md §4.3.
 *
 * Every use-case is a class implementing `UseCase<TInput, TOutput>`
 * with a single `execute(input)` method. Input is re-validated with
 * Zod at the boundary (defence-in-depth against UI mistakes).
 */

export * from './_use-case.js';
export * from './registrar-venta/index.js';
export * from './registrar-egreso/index.js';
export * from './registrar-movimiento-inventario/index.js';
export * from './registrar-pago-cliente/index.js';
