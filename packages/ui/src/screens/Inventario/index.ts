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
export { MovimientoModal, type MovimientoModalProps } from './movimiento-modal';
export { StockBajoBanner, type StockBajoBannerProps, countBajoStock } from './stock-bajo-banner';
export { StockBajoSummary, type StockBajoSummaryProps } from './stock-bajo-summary';
export { ProductoDetailPopover, type ProductoDetailPopoverProps } from './producto-detail-popover';
export { ProductoDetailRoute, type ProductoDetailRouteProps } from './producto-detail-route';
export {
  InventarioTabBar,
  type InventarioTabBarProps,
  type InventarioSubTab,
} from './inventario-tab-bar';
export { MovimientosRoute } from './movimientos-route';
// Phase 18 consolidation: re-export from canonical Productos location.
export { NuevoProductoModal, type NuevoProductoModalProps } from '../Productos/nuevo-producto-modal';
export { EditarProductoModal, type EditarProductoModalProps } from '../Productos/editar-producto-modal';
