/**
 * The digest's «Negocios sobre su límite» section (N-10, ADR-065): tenants at
 * or past 100 % of a plan limit this month, from the same `listUsage` rule
 * the console's /uso page shows (`over-limit-source.ts`). Never blocks
 * anything — ADR-065 never blocks a sale — it tells staff whom to talk to.
 */

export interface OverLimitRow {
  readonly nombre: string;
  /** The effective plan's name, or null when billing does not know it. */
  readonly plan: string | null;
  /** The highest percent across the plan's metrics, rounded. */
  readonly percent: number;
  /** Over two months running: the «sugerir upgrade» case (ADR-065). */
  readonly twoMonths: boolean;
}

/** Port: `over-limit-source.ts` (Postgres) or a literal in tests. */
export interface OverLimitSource {
  list(now: Date): Promise<{ readonly rows: readonly OverLimitRow[]; readonly partial: boolean }>;
}

export type OverLimitSummary =
  | { readonly status: 'ok'; readonly rows: readonly OverLimitRow[]; readonly partial: boolean }
  | { readonly status: 'unavailable' };

export const OVER_LIMIT_UNAVAILABLE: OverLimitSummary = { status: 'unavailable' };

/** Tenants listed before «y N más». */
export const OVER_LIMIT_CAP = 10;

export interface OverLimitSection {
  readonly title: string;
  readonly empty: string;
  readonly lines: readonly string[];
  readonly note?: string;
}

function line(r: OverLimitRow): string {
  const plan = r.plan === null ? '' : ` · ${r.plan}`;
  return `${r.nombre}${plan} · ${r.percent} %${r.twoMonths ? ' · 2 meses seguidos' : ''}`;
}

/** Worst first, then by name: the tenant most over is the first call to make. */
export function overLimitSection(s: OverLimitSummary, consoleUrl: string): OverLimitSection {
  const title = 'Negocios sobre su límite';
  if (s.status === 'unavailable') {
    return { title, empty: 'No disponible: no se pudo leer el uso del mes.', lines: [] };
  }
  const sorted = [...s.rows].sort(
    (a, b) => b.percent - a.percent || a.nombre.localeCompare(b.nombre),
  );
  const shown = sorted.slice(0, OVER_LIMIT_CAP).map(line);
  const rest = sorted.length - shown.length;
  const more = s.partial ? 'y posiblemente más' : `y ${rest} más`;
  return {
    title: `${title}: ${s.rows.length}${s.partial ? '+' : ''}`,
    empty: 'Ningún negocio sobre su límite este mes.',
    lines: rest > 0 || s.partial ? [...shown, more] : shown,
    ...(s.rows.length > 0
      ? { note: `Detalle y a quién sugerir upgrade: ${consoleUrl}/uso?filtro=sobre` }
      : {}),
  };
}
