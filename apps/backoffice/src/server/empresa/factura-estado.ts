import type { FacturaDelMes } from '@xangarro/data-corp';

/**
 * Owed (E-11, owner decision 9): registered on credit, not paid, its expense
 * still standing. Only such an invoice can be cancelled from Facturas: once
 * paid, its money did leave the bank (owner, 2026-10-31).
 */
export const porPagar = (d: FacturaDelMes): boolean =>
  d.factura.estado === 'registrada' &&
  d.factura.cfdi.metodoPago === 'PPD' &&
  d.factura.pagoEntryId === null &&
  !d.revertida;
