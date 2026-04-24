/**
 * Form state + validation for NuevaVentaModal. Split out of the modal
 * file to respect the 200-line file budget (CLAUDE.md §4.4).
 */

import { useState } from 'react';
import {
  NewSaleSchema,
  fromPesos,
  type BusinessId,
  type ClientId,
  type NewSale,
  type PaymentMethod,
  type SaleCategory,
} from '@cachink/domain';

export const CATEGORIAS: readonly SaleCategory[] = [
  'Producto',
  'Servicio',
  'Anticipo',
  'Suscripción',
  'Otro',
];

export const METODOS: readonly PaymentMethod[] = [
  'Efectivo',
  'Transferencia',
  'Tarjeta',
  'QR/CoDi',
  'Crédito',
];

export interface FormState {
  concepto: string;
  categoria: SaleCategory;
  montoPesos: string;
  metodo: PaymentMethod;
  clienteId: string;
}

export interface FormErrors {
  concepto?: string;
  monto?: string;
  cliente?: string;
}

export function initialState(): FormState {
  return {
    concepto: '',
    categoria: 'Producto',
    montoPesos: '',
    metodo: 'Efectivo',
    clienteId: '',
  };
}

export function validate(state: FormState, requiredLabel: string): FormErrors {
  const errors: FormErrors = {};
  if (!state.concepto.trim()) errors.concepto = requiredLabel;
  const monto = Number(state.montoPesos);
  if (!Number.isFinite(monto) || monto <= 0) errors.monto = requiredLabel;
  if (state.metodo === 'Crédito' && !state.clienteId) errors.cliente = requiredLabel;
  return errors;
}

export function buildPayload(state: FormState, fecha: string, businessId: BusinessId): NewSale {
  return NewSaleSchema.parse({
    fecha,
    concepto: state.concepto.trim(),
    categoria: state.categoria,
    monto: fromPesos(state.montoPesos),
    metodo: state.metodo,
    clienteId: state.clienteId ? (state.clienteId as ClientId) : undefined,
    businessId,
  });
}

export interface NuevaVentaFormApi {
  state: FormState;
  errors: FormErrors;
  update: (partial: Partial<FormState>) => void;
  reset: () => void;
  setErrors: (errors: FormErrors) => void;
}

export function useNuevaVentaForm(): NuevaVentaFormApi {
  const [state, setState] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
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
