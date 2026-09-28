import { esIsoDate } from '@xangarro/domain';

import type { RangoChip } from './periodo';

/**
 * Ventas y gastos keeps its filters in the URL (DB2-QRY-02): the server
 * reads one page of the filtered rows and the period's summary, instead of
 * the browser receiving the tenant's whole history to filter and sum.
 *
 * Everything here arrives from a URL a person can type, so it is parsed —
 * anything unrecognised falls back to the default rather than reaching SQL.
 */
export type TabKey = 'ventas' | 'gastos';

export interface EstadoMovimientos {
  readonly tab: TabKey;
  readonly rango: RangoChip;
  /** Personalizado's dates, `YYYY-MM-DD` or '' for open on that side. */
  readonly desde: string;
  readonly hasta: string;
  /** The category chip, or null for «Todos». */
  readonly cat: string | null;
  readonly q: string;
  /** 1-based. */
  readonly pagina: number;
  /**
   * «Ir a fecha» (DS-01): a day whose page the server opens, then drops from
   * the URL — the page redirects to `?pagina=N`, so paging goes on from there.
   */
  readonly ir: string;
}

export interface ParamsMovimientos {
  readonly tab?: string;
  readonly rango?: string;
  readonly desde?: string;
  readonly hasta?: string;
  readonly cat?: string;
  readonly q?: string;
  readonly pagina?: string;
  readonly ir?: string;
}

const RANGOS: readonly RangoChip[] = ['hoy', 'semana', 'mes', 'personalizado'];
const corto = (v: string | undefined, max: number): string => (v ?? '').trim().slice(0, max);

export function leerEstado(p: ParamsMovimientos): EstadoMovimientos {
  const pagina = Number.parseInt(p.pagina ?? '', 10);
  const cat = corto(p.cat, 60);
  return {
    tab: p.tab === 'gastos' ? 'gastos' : 'ventas',
    rango: RANGOS.find((r) => r === p.rango) ?? 'mes',
    // A real day or nothing: `2026-02-30` would roll into March (R3-14).
    desde: esIsoDate(p.desde) ? p.desde : '',
    hasta: esIsoDate(p.hasta) ? p.hasta : '',
    cat: cat === '' ? null : cat,
    q: corto(p.q, 80),
    pagina: Number.isFinite(pagina) && pagina > 0 ? pagina : 1,
    ir: esIsoDate(p.ir) ? p.ir : '',
  };
}

/** The URL for a state, leaving defaults out so the plain link stays plain. */
export function urlDe(e: EstadoMovimientos): string {
  const p = new URLSearchParams();
  if (e.tab === 'gastos') p.set('tab', 'gastos');
  if (e.rango !== 'mes') p.set('rango', e.rango);
  if (e.rango === 'personalizado' && e.desde !== '') p.set('desde', e.desde);
  if (e.rango === 'personalizado' && e.hasta !== '') p.set('hasta', e.hasta);
  if (e.cat !== null) p.set('cat', e.cat);
  if (e.q !== '') p.set('q', e.q);
  if (e.pagina > 1) p.set('pagina', String(e.pagina));
  const qs = p.toString();
  return qs === '' ? '/movimientos' : `/movimientos?${qs}`;
}
