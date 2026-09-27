/**
 * The linked caja's inventory as the screen shows it (O-24 live): the
 * Worker's products and movements mapped to `Existencia` and `Movimiento` —
 * the domain's unit onto the screen's word, the product's icon onto the
 * register's glyphs, its colour onto a token tint.
 */

import { colors } from '@xangarro/tokens';

import { hhmmLocal } from '../runtime/fechas';
import type { ExistenciaPara, InventarioPara, MovimientoPara } from '../runtime/inventario-mapa';
import type { ProductIcon } from '../ui/product-icons';
import type { Existencia, InventarioData, Movimiento, Unidad } from './types';

const UNIDAD: Readonly<Record<string, Unidad>> = {
  pza: 'piezas',
  kg: 'kg',
  lt: 'litros',
  m: 'metros',
  caja: 'cajas',
  bolsa: 'bolsas',
  rollo: 'rollos',
  par: 'pares',
};

/** The domain's unit as the operator says it; «otro» (or anything new) counts pieces. */
export const unidadOperador = (u: string): Unidad => UNIDAD[u] ?? 'piezas';

const ICONO: Readonly<Record<string, ProductIcon>> = {
  beef: 'ham',
  drumstick: 'drumstick',
  fish: 'drumstick',
  egg: 'salad',
  pizza: 'pizza',
  soup: 'soup',
  salad: 'salad',
  sandwich: 'utensils',
  leaf: 'leafy',
  apple: 'leafy',
  grape: 'leafy',
  nut: 'leafy',
  'cup-soda': 'soda',
  beer: 'glass',
  wine: 'glass',
  martini: 'glass',
  'glass-water': 'glass',
  coffee: 'glass',
  milk: 'bottle',
  droplets: 'droplet',
};

/** The product's icon among the register's glyphs; the rest look like a pot. */
export const iconoOperador = (icono: string | null): ProductIcon =>
  (icono === null ? undefined : ICONO[icono]) ?? 'pot';

const TINTE: Readonly<Record<string, string>> = {
  yellow: colors.yellowSoft,
  green: colors.greenSoft,
  blue: colors.blueSoft,
  pink: colors.redSoft,
  purple: colors.purpleSoft,
  peach: colors.peachSoft,
};

/** The product's background colour as a token tint; white and gray read as gray. */
export const tinteDe = (color: string): string => TINTE[color] ?? colors.gray100;

/** «Carne de pastor» → «carne de pastor» for the KPI hints (an acronym stays). */
export function cortoDe(nombre: string): string {
  const segunda = nombre.charAt(1);
  if (segunda !== '' && segunda === segunda.toUpperCase() && /\p{L}/u.test(segunda)) {
    return nombre;
  }
  return nombre.charAt(0).toLowerCase() + nombre.slice(1);
}

export function comoExistencia(e: ExistenciaPara): Existencia {
  return {
    id: e.id,
    nombre: e.nombre,
    corto: cortoDe(e.nombre),
    // The ledger can run negative (a sale beyond the count); the screen says 0.
    existencias: Math.max(0, e.existencias),
    umbral: e.umbral,
    unidad: unidadOperador(e.unidad),
    icono: iconoOperador(e.icono),
    tint: tinteDe(e.color),
  };
}

export function comoMovimiento(m: MovimientoPara): Movimiento {
  return {
    id: m.id,
    existenciaId: m.productoId,
    tipo: m.tipo,
    cantidad: m.cantidad,
    detalle: m.nota ?? '',
    hora: hhmmLocal(m.createdAt),
  };
}

export function comoInventario(
  r: InventarioPara,
  sesion: { readonly nombre: string },
): InventarioData {
  return {
    operador: sesion.nombre,
    caja: 'Caja 1',
    existencias: r.existencias.map(comoExistencia),
    movimientos: r.movimientos.map(comoMovimiento),
  };
}

/** A linked caja before its read arrives: nothing, never the fixture. */
export const INVENTARIO_VACIO: InventarioData = {
  operador: '',
  caja: 'Caja 1',
  existencias: [],
  movimientos: [],
};
