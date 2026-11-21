/**
 * A stand-in for the console's `POST /api/internal/support-items` (N-08), for
 * the portal's E2E suite.
 *
 * The portal files inbox items over HTTP to the admin console, which this
 * suite does not run. Without `ADMIN_INGEST_URL` an item becomes a log line,
 * and a spec could only assert the confirmation on screen. With this the item
 * really leaves the portal on its real wire (`httpSupportInbox`), and a spec
 * reads back what was filed (`./ingest.ts`).
 *
 * It keeps the console's contract and nothing of its rules: the shared secret
 * in `x-admin-ingest-secret`, 201 when filed, 200 for the same
 * `(source, sourceRef)` again, 401 without the secret. Items live in memory
 * and are read back by business. The console's own validation, storage and
 * inbox are its suite's to prove (`apps/backoffice`).
 */
import { createServer } from 'node:http';

const PORT = Number(process.env.INGEST_STUB_PORT);
const SECRET = process.env.INGEST_STUB_SECRET ?? '';
const HEADER = 'x-admin-ingest-secret';
const MAX_BYTES = 64 * 1024;

/** `(source, sourceRef)` → the item, as the console keys its idempotency. */
const items = new Map();

function reply(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function read(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BYTES) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function file(req, res) {
  const raw = await read(req);
  if (raw === null) return reply(res, 413, { error: 'too_large' });
  let item;
  try {
    item = JSON.parse(raw);
  } catch {
    return reply(res, 400, { error: 'invalid_json' });
  }
  const key = `${item.source}|${item.sourceRef}`;
  const created = !items.has(key);
  if (created) items.set(key, item);
  return reply(res, created ? 201 : 200, { id: key, created });
}

function list(url, res) {
  const businessId = url.searchParams.get('businessId');
  reply(
    res,
    200,
    [...items.values()].filter((item) => item.businessId === businessId),
  );
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`);
  if (url.pathname === '/health') return reply(res, 200, { ok: true });
  if (SECRET === '' || req.headers[HEADER] !== SECRET) {
    return reply(res, 401, { error: 'unauthorized' });
  }
  if (req.method === 'POST' && url.pathname === '/api/internal/support-items') {
    return file(req, res).catch(() => reply(res, 500, { error: 'store_failed' }));
  }
  if (req.method === 'GET' && url.pathname === '/items') return list(url, res);
  return reply(res, 404, { error: 'not_found' });
});

server.listen(PORT, '127.0.0.1');
