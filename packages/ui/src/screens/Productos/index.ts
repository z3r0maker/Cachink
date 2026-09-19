export { StockScreen, type StockScreenProps, filterProductos } from './stock-screen';
// Legacy re-export: ProductoCard renamed to ProductoListRow in UXD-R3.
// The new vertical ProductoCard tile lives in components/ProductoCard/.
export {
  ProductoCard as ProductoListRowLegacy,
  type ProductoCardProps as ProductoListRowLegacyProps,
} from './producto-card';
export { EmptyProductos, type EmptyProductosProps } from './empty-productos';
export { StockKpiStrip, type StockKpiStripProps } from './stock-kpi-strip';
export { MovimientosScreen, type MovimientosScreenProps } from './movimientos-screen';
export { MovimientoCard, type MovimientoCardProps } from './movimiento-card';
export { NuevoProductoScreen, type NuevoProductoScreenProps } from './nuevo-producto-screen';
export { initialProductoState, type ProductoFormState } from './nuevo-producto-form';
export { MovimientoModal, type MovimientoModalProps } from './movimiento-modal';
export { StockBajoBanner, type StockBajoBannerProps, countBajoStock } from './stock-bajo-banner';
export { StockBajoSummary, type StockBajoSummaryProps } from './stock-bajo-summary';
export {
  ProductosTabBar,
  type ProductosTabBarProps,
  type ProductosSubTab,
  visibleSubTabs,
} from './productos-tab-bar';
export { MovimientosRoute } from './movimientos-route';
// Icon catalogue data stays shared for the portal's picker (P-07); the device no longer picks icons.
export { ICON_CATEGORIES, type IconCategory } from './icon-picker-data';
export { ProductoDetailScreen, type ProductoDetailScreenProps } from './producto-detail-screen';
export { ProductoDetailSmart, type ProductoDetailSmartProps } from './producto-detail-smart';
// Legacy re-exports — will be removed after Phase B transition.
export {
  InventarioTabBar,
  type InventarioTabBarProps,
  type InventarioSubTab,
} from './inventario-tab-bar';
