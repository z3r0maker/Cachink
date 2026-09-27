import type { MovimientosVista } from '@/server/movimientos';

/**
 * The Movimientos KPIs (B-1), built from the period's per-category summary
 * the server aggregated (DB2-QRY-02) — narrowed to the category chip when
 * one is on — so a tile always answers for the period, the search and the
 * chip the viewer has applied, not only for the ten rows on the page.
 *
 * A cancelled venta is money that did not happen and stays out of every
 * total (the summary counts it as a row, never as money or as a ticket); it
 * remains in the table, struck through, because the owner still needs to see
 * that it was cancelled.
 */
type Grupo = Pick<MovimientosVista['grupos'][number], 'clasificacion' | 'total' | 'tickets'>;

const suma = (gs: readonly Grupo[]) => gs.reduce((t, g) => t + g.total, 0n);

const esCredito = (g: Grupo) => g.clasificacion === 'Crédito';

/** The groups a category chip selects; null is «Todos». */
export function delFiltro<G extends Grupo>(grupos: readonly G[], cat: string | null): readonly G[] {
  return cat === null ? grupos : grupos.filter((g) => g.clasificacion === cat);
}

export interface KpiVentas {
  readonly total: bigint;
  /** Per **ticket**, not per line: a ticket of three tacos is one sale. */
  readonly ticketPromedio: bigint | null;
  readonly contado: bigint;
  readonly credito: bigint;
}

export function kpisDeVentas(grupos: readonly Grupo[]): KpiVentas {
  const total = suma(grupos);
  // A ticket has one method, so tickets per method add up without overlap.
  const tickets = grupos.reduce((n, g) => n + g.tickets, 0);
  return {
    total,
    ticketPromedio: tickets === 0 ? null : total / BigInt(tickets),
    contado: suma(grupos.filter((g) => !esCredito(g))),
    credito: suma(grupos.filter(esCredito)),
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

export function kpisDeGastos(grupos: readonly Grupo[]): KpiGastos {
  const total = suma(grupos);
  const primera = [...grupos].sort((a, b) => (b.total > a.total ? 1 : -1))[0];
  return {
    total,
    mayor:
      primera === undefined || total === 0n
        ? null
        : {
            nombre: primera.clasificacion,
            monto: primera.total,
            parte: Number(primera.total) / Number(total),
          },
    nomina: grupos.find((g) => g.clasificacion === 'Nómina')?.total ?? 0n,
  };
}
