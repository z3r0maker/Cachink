/**
 * Quick-add product form (A-09): the device only creates products, with the
 * fields an operator knows at the counter — nombre, código (scan), categoría,
 * precio de venta and whether stock is tracked. Everything else takes a
 * default and is refined in the portal (costo, unidad, umbral, ícono, color).
 */

import { useState } from 'react';
import { fromPesos, type InventoryCategory } from '@xangarro/domain';
import type { OptionCardItem } from '../../components/OptionCardGroup/index';
import type { CrearProductoInput } from '../../hooks/use-crear-producto';

export const INV_CATEGORIAS: readonly InventoryCategory[] = [
  'Materia Prima',
  'Producto Terminado',
  'Empaque',
  'Herramienta',
  'Insumo',
  'Otro',
];

export type StockTracking = 'con-stock' | 'sin-stock';

export interface ProductoFormState {
  nombre: string;
  sku: string;
  categoria: InventoryCategory;
  precioVentaPesos: string;
  stock: StockTracking;
}

export interface ProductoFormErrors {
  nombre?: string;
  precioVenta?: string;
}

export function initialProductoState(): ProductoFormState {
  return {
    nombre: '',
    sku: '',
    categoria: 'Producto Terminado',
    precioVentaPesos: '',
    stock: 'con-stock',
  };
}

/** Pre-resolved validation messages passed into `validateProducto`. */
export interface ValidationMessages {
  readonly required: string;
  readonly greaterThanZero: string;
}

export function validateProducto(
  state: ProductoFormState,
  msgs: ValidationMessages,
): ProductoFormErrors {
  const errors: ProductoFormErrors = {};
  if (!state.nombre.trim()) errors.nombre = msgs.required;
  const pv = Number(state.precioVentaPesos);
  if (!Number.isFinite(pv) || pv <= 0) errors.precioVenta = msgs.greaterThanZero;
  return errors;
}

export function validationMessages(t: (k: string) => string): ValidationMessages {
  return { required: t('validation.required'), greaterThanZero: t('validation.greaterThanZero') };
}

/** Defaults for what quick-add does not ask: the portal owns those fields. */
export function buildProductoPayload(state: ProductoFormState): CrearProductoInput {
  return {
    nombre: state.nombre.trim(),
    sku: state.sku.trim() || undefined,
    categoria: state.categoria,
    usoProducto: 'venta',
    costoUnit: 0n,
    precioVenta: fromPesos(state.precioVentaPesos),
    unidad: 'pza',
    umbralStockBajo: 3,
    seguirStock: state.stock === 'con-stock',
  };
}

export function stockTrackingCards(t: (k: string) => string): OptionCardItem<StockTracking>[] {
  return [
    {
      key: 'con-stock',
      icon: 'package',
      label: t('nuevoProducto.conStock'),
      description: t('nuevoProducto.conStockHint'),
    },
    {
      key: 'sin-stock',
      icon: 'tag',
      label: t('nuevoProducto.sinStock'),
      description: t('nuevoProducto.sinStockHint'),
    },
  ];
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
