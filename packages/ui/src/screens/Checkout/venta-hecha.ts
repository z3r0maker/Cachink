/**
 * A sale just registered, as «Venta hecha» and the comprobante tell it
 * (MvVentaHecha): folio, lines, total, how it was paid and the change. Kept
 * in a small store so the Cobrar tab shows it when the cobro closes.
 */
import { create } from 'zustand';
import type { Money } from '@xangarro/domain';
import { totalDe, type LineaDetalle, type VentaDetalle } from '@xangarro/caja/ventas';
import type { LineaTicket } from '@xangarro/caja/caja';
import type { MetodoCobro } from './cobro-logic';

export interface VentaHecha {
  readonly ticketId: string;
  /** «V-0413». */
  readonly folio: string;
  /** «14:58». */
  readonly hora: string;
  readonly lines: readonly LineaTicket[];
  readonly total: Money;
  readonly metodo: MetodoCobro;
  /** Cash only: what the customer handed over, and the change given. */
  readonly recibido: Money | null;
  readonly cambio: Money | null;
  /** Fiado only: whose account, and what they owe now. */
  readonly cliente: string | null;
  readonly saldoCliente: Money | null;
}

interface VentaHechaStore {
  readonly venta: VentaHecha | null;
  readonly mostrar: (v: VentaHecha) => void;
  readonly cerrar: () => void;
}

export const useVentaHecha = create<VentaHechaStore>((set) => ({
  venta: null,
  mostrar: (venta) => set({ venta }),
  cerrar: () => set({ venta: null }),
}));

/** A past sale of the turno as the comprobante tells it: the Ventas sheet's
 *  share hands this to `ComprobanteSheet`. What the detalle does not know
 *  (cash change, the client's balance after) reads as absent. */
export function ventaHechaDeDetalle(d: VentaDetalle): VentaHecha {
  const total = totalDe(d);
  return {
    ticketId: d.id ?? d.folio,
    folio: d.folio,
    hora: d.cuando.split(' ').pop() ?? d.cuando,
    lines: d.lineas.map(
      (l: LineaDetalle): LineaTicket => ({
        productoId: l.productoId,
        nombre: l.nombre,
        precio: l.precio ?? 0n,
        cantidad: l.cantidad,
      }),
    ),
    total,
    metodo: d.metodo as MetodoCobro,
    recibido: d.recibido ?? null,
    cambio: d.recibido !== undefined && d.recibido > total ? d.recibido - total : null,
    cliente: d.fiado?.cliente ?? null,
    saldoCliente: d.fiado?.saldo ?? null,
  };
}
