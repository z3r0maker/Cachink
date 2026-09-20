/**
 * Typed client for the device API (docs/plan/02-contracts.md §3–§7).
 *
 * Every call returns a discriminated result instead of throwing, so callers
 * (activation screen, sync orchestrator) branch on `ok` and on the contract
 * error code. Network failures and malformed responses map to
 * `NETWORK` / `BAD_RESPONSE`, which are not contract codes: they never come
 * from the server.
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

export type ClientErrorCode = string | 'NETWORK' | 'BAD_RESPONSE';

export type ApiResult<T> =
  | { readonly ok: true; readonly data: T }
  | {
      readonly ok: false;
      readonly status: number;
      readonly code: ClientErrorCode;
      readonly message: string;
    };

export interface ApiClientOptions {
  readonly baseUrl: string;
  readonly fetchImpl?: typeof fetch;
  /** Extra headers on every request (e.g. `X-Mock-Scenario` in dev). */
  readonly extraHeaders?: Readonly<Record<string, string>>;
}

interface CallSpec<S extends z.ZodType> {
  readonly method: 'GET' | 'POST';
  readonly path: string;
  readonly token?: string;
  readonly body?: unknown;
  readonly schema: S;
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  return text ? (JSON.parse(text) as unknown) : null;
}

function failure(status: number, body: unknown): ApiResult<never> {
  const env = ErrorEnvelopeSchema.safeParse(body);
  if (env.success)
    return { ok: false, status, code: env.data.error.code, message: env.data.error.message };
  return { ok: false, status, code: 'BAD_RESPONSE', message: `HTTP ${status}` };
}

export class ApiClient {
  readonly #opts: ApiClientOptions;
  constructor(opts: ApiClientOptions) {
    this.#opts = opts;
  }

  async #call<S extends z.ZodType>(spec: CallSpec<S>): Promise<ApiResult<z.infer<S>>> {
    const fetchImpl = this.#opts.fetchImpl ?? fetch;
    const headers = { ...deviceHeaders(spec.token), ...(this.#opts.extraHeaders ?? {}) };
    let res: Response;
    try {
      res = await fetchImpl(`${this.#opts.baseUrl}${spec.path}`, {
        method: spec.method,
        headers,
        body: spec.body === undefined ? undefined : encodeJson(spec.body),
      });
    } catch (e) {
      return {
        ok: false,
        status: 0,
        code: 'NETWORK',
        message: e instanceof Error ? e.message : String(e),
      };
    }
    let body: unknown;
    try {
      body = await readJson(res);
    } catch {
      return { ok: false, status: res.status, code: 'BAD_RESPONSE', message: 'invalid JSON' };
    }
    if (!res.ok) return failure(res.status, body);
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

  pull(token: string, since: number): Promise<ApiResult<PullResponse>> {
    return this.#call({
      method: 'GET',
      path: `${API_PATHS.syncPull}?since=${since}`,
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
