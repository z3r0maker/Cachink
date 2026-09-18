/**
 * The inbox use cases' one error type. Every failure carries a `code` the
 * server actions and the ingestion route map to a message or an HTTP status.
 */
export type SupportItemErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'ALREADY_RESOLVED'
  | 'CFDI_UUID_REQUIRED'
  | 'INVALID_CFDI_UUID'
  | 'INVALID_CURSOR'
  | 'STORE_FAILED';

export class SupportItemError extends Error {
  constructor(
    readonly code: SupportItemErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'SupportItemError';
  }
}

/** Runs a repository call, turning any infrastructure failure into `STORE_FAILED`. */
export async function store<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (cause) {
    throw new SupportItemError('STORE_FAILED', 'No se pudo leer o guardar el item.', { cause });
  }
}

/** The first zod issue as a short message, for logs and 400 bodies. */
export function invalid(message: string): SupportItemError {
  return new SupportItemError('VALIDATION', message);
}
