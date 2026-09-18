import { ActivateRequestSchema } from '@xangarro/contracts';

import { fail, ok, protocolRefusal } from '@/server/api/respond';
import { activate, Refusal } from '@/server/device/activate';

/**
 * `POST /api/v1/activate` — a phone joins a business (contract §3).
 *
 * Only the HTTP layer lives here: the protocol header, parsing, and mapping a
 * refusal onto the contract's error envelope. The activation itself — the
 * atomic claim, the device row, the bootstrap, the signatures — is in
 * `server/device/activate.ts`.
 *
 * The acceptance is the contract's own conformance suite, run against this
 * server by `pnpm test:conformance` and in CI. The same assertions pass against
 * the mock and against the portal, or the portal does not implement the
 * phone's contract.
 */

export async function POST(request: Request): Promise<Response> {
  const refusal = protocolRefusal(request);
  if (refusal !== null) return refusal;

  const parsed = ActivateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return fail('CODE_INVALID', parsed.error.issues.map((i) => i.message).join('; '));
  }

  try {
    return ok(await activate(parsed.data));
  } catch (error) {
    if (error instanceof Refusal) return fail(error.code, error.code);
    console.error('[activate]', error);
    return fail('INTERNAL', 'No pudimos activar el dispositivo. Intenta de nuevo.');
  }
}
