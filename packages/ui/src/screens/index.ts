/**
 * Barrel for `@xangarro/ui/screens`.
 *
 * Every screen owns a folder under `./screens/<Name>/` with the screen
 * component, sub-components, and an `index.ts` that re-exports the main
 * component + prop types. New screens add one `export *` line here.
 */
export * from './AppShell/index';
export * from './Settings/index';
export * from './Wizard/index';
export * from './BusinessForm/index';
export * from './Ventas/index';
export * from './Clientes/index';
export * from './CuentasPorCobrar/index';
export * from './Egresos/index';
export * from './Productos/index';
export * from './CorteDeDia/index';
export * from './ConsentModal/index';
export * from './LanPairing/index';
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
export * from './DirectorSetup/index';
export * from './Caja/index';
export * from './Merma/index';
// Phase 18 — Conversion
export * from './Conversion/index';
// Feature-flagged screens (dormant, flag-off in v1)
export * from './VentasCredito/index';
export * from './Auditoria/index';
export * from './DemoSeeding/index';
// Phase Caja Completa — Checkout + Cancelaciones
export * from './Checkout/index';
export * from './Cancelaciones/index';
