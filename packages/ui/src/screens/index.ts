/**
 * Barrel for `@cachink/ui/screens`.
 *
 * Every screen owns a folder under `./screens/<Name>/` with the screen
 * component, sub-components, and an `index.ts` that re-exports the main
 * component + prop types. New screens add one `export *` line here.
 */
export * from './RolePicker/index';
export * from './AppShell/index';
export * from './Settings/index';
export * from './Wizard/index';
export * from './BusinessForm/index';
export * from './Ventas/index';
export * from './Clientes/index';
export * from './CuentasPorCobrar/index';
export * from './Egresos/index';
export * from './Inventario/index';
// Productos/ re-exports come from Inventario/ which still has the full set.
// ProductosTabBar + visibleSubTabs are new and only in Productos/.
export {
  ProductosTabBar,
  type ProductosTabBarProps,
  type ProductosSubTab,
  visibleSubTabs,
  ProductoListRow,
  type ProductoListRowProps,
  NuevoProductoScreen,
  type NuevoProductoScreenProps,
  IconPickerScreen,
  type IconPickerScreenProps,
  ProductoDetailScreen,
  type ProductoDetailScreenProps,
  ProductoDetailSmart,
  type ProductoDetailSmartProps,
} from './Productos/index';
export * from './CorteDeDia/index';
export * from './Estados/index';
export * from './DirectorHome/index';
export * from './ConsentModal/index';
export * from './LanPairing/index';
export * from './CloudOnboarding/index';
// AppShellRouteWrapper lives in components/ but imports from
// screens/AppShell — exporting it from the components barrel would
// create a require cycle. Re-exported here to break the cycle while
// keeping a single `@cachink/ui` import for consumers.
export {
  AppShellRouteWrapper,
  type AppShellRouteWrapperProps,
} from '../components/AppShellRouteWrapper/index';
// Phase 1-12 new screens
export * from './Login/index';
export * from './DirectorSetup/index';
export * from './FuncionesNegocio/index';
export * from './Otros/index';
export * from './Caja/index';
export * from './Merma/index';
export * from './UserManagement/index';
// Phase 18 — Conversion
export * from './Conversion/index';
// Feature-flagged report screens
export * from './MermaReportes/index';
export * from './CajaReportes/index';
export * from './VentasCredito/index';
export * from './Auditoria/index';
export * from './DemoSeeding/index';
// Phase Caja Completa — Checkout + Cancelaciones
export * from './Checkout/index';
export * from './Cancelaciones/index';
