/**
 * The digest's «Rechazos de sincronización (24 h)» section (N-10, B-18).
 *
 * The counting is B-18's `rejectionDigest(tx, since)` in @xangarro/data-pg —
 * unresolved rejections received since `since`, by code. The portal calls it
 * under a tenant's RLS; the console calls the same function as
 * `xangarro_admin`, whose `admin_read` policy (0007) makes it cross-tenant.
 * This file only shapes its rows for the email: codes and counts, never rows.
 */

export interface RejectionCount {
  readonly code: string;
  readonly n: number;
}

/** Port: `../db/rejections.ts` (Postgres) or a literal in tests. */
export interface RejectionSource {
  since(iso: string): Promise<readonly RejectionCount[]>;
}

export const REJECTION_WINDOW_HOURS = 24;

/** Codes listed before «y N más». */
export const REJECTION_CODE_CAP = 10;

/** `unavailable` when the read failed: the digest still goes out, and says so. */
export type RejectionSummary =
  | { readonly status: 'ok'; readonly total: number; readonly byCode: readonly RejectionCount[] }
  | { readonly status: 'unavailable' };

export const REJECTIONS_UNAVAILABLE: RejectionSummary = { status: 'unavailable' };

export class RejectionInputError extends Error {
  readonly code = 'INVALID_REJECTION_COUNT' as const;

  constructor(readonly received: RejectionCount) {
    super(`Conteo de rechazos inválido: ${JSON.stringify(received)}`);
    this.name = 'RejectionInputError';
  }
}

/** The instant the 24-hour window opens, as ISO-8601. */
export function rejectionWindowStart(now: Date): string {
  return new Date(now.getTime() - REJECTION_WINDOW_HOURS * 3_600_000).toISOString();
}

/**
 * Validates and orders the source's rows: most frequent first, then by code,
 * zero counts dropped. A negative, fractional or code-less row is a broken
 * source, not a quiet zero.
 */
export function summarizeRejections(rows: readonly RejectionCount[]): RejectionSummary {
  for (const r of rows) {
    if (r.code.trim() === '' || !Number.isInteger(r.n) || r.n < 0) {
      throw new RejectionInputError(r);
    }
  }
  const byCode = rows
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n || a.code.localeCompare(b.code));
  return { status: 'ok', total: byCode.reduce((sum, r) => sum + r.n, 0), byCode };
}

export interface RejectionSection {
  readonly title: string;
  readonly empty: string;
  readonly lines: readonly string[];
  readonly note?: string;
}

const WHERE = 'Por negocio: supabase/studio/unresolved-rejections.sql (docs/ops/back-office.md).';

/** The section's copy, shared by the text and HTML renderings. */
export function rejectionSection(s: RejectionSummary): RejectionSection {
  const title = `Rechazos de sincronización (${REJECTION_WINDOW_HOURS} h)`;
  if (s.status === 'unavailable') {
    return { title, empty: 'No disponible: no se pudo leer sync_rejections.', lines: [] };
  }
  const shown = s.byCode.slice(0, REJECTION_CODE_CAP).map((r) => `${r.code}: ${r.n}`);
  const rest = s.byCode.length - shown.length;
  return {
    title: `${title}: ${s.total}`,
    empty: 'Ningún rechazo sin resolver.',
    lines: rest > 0 ? [...shown, `y ${rest} códigos más`] : shown,
    ...(s.total > 0 ? { note: WHERE } : {}),
  };
}
