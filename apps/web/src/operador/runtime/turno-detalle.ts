/**
 * The open turno's detail for Mi turno and Inicio (O-39), pure over the rows
 * `filasDelTurno` read: per-method totals, who took fiado, the last sale and
 * cancellation, and the movements list. Ticket totals come from the same
 * helper as Cierre's Resumen, so the figures agree.
 */

import { formatMoney } from '@xangarro/domain';

import { totalesPorTicket } from './cierre-resumen';
import { hhmmLocal } from './fechas';
import type { MetodoTurno, MovimientoPara, TurnoVivoPara } from './turno-shapes';

interface TicketFila {
  readonly id: string;
  readonly folio: number;
  readonly metodo: string;
  readonly clienteId: string | null;
  readonly cancelledAt: string | null;
  readonly createdAt: string;
}
interface LineaFila {
  readonly ticketId: string;
  readonly concepto: string;
  readonly cantidad: number;
  readonly monto: bigint;
  readonly deletedAt: string | null;
}
interface AbonoFila {
  readonly id: string;
  readonly clienteId: string;
  readonly metodo: string;
  readonly montoCentavos: bigint;
  readonly createdAt: string;
  readonly deletedAt: string | null;
}
interface GastoFila {
  readonly id: string;
  readonly concepto: string;
  readonly proveedor: string | null;
  readonly monto: bigint;
  readonly createdAt: string;
}

export interface FilasDetalle {
  readonly delTurno: readonly TicketFila[];
  readonly lineas: readonly LineaFila[];
  readonly abonos: readonly AbonoFila[];
  readonly gastos: readonly GastoFila[];
}

/** The screen's four methods; the retired QR/CoDi rides with Transferencia. */
const METODO: Readonly<Record<string, MetodoTurno>> = {
  Efectivo: 'Efectivo',
  Tarjeta: 'Tarjeta',
  Transferencia: 'Transferencia',
  'QR/CoDi': 'Transferencia',
  Crédito: 'Fiado',
};

export const folioDe = (n: number): string => `V-${String(n).padStart(4, '0')}`;

const ultimo = (xs: readonly string[]): string | null =>
  xs.length === 0 ? null : xs.reduce((a, b) => (b > a ? b : a));

type Detalle = Pick<
  TurnoVivoPara,
  'porMetodo' | 'fiadoClientes' | 'ultimaCancelada' | 'ultimaVentaAt' | 'gastos' | 'movimientos'
>;

/** Everything Mi turno and Inicio show beyond the close figures. */
export function detalleDelTurno(f: FilasDetalle, nombres: ReadonlyMap<string, string>): Detalle {
  const total = totalesPorTicket(f.lineas);
  const vivas = f.delTurno.filter((t) => t.cancelledAt === null);
  const porMetodo: Record<MetodoTurno, bigint> = {
    Efectivo: 0n,
    Tarjeta: 0n,
    Transferencia: 0n,
    Fiado: 0n,
  };
  for (const t of vivas) {
    const m = METODO[t.metodo];
    if (m !== undefined) porMetodo[m] += total(t.id);
  }
  const fiados = vivas.filter((t) => t.metodo === 'Crédito' && t.clienteId !== null);
  const clientes = [...new Set(fiados.map((t) => t.clienteId as string))];
  return {
    porMetodo: {
      Efectivo: porMetodo.Efectivo.toString(),
      Tarjeta: porMetodo.Tarjeta.toString(),
      Transferencia: porMetodo.Transferencia.toString(),
      Fiado: porMetodo.Fiado.toString(),
    },
    fiadoClientes: clientes.map((id) => nombres.get(id) ?? 'Cliente'),
    ultimaCancelada: ((at) => (at === null ? null : hhmmLocal(at)))(
      ultimo(f.delTurno.flatMap((t) => (t.cancelledAt === null ? [] : [t.cancelledAt]))),
    ),
    ultimaVentaAt: ultimo(vivas.map((t) => t.createdAt)),
    gastos: f.gastos.length,
    movimientos: movimientosDe(f, nombres),
  };
}

/** «2 Orden del día · 1 Refresco» and how it was paid. */
function detalleVenta(t: TicketFila, lineas: readonly LineaFila[], cliente: string): string {
  const piezas = lineas
    .filter((l) => l.ticketId === t.id && l.deletedAt === null)
    .map((l) => `${l.cantidad} ${l.concepto}`);
  const base = piezas.join(' · ');
  if (t.metodo === 'Crédito') return `${base} · fiado a ${cliente}`;
  if (t.metodo === 'Efectivo') return base;
  return `${base} · ${t.metodo.toLowerCase()}`;
}

interface ConFecha extends MovimientoPara {
  readonly at: string;
}

type Cliente = (id: string | null) => string;

/** The turno's standing sales, as movements. */
function ventasComoMov(f: FilasDetalle, cliente: Cliente): ConFecha[] {
  const total = totalesPorTicket(f.lineas);
  return f.delTurno
    .filter((t) => t.cancelledAt === null)
    .map((t) => ({
      id: t.id,
      tipo: t.metodo === 'Crédito' ? 'credito' : 'venta',
      titulo: `Venta ${folioDe(t.folio)}`,
      detalle: detalleVenta(t, f.lineas, cliente(t.clienteId)),
      hora: hhmmLocal(t.createdAt),
      montoCentavos: total(t.id).toString(),
      at: t.createdAt,
    }));
}

/** The turno's standing sales, its gastos and the abonos, newest first. */
export function movimientosDe(
  f: FilasDetalle,
  nombres: ReadonlyMap<string, string>,
): readonly MovimientoPara[] {
  const cliente: Cliente = (id) => (id === null ? 'Cliente' : (nombres.get(id) ?? 'Cliente'));
  const gastos: ConFecha[] = f.gastos.map((g) => ({
    id: g.id,
    tipo: 'gasto',
    titulo: `Gasto · ${g.concepto}`,
    detalle: g.proveedor ?? 'Sin comprobante',
    hora: hhmmLocal(g.createdAt),
    montoCentavos: (-g.monto).toString(),
    at: g.createdAt,
  }));
  const abonos: ConFecha[] = f.abonos
    .filter((a) => a.deletedAt === null)
    .map((a) => ({
      id: a.id,
      tipo: 'abono',
      titulo: `Abono · ${cliente(a.clienteId)}`,
      detalle: `${a.metodo} · ${formatMoney(a.montoCentavos)} a su cuenta`,
      hora: hhmmLocal(a.createdAt),
      montoCentavos: a.montoCentavos.toString(),
      at: a.createdAt,
    }));
  return [...ventasComoMov(f, cliente), ...gastos, ...abonos]
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((m) => ({
      id: m.id,
      tipo: m.tipo,
      titulo: m.titulo,
      detalle: m.detalle,
      hora: m.hora,
      montoCentavos: m.montoCentavos,
    }));
}
