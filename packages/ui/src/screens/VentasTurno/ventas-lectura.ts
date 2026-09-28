/**
 * The turno's tickets as Ventas reads them (MvVentas; the web caja's
 * `runtime/tickets.ts` + `ventas/detalle/carga.ts`): one row per ticket
 * (ADR-073), its lines grouped under it, the fiado client and the cash the
 * customer handed over. Older phone sales were one ticket per product; they
 * stay one row each, since each is its own cancellable ticket. Pure.
 */
import { formatMoney, type Money, type Sale, type Ticket } from '@xangarro/domain';
import { hhmmLocal } from '@xangarro/caja';
import { comoMetodo, type VentaDetalle, type VentaTurno } from '@xangarro/caja/ventas';
import { folioTexto } from '../Checkout/cobro-logic';
import type { VentaHecha } from '../Checkout/venta-hecha';

/** One ticket with what the screen needs around it. */
export interface TicketLeido {
  readonly ticket: Ticket;
  /** Its live lines (a line the old phone flow deleted is gone). */
  readonly lineas: readonly Sale[];
  /** The fiado client, and what they owe now when known. */
  readonly cliente: { readonly nombre: string; readonly saldo?: Money } | null;
  /** Who captured it, when the caja knows the user. */
  readonly capturo: string | null;
}

/** «3 Taco de pastor · 1 Gringa»: the ticket's lines in one line. */
export function conceptoDe(lineas: readonly Sale[]): string {
  return lineas.map((l) => `${l.cantidad} ${l.concepto}`).join(' · ');
}

export const totalDe = (lineas: readonly Sale[]): Money =>
  lineas.reduce((acc, l) => acc + l.monto, 0n);

/** «14:52»: the ticket's own time, or when it was written for a migrated row. */
export const horaDe = (t: Ticket): string => t.hora ?? hhmmLocal(t.createdAt);

export function ventaDeTicket(t: TicketLeido): VentaTurno {
  return {
    id: t.ticket.id,
    folio: folioTexto(t.ticket.folio),
    concepto: conceptoDe(t.lineas),
    monto: totalDe(t.lineas),
    metodo: comoMetodo(t.ticket.metodo),
    hora: horaDe(t.ticket),
    ...(t.cliente === null ? {} : { cliente: t.cliente.nombre }),
    ...(t.ticket.cancelMotivo === null ? {} : { cancelada: { motivo: t.ticket.cancelMotivo } }),
  };
}

/**
 * The sheet's ticket. `categoria` only tints the web's fixture icons; the
 * phone draws each line with its product's own icon and colour.
 */
export function detalleDeTicket(t: TicketLeido, hoy: string): VentaDetalle {
  const v = ventaDeTicket(t);
  return {
    id: t.ticket.id,
    folio: v.folio,
    cuando: t.ticket.fecha === hoy ? `Hoy ${v.hora}` : `${t.ticket.fecha} ${v.hora}`,
    metodo: v.metodo,
    lineas: t.lineas.map((l) => ({
      productoId: l.productoId,
      nombre: l.concepto,
      precio: l.monto / BigInt(Math.max(l.cantidad, 1)),
      cantidad: l.cantidad,
      categoria: 'Extras' as const,
    })),
    total: v.monto,
    ...(t.ticket.efectivoRecibidoCentavos === null
      ? {}
      : { recibido: t.ticket.efectivoRecibidoCentavos }),
    ...(t.cliente === null
      ? {}
      : {
          fiado: {
            cliente: t.cliente.nombre,
            ...(t.cliente.saldo === undefined ? {} : { saldo: t.cliente.saldo }),
          },
        }),
    ...(v.cancelada ? { cancelada: v.cancelada } : {}),
    ...(t.capturo === null ? {} : { capturo: t.capturo }),
  };
}

/** The same ticket as the comprobante of M-07 tells it. */
export function comprobanteDe(t: TicketLeido): VentaHecha {
  const v = ventaDeTicket(t);
  const efectivo = v.metodo === 'Efectivo' && t.ticket.efectivoRecibidoCentavos !== null;
  return {
    ticketId: t.ticket.id,
    folio: v.folio,
    hora: v.hora,
    lines: t.lineas.map((l) => ({
      productoId: l.productoId,
      nombre: l.concepto,
      precio: l.monto / BigInt(Math.max(l.cantidad, 1)),
      cantidad: l.cantidad,
    })),
    total: v.monto,
    metodo: v.metodo,
    recibido: efectivo ? t.ticket.efectivoRecibidoCentavos : null,
    cambio: efectivo ? (t.ticket.cambioCentavos ?? null) : null,
    cliente: t.cliente?.nombre ?? null,
    saldoCliente: t.cliente?.saldo ?? null,
  };
}

/** The motive plus the operator's note for the owner, as the web stores it. */
export function motivoCompleto(motivo: string, nota: string): string {
  const n = nota.trim();
  return (n === '' ? motivo : `${motivo}: ${n}`).slice(0, 500);
}

/** «V-0412 cancelada · Me equivoqué al cobrar. Devuelve $160.00.» */
export function avisoCancelada(folio: string, motivo: string, devuelve: Money | null): string {
  const extra = devuelve === null ? '' : ` Devuelve ${formatMoney(devuelve)}.`;
  return `${folio} cancelada · ${motivo}.${extra}`;
}
