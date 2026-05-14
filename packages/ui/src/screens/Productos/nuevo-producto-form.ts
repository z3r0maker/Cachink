/**
 * Form state + validation for NuevoProductoScreen. Extracted to keep
 * the screen file under the 200-line budget.
 *
 * Phase 18: added usoProducto field support.
 */

import { useState } from 'react';
import {
  fromPesos,
  type InventoryCategory,
  type InventoryUnit,
  type ProductColor,
  type UsoProducto,
} from '@cachink/domain';
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

/**
 * Audit M-1 PR 5: expanded labels so users see the full unit name,
 * not just abbreviations. `key` is the stored value, `label` is the
 * user-facing display string.
 */
export const INV_UNIDADES_OPTIONS: readonly { key: InventoryUnit; label: string }[] = [
  { key: 'pza', label: 'Pieza (pza)' },
  { key: 'kg', label: 'Kilogramo (kg)' },
  { key: 'lt', label: 'Litro (lt)' },
  { key: 'm', label: 'Metro (m)' },
  { key: 'caja', label: 'Caja' },
  { key: 'bolsa', label: 'Bolsa' },
  { key: 'rollo', label: 'Rollo' },
  { key: 'par', label: 'Par' },
  { key: 'otro', label: 'Otro' },
];

/** Flat list of unit keys — backwards-compat alias. */
export const INV_UNIDADES: readonly InventoryUnit[] = INV_UNIDADES_OPTIONS.map((o) => o.key);

/** Select options for the usoProducto field. */
export const USO_PRODUCTO_OPTIONS: readonly { key: UsoProducto; label: string }[] = [
  { key: 'venta', label: 'Para venta' },
  { key: 'materia-prima', label: 'Materia prima (para convertir)' },
  { key: 'ambos', label: 'Ambos (venta y conversión)' },
];

/** Card-compatible data for the OptionCardGroup selector. */
export const USO_PRODUCTO_CARDS: readonly OptionCardItem<UsoProducto>[] = [
  {
    key: 'venta',
    icon: 'shopping-bag',
    label: 'Venta en mostrador',
    description: 'Se vende directamente al cliente.',
  },
  {
    key: 'materia-prima',
    icon: 'refresh-cw',
    label: 'Materia Prima (Convertir)',
    description: 'Ej. Una bolsa de café se convierte en tazas de café.',
  },
  {
    key: 'ambos',
    icon: 'package',
    label: 'Vender y Convertir',
    description: 'Se vende tal cual y también se usa como ingrediente.',
  },
];

export interface ProductoFormState {
  nombre: string;
  sku: string;
  categoria: InventoryCategory;
  usoProducto: UsoProducto;
  costoPesos: string;
  precioVentaPesos: string;
  unidad: InventoryUnit;
  umbral: string;
  stockInicial: string;
  colorFondo: ProductColor;
}

export interface ProductoFormErrors {
  nombre?: string;
  costo?: string;
  precioVenta?: string;
  umbral?: string;
}

export function initialProductoState(): ProductoFormState {
  return {
    nombre: '',
    sku: '',
    categoria: 'Producto Terminado',
    usoProducto: 'venta',
    costoPesos: '',
    precioVentaPesos: '',
    unidad: 'pza',
    umbral: '3',
    stockInicial: '',
    colorFondo: 'white',
  };
}

/** Pre-resolved validation messages passed into `validateProducto`. */
export interface ValidationMessages {
  readonly required: string;
  readonly greaterThanZero: string;
  readonly invalidNumber: string;
}

export function validateProducto(
  state: ProductoFormState,
  msgs: ValidationMessages,
): ProductoFormErrors {
  const errors: ProductoFormErrors = {};
  if (!state.nombre.trim()) errors.nombre = msgs.required;
  const c = Number(state.costoPesos);
  if (!Number.isFinite(c) || c <= 0) errors.costo = msgs.greaterThanZero;
  // Precio de venta only required when not materia-prima-only
  if (state.usoProducto !== 'materia-prima') {
    const pv = Number(state.precioVentaPesos);
    if (!Number.isFinite(pv) || pv <= 0) errors.precioVenta = msgs.greaterThanZero;
  }
  const u = Number(state.umbral);
  if (!Number.isInteger(u) || u < 0) errors.umbral = msgs.invalidNumber;
  return errors;
}

export function buildProductoPayload(state: ProductoFormState): CrearProductoInput {
  const parsed = state.stockInicial.trim() !== '' ? Number(state.stockInicial) : undefined;
  const stockInicial =
    parsed !== undefined && Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  // Materia prima doesn't have a sale price — zero it out
  const precioVenta =
    state.usoProducto === 'materia-prima' ? 0n : fromPesos(state.precioVentaPesos || '0');
  return {
    nombre: state.nombre.trim(),
    sku: state.sku.trim() || undefined,
    categoria: state.categoria,
    usoProducto: state.usoProducto,
    costoUnit: fromPesos(state.costoPesos || '0'),
    precioVenta,
    unidad: state.unidad,
    umbralStockBajo: Number(state.umbral),
    colorFondo: state.colorFondo,
    stockInicial,
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
