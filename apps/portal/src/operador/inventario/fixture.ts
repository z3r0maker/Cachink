import { colors } from '@xangarro/tokens';

import type { Existencia, InventarioData, Movimiento } from './types';

type Row = [
  string,
  string,
  string,
  number,
  number,
  Existencia['unidad'],
  Existencia['icono'],
  string,
];

/** `Operador Inventario.dc.html`: ten items, four at or below their threshold. */
const ROWS: readonly Row[] = [
  ['pastor', 'Carne de pastor', 'pastor', 8, 15, 'kg', 'ham', colors.redSoft],
  ['tortilla', 'Tortilla de maíz', 'tortilla', 220, 200, 'piezas', 'leafy', colors.greenSoft],
  ['suadero', 'Suadero', 'suadero', 12, 10, 'kg', 'drumstick', colors.redSoft],
  ['bistec', 'Bistec', 'bistec', 6, 10, 'kg', 'ham', colors.redSoft],
  ['queso', 'Queso oaxaca', 'queso oaxaca', 4, 6, 'kg', 'salad', colors.peachSoft],
  ['refresco', 'Refresco 600 ml', 'refresco', 64, 24, 'piezas', 'bottle', colors.blueSoft],
  ['agua', 'Agua embotellada', 'agua', 3, 12, 'piezas', 'bottle', colors.blueSoft],
  ['horchata', 'Horchata preparada', 'horchata', 9, 6, 'litros', 'glass', colors.blueSoft],
  ['cebolla', 'Cebolla', 'cebolla', 5, 4, 'kg', 'leafy', colors.greenSoft],
  ['aguacate', 'Aguacate', 'aguacate', 11, 8, 'kg', 'salad', colors.greenSoft],
];

const MOVIMIENTOS: readonly Movimiento[] = [
  {
    id: 'm-1',
    existenciaId: 'pastor',
    tipo: 'Entrada',
    cantidad: 15,
    detalle: 'Carnicería La Central · nota de remisión',
    hora: '08:40',
  },
  {
    id: 'm-2',
    existenciaId: 'tortilla',
    tipo: 'Entrada',
    cantidad: 300,
    detalle: 'Tortillería Esperanza',
    hora: '08:52',
  },
  {
    id: 'm-3',
    existenciaId: 'horchata',
    tipo: 'Merma',
    cantidad: 2,
    detalle: 'Se cortó con el calor',
    hora: '12:15',
  },
  {
    id: 'm-4',
    existenciaId: 'queso',
    tipo: 'Merma',
    cantidad: 1,
    detalle: 'Se cayó al piso',
    hora: '13:04',
  },
  {
    id: 'm-5',
    existenciaId: 'agua',
    tipo: 'Entrada',
    cantidad: 24,
    detalle: 'Abarrotes Don Beto',
    hora: '14:20',
  },
];

export const INVENTARIO_FIXTURE: InventarioData = {
  operador: 'Ana Robledo',
  caja: 'Caja 1',
  existencias: ROWS.map(([id, nombre, corto, existencias, umbral, unidad, icono, tint]) => ({
    id,
    nombre,
    corto,
    existencias,
    umbral,
    unidad,
    icono,
    tint,
  })),
  movimientos: MOVIMIENTOS,
};
