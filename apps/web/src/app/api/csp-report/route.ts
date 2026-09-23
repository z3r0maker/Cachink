import { parseViolations } from '@/server/security/csp-report';

/**
 * `POST /api/csp-report` — where the browser sends CSP violations while the
 * portal's policy is report-only (SEC-WEB-01). One structured log line per
 * violation, and always 204: a reporting endpoint that errors teaches nothing.
 */
const MAX_BYTES = 16_384;

export async function POST(request: Request): Promise<Response> {
  const text = (await request.text()).slice(0, MAX_BYTES);
  let body: unknown = null;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 204 });
  }
  for (const v of parseViolations(body).slice(0, 10)) {
    console.log(JSON.stringify({ evt: 'csp', ...v }));
  }
  return new Response(null, { status: 204 });
}
