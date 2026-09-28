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
  /**
   * Case-insensitive substring of the concepto or the operator's name, or a
   * venta's exact folio («412», «#412», «folio 412»); blank means no search.
   */
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

/** The folio a search names («412», «#412», «folio 412»), or null. Nine digits fit an int4. */
export function folioBuscado(buscar: string): number | null {
  const m = /^(?:folio\s*)?#?\s*(\d{1,9})$/i.exec(buscar.trim());
  return m?.[1] === undefined ? null : Number(m[1]);
}

/**
 * The search, per driving table. The operator lives on the row's shift, so the
 * shifts whose operator matches are found once (a hashed subplan over a few
 * rows) and each candidate row makes one probe, not a three-table join.
 */
function busqueda(kind: 'venta' | 'gasto', buscar: string): SQL {
  const patron = patronBusqueda(buscar);
  const turnos = sql`SELECT ct.id FROM caja_turnos ct JOIN users u ON u.id = ct.user_id WHERE u.nombre ILIKE ${patron}`;
  if (kind === 'gasto') return sql`(e.concepto ILIKE ${patron} OR e.caja_turno_id IN (${turnos}))`;
  const folio = folioBuscado(buscar);
  const porFolio = folio === null ? sql`FALSE` : sql`tb.folio = ${folio}`;
  return sql`(s.concepto ILIKE ${patron} OR EXISTS (SELECT 1 FROM tickets tb WHERE tb.id = s.ticket_id AND (${porFolio} OR tb.caja_turno_id IN (${turnos}))))`;
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
  if (buscar !== null) partes.push(busqueda(kind, buscar));
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
