/**
 * Form state + validators + payload builders for MovimientoModal.
 * Extracted to respect the 200-line file budget.
 */

import { useState } from 'react';
import {
  NewInventoryMovementSchema,
  fromPesos,
  type BusinessId,
  type EntryReason,
  type ExitReason,
  type IsoDate,
  type MovementType,
  type NewInventoryMovement,
  type Product,
  type ProductId,
} from '@cachink/domain';

export const ENTRADA_MOTIVOS: readonly EntryReason[] = [
  'Compra a proveedor',
  'Devolución de cliente',
  'Ajuste de inventario',
  'Producción',
  'Otro',
];

export const SALIDA_MOTIVOS: readonly ExitReason[] = [
  'Venta',
  'Uso en producción',
  'Merma / daño',
  'Muestra',
  'Ajuste de inventario',
  'Otro',
];

export interface MovimientoFormState {
  tipo: MovementType;
  cantidad: string;
  costoPesos: string;
  motivo: string;
  nota: string;
}

export function initialMovimientoState(producto: Product, tipo: MovementType): MovimientoFormState {
  return {
    tipo,
    cantidad: '',
    costoPesos: (Number(producto.costoUnitCentavos) / 100).toString(),
    motivo: tipo === 'entrada' ? 'Compra a proveedor' : 'Venta',
    nota: '',
  };
}

export function validateCantidad(value: string): boolean {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

export function buildMovimientoPayload(
  state: MovimientoFormState,
  producto: Product,
  businessId: BusinessId,
  fecha: IsoDate,
): NewInventoryMovement {
  return NewInventoryMovementSchema.parse({
    productoId: producto.id as ProductId,
    fecha,
    tipo: state.tipo,
    cantidad: Number(state.cantidad),
    costoUnitCentavos:
      state.tipo === 'entrada' ? fromPesos(state.costoPesos || '0') : producto.costoUnitCentavos,
    motivo: state.motivo,
    nota: state.nota.trim() || undefined,
    businessId,
  });
}

export function useMovimientoFormState(
  producto: Product,
  initialTipo: MovementType = 'entrada',
): [MovimientoFormState, (p: Partial<MovimientoFormState>) => void, () => void] {
  const [state, setState] = useState<MovimientoFormState>(() =>
    initialMovimientoState(producto, initialTipo),
  );
  const update = (p: Partial<MovimientoFormState>): void => setState((prev) => ({ ...prev, ...p }));
  const reset = (): void => setState(initialMovimientoState(producto, initialTipo));
  return [state, update, reset];
}
