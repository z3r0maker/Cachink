import 'server-only';

import * as Sentry from '@sentry/node';

/**
 * Where every server-side failure goes (B-18): Sentry, tagged so it can be
 * found by business and device, and one structured line on stdout.
 *
 * Only ids and codes are written — never an email, a PIN, a name or a row's
 * contents (the plan's no-PII rule). A Postgres error's `detail` can carry
 * column values, so it is not copied; its SQLSTATE `code` is.
 */
export interface ReportScope {
  /** What was running: a route (`sync/push`) or an action (`crearOperador`). */
  readonly endpoint: string;
  readonly businessId?: string;
  readonly deviceId?: string;
}

function describe(error: unknown): { name: string; message: string; code?: string } {
  const e = error as { name?: string; message?: string; code?: string; cause?: { code?: string } };
  const code = e?.code ?? e?.cause?.code;
  return {
    name: e?.name ?? typeof error,
    message: e?.message ?? String(error),
    ...(typeof code === 'string' ? { code } : {}),
  };
}

export function reportError(error: unknown, scope: ReportScope): void {
  Sentry.withScope((s) => {
    s.setTag('endpoint', scope.endpoint);
    if (scope.businessId !== undefined) s.setTag('business_id', scope.businessId);
    if (scope.deviceId !== undefined) s.setTag('device_id', scope.deviceId);
    Sentry.captureException(error);
  });
  console.error(
    JSON.stringify({
      evt: 'error',
      endpoint: scope.endpoint,
      business_id: scope.businessId,
      device_id: scope.deviceId,
      ...describe(error),
    }),
  );
}

/** One line per phone-API call: who, what, how long, what came of it. */
export interface ApiLine {
  readonly endpoint: string;
  readonly status: number;
  readonly ms: number;
  readonly businessId?: string;
  readonly deviceId?: string;
  readonly accepted?: number;
  readonly rejected?: number;
  /** Rejection codes → count, e.g. `{ FK_PRODUCT_MISSING: 1 }`. */
  readonly codes?: Readonly<Record<string, number>>;
  /** `/activate`'s real refusal, which the response may generalise (SEC-DEV-01). */
  readonly refusal?: string;
}

export function logApi(line: ApiLine): void {
  const { businessId, deviceId, ...rest } = line;
  console.log(
    JSON.stringify({ evt: 'api', business_id: businessId, device_id: deviceId, ...rest }),
  );
}
