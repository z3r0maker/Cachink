import { ActivateRequestSchema } from '@xangarro/contracts';

import { fail, ok, protocolRefusal, rateLimited } from '@/server/api/respond';
import { activate, Refusal } from '@/server/device/activate';
import { activateThrottle } from '@/server/device/activate-throttle';

/**
 * `POST /api/v1/activate` — a phone joins a business (contract §3).
 *
 * Only the HTTP layer lives here: the protocol header, parsing, and mapping a
 * refusal onto the contract's error envelope. The activation itself — the
 * atomic claim, the device row, the bootstrap, the signatures — is in
 * `server/device/activate.ts`.
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

function codeOf(body: unknown): string | null {
  const code = (body as { code?: unknown } | null)?.code;
  return typeof code === 'string' ? code : null;
}

export async function POST(request: Request): Promise<Response> {
  const refusal = protocolRefusal(request);
  if (refusal !== null) return refusal;

  const body: unknown = await request.json().catch(() => null);
  const throttle = activateThrottle(request, codeOf(body));
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
      console.error('[activate]', error);
      return fail('INTERNAL', 'No pudimos activar el dispositivo. Intenta de nuevo.');
    }
    const locked = await throttle.failed(error.code);
    return locked > 0 ? rateLimited(locked) : fail(error.code, error.code);
  }
}
