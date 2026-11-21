import 'server-only';

import * as Sentry from '@sentry/node';
import { describeError, redactError } from '@xangarro/config/error-report';

/**
 * Where every server-side failure goes (B-18): Sentry, tagged so it can be
 * found by business and device, and one structured line on stdout.
 *
 * Only ids and codes are written — never an email, a PIN, a name or a row's
 * contents (the plan's no-PII rule). A failed query is where that rule is
 * easiest to break (audit F-14): Drizzle's message is the SQL **and its bound
 * parameters**, and Postgres' `detail` quotes the row. So a database error is
 * logged and sent as its name, its SQLSTATE and the names of the constraint,
 * table and column, and nothing else; any other error keeps its message. The
 * rule itself is `@xangarro/config/error-report`, shared with the console.
 */
export interface ReportScope {
  /** What was running: a route (`sync/push`) or an action (`crearOperador`). */
  readonly endpoint: string;
  readonly businessId?: string;
  readonly deviceId?: string;
}

/**
 * Reports, and answers with the id of the Sentry event it sent: what a report
 * from Ayuda names as the session's last error (P-48, ADR-162 §8). Undefined
 * while Sentry is off: the SDK still mints an id then, but it names nothing.
 */
export function reportError(error: unknown, scope: ReportScope): string | undefined {
  const eventId = Sentry.withScope((s) => {
    s.setTag('endpoint', scope.endpoint);
    if (scope.businessId !== undefined) s.setTag('business_id', scope.businessId);
    if (scope.deviceId !== undefined) s.setTag('device_id', scope.deviceId);
    return Sentry.captureException(redactError(error));
  });
  console.error(
    JSON.stringify({
      evt: 'error',
      endpoint: scope.endpoint,
      business_id: scope.businessId,
      device_id: scope.deviceId,
      ...describeError(error),
    }),
  );
  return Sentry.isInitialized() ? eventId : undefined;
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
