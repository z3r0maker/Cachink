import 'server-only';

import {
  contarMovimientos,
  paginaDeFecha,
  lineasDeTickets,
  listMovimientos,
  resumenMovimientos,
  type FiltroMovimientos,
  type GrupoMovimientos,
  type LineaDeTicket,
  type MovimientoRow,
} from '@xangarro/data-pg';

import { withTenant } from './db';

/**
 * Ventas y gastos' read model (P-09, audit DB2-QRY-02): one page of the
 * filtered rows, the per-category summary the KPIs, chips and counter are
 * built from, the other tab's count, and the lines of the tickets on the page
 * for the drawer — all in one tenant transaction, all bounded by the filter.
 *
 * It used to be the tenant's entire ledger, twice (ventas and gastos), with
 * a per-row receipt lookup: 576K rows and 3.6 s for a year-old heavy tenant,
 * shipped to the browser to be filtered and summed there.
 */
export const POR_PAGINA = 10;

export interface MovimientosVista {
  readonly filas: readonly MovimientoRow[];
  /** Per category for the period and search; the category filter is not applied. */
  readonly grupos: readonly GrupoMovimientos[];
  /** Rows per tab for the period and search, as the tab labels count them. */
  readonly conteos: { readonly ventas: number; readonly gastos: number };
  /** Every live line of the tickets on this page (ventas only). */
  readonly lineas: readonly LineaDeTicket[];
  /** The page actually served, 1-based: a page past the end serves the last. */
  readonly pagina: number;
  /** Rows the filter selects, category included — the pager's «de N». */
  readonly total: number;
}

/** Rows the table lists for a category, or for all of them. */
export function filasDe(grupos: readonly GrupoMovimientos[], cat: string | null | undefined) {
  return grupos
    .filter((g) => cat === null || cat === undefined || g.clasificacion === cat)
    .reduce((n, g) => n + g.filas, 0);
}

/** «Ir a fecha» (DS-01): the page, at {@link POR_PAGINA} rows, that holds `fecha`. */
export function paginaParaFecha(
  businessId: string,
  kind: 'venta' | 'gasto',
  filtro: FiltroMovimientos,
  fecha: string,
): Promise<number> {
  return withTenant(businessId, (tx) => paginaDeFecha(tx, kind, filtro, fecha, POR_PAGINA));
}

export function loadMovimientos(
  businessId: string,
  kind: 'venta' | 'gasto',
  filtro: FiltroMovimientos,
  pagina: number,
): Promise<MovimientosVista> {
  return withTenant(businessId, async (tx) => {
    const sinCategoria = { ...filtro, clasificacion: null };
    const grupos = await resumenMovimientos(tx, kind, sinCategoria);
    const otro = await contarMovimientos(tx, kind === 'venta' ? 'gasto' : 'venta', sinCategoria);
    const total = filasDe(grupos, filtro.clasificacion);
    const actual = Math.min(Math.max(1, pagina), Math.max(1, Math.ceil(total / POR_PAGINA)));
    const filas = await listMovimientos(tx, kind, filtro, {
      limit: POR_PAGINA,
      offset: (actual - 1) * POR_PAGINA,
    });
    const tickets = filas.flatMap((f) => (f.ticketId === null ? [] : [f.ticketId]));
    const propios = filasDe(grupos, null);
    return {
      filas,
      grupos,
      conteos:
        kind === 'venta' ? { ventas: propios, gastos: otro } : { ventas: otro, gastos: propios },
      lineas: await lineasDeTickets(tx, tickets),
      pagina: actual,
      total,
    };
  });
}
