import { handleBugReport, handleErrors, json, type IngestStore } from './handlers.ts';

/**
 * The request pipeline (F-10): CORS preflight, method, body size, JSON, then
 * the route by the last path segment. The store is created lazily so a request
 * refused before the route never touches the service-role client.
 */
export const MAX_BODY_BYTES = 100 * 1024;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function readBody(req: Request): Promise<unknown> {
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) return json({ error: 'Payload too large' }, 413);
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) return json({ error: 'Payload too large' }, 413);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
}

export async function route(
  req: Request,
  store: () => IngestStore,
  now: () => number = Date.now,
): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body = await readBody(req);
  if (body instanceof Response) return body;

  const path = new URL(req.url).pathname.split('/').pop();
  try {
    if (path === 'errors') return await handleErrors(body, store(), now());
    if (path === 'bug-reports') return await handleBugReport(body, store(), now());
    return json({ error: 'Not found' }, 404);
  } catch (err) {
    console.error('Unhandled error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
}
