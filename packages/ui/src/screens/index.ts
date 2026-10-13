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
export * from './Caja/index';
// Phase Caja Completa — Checkout + Cancelaciones
export * from './Checkout/index';
export * from './Cancelaciones/index';
export * from './SyncRejected/index';
// Track M, M-08 — Dinero del turno: Gastos y Fiado y abonos
export * from './Gastos/index';
export * from './Cobranza/index';
// Track M, M-09 — Mi turno y cierre: Inventario, Avisos, Registros por enviar
export * from './Turno/index';
export * from './Inventario/index';
export * from './Avisos/index';
export * from './Pendientes/index';
// The web operador's surfaces that live beside the phone's in the same
// directories; main's mobile routes (cobranza, pendientes, inventario) and
// the portal pages import them from this barrel by name.
export { ClienteScreen } from './Cobranza/cliente-screen';
export { useClienteCobranza } from './Cobranza/use-cliente-cobranza';
export { useCuentas } from './Cobranza/use-cuentas';
export { useInventarioCaja } from './Inventario/use-inventario-caja';
export { useInventarioVista } from './Inventario/use-inventario-vista';
