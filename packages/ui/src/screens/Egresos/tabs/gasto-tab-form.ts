/**
 * Form state + validators + payload builders for GastoTab. Split out of
 * the tab file to respect the 200-line budget (CLAUDE.md §4.4).
 */

import { useState } from 'react';
import {
  NewExpenseSchema,
  fromPesos,
  type BusinessId,
  type ExpenseCategory,
  type IsoDate,
  type NewExpense,
} from '@cachink/domain';
import { initialRecurrenteState, type RecurrenteState } from './gasto-recurrente';

export const GASTO_CATEGORIAS: readonly ExpenseCategory[] = [
  'Renta',
  'Servicios',
  'Publicidad',
  'Mantenimiento',
  'Impuestos',
  'Logística',
  'Materia Prima',
  'Otro',
];

export interface GastoFormState {
  concepto: string;
  categoria: ExpenseCategory;
  montoPesos: string;
  proveedor: string;
  recurrente: boolean;
}

export interface GastoFormErrors {
  concepto?: string;
  monto?: string;
}

export function initialGastoState(): GastoFormState {
  return {
    concepto: '',
    categoria: 'Otro',
    montoPesos: '',
    proveedor: '',
    recurrente: false,
  };
}

export function validateGasto(state: GastoFormState, requiredLabel: string): GastoFormErrors {
  const errors: GastoFormErrors = {};
  if (!state.concepto.trim()) errors.concepto = requiredLabel;
  const m = Number(state.montoPesos);
  if (!Number.isFinite(m) || m <= 0) errors.monto = requiredLabel;
  return errors;
}

export function buildEgreso(
  state: GastoFormState,
  businessId: BusinessId,
  fecha: IsoDate,
): NewExpense {
  return NewExpenseSchema.parse({
    fecha,
    concepto: state.concepto.trim(),
    categoria: state.categoria,
    monto: fromPesos(state.montoPesos),
    proveedor: state.proveedor.trim() || undefined,
    businessId,
  });
}

export interface GastoFormApi {
  state: GastoFormState;
  errors: GastoFormErrors;
  recurrenteState: RecurrenteState;
  setErrors: (e: GastoFormErrors) => void;
  update: (p: Partial<GastoFormState>) => void;
  updateRecurrente: (p: Partial<RecurrenteState>) => void;
  reset: () => void;
}

export function useGastoForm(): GastoFormApi {
  const [state, setState] = useState<GastoFormState>(initialGastoState);
  const [errors, setErrors] = useState<GastoFormErrors>({});
  const [recurrenteState, setRecurrenteState] = useState<RecurrenteState>(initialRecurrenteState);
  return {
    state,
    errors,
    recurrenteState,
    setErrors,
    update: (p) => setState((prev) => ({ ...prev, ...p })),
    updateRecurrente: (p) => setRecurrenteState((prev) => ({ ...prev, ...p })),
    reset: () => {
      setState(initialGastoState());
      setRecurrenteState(initialRecurrenteState());
      setErrors({});
    },
  };
}
