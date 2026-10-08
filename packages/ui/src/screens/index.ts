/**
 * Barrel for `@xangarro/ui/screens`.
 *
 * Every screen owns a folder under `./screens/<Name>/` with the screen
 * component, sub-components, and an `index.ts` that re-exports the main
 * component + prop types. New screens add one `export *` line here.
 */
export * from './AppShell/index';
export * from './Settings/index';
export * from './Ventas/index';
export * from './Egresos/index';
export * from './Productos/index';
export * from './ConsentModal/index';
// AppShellRouteWrapper lives in components/ but imports from
// screens/AppShell — exporting it from the components barrel would
// create a require cycle. Re-exported here to break the cycle while
// keeping a single `@xangarro/ui` import for consumers.
export {
  AppShellRouteWrapper,
  type AppShellRouteWrapperProps,
} from '../components/AppShellRouteWrapper/index';
// Phase 1-12 new screens
export * from './Login/index';
export * from './Activation/index';
// Track M, M-06 — Entrar y empezar
export * from './Inicio/index';
export * from './AbrirTurno/index';
export * from './Bloqueo/index';
export * from './MiTurno/index';
export * from './Cierre/index';
// Phase Caja Completa — Checkout; Track M, M-08 — Ventas del turno
export * from './Checkout/index';
export * from './Cobranza/index';
export * from './VentasTurno/index';
export * from './SyncRejected/index';
// Track M, M-09 — Inventario, Avisos, Registros por enviar
export * from './Inventario/index';
export * from './Avisos/index';
export * from './Pendientes/index';
