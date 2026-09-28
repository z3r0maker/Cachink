/**
 * Example catalogue and ticket for the Cobrar stories only (the boards' day,
 * SPEC-caja); a live screen reads the phone's products.
 */
import type { LineaTicket } from '@xangarro/caja/caja';
import { colors } from '../../theme';
import type { ProductoCobrar } from './cobrar-catalogo';

type Fila = readonly [
  string,
  string,
  bigint,
  string,
  ProductoCobrar['icono'],
  string,
  number | null,
];

const FILAS: readonly Fila[] = [
  ['pastor', 'Taco de pastor', 25_00n, 'Tacos', 'beef', colors.peachSoft, null],
  ['suadero', 'Taco de suadero', 27_00n, 'Tacos', 'beef', colors.peachSoft, null],
  ['bistec', 'Taco de bistec', 30_00n, 'Tacos', 'beef', colors.redSoft, null],
  ['tripa', 'Taco de tripa', 32_00n, 'Tacos', 'beef', colors.redSoft, 6],
  ['gringa', 'Gringa', 60_00n, 'Guisados', 'sandwich', colors.yellowSoft, null],
  ['quesadilla', 'Quesadilla', 45_00n, 'Guisados', 'sandwich', colors.yellowSoft, null],
  ['horchata', 'Agua de horchata', 25_00n, 'Bebidas', 'glass-water', colors.blueSoft, null],
  ['refresco', 'Refresco 600 ml', 28_00n, 'Bebidas', 'cup-soda', colors.greenSoft, null],
  ['agua', 'Agua embotellada', 15_00n, 'Bebidas', 'glass-water', colors.blueSoft, 3],
  ['consome', 'Consomé', 35_00n, 'Extras', 'soup', colors.yellowSoft, null],
];

export const CATALOGO_EJEMPLO: readonly ProductoCobrar[] = FILAS.map(
  ([id, nombre, precio, categoria, icono, tint, quedan]) => ({
    id,
    nombre,
    precio,
    categoria,
    icono,
    tint,
    codigo: id === 'refresco' ? '7501055300075' : null,
    quedan,
  }),
);

export const TICKET_EJEMPLO: readonly LineaTicket[] = [
  { productoId: 'pastor', nombre: 'Taco de pastor', precio: 25_00n, cantidad: 3 },
  { productoId: 'gringa', nombre: 'Gringa', precio: 60_00n, cantidad: 1 },
  { productoId: 'horchata', nombre: 'Agua de horchata', precio: 25_00n, cantidad: 1 },
];
