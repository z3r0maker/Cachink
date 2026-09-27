/**
 * Barrel for `@xangarro/ui/hooks` — composable hooks used by app shells and
 * screens. Each hook lives in its own file under this folder; add one line
 * per hook as new ones land.
 */
export * from './use-current-business';
export * from './use-ventas-by-date';
export * from './use-total-del-dia';
export * from './use-registrar-venta';
export * from './use-egresos-by-date';
export * from './use-total-egresos-del-dia';
export * from './use-registrar-egreso';
export * from './use-productos';
export * from './use-productos-para-venta';
export * from './use-registrar-movimiento';
export * from './use-crear-gasto-recurrente';
export * from './use-pendientes-gastos-recurrentes';
export * from './use-procesar-gasto-recurrente';
export * from './use-descartar-gasto-recurrente';
export * from './use-productos-con-stock';
export * from './use-movimientos-recientes';
export * from './use-crear-producto';
export * from './query-keys';
export * from './use-efectivo-esperado';
export * from './use-schedule-stock-low-check';
export * from './use-check-for-updates';
// Phase 1 — User Management + Auth
export * from './use-auto-lock';
export * from './use-reduced-motion';
// Phase 3 — Feature Flags
export * from './use-feature-flags';
// Phase 1 — User Management hooks
// Phase 6 — Caja
export * from './use-abrir-caja';
export * from './use-cerrar-caja';
export * from './use-open-caja-turno';
export * from './use-sale-sound';
export * from './use-enabled-payment-methods';
// Tap-to-Cart POS redesign
export * from './use-cart';
// Caja Completa — Checkout flow
export * from './use-checkout-store';
// Shared derived-state hooks
export * from './use-stock-map';
// Phase 11 — Director Notification Inbox
export * from './use-emit-director-alert';
export * from './use-mark-alert-read';
export * from './use-notification-prefs';
