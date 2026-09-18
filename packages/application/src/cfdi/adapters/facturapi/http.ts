/**
 * Minimal HTTP seam for the Facturapi adapter. The composition root passes
 * the platform `fetch` (Node ≥ 18 / Next.js); tests pass a scripted fake.
 * Typed structurally so the package needs neither DOM lib nor @types/node.
 */

import {
  CfdiError,
  CfdiProviderRejectedError,
  CfdiProviderUnavailableError,
} from '../../errors.js';

export interface HttpRequestInit {
  readonly method: 'GET' | 'POST' | 'DELETE';
  readonly headers: Record<string, string>;
  readonly body?: string;
}

export interface HttpResponse {
  readonly status: number;
  readonly ok: boolean;
  json(): Promise<unknown>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export type HttpFetch = (url: string, init: HttpRequestInit) => Promise<HttpResponse>;

interface FacturapiErrorBody {
  readonly code?: unknown;
  readonly message?: unknown;
  readonly errors?: unknown;
}

function detailsOf(errors: unknown): string[] {
  if (!Array.isArray(errors)) return [];
  return errors
    .map((e: unknown) => (e && typeof e === 'object' ? (e as { message?: unknown }).message : null))
    .filter((m): m is string => typeof m === 'string');
}

async function readErrorBody(response: HttpResponse): Promise<FacturapiErrorBody> {
  try {
    const body = await response.json();
    return body && typeof body === 'object' ? (body as FacturapiErrorBody) : {};
  } catch {
    return {};
  }
}

/** Classify a non-2xx Facturapi response into a typed CFDI error. */
export async function toCfdiError(response: HttpResponse): Promise<CfdiError> {
  const body = await readErrorBody(response);
  const code = typeof body.code === 'string' ? body.code : `http_${response.status}`;
  const message =
    typeof body.message === 'string' ? body.message : `Facturapi HTTP ${response.status}`;
  if (response.status === 401 || response.status === 403) {
    return new CfdiError('CFDI_PROVIDER_AUTH', `Facturapi: ${message}`);
  }
  const retryable =
    response.status >= 500 ||
    response.status === 429 ||
    response.status === 409 ||
    code === 'idempotency_key_in_use';
  if (retryable) return new CfdiProviderUnavailableError(`Facturapi: ${message}`);
  return new CfdiProviderRejectedError(code, message, detailsOf(body.errors));
}

/** Perform a request; network failures become retryable errors. */
export async function send(
  fetchFn: HttpFetch,
  url: string,
  init: HttpRequestInit,
): Promise<HttpResponse> {
  let response: HttpResponse;
  try {
    response = await fetchFn(url, init);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new CfdiProviderUnavailableError(`Facturapi inalcanzable: ${reason}`);
  }
  if (!response.ok) throw await toCfdiError(response);
  return response;
}
