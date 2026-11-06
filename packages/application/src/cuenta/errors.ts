/** Refusals of account deletion, each with a sentence for the owner (CLAUDE.md §8). */
export const CUENTA_ERROR_CODES = ['WRONG_PASSWORD', 'NO_BUSINESS'] as const;
export type CuentaErrorCode = (typeof CUENTA_ERROR_CODES)[number];

const MESSAGES: Record<CuentaErrorCode, string> = {
  WRONG_PASSWORD: 'Esa contraseña no es correcta. Escríbela otra vez.',
  NO_BUSINESS: 'Tu cuenta no tiene negocios propios que eliminar.',
};

export class CuentaError extends Error {
  readonly code: CuentaErrorCode;
  constructor(code: CuentaErrorCode) {
    super(MESSAGES[code]);
    this.name = 'CuentaError';
    this.code = code;
  }
}
