import 'server-only';

import { encodeJson, ERROR_CATALOG, HEADER_PROTOCOL, PROTOCOL_VERSION } from '@xangarro/contracts';

/**
 * The phone API's two response shapes (contract §1), in one place.
 *
 * The status comes from `ERROR_CATALOG`: a route that picked its own status for
 * `DEVICE_REVOKED` would be a second opinion on the contract, and the phone
 * decides whether to retry from the status.
 */
export type ApiErrorCode = keyof typeof ERROR_CATALOG;

/**
 * `status` overrides the catalog only where the contract says a code means
 * something else as a whole-request answer: `VALIDATION` is a per-row code
 * (200), but a batch that fails the schema is refused outright with 400 (§4).
 */
export function fail(code: ApiErrorCode, message: string, status?: number): Response {
  return new Response(encodeJson({ error: { code, message } }), {
    status: status ?? ERROR_CATALOG[code].httpStatus,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** `encodeJson`, so bigint money survives the wire; never cached. */
export function ok(body: unknown): Response {
  return new Response(encodeJson(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/** `null` when the request speaks this protocol; the refusal otherwise. */
export function protocolRefusal(request: Request): Response | null {
  return request.headers.get(HEADER_PROTOCOL) === String(PROTOCOL_VERSION)
    ? null
    : fail('PROTOCOL_UNSUPPORTED', `Send ${HEADER_PROTOCOL}: ${PROTOCOL_VERSION}`);
}

/** 429 with the `Retry-After` the phone backs off by (§1, B-17). */
export function rateLimited(retryAfter: number): Response {
  const response = fail('RATE_LIMITED', 'Demasiadas solicitudes. Intenta más tarde.');
  response.headers.set('Retry-After', String(retryAfter));
  return response;
}
