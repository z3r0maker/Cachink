import 'server-only';

import { ServiceBusyError } from '@xangarro/data-pg';

import { DeviceAuthError, RateLimitedError } from '../device/authenticate';
import { fail, rateLimited, serviceBusy } from './respond';

/**
 * The answer every device route gives when the caller is not let in: 401 for
 * a bad or revoked device, 429 for one over its allowance, 503 when the pool
 * could not serve it in time (DB3-SYNC-05). `null` for any other error, which
 * the route logs and reports as INTERNAL.
 */
export function deviceFailure(error: unknown): Response | null {
  if (error instanceof DeviceAuthError) return fail(error.code, error.code);
  if (error instanceof RateLimitedError) return rateLimited(error.retryAfter);
  if (error instanceof ServiceBusyError) return serviceBusy();
  return null;
}
