/**
 * TEMPORARY — N-55 Phase 0 spike. Delete once the question is answered.
 *
 * Vercel's docs list the `x-vercel-ip-*` geolocation headers with no plan
 * note, while an older Vercel KB article restricts the enrichment to
 * Pro/Enterprise. This team is on Hobby, so the whole geo feature depends on
 * an answer no document gives reliably: does a request to *this* deployment
 * carry a region?
 *
 * It reports only the caller's own coarse location — which the caller already
 * knows — and reads no database. The shared-secret check is here anyway so it
 * is not an open endpoint while it exists.
 */
export const dynamic = 'force-dynamic';

const HEADERS = [
  'x-vercel-ip-continent',
  'x-vercel-ip-country',
  'x-vercel-ip-country-region',
  'x-vercel-ip-city',
  'x-vercel-ip-latitude',
  'x-vercel-ip-longitude',
  'x-vercel-ip-timezone',
  'x-vercel-ip-postal-code',
] as const;

export function GET(request: Request): Response {
  const secret = process.env.ADMIN_INGEST_SECRET;
  if (secret !== undefined && request.headers.get('x-admin-secret') !== secret) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }
  const seen = Object.fromEntries(HEADERS.map((h) => [h, request.headers.get(h)]));
  return Response.json({ plan: 'hobby', seen }, { headers: { 'cache-control': 'no-store' } });
}
