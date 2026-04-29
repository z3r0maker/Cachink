export { StockScreen, type StockScreenProps, filterProductos } from './stock-screen';
export { ProductoListRow, type ProductoListRowProps } from './producto-list-row';
export { EmptyProductos, type EmptyProductosProps } from './empty-productos';
export { StockKpiStrip, type StockKpiStripProps } from './stock-kpi-strip';
export { MovimientosScreen, type MovimientosScreenProps } from './movimientos-screen';
export { MovimientoCard, type MovimientoCardProps } from './movimiento-card';
export { NuevoProductoModal, type NuevoProductoModalProps } from './nuevo-producto-modal';
export { MovimientoModal, type MovimientoModalProps } from './movimiento-modal';
export { StockBajoBanner, type StockBajoBannerProps, countBajoStock } from './stock-bajo-banner';
export { StockBajoSummary, type StockBajoSummaryProps } from './stock-bajo-summary';
export { ProductoDetailPopover, type ProductoDetailPopoverProps } from './producto-detail-popover';
export { ProductoDetailRoute, type ProductoDetailRouteProps } from './producto-detail-route';
export {
  ProductosTabBar,
  type ProductosTabBarProps,
  type ProductosSubTab,
  visibleSubTabs,
} from './productos-tab-bar';
export { MovimientosRoute } from './movimientos-route';
export { EditarProductoModal, type EditarProductoModalProps } from './editar-producto-modal';
// Legacy re-exports — will be removed after Phase B transition.
export {
  InventarioTabBar,
  type InventarioTabBarProps,
  type InventarioSubTab,
} from './inventario-tab-bar';
