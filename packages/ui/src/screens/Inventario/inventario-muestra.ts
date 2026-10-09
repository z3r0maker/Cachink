/**
 * The design's inventory (`INVENTARIO_FIXTURE`, the web board's day) as the
 * phone screen reads it, with each product's catalogue glyph and a cost.
 * Review only: stories and tests. A live screen reads the phone's products.
 */
import { INVENTARIO_FIXTURE } from '@xangarro/caja/inventario';
import type { Money, ProductIcon } from '@xangarro/domain';
import type { InventarioLeido } from './inventario-registro';

const GLIFO: Readonly<Record<string, ProductIcon>> = {
  ham: 'beef',
  drumstick: 'drumstick',
  leafy: 'leaf',
  salad: 'salad',
  bottle: 'cup-soda',
  glass: 'glass-water',
};

export function muestraInventario(): InventarioLeido {
  return {
    existencias: INVENTARIO_FIXTURE.existencias.map((e) => ({
      ...e,
      glifo: GLIFO[e.icono] ?? 'salad',
      costoUnitCentavos: 40_00n as Money,
    })),
    movimientos: INVENTARIO_FIXTURE.movimientos,
  };
}
