/**
 * `Retry-After` (RFC 9110 §10.2.3): delay-seconds or an HTTP-date. The
 * server sends it with 429 (`rateLimited`, B-17) and may send it with 503;
 * the engine backs off by it (DB2-DEV-02). Unparseable → undefined.
 */
export function parseRetryAfter(value: string | null, nowMs: number): number | undefined {
  if (value === null) return undefined;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 1000;
  const at = Date.parse(trimmed);
  if (Number.isNaN(at)) return undefined;
  return Math.max(0, at - nowMs);
}
