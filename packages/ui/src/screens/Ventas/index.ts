// Cobrar (Track M, M-07): the catalogue, the ticket, the escáner, producto nuevo.
export { CobrarScreen, type CobrarScreenProps } from './cobrar-screen';
export { productosDeCaja, type ProductoCobrar } from './cobrar-catalogo';
export { TicketSheet, type TicketSheetProps } from './ticket-sheet';
export { TicketPanel, type TicketPanelProps } from './ticket-panel';
export { EscanerSheet, type EscanerSheetProps } from './escaner-sheet';
export { ProductoNuevoSheet, type ProductoNuevoSheetProps } from './producto-nuevo-sheet';
export { useTicketEnCurso, resumenTicket, type ProductoParaTicket } from './ticket-en-curso';
export { deriveVentaCategoria, buildQuickSellPayload, type QuickSellInput } from './quick-sell';
// Caja Gate
export { CajaGateBanner, type CajaGateBannerProps } from './caja-gate-banner';
// Products Gate
export { ProductosGateBanner, type ProductosGateBannerProps } from './productos-gate-banner';
