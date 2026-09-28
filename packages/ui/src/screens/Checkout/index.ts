// Cobro, fiado, venta hecha and the comprobante (Track M, M-07).
export { CobroScreen, type CobroScreenProps } from './cobro-screen';
export { FiadoScreen, type FiadoScreenProps, type AQuien } from './fiado-screen';
export { VentaHechaDialog, type VentaHechaDialogProps } from './venta-hecha-dialog';
export { ComprobanteSheet, type ComprobanteSheetProps } from './comprobante-sheet';
export { useVentaHecha, type VentaHecha } from './venta-hecha';
export {
  METODOS as METODOS_COBRO,
  metodoDominio,
  metodosDisponibles,
  folioTexto,
  type MetodoCobro,
} from './cobro-logic';
export { useCobrarTicket, type CobrarTicketInput } from './use-cobrar-ticket';
export { useClientesFiado, useSiguienteFolio, cobrarKeys } from './use-cobrar-datos';
export { useCrearClienteFiado } from './use-crear-cliente-fiado';
export { useDueno } from './use-dueno';
