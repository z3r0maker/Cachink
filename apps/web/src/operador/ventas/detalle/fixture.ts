import type { DetalleData, VentaDetalle } from './types';

/**
 * The two tickets of `Operador Detalle de venta.dc.html`, in centavos. The file's
 * V-0412 ($160.00) disagrees with the Ventas list ($320.00); each screen follows
 * its own file until real data arrives (O-06), and the gap is flagged in §4b.
 */
export const DETALLE_VENTAS: Readonly<Record<'efectivo' | 'fiado', VentaDetalle>> = {
  efectivo: {
    folio: 'V-0412',
    cuando: 'Hoy 14:52',
    metodo: 'Efectivo',
    lineas: [
      {
        productoId: 'taco-de-pastor',
        nombre: 'Taco de pastor',
        precio: 25_00n,
        cantidad: 3,
        categoria: 'Tacos',
      },
      {
        productoId: 'gringa',
        nombre: 'Gringa',
        precio: 60_00n,
        cantidad: 1,
        categoria: 'Guisados',
      },
      {
        productoId: 'agua-de-horchata',
        nombre: 'Agua de horchata',
        precio: 25_00n,
        cantidad: 1,
        categoria: 'Bebidas',
      },
    ],
    recibido: 200_00n,
  },
  fiado: {
    folio: 'V-0409',
    cuando: 'Hoy 14:04',
    metodo: 'Fiado',
    lineas: [
      {
        productoId: 'volcan',
        nombre: 'Volcán',
        precio: 55_00n,
        cantidad: 1,
        categoria: 'Guisados',
      },
      {
        productoId: 'consome',
        nombre: 'Consomé',
        precio: 35_00n,
        cantidad: 1,
        categoria: 'Extras',
      },
    ],
    fiado: { cliente: 'Doña Mari de la tienda', saldo: 340_00n },
  },
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

/** The folio in the path picks the ticket; any other folio is «ya no existe». */
export function ventaPorFolio(folio: string): VentaDetalle | null {
  return Object.values(DETALLE_VENTAS).find((v) => v.folio === folio) ?? null;
}
