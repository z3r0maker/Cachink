import type { EstadoFactura, FacturaRecibida, NuevaFactura } from '@xangarro/application/corp';
import { CATEGORIAS_GASTO, type CategoriaGasto } from '@xangarro/domain/corp';

import type { receivedInvoices } from '../schema/facturas.js';

/**
 * corp.received_invoices ↔ the application's `FacturaRecibida` (E-11). Every
 * stored enum is parsed, never asserted (CLAUDE.md §2.8).
 */
export type FacturaRow = typeof receivedInvoices.$inferSelect;

const ESTADOS: readonly EstadoFactura[] = ['por_revisar', 'registrada', 'cancelada', 'descartada'];

function uno<T extends string>(lista: readonly T[], value: string, campo: string): T {
  const found = lista.find((v) => v === value);
  if (found === undefined) throw new Error(`corp.received_invoices: unknown ${campo} «${value}»`);
  return found;
}

export const categoriaDe = (value: string | null): CategoriaGasto | null =>
  value === null ? null : uno(CATEGORIAS_GASTO, value, 'categoria');

export function toFactura(r: FacturaRow): FacturaRecibida {
  const usd =
    r.montoOriginal !== null && r.tipoCambio !== null
      ? { montoOriginal: r.montoOriginal, tipoCambio: r.tipoCambio }
      : null;
  return {
    cfdi: {
      uuid: r.uuid,
      fecha: r.fecha,
      folio: r.folio,
      emisor: { rfc: r.emisorRfc, nombre: r.emisorNombre },
      receptor: { rfc: r.receptorRfc, uso: r.usoCfdi },
      metodoPago: uno(['PUE', 'PPD'] as const, r.metodoPago, 'metodo_pago'),
      moneda: uno(['MXN', 'USD'] as const, r.moneda, 'moneda'),
      subtotal: r.subtotal,
      iva: r.iva,
      retencionIsr: r.retencionIsr,
      retencionIva: r.retencionIva,
      total: r.total,
      usd,
      concepto: r.concepto,
      sat: { total: r.satTotal, sello8: r.sello8 },
    },
    archivo: r.archivo,
    estado: uno(ESTADOS, r.estado, 'estado'),
    estadoSat: uno(['vigente', 'cancelado', 'sin_verificar'] as const, r.estadoSat, 'estado_sat'),
    categoria: categoriaDe(r.categoria),
    projectId: r.projectId,
    entryId: r.entryId,
    pagoEntryId: r.pagoEntryId,
  };
}

/** The row a new upload writes; a discarded one is overwritten with it whole. */
export function toRow(f: NuevaFactura, now: string): typeof receivedInvoices.$inferInsert {
  const c = f.cfdi;
  return {
    uuid: c.uuid,
    fecha: c.fecha,
    folio: c.folio,
    emisorRfc: c.emisor.rfc,
    emisorNombre: c.emisor.nombre,
    receptorRfc: c.receptor.rfc,
    usoCfdi: c.receptor.uso,
    metodoPago: c.metodoPago,
    moneda: c.moneda,
    montoOriginal: c.usd?.montoOriginal ?? null,
    tipoCambio: c.usd?.tipoCambio ?? null,
    subtotal: c.subtotal,
    iva: c.iva,
    retencionIsr: c.retencionIsr,
    retencionIva: c.retencionIva,
    total: c.total,
    concepto: c.concepto,
    satTotal: c.sat.total,
    sello8: c.sat.sello8,
    archivo: f.archivo,
    xml: Buffer.from(f.xml),
    estado: f.estado,
    estadoSat: f.estadoSat,
    categoria: null,
    projectId: null,
    entryId: null,
    pagoEntryId: null,
    createdBy: f.creadaPor,
    createdAt: now,
    updatedAt: now,
  };
}
