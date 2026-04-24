/**
 * Form state + validation for NuevoProductoModal. Extracted to keep
 * the modal file under the 200-line budget.
 */

import { useState } from 'react';
import { fromPesos, type InventoryCategory, type InventoryUnit } from '@cachink/domain';
import type { CrearProductoInput } from '../../hooks/use-crear-producto';

export const INV_CATEGORIAS: readonly InventoryCategory[] = [
  'Materia Prima',
  'Producto Terminado',
  'Empaque',
  'Herramienta',
  'Insumo',
  'Otro',
];

export const INV_UNIDADES: readonly InventoryUnit[] = [
  'pza',
  'kg',
  'lt',
  'm',
  'caja',
  'bolsa',
  'rollo',
  'par',
  'otro',
];

export interface ProductoFormState {
  nombre: string;
  sku: string;
  categoria: InventoryCategory;
  costoPesos: string;
  unidad: InventoryUnit;
  umbral: string;
}

export interface ProductoFormErrors {
  nombre?: string;
  costo?: string;
  umbral?: string;
}

export function initialProductoState(): ProductoFormState {
  return {
    nombre: '',
    sku: '',
    categoria: 'Producto Terminado',
    costoPesos: '',
    unidad: 'pza',
    umbral: '3',
  };
}

export function validateProducto(
  state: ProductoFormState,
  requiredLabel: string,
): ProductoFormErrors {
  const errors: ProductoFormErrors = {};
  if (!state.nombre.trim()) errors.nombre = requiredLabel;
  const c = Number(state.costoPesos);
  if (!Number.isFinite(c) || c < 0) errors.costo = requiredLabel;
  const u = Number(state.umbral);
  if (!Number.isInteger(u) || u < 0) errors.umbral = requiredLabel;
  return errors;
}

export function buildProductoPayload(state: ProductoFormState): CrearProductoInput {
  return {
    nombre: state.nombre.trim(),
    sku: state.sku.trim() || undefined,
    categoria: state.categoria,
    costoUnit: fromPesos(state.costoPesos || '0'),
    unidad: state.unidad,
    umbralStockBajo: Number(state.umbral),
  };
}

export interface ProductoFormApi {
  state: ProductoFormState;
  errors: ProductoFormErrors;
  setErrors: (e: ProductoFormErrors) => void;
  update: (p: Partial<ProductoFormState>) => void;
  reset: () => void;
}

export function useProductoForm(): ProductoFormApi {
  const [state, setState] = useState<ProductoFormState>(initialProductoState);
  const [errors, setErrors] = useState<ProductoFormErrors>({});
  return {
    state,
    errors,
    setErrors,
    update: (p) => setState((prev) => ({ ...prev, ...p })),
    reset: () => {
      setState(initialProductoState());
      setErrors({});
    },
  };
}
