/**
 * Director setup form validation logic.
 *
 * Extracted from the screen for testability and the 200-line budget.
 * ADR-049: PIN first (login), recovery password second.
 */

export interface DirectorSetupFormState {
  readonly nombre: string;
  readonly pin: string;
  readonly confirmPin: string;
  readonly recoveryPassword: string;
  readonly confirmRecoveryPassword: string;
}

export interface ValidationErrors {
  readonly confirmPin: string | undefined;
  readonly confirmRecoveryPassword: string | undefined;
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
      confirmRecoveryPassword:
        state.confirmRecoveryPassword.length > 0 &&
        state.recoveryPassword !== state.confirmRecoveryPassword
          ? 'Las contraseñas no coinciden'
          : undefined,
    };

    const valid =
      state.nombre.length > 0 &&
      /^\d{6}$/.test(state.pin) &&
      state.confirmPin === state.pin &&
      state.recoveryPassword.length >= 6 &&
      state.confirmRecoveryPassword === state.recoveryPassword &&
      errors.confirmPin === undefined &&
      errors.confirmRecoveryPassword === undefined;

    return { valid, errors };
  },
} as const;
