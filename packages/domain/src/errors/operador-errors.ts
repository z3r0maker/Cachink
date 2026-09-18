/**
 * Typed errors for operator management (B-13).
 *
 * Operators are the people who sign in to a phone with a name and a PIN. The
 * portal creates them, resets their PIN and deactivates them; the phone only
 * ever reads them (`users` is a DOWN table).
 */

/** The plan's operator allowance is used up. */
export class OperatorLimitError extends Error {
  readonly code = 'OPERATOR_LIMIT' as const;

  constructor(readonly limit: number) {
    super(
      `Tu plan incluye ${limit} ${limit === 1 ? 'operador' : 'operadores'}. Desactiva uno o cambia de plan.`,
    );
    this.name = 'OperatorLimitError';
  }
}

/** A PIN must be 4 to 6 digits — short enough to type at a counter. */
export class InvalidPinError extends Error {
  readonly code = 'INVALID_PIN' as const;

  constructor() {
    super('El PIN debe tener de 4 a 6 números.');
    this.name = 'InvalidPinError';
  }
}

/** The operator does not exist, or belongs to another business. */
export class OperatorNotFoundError extends Error {
  readonly code = 'OPERATOR_NOT_FOUND' as const;

  constructor() {
    super('No encontramos a ese operador.');
    this.name = 'OperatorNotFoundError';
  }
}

/** Two operators of one business cannot share a name: the phone signs in by name. */
export class DuplicateOperatorError extends Error {
  readonly code = 'DUPLICATE_OPERATOR' as const;

  constructor(nombre: string) {
    super(`Ya existe un operador llamado "${nombre}".`);
    this.name = 'DuplicateOperatorError';
  }
}

/** 4–6 ASCII digits, nothing else. Exported so the UI validates with the same rule. */
export const PIN_PATTERN = /^\d{4,6}$/;
export const isValidPin = (pin: string): boolean => PIN_PATTERN.test(pin);
