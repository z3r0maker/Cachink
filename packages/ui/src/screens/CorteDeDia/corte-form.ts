/**
 * Form state + validation for CorteDeDiaModal (P1C-M7-T02, T03).
 *
 * Split out of the modal file to respect the 200-line file budget
 * (CLAUDE.md §4.4). Mirrors the shape of NuevaVentaForm from Slice 1 —
 * `initialState → validate → buildPayload`, reusable hook API.
 */

import { useState } from 'react';
import { ZERO, fromPesos, type Money } from '@cachink/domain';

export interface CorteFormState {
  contadoPesos: string;
  explicacion: string;
}

export interface CorteFormErrors {
  contado?: string;
  explicacion?: string;
}

export interface CorteFormPayload {
  efectivoContadoCentavos: Money;
  explicacion?: string;
}

export function initialState(): CorteFormState {
  return { contadoPesos: '', explicacion: '' };
}

/**
 * Pure "contado in pesos" → centavos helper. Returns ZERO when the input
 * doesn't parse — the caller usually pairs this with `validate` first.
 */
export function parseContadoSafe(contadoPesos: string): Money {
  try {
    return fromPesos(contadoPesos);
  } catch {
    return ZERO;
  }
}

/**
 * Compute diferencia from contado (string pesos) + esperado (money).
 *   diferencia = contado - esperado
 * Negative → faltante, positive → sobrante, zero → cuadra.
 */
export function computeDiferencia(contadoPesos: string, esperado: Money): Money {
  return parseContadoSafe(contadoPesos) - esperado;
}

export function validate(
  state: CorteFormState,
  esperado: Money,
  requiredLabel: string,
  explicacionRequiredLabel: string,
): CorteFormErrors {
  const errors: CorteFormErrors = {};
  const contadoValid = /^\d+(\.\d{1,2})?$/.test(state.contadoPesos.trim());
  if (!contadoValid) {
    errors.contado = requiredLabel;
    return errors;
  }
  const diferencia = computeDiferencia(state.contadoPesos, esperado);
  if (diferencia !== ZERO && !state.explicacion.trim()) {
    errors.explicacion = explicacionRequiredLabel;
  }
  return errors;
}

export function buildPayload(state: CorteFormState): CorteFormPayload {
  const explicacion = state.explicacion.trim();
  return {
    efectivoContadoCentavos: fromPesos(state.contadoPesos),
    explicacion: explicacion === '' ? undefined : explicacion,
  };
}

export interface CorteFormApi {
  state: CorteFormState;
  errors: CorteFormErrors;
  update: (partial: Partial<CorteFormState>) => void;
  reset: () => void;
  setErrors: (errors: CorteFormErrors) => void;
}

export function useCorteForm(): CorteFormApi {
  const [state, setState] = useState<CorteFormState>(initialState);
  const [errors, setErrors] = useState<CorteFormErrors>({});
  return {
    state,
    errors,
    update: (partial) => setState((prev) => ({ ...prev, ...partial })),
    reset: () => {
      setState(initialState());
      setErrors({});
    },
    setErrors,
  };
}
