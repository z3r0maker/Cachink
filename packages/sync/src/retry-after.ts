/**
 * `Retry-After` (RFC 9110 §10.2.3): delay-seconds or an HTTP-date. The
 * server sends it with 429 (`rateLimited`, B-17) and with 503 (ADR-122); the
 * engine backs off by it (DB2-DEV-02). Unparseable → undefined.
 *
 * An HTTP-date is a moment on the server's clock, so it is measured against
 * the response's own `Date` when there is one, and otherwise against the
 * device clock — which can be hours off — clamped to `MAX_DATE_WAIT_MS`
 * either way (DB3-L-02). Delay-seconds need no clock and are left alone.
 */

/** The longest a date-based Retry-After can hold a device back. */
export const MAX_DATE_WAIT_MS = 5 * 60_000;

export function parseRetryAfter(
  value: string | null,
  nowMs: number,
  serverDate: string | null = null,
): number | undefined {
  if (value === null) return undefined;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 1000;
  const at = Date.parse(trimmed);
  if (Number.isNaN(at)) return undefined;
  const serverNow = serverDate === null ? Number.NaN : Date.parse(serverDate);
  const from = Number.isNaN(serverNow) ? nowMs : serverNow;
  return Math.min(Math.max(0, at - from), MAX_DATE_WAIT_MS);
}
