import { sql, type SQL } from 'drizzle-orm';

import { fechaEnDias } from './rango-fechas.js';

/**
 * What Ventas y gastos narrows by (P-09), applied **in SQL** so a page, its
 * counter and its KPIs answer for the same rows without shipping the
 * tenant's history to the browser (audit DB2-QRY-02).
 */
export interface FiltroMovimientos {
  /** First day, inclusive (`YYYY-MM-DD`); absent means open on that side. */
  readonly desde?: string | null;
  /** Last day, inclusive (`YYYY-MM-DD`); absent means open on that side. */
  readonly hasta?: string | null;
  /** A venta's payment method or an egreso's category; absent means all. */
  readonly clasificacion?: string | null;
  /** Case-insensitive substring of the concepto; blank means no search. */
  readonly buscar?: string | null;
}

/** `limit` rows after skipping `offset` — the screen's pages of ten. */
export interface PaginaMovimientos {
  readonly limit: number;
  readonly offset: number;
}

/** The most rows one page may ask for; a bigger `limit` is clamped. */
export const PAGINA_MAXIMA = 200;

/** `%`, `_` and `\` typed by a person are text, not LIKE wildcards. */
export function patronBusqueda(buscar: string): string {
  return `%${buscar.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

const texto = (v: string | null | undefined): string | null => {
  const t = v?.trim() ?? '';
  return t === '' ? null : t;
};

/**
 * The WHERE of the driving table, aliased `alias` (`s` for sales, `e` for
 * expenses). The venta's method lives on its ticket, so `metodo` is a
 * primary-key probe per candidate row rather than a join that would let the
 * planner drive from `tickets` (DB2-QRY-03). `conClasificacion: false` leaves
 * the category out, for the per-category summary that feeds the chips.
 */
export function condiciones(
  kind: 'venta' | 'gasto',
  filtro: FiltroMovimientos,
  conClasificacion = true,
): SQL {
  const a = sql.raw(kind === 'venta' ? 's' : 'e');
  const partes: SQL[] = [
    sql`${a}.deleted_at IS NULL`,
    fechaEnDias(sql`${a}.fecha`, texto(filtro.desde), texto(filtro.hasta)),
  ];
  const buscar = texto(filtro.buscar);
  if (buscar !== null) partes.push(sql`${a}.concepto ILIKE ${patronBusqueda(buscar)}`);
  const clasificacion = conClasificacion ? texto(filtro.clasificacion) : null;
  if (clasificacion !== null) {
    partes.push(
      kind === 'venta'
        ? sql`EXISTS (SELECT 1 FROM tickets tc WHERE tc.id = s.ticket_id AND tc.metodo = ${clasificacion})`
        : sql`e.categoria = ${clasificacion}`,
    );
  }
  return sql.join(partes, sql` AND `);
}

export function acotar(pagina: PaginaMovimientos): PaginaMovimientos {
  return {
    limit: Math.max(1, Math.min(PAGINA_MAXIMA, Math.trunc(pagina.limit))),
    offset: Math.max(0, Math.trunc(pagina.offset)),
  };
}
