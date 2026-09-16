/**
 * Director setup form validation logic.
 *
 * Extracted from the screen for testability and the 200-line budget.
 * ADR-049: PIN first (login), recovery password second.
 *
 * Note: Email and recovery password fields are hidden for now (email
 * recovery not yet available). Recovery password is auto-set to the
 * PIN value at the UI layer. When email recovery is implemented,
 * restore those fields and their validation.
 */

export interface DirectorSetupFormState {
  readonly nombre: string;
  readonly pin: string;
  readonly confirmPin: string;
}

export interface ValidationErrors {
  readonly confirmPin: string | undefined;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: ValidationErrors;
}

export const DirectorSetupValidation = {
  validate(state: DirectorSetupFormState): ValidationResult {
    const errors: ValidationErrors = {
      confirmPin:
        state.confirmPin.length > 0 && state.pin !== state.confirmPin
          ? 'Los PINs no coinciden'
          : undefined,
    };

    const valid =
      state.nombre.length > 0 &&
      /^\d{6}$/.test(state.pin) &&
      state.confirmPin === state.pin &&
      errors.confirmPin === undefined;

    return { valid, errors };
  },
} as const;
