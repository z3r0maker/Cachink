/**
 * The tenant use cases' one error type (N-06). Every failure carries a `code`
 * the pages and server actions map to a Spanish message.
 */
export type TenantErrorCode = 'VALIDATION' | 'NOT_FOUND' | 'INVALID_CURSOR' | 'STORE_FAILED';

export class TenantError extends Error {
  constructor(
    readonly code: TenantErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'TenantError';
  }
}

/** Runs a store call, turning any infrastructure failure into `STORE_FAILED`. */
export async function tenantStore<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (cause) {
    throw new TenantError('STORE_FAILED', 'No se pudo leer o guardar el negocio.', { cause });
  }
}

export function invalidTenantInput(message: string): TenantError {
  return new TenantError('VALIDATION', message);
}
