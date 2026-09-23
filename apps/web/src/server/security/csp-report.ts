/**
 * What `/api/csp-report` keeps of a violation (SEC-WEB-01): the directive,
 * where the blocked thing came from (an origin, or «inline» / «eval»), and the
 * page's path — never a query string, a full URL or a script sample, which
 * could carry a token or a customer's data.
 */
export interface CspViolation {
  readonly directive: string;
  readonly blocked: string;
  readonly path: string;
}

const MAX = 120;
const clip = (s: string): string => s.slice(0, MAX);

function originOf(raw: string): string {
  if (raw === '' || raw === 'inline' || raw === 'eval' || raw === 'wasm-eval')
    return raw || 'unknown';
  try {
    return new URL(raw).origin;
  } catch {
    return clip(raw.split(/[?#]/)[0] ?? 'unknown');
  }
}

function pathOf(raw: string): string {
  try {
    return new URL(raw).pathname;
  } catch {
    return 'unknown';
  }
}

/** Accepts the legacy `{ "csp-report": … }` body and the Reporting API's array. */
export function parseViolations(body: unknown): CspViolation[] {
  const items = Array.isArray(body)
    ? body.map((r) => (r as { body?: unknown }).body)
    : [(body as Record<string, unknown> | null)?.['csp-report']];
  return items.flatMap((raw) => {
    if (raw === null || typeof raw !== 'object') return [];
    const r = raw as Record<string, unknown>;
    const pick = (a: string, b: string): string => String(r[a] ?? r[b] ?? '');
    return [
      {
        directive: clip(
          pick('effective-directive', 'effectiveDirective') ||
            pick('violated-directive', 'violatedDirective'),
        ),
        blocked: originOf(pick('blocked-uri', 'blockedURL')),
        path: clip(pathOf(pick('document-uri', 'documentURL'))),
      },
    ];
  });
}
