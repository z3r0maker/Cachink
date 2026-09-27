/**
 * Typed client for the device API (docs/plan/02-contracts.md §3–§7).
 *
 * Every call returns a discriminated result instead of throwing, so callers
 * (activation screen, sync orchestrator) branch on `ok` and on the contract
 * error code. Network failures, requests that hang past `timeoutMs` and
 * malformed responses map to `NETWORK` / `TIMEOUT` / `BAD_RESPONSE`, which
 * are not contract codes: they never come from the server. A failure carries
 * the server's `Retry-After` when it sent one (DB2-DEV-02).
 */

import {
  API_PATHS,
  ActivateResponseSchema,
  EntitlementResponseSchema,
  ErrorEnvelopeSchema,
  PullResponseSchema,
  PushResponseSchema,
  deviceHeaders,
  encodeJson,
  type ActivateRequest,
  type ActivateResponse,
  type Delta,
  type EntitlementResponse,
  type PullResponse,
  type PushResponse,
} from '@xangarro/contracts';
import type { z } from 'zod';
import { parseRetryAfter } from './retry-after.js';

export type ClientErrorCode = string | 'NETWORK' | 'TIMEOUT' | 'BAD_RESPONSE';

/** A hung request must not wedge the single-flight engine (DB2-DEV-02). */
export const DEFAULT_TIMEOUT_MS = 30_000;

export type ApiResult<T> =
  | { readonly ok: true; readonly data: T }
  | {
      readonly ok: false;
      readonly status: number;
      readonly code: ClientErrorCode;
      readonly message: string;
      /** How long the server asked us to wait (`Retry-After`), when it did. */
      readonly retryAfterMs?: number;
    };

export interface ApiClientOptions {
  readonly baseUrl: string;
  readonly fetchImpl?: typeof fetch;
  /** Extra headers on every request (e.g. `X-Mock-Scenario` in dev). */
  readonly extraHeaders?: Readonly<Record<string, string>>;
  /** Abort a request (body included) after this long; default 30 s. */
  readonly timeoutMs?: number;
}

interface CallSpec<S extends z.ZodType> {
  readonly method: 'GET' | 'POST';
  readonly path: string;
  readonly token?: string;
  readonly body?: unknown;
  readonly schema: S;
}

function failure(res: Response, body: unknown): ApiResult<never> {
  const retryAfterMs = parseRetryAfter(res.headers.get('Retry-After'), Date.now());
  const wait = retryAfterMs === undefined ? {} : { retryAfterMs };
  const env = ErrorEnvelopeSchema.safeParse(body);
  if (env.success)
    return {
      ok: false,
      status: res.status,
      code: env.data.error.code,
      message: env.data.error.message,
      ...wait,
    };
  return {
    ok: false,
    status: res.status,
    code: 'BAD_RESPONSE',
    message: `HTTP ${res.status}`,
    ...wait,
  };
}

function transportFailure(e: unknown, timedOut: boolean): ApiResult<never> {
  const message = e instanceof Error ? e.message : String(e);
  return { ok: false, status: 0, code: timedOut ? 'TIMEOUT' : 'NETWORK', message };
}

export class ApiClient {
  readonly #opts: ApiClientOptions;
  constructor(opts: ApiClientOptions) {
    this.#opts = opts;
  }

  async #call<S extends z.ZodType>(spec: CallSpec<S>): Promise<ApiResult<z.infer<S>>> {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), this.#opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    try {
      return await this.#exchange(spec, abort.signal);
    } catch (e) {
      return transportFailure(e, abort.signal.aborted);
    } finally {
      clearTimeout(timer);
    }
  }

  /** One request and its body, under `signal`; transport errors throw. */
  async #exchange<S extends z.ZodType>(
    spec: CallSpec<S>,
    signal: AbortSignal,
  ): Promise<ApiResult<z.infer<S>>> {
    const fetchImpl = this.#opts.fetchImpl ?? fetch;
    const headers = { ...deviceHeaders(spec.token), ...(this.#opts.extraHeaders ?? {}) };
    const res = await fetchImpl(`${this.#opts.baseUrl}${spec.path}`, {
      method: spec.method,
      headers,
      body: spec.body === undefined ? undefined : encodeJson(spec.body),
      signal,
    });
    const text = await res.text();
    let body: unknown;
    try {
      body = text ? (JSON.parse(text) as unknown) : null;
    } catch {
      return { ok: false, status: res.status, code: 'BAD_RESPONSE', message: 'invalid JSON' };
    }
    if (!res.ok) return failure(res, body);
    const parsed = spec.schema.safeParse(body);
    if (!parsed.success)
      return { ok: false, status: res.status, code: 'BAD_RESPONSE', message: parsed.error.message };
    return { ok: true, data: parsed.data };
  }

  activate(req: ActivateRequest): Promise<ApiResult<ActivateResponse>> {
    return this.#call({
      method: 'POST',
      path: API_PATHS.activate,
      body: req,
      schema: ActivateResponseSchema,
    });
  }

  push(token: string, deltas: readonly Delta[]): Promise<ApiResult<PushResponse>> {
    return this.#call({
      method: 'POST',
      path: API_PATHS.syncPush,
      token,
      body: { deltas },
      schema: PushResponseSchema,
    });
  }

  /** `snapshot`: `start` or a page's `next` token (C-23); omitted for an ordinary pull. */
  pull(token: string, since: number, snapshot?: string): Promise<ApiResult<PullResponse>> {
    const page = snapshot === undefined ? '' : `&snapshot=${encodeURIComponent(snapshot)}`;
    return this.#call({
      method: 'GET',
      path: `${API_PATHS.syncPull}?since=${since}${page}`,
      token,
      schema: PullResponseSchema,
    });
  }

  entitlement(token: string): Promise<ApiResult<EntitlementResponse>> {
    return this.#call({
      method: 'GET',
      path: API_PATHS.entitlement,
      token,
      schema: EntitlementResponseSchema,
    });
  }
}
