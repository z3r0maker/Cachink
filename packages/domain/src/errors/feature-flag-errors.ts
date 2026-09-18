/**
 * Typed errors for switching feature flags (P-15). The messages are the ones
 * the phone already shows; only the type is new.
 */

export class BusinessNotFoundError extends Error {
  readonly code = 'BUSINESS_NOT_FOUND' as const;

  constructor() {
    super('Negocio no encontrado');
    this.name = 'BusinessNotFoundError';
  }
}

/** The flag needs another one turned on first (FEATURE_FLAG_DEPENDENCIES). */
export class FlagDependencyError extends Error {
  readonly code = 'FLAG_DEPENDENCY' as const;

  constructor(readonly flag: string) {
    super(`No se puede activar ${flag}: dependencia no activa`);
    this.name = 'FlagDependencyError';
  }
}

/** Not released on the platform, or not in the plan — so it cannot be turned on. */
export class FlagNotAllowedError extends Error {
  readonly code = 'FLAG_NOT_ALLOWED' as const;

  constructor(readonly flag: string) {
    super('Esta función no está disponible en tu plan.');
    this.name = 'FlagNotAllowedError';
  }
}
