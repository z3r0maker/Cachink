/**
 * Error envelope shared by every `/api/v1/*` endpoint (docs/plan/02-contracts.md §1).
 *
 * The full per-endpoint catalog (`ERROR_CATALOG`, retryability, i18n keys)
 * lands in C-07; this module only fixes the envelope shape and the one rule
 * both sides already agree on: 5xx is retryable, 4xx is terminal, unless the
 * code says otherwise.
 */

import { z } from 'zod';

export const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string().regex(/^[A-Z][A-Z0-9_]*$/, 'UPPER_SNAKE code'),
    message: z.string().min(1),
    details: z.unknown().optional(),
  }),
});
export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

export interface ErrorCatalogEntry {
  readonly httpStatus: number;
  readonly retryable: boolean;
  /** i18n key under `sync.errors.*` in `es-mx.ts` (A-08) and the portal (P-11). */
  readonly userMessageKey: string;
}

/**
 * Single source of truth for every code the API can emit (§3, §4, §7).
 * Per-row rejection codes and envelope codes share this table.
 */
export const ERROR_CATALOG = {
  // envelope / auth / transport
  PROTOCOL_UNSUPPORTED: {
    httpStatus: 426,
    retryable: false,
    userMessageKey: 'sync.errors.protocol',
  },
  UNAUTHENTICATED: {
    httpStatus: 401,
    retryable: false,
    userMessageKey: 'sync.errors.unauthenticated',
  },
  DEVICE_REVOKED: {
    httpStatus: 401,
    retryable: false,
    userMessageKey: 'sync.errors.deviceRevoked',
  },
  RATE_LIMITED: { httpStatus: 429, retryable: true, userMessageKey: 'sync.errors.rateLimited' },
  INTERNAL: { httpStatus: 500, retryable: true, userMessageKey: 'sync.errors.internal' },
  // activate
  CODE_INVALID: {
    httpStatus: 400,
    retryable: false,
    userMessageKey: 'activate.errors.codeInvalid',
  },
  CODE_EXPIRED: {
    httpStatus: 410,
    retryable: false,
    userMessageKey: 'activate.errors.codeExpired',
  },
  CODE_USED: { httpStatus: 409, retryable: false, userMessageKey: 'activate.errors.codeUsed' },
  EMAIL_MISMATCH: {
    httpStatus: 403,
    retryable: false,
    userMessageKey: 'activate.errors.codeInvalid',
  },
  NO_DEVICE_SLOTS: { httpStatus: 402, retryable: false, userMessageKey: 'activate.errors.noSlots' },
  BUSINESS_SUSPENDED: {
    httpStatus: 423,
    retryable: false,
    userMessageKey: 'activate.errors.suspended',
  },
  // per-row push outcomes
  VALIDATION: { httpStatus: 200, retryable: false, userMessageKey: 'sync.errors.validation' },
  BUSINESS_MISMATCH: {
    httpStatus: 200,
    retryable: false,
    userMessageKey: 'sync.errors.businessMismatch',
  },
  TABLE_NOT_WRITABLE: {
    httpStatus: 200,
    retryable: false,
    userMessageKey: 'sync.errors.tableNotWritable',
  },
  HYBRID_UPDATE_FORBIDDEN: {
    httpStatus: 200,
    retryable: false,
    userMessageKey: 'sync.errors.hybridUpdate',
  },
  FK_PRODUCT_MISSING: {
    httpStatus: 200,
    retryable: false,
    userMessageKey: 'sync.errors.fkProduct',
  },
  FK_USER_MISSING: { httpStatus: 200, retryable: false, userMessageKey: 'sync.errors.fkUser' },
  FK_CLIENT_MISSING: { httpStatus: 200, retryable: false, userMessageKey: 'sync.errors.fkClient' },
  DUPLICATE_CONFLICT: {
    httpStatus: 200,
    retryable: false,
    userMessageKey: 'sync.errors.duplicate',
  },
} as const satisfies Record<string, ErrorCatalogEntry>;

export type ErrorCode = keyof typeof ERROR_CATALOG;
export const ERROR_CODES = Object.keys(ERROR_CATALOG) as readonly ErrorCode[];
export const ErrorCodeSchema = z.enum(ERROR_CODES as [ErrorCode, ...ErrorCode[]]);

export function isKnownErrorCode(code: string): code is ErrorCode {
  return Object.prototype.hasOwnProperty.call(ERROR_CATALOG, code);
}

/**
 * Retryability: the catalog decides for known codes; unknown codes fall back
 * to "5xx retryable, 4xx terminal" (§1).
 */
export function isRetryableError(code: string, httpStatus: number): boolean {
  if (isKnownErrorCode(code)) return ERROR_CATALOG[code].retryable;
  return httpStatus >= 500;
}
