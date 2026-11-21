import type { Guia } from './guia.js';
import {
  ALTA_PRODUCTO,
  CANCELAR_VENTA,
  COBRAR_ESCANER,
  COBRAR_VENTA,
} from './guias-caja-cobrar.js';
import { ABRIR_TURNO, CERRAR_TURNO, LLEGO_MERCANCIA, REGISTRAR_GASTO } from './guias-caja-turno.js';

/**
 * The guides of whoever charges, read on the phone and on the web caja
 * (ADR-163), in the order a first day goes: open, sell, the things that come
 * up while selling, close.
 */
export const GUIAS_CAJA: readonly Guia[] = [
  ABRIR_TURNO,
  COBRAR_VENTA,
  COBRAR_ESCANER,
  REGISTRAR_GASTO,
  LLEGO_MERCANCIA,
  ALTA_PRODUCTO,
  CANCELAR_VENTA,
  CERRAR_TURNO,
];
