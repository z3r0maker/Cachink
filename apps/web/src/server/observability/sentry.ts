import 'server-only';

import * as Sentry from '@sentry/node';
import type { ErrorEvent, NodeOptions } from '@sentry/node';

/**
 * Sentry for the portal and the phone API (B-18).
 *
 * Off unless `SENTRY_DSN` is set, so local runs and CI send nothing. Events
 * carry **ids, never people**: no request cookies, headers, query or body, no
 * user, no breadcrumbs of console output — a session token or an email in a
 * header must not reach a third party. Tags (`business_id`, `device_id`,
 * `endpoint`) are what an event is found by.
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  const { request, user: _user, breadcrumbs: _breadcrumbs, ...rest } = event;
  return request === undefined
    ? rest
    : { ...rest, request: { method: request.method, url: request.url?.split('?')[0] } };
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
