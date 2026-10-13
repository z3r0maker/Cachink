/**
 * Ventas del turno on the phone (Track M, M-08): the rows and the drawer's
 * ticket as the device reads them from its own tables (ADR-073), plus the
 * derivations the phone list and its cancel dialog still need. The wording is
 * the phone boards' (`Operador Ventas` / `Operador Detalle de venta`, the
 * `forcePhone` layout); rows in, read models out, nothing else.
 */
import { formatMoney, sum, type Money } from '@xangarro/domain';

import type { Categoria } from '../caja/types';
import type { LineaDetalle, VentaDetalle } from './detalle/types';
import { comoMetodo } from './derive';
import type { MetodoVenta, VentaTurno } from './types';

/** The operator sees `V-0412`: `V-`, the counter padded to four (ADR-073). */
export function folioVisto(folio: number): string {
  return `V-${String(folio).padStart(4, '0')}`;
}

/** The motivo chips, as the board words them (one of four, required). */
export const MOTIVOS_CANCELAR: readonly string[] = [
  'Error de captura',
  'El cliente se arrepintió',
  'Producto equivocado',
  'Cobro duplicado',
];

/** A ticket header as the device stores it (structural: `Ticket` satisfies it). */
interface TicketLeido {
  readonly id?: string;
  readonly folio: number;
  readonly fecha: string;
  readonly hora: string | null;
  readonly concepto: string;
  readonly metodo: string;
  readonly efectivoRecibidoCentavos: Money | null;
  readonly cancelMotivo: string | null;
}

/** One of the ticket's lines (`Sale` satisfies it: `monto` is the line total). */
interface LineaLeida {
  readonly concepto: string;
  readonly productoId: string;
  readonly cantidad: number;
  readonly monto: Money;
}

/** The list's row: the lines summed, the method as the operator says it. */
export function ventaTurnoDe(
  t: TicketLeido,
  lineas: readonly LineaLeida[],
  cliente?: string | null,
): VentaTurno {
  return {
    ...(t.id === undefined ? {} : { id: t.id }),
    folio: folioVisto(t.folio),
    concepto: t.concepto,
    monto: sum(lineas.map((l) => l.monto)),
    metodo: comoMetodo(t.metodo),
    hora: t.hora ?? '',
    ...(cliente === undefined || cliente === null ? {} : { cliente }),
    ...(t.cancelMotivo === null ? {} : { cancelada: { motivo: t.cancelMotivo } }),
  };
}

/**
 * The catalogue's family from the line's words — the same rule the web caja
 * reads its products with (`operador/caja/viva.tsx`): what a line is called
 * says its tint, because a sale line carries no category of its own.
 */
export function categoriaDeNombre(nombre: string): Categoria {
  const n = nombre.toLowerCase();
  if (/(bebida|agua|refresco|jugo|licuado|cafe|atole|cerveza)/.test(n)) return 'Bebidas';
  if (n.includes('taco')) return 'Tacos';
  if (/(guisado|orden|torta|gringa|quesadilla|volcan|sope|tostada)/.test(n)) return 'Guisados';
  return 'Extras';
}

/** «Hoy 14:52», or the short date when the ticket is from another day. */
function cuando(fecha: string, hora: string | null, hoy: string): string {
  if (hora === null) return fecha;
  if (fecha === hoy) return `Hoy ${hora}`;
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(
    new Date(`${fecha}T12:00:00`),
  );
}

/** A line as the drawer shows it: the unit price when the line divides evenly. */
function lineaDe(l: LineaLeida): LineaDetalle {
  const piezas = BigInt(l.cantidad);
  const precio = l.monto % piezas === 0n ? l.monto / piezas : undefined;
  return {
    productoId: l.productoId,
    nombre: l.concepto,
    cantidad: l.cantidad,
    categoria: categoriaDeNombre(l.concepto),
    ...(precio === undefined ? {} : { precio }),
  };
}

/** The drawer's ticket: lines priced, cash received, the fiado client, the motivo. */
export function ventaDetalleDe(
  t: TicketLeido,
  lineas: readonly LineaLeida[],
  ctx: {
    readonly hoy: string;
    /** The fiado client, and the balance this sale leaves them with when known. */
    readonly cliente?: { readonly nombre: string; readonly saldo?: Money };
    /** Who captured it, when the session says so. */
    readonly capturo?: string;
  },
): VentaDetalle {
  return {
    ...(t.id === undefined ? {} : { id: t.id }),
    folio: folioVisto(t.folio),
    cuando: cuando(t.fecha, t.hora, ctx.hoy),
    metodo: comoMetodo(t.metodo) as MetodoVenta,
    lineas: lineas.map(lineaDe),
    total: sum(lineas.map((l) => l.monto)),
    ...(t.efectivoRecibidoCentavos === null ? {} : { recibido: t.efectivoRecibidoCentavos }),
    ...(ctx.cliente === undefined
      ? {}
      : {
          fiado: {
            cliente: ctx.cliente.nombre,
            ...(ctx.cliente.saldo === undefined ? {} : { saldo: ctx.cliente.saldo }),
          },
        }),
    ...(t.cancelMotivo === null ? {} : { cancelada: { motivo: t.cancelMotivo } }),
    ...(ctx.capturo === undefined ? {} : { capturo: ctx.capturo }),
  };
}

/** The list after a cancellation made on it: the row stays, marked (rule 6). */
export function marcarCancelada(
  ventas: readonly VentaTurno[],
  folio: string,
  motivo: string,
): readonly VentaTurno[] {
  return ventas.map((v) => (v.folio === folio ? { ...v, cancelada: { motivo } } : v));
}

/** The toast's body, as the board words it. */
export function avisoCancelada(v: VentaTurno): string {
  const motivo = v.cancelada?.motivo ?? '';
  return `${v.folio} por ${formatMoney(v.monto)} · ${motivo}. Queda visible en tu turno y en el corte.`;
}

/**
 * The cancel dialog's consequence line (the Detalle board's intro and warn,
 * by how the sale was paid). The web's shipped dialog says it with
 * `consecuencia`; the phone board is this screen's spec, so it lives here.
 */
export function avisoCancelar(
  metodo: MetodoVenta,
  monto: Money,
  cliente?: string,
  dueno = 'Pedro',
): string {
  if (metodo === 'Fiado' && cliente !== undefined) {
    return (
      `Esta venta es fiada. Al cancelarla, el saldo de ${cliente} baja ${formatMoney(monto)}. ` +
      `Si el cliente ya abonó contra esta venta, ese dinero no sale de la caja: queda como saldo ` +
      `a favor suyo y se aplica solo a su siguiente compra. ${dueno} lo ve marcado en su portal.`
    );
  }
  if (metodo === 'Efectivo') {
    return (
      'La venta no se borra: queda marcada como cancelada, con tu nombre y el motivo. ' +
      'Si fue en efectivo, el monto sale de lo esperado en tu caja al cerrar el turno.'
    );
  }
  return (
    `Sale de tus ventas del turno y ${dueno} lo ve en su portal. ` +
    'Si hay que devolver el dinero, se hace por el mismo medio.'
  );
}
