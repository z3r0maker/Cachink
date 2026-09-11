/**
 * Transport constants (docs/plan/02-contracts.md §1).
 */

export const PROTOCOL_VERSION = 1 as const;
export const HEADER_PROTOCOL = 'X-Xangarro-Protocol' as const;
export const HEADER_BUSINESS = 'X-Business-Id' as const;
export const API_PREFIX = '/api/v1' as const;

export const API_PATHS = {
  activate: `${API_PREFIX}/activate`,
  syncPush: `${API_PREFIX}/sync/push`,
  syncPull: `${API_PREFIX}/sync/pull`,
  entitlement: `${API_PREFIX}/entitlement`,
} as const;

/** Per-device token bucket the server enforces (§1). */
export const RATE_LIMIT_PER_MINUTE = 60 as const;

/** Largest push batch the server accepts (§4). */
export const MAX_PUSH_DELTAS = 500 as const;

/** Rows per table per pull page before the server truncates and asks for another page (§5). */
export const MAX_PULL_ROWS_PER_TABLE = 5_000 as const;

/** Headers every device call carries (bearer token added by the caller except on /activate). */
export function deviceHeaders(deviceToken?: string): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    [HEADER_PROTOCOL]: String(PROTOCOL_VERSION),
  };
  if (deviceToken) h['Authorization'] = `Bearer ${deviceToken}`;
  return h;
}
