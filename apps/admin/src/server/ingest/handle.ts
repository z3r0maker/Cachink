/**
 * `POST /api/internal/support-items` — how other Xangarro services file an
 * inbox item (N-08): the `bug-report` function, the portal's «Ayuda» form,
 * «Solicitar factura», the Stripe webhook, N-03's limit alerts. Machine to
 * machine, so no staff session: a shared secret in a header, compared in
 * constant time, and the route is outside the staff gate (`isMachinePath`).
 *
 * Idempotent by `(source, sourceRef)`: 201 when filed, 200 with the same id on
 * a retry. The body shape is `NewSupportItemSchema` (`../inbox/create.ts`).
 */
import { createSupportItem, type CreateDeps } from '../inbox/create';
import { SupportItemError } from '../inbox/errors';
import type { SupportItemRepository } from '../inbox/port';
import { secretMatches } from './secret';

export const INGEST_SECRET_HEADER = 'x-admin-ingest-secret';
export const MAX_BODY_BYTES = 64 * 1024;

export interface IngestDeps {
  /** `ADMIN_INGEST_SECRET`; unset or empty closes the endpoint. */
  readonly secret: string | undefined;
  readonly repo: SupportItemRepository;
  readonly createDeps: CreateDeps;
}

const reply = (status: number, body: Record<string, unknown>) =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store' } });

async function readJson(
  req: Request,
): Promise<{ ok: true; value: unknown } | { ok: false; res: Response }> {
  const raw = await req.text();
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
    return { ok: false, res: reply(413, { error: 'too_large' }) };
  }
  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, res: reply(400, { error: 'invalid_json' }) };
  }
}

function failure(error: unknown): Response {
  if (error instanceof SupportItemError && error.code === 'VALIDATION') {
    return reply(400, { error: 'invalid_item', message: error.message });
  }
  console.error('support item ingest failed', error);
  return reply(500, { error: 'store_failed' });
}

export async function handleIngest(req: Request, deps: IngestDeps): Promise<Response> {
  if (!deps.secret) return reply(503, { error: 'ingest_disabled' });
  if (!secretMatches(req.headers.get(INGEST_SECRET_HEADER), deps.secret)) {
    return reply(401, { error: 'unauthorized' });
  }
  const body = await readJson(req);
  if (!body.ok) return body.res;
  try {
    const { item, created, notified } = await createSupportItem(
      deps.repo,
      body.value,
      deps.createDeps,
    );
    return reply(created ? 201 : 200, { id: item.id, created, notified });
  } catch (error) {
    return failure(error);
  }
}
