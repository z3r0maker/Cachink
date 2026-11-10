import 'server-only';

import * as Sentry from '@sentry/node';
import type { ErrorEvent, EventHint, NodeOptions } from '@sentry/node';
import {
  databaseSummary,
  describeError,
  isDatabaseError,
  mentionsQuery,
} from '@xangarro/config/error-report';

/**
 * Sentry for the portal and the phone API (B-18).
 *
 * Off unless `SENTRY_DSN` is set, so local runs and CI send nothing. Events
 * carry **ids, never people**: no request cookies, headers, query or body, no
 * user, no breadcrumbs of console output — a session token or an email in a
 * header must not reach a third party. Tags (`business_id`, `device_id`,
 * `endpoint`) are what an event is found by.
 *
 * Nor a failed query's own words (audit F-14): Drizzle's message is the SQL
 * and its parameters. `reportError` already hands over a redacted copy; this
 * is the last gate, for an error that reaches the SDK by any other path.
 */
type Exceptions = NonNullable<ErrorEvent['exception']>;

/** A database error's values, said in the summary's words and no others. */
function scrubException(exception: Exceptions, original: unknown): Exceptions {
  const database = isDatabaseError(original);
  const { name } = describeError(original);
  return {
    ...exception,
    values: exception.values?.map((value) => {
      if (database) return { ...value, type: name, value: databaseSummary(original) };
      return mentionsQuery(value.value) ? { ...value, value: 'database error' } : value;
    }),
  };
}

export function scrubEvent(event: ErrorEvent, hint?: EventHint): ErrorEvent {
  const { request, user: _user, breadcrumbs: _breadcrumbs, exception, message, ...rest } = event;
  return {
    ...rest,
    ...(message === undefined
      ? {}
      : { message: mentionsQuery(message) ? 'database error' : message }),
    ...(exception === undefined
      ? {}
      : { exception: scrubException(exception, hint?.originalException) }),
    ...(request === undefined
      ? {}
      : { request: { method: request.method, url: request.url?.split('?')[0] } }),
  };
}

export function initSentry(
  options: { dsn?: string; transport?: NodeOptions['transport'] } = {},
): boolean {
  const dsn = options.dsn ?? process.env.SENTRY_DSN;
  if (dsn === undefined || dsn === '') return false;
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    defaultIntegrations: false,
    beforeSend: scrubEvent,
    ...(options.transport === undefined ? {} : { transport: options.transport }),
  });
  return true;
}
