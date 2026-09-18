/**
 * The platform-flag use cases' one error type (N-09). Every failure carries a
 * `code` the page and the server action map to a Spanish message.
 */
export type FlagErrorCode =
  | 'VALIDATION'
  | 'NO_CHANGE'
  | 'NEEDS_CONFIRMATION'
  | 'UNKNOWN_TENANT'
  | 'STORE_FAILED';

export class FlagError extends Error {
  constructor(
    readonly code: FlagErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'FlagError';
  }
}

/** Runs a store call, turning any infrastructure failure into `STORE_FAILED`. */
export async function flagStore<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (cause) {
    throw new FlagError('STORE_FAILED', 'No se pudo leer o guardar el flag.', { cause });
  }
}
