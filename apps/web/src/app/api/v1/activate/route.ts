import { ActivateRequestSchema } from '@xangarro/contracts';

import { fail, ok, protocolRefusal, rateLimited } from '@/server/api/respond';
import { activate, Refusal } from '@/server/device/activate';
import { activateThrottle } from '@/server/device/activate-throttle';
import { publicRefusal } from '@/server/device/public-refusal';
import { hashPairingToken } from '@/lib/pairing-token';
import { logApi, reportError } from '@/server/observability/report';

/**
 * `POST /api/v1/activate` — a phone joins a business (contract §3).
 *
 * Only the HTTP layer lives here: the protocol header, parsing, and mapping a
 * refusal onto the contract's error envelope. The activation itself — the
 * atomic claim, the device row, the bootstrap, the signatures — is in
 * `server/device/activate.ts`.
 *
 * Two request shapes (C-14): the typed code + email, or a scanned pairing
 * token. Either way a wrong email is answered as `CODE_INVALID` (SEC-DEV-01).
 *
 * Wrong tries are throttled per IP and per code before anything else runs
 * (`activate-throttle.ts`). NO_DEVICE_SLOTS is not a wrong try: the code was
 * right, the plan was full.
 *
 * The acceptance is the contract's own conformance suite, run against this
 * server by `pnpm test:conformance` and in CI. The same assertions pass against
 * the mock and against the portal, or the portal does not implement the
 * phone's contract.
 */

/** What the per-credential lockout counts against: the typed code, or the scan token's hash. */
function credentialOf(body: unknown): string | null {
  const b = body as { code?: unknown; qrToken?: unknown } | null;
  if (typeof b?.code === 'string') return b.code;
  return typeof b?.qrToken === 'string' ? `qr:${hashPairingToken(b.qrToken).slice(0, 32)}` : null;
}

async function handle(request: Request): Promise<Response> {
  const refusal = protocolRefusal(request);
  if (refusal !== null) return refusal;

  const body: unknown = await request.json().catch(() => null);
  const throttle = activateThrottle(request, credentialOf(body));
  const wait = await throttle.wait();
  if (wait > 0) return rateLimited(wait);

  const parsed = ActivateRequestSchema.safeParse(body);
  if (!parsed.success) {
    await throttle.failed('CODE_INVALID');
    return fail('CODE_INVALID', parsed.error.issues.map((i) => i.message).join('; '));
  }

  try {
    return ok(await activate(parsed.data));
  } catch (error) {
    if (!(error instanceof Refusal)) {
      reportError(error, { endpoint: 'activate' });
      return fail('INTERNAL', 'No pudimos activar el dispositivo. Intenta de nuevo.');
    }
    const locked = await throttle.failed(error.code);
    if (locked > 0) return rateLimited(locked);
    // SEC-DEV-01: the log keeps the real reason; the caller gets the public one.
    refusals.set(request, error.code);
    const code = publicRefusal(error.code);
    return fail(code, code);
  }
}

/** The refusal each request really got, for its log line only. */
const refusals = new WeakMap<Request, string>();

/** One log line per attempt: status, timing and the real refusal — no email, no code (B-18). */
export async function POST(request: Request): Promise<Response> {
  const started = performance.now();
  const response = await handle(request);
  const refusal = refusals.get(request);
  logApi({
    endpoint: 'activate',
    status: response.status,
    ms: Math.round(performance.now() - started),
    ...(refusal === undefined ? {} : { refusal }),
  });
  return response;
}
