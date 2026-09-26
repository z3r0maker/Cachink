import type { InventoryCategory, InventoryUnit, UsoProducto } from '@xangarro/domain';
import { formatMoney } from '@xangarro/domain';

import { pesosToCentavos } from '@/lib/money';

import type { Draft } from '../sheet/use-producto-form';

/**
 * «Nuevo producto» as three short questions (ADR-107). The rules are the
 * sheet's (`validate` in use-producto-form); this only splits them by step so
 * the owner hears about the price on the price step, not after the last one.
 */
export type Paso = 1 | 2 | 3;

export const PASOS: ReadonlyArray<{ readonly paso: Paso; readonly label: string }> = [
  { paso: 1, label: '¿Qué vendes?' },
  { paso: 2, label: '¿En cuánto?' },
  { paso: 3, label: '¿Lo cuentas?' },
];

export const UNIDADES: ReadonlyArray<{
  readonly value: InventoryUnit;
  readonly label: string;
  readonly una: string;
}> = [
  { value: 'pza', label: 'Pieza', una: 'pieza' },
  { value: 'kg', label: 'Kilo', una: 'kilo' },
  { value: 'lt', label: 'Litro', una: 'litro' },
  { value: 'm', label: 'Metro', una: 'metro' },
  { value: 'caja', label: 'Caja', una: 'caja' },
  { value: 'bolsa', label: 'Bolsa', una: 'bolsa' },
  { value: 'rollo', label: 'Rollo', una: 'rollo' },
  { value: 'par', label: 'Par', una: 'par' },
  { value: 'otro', label: 'Otra', una: 'unidad' },
];

function errorPrecio(d: Draft): string | null {
  if (pesosToCentavos(d.costo) === null) return 'Escribe el costo, por ejemplo 12.50';
  if (pesosToCentavos(d.precio) === null) return 'Escribe el precio de venta, por ejemplo 25.00';
  return null;
}

function errorAviso(d: Draft): string | null {
  const umbral = Number(d.umbral);
  if (!d.seguirStock || (Number.isInteger(umbral) && umbral >= 0)) return null;
  return 'El aviso de stock bajo es un número entero.';
}

/** What stops the owner from leaving this step; null when it is complete. */
export function errorDelPaso(d: Draft, paso: Paso): string | null {
  if (d.nombre.trim().length === 0) return 'Escribe el nombre del producto.';
  if (paso === 1) return null;
  return errorPrecio(d) ?? (paso === 2 ? null : errorAviso(d));
}

export interface Ganancia {
  readonly tono: 'bien' | 'mal' | 'nada';
  readonly texto: string;
}

/** «Ganas $13.90 por pieza (69%)»: the margin, said the way an owner says it. */
export function ganancia(costo: string, precio: string, unidad: InventoryUnit): Ganancia {
  const c = pesosToCentavos(costo);
  const p = pesosToCentavos(precio);
  if (c === null || p === null || p === 0n) {
    return { tono: 'nada', texto: 'Escribe el costo y el precio y te digo cuánto ganas.' };
  }
  const gan = p - c;
  if (gan <= 0n) {
    return { tono: 'mal', texto: `Ojo: lo vendes ${formatMoney(-gan)} abajo de lo que te cuesta` };
  }
  const una = UNIDADES.find((u) => u.value === unidad)?.una ?? 'unidad';
  const pct = Number((gan * 100n) / p);
  return { tono: 'bien', texto: `Ganas ${formatMoney(gan)} por ${una} (${pct}%)` };
}

/** The catalogue category, from what the product is for: no list to pick from. */
export function categoriaDe(uso: UsoProducto): InventoryCategory {
  return uso === 'materia-prima' ? 'Materia Prima' : 'Producto Terminado';
}
