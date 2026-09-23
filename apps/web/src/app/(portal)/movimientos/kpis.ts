import type { MovimientosData } from '@/server/screens';

type Row = NonNullable<MovimientosData>[number];

/**
 * The Movimientos KPIs (B-1), computed from the rows the table is showing —
 * so a tile always answers for the period, the search and the chips the
 * viewer has actually applied, rather than for some other window.
 *
 * A cancelled venta is money that did not happen and stays out of every
 * total; it remains in the table, struck through, because the owner still
 * needs to see that it was cancelled.
 */
const vivas = (rows: readonly Row[]) => rows.filter((r) => !r.cancelada);

const suma = (rows: readonly Row[]) => rows.reduce((t, r) => t + r.amount, 0n);

const esCredito = (r: Row) => r.clasificacion === 'Crédito';

export interface KpiVentas {
  readonly total: bigint;
  /** Per **ticket**, not per line: a ticket of three tacos is one sale. */
  readonly ticketPromedio: bigint | null;
  readonly contado: bigint;
  readonly credito: bigint;
}

export function kpisDeVentas(rows: readonly Row[]): KpiVentas {
  const v = vivas(rows);
  const tickets = new Set(v.map((r) => r.ticketId ?? r.id));
  const total = suma(v);
  return {
    total,
    ticketPromedio: tickets.size === 0 ? null : total / BigInt(tickets.size),
    contado: suma(v.filter((r) => !esCredito(r))),
    credito: suma(v.filter(esCredito)),
  };
}

export interface KpiGastos {
  readonly total: bigint;
  /** The category that took the most, with its share of the total. */
  readonly mayor: {
    readonly nombre: string;
    readonly monto: bigint;
    readonly parte: number;
  } | null;
  readonly nomina: bigint;
}

export function kpisDeGastos(rows: readonly Row[]): KpiGastos {
  const total = suma(rows);
  const porCategoria = new Map<string, bigint>();
  for (const r of rows) {
    porCategoria.set(r.clasificacion, (porCategoria.get(r.clasificacion) ?? 0n) + r.amount);
  }
  const ordenadas = [...porCategoria.entries()].sort((a, b) => (b[1] > a[1] ? 1 : -1));
  const primera = ordenadas[0];
  return {
    total,
    mayor:
      primera === undefined || total === 0n
        ? null
        : { nombre: primera[0], monto: primera[1], parte: Number(primera[1]) / Number(total) },
    nomina: porCategoria.get('Nómina') ?? 0n,
  };
}
