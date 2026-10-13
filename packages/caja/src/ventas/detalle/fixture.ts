import type { Categoria } from '../../caja/types';
import type { VentaTurno } from '../types';
import type { DetalleData, LineaDetalle, VentaDetalle } from './types';

/**
 * The two tickets with every line priced (`Operador Detalle de venta`), in
 * centavos. V-0412 ($160.00) is the same ticket as in the Ventas list.
 */
export const DETALLE_VENTAS: Readonly<Record<'efectivo' | 'fiado', VentaDetalle>> = {
  efectivo: {
    folio: 'V-0412',
    cuando: 'Hoy 14:52',
    metodo: 'Efectivo',
    lineas: [
      linea('taco-de-pastor', 'Taco de pastor', 3, 'Tacos', 25_00n),
      linea('gringa', 'Gringa', 1, 'Guisados', 60_00n),
      linea('agua-de-horchata', 'Agua de horchata', 1, 'Bebidas', 25_00n),
    ],
    recibido: 200_00n,
  },
  fiado: {
    folio: 'V-0409',
    cuando: 'Hoy 14:04',
    metodo: 'Fiado',
    lineas: [
      linea('volcan', 'Volcán', 1, 'Guisados', 55_00n),
      linea('consome', 'Consomé', 1, 'Extras', 35_00n),
    ],
    fiado: { cliente: 'Doña Mari de la tienda', saldo: 340_00n },
  },
};

function linea(
  productoId: string,
  nombre: string,
  cantidad: number,
  categoria: Categoria,
  precio?: bigint,
): LineaDetalle {
  return { productoId, nombre, cantidad, categoria, ...(precio === undefined ? {} : { precio }) };
}

/**
 * The cancelled ticket of the Ventas board (V-0405, «1 gringa», $60.00,
 * «error de captura»), for the phone's detalle-cancelada state. Separate from
 * `DETALLE_VENTAS` so the web's `ventaPorFolio` keeps its two priced tickets.
 */
export const DETALLE_CANCELADA: VentaDetalle = {
  folio: 'V-0405',
  cuando: 'Hoy 12:58',
  metodo: 'Efectivo',
  lineas: [linea('gringa', 'Gringa', 1, 'Guisados', 60_00n)],
  total: 60_00n,
  cancelada: { motivo: 'error de captura' },
};

export function detalleFixture(venta: VentaDetalle | null): DetalleData {
  return {
    negocio: 'Taquería Don Pedro',
    operador: 'Ana Robledo',
    caja: 'Caja 1',
    turno: 'Hoy, abierto 08:15',
    venta,
  };
}

/** The folio in the path picks the ticket; any other folio is looked up in the list. */
export function ventaPorFolio(folio: string): VentaDetalle | null {
  return Object.values(DETALLE_VENTAS).find((v) => v.folio === folio) ?? null;
}

/** The list's short words for the catalogue's products. */
const NOMBRES: Readonly<Record<string, readonly [string, Categoria]>> = {
  pastor: ['Taco de pastor', 'Tacos'],
  suadero: ['Taco de suadero', 'Tacos'],
  bistec: ['Taco de bistec', 'Tacos'],
  chorizo: ['Taco de chorizo', 'Tacos'],
  campechano: ['Taco campechano', 'Tacos'],
  tripa: ['Taco de tripa', 'Tacos'],
  gringa: ['Gringa', 'Guisados'],
  quesadilla: ['Quesadilla', 'Guisados'],
  volcán: ['Volcán', 'Guisados'],
  'orden de pastor': ['Orden de pastor', 'Guisados'],
  horchata: ['Agua de horchata', 'Bebidas'],
  jamaica: ['Agua de jamaica', 'Bebidas'],
  refresco: ['Refresco 600 ml', 'Bebidas'],
  agua: ['Agua embotellada', 'Bebidas'],
  consomé: ['Consomé', 'Extras'],
  cebollitas: ['Cebollitas asadas', 'Extras'],
  guacamole: ['Guacamole', 'Extras'],
  'salsa extra': ['Salsa extra', 'Extras'],
};

/**
 * A fixture row without its priced ticket: the lines come from the list's
 * summary («3 pastor · 1 gringa»), with pieces and no prices.
 */
export function detalleDeFila(v: VentaTurno): VentaDetalle {
  const lineas = v.concepto.split(' · ').map((parte) => {
    const cantidad = Number.parseInt(parte, 10) || 1;
    const corto = parte.replace(/^\d+\s+/, '');
    const [nombre, categoria] = NOMBRES[corto] ?? [corto, 'Extras'];
    return linea(corto, nombre, cantidad, categoria);
  });
  return {
    folio: v.folio,
    cuando: `Hoy ${v.hora}`,
    metodo: v.metodo,
    lineas,
    total: v.monto,
    ...(v.cliente === undefined ? {} : { fiado: { cliente: v.cliente } }),
  };
}
