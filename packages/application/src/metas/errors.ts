/** Metas' typed errors — each one is a state the screen renders. */
export type MetaErrorCode = 'NEGOCIO_NUEVO' | 'FUERA_DE_RANGO' | 'META_ACTIVA' | 'META_INVALIDA';

export class MetaError extends Error {
  readonly code: MetaErrorCode;

  constructor(code: MetaErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'MetaError';
  }
}
