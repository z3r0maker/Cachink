import {
  ActivateRequestSchema,
  encodeJson,
  ERROR_CATALOG,
  HEADER_PROTOCOL,
  PROTOCOL_VERSION,
} from '@xangarro/contracts';

import { activate, Refusal, type ActivateErrorCode } from '@/server/device/activate';

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

function fail(code: ActivateErrorCode, message: string): Response {
  return new Response(encodeJson({ error: { code, message } }), {
    status: ERROR_CATALOG[code].httpStatus,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request): Promise<Response> {
  if (request.headers.get(HEADER_PROTOCOL) !== String(PROTOCOL_VERSION)) {
    return fail('PROTOCOL_UNSUPPORTED', `Send ${HEADER_PROTOCOL}: ${PROTOCOL_VERSION}`);
  }

  const parsed = ActivateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return fail('CODE_INVALID', parsed.error.issues.map((i) => i.message).join('; '));
  }

  try {
    const body = await activate(parsed.data);
    return new Response(encodeJson(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof Refusal) return fail(error.code, error.code);
    console.error('[activate]', error);
    return fail('INTERNAL', 'No pudimos activar el dispositivo. Intenta de nuevo.');
  }
}
