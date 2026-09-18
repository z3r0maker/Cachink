import type { GastosData } from './types';

/**
 * The design's turno (`Operador Gastos.dc.html`), in centavos: five expenses,
 * $620.00 out of the drawer — the total Turno, Inicio and Cierre subtract from
 * the expected cash — and one without a receipt.
 */
export const GASTOS_FIXTURE: GastosData = {
  operador: 'Ana Robledo',
  caja: 'Caja 1',
  desde: '08:15',
  gastos: [
    {
      id: 'g-5',
      concepto: 'Carbón',
      detalle: 'Carbonería La Flama · con foto',
      monto: 240_00n,
      categoria: 'Insumos',
      hora: '09:18',
      comprobante: true,
    },
    {
      id: 'g-4',
      concepto: 'Bolsas y servilletas',
      detalle: 'Abarrotes Don Beto · con foto',
      monto: 180_00n,
      categoria: 'Insumos',
      hora: '11:22',
      comprobante: true,
    },
    {
      id: 'g-3',
      concepto: 'Taxi por insumos',
      detalle: 'Sin comprobante · autorizado por Pedro',
      monto: 95_00n,
      categoria: 'Transporte',
      hora: '10:05',
      comprobante: false,
    },
    {
      id: 'g-2',
      concepto: 'Hielo para las bebidas',
      detalle: 'Hielera del mercado · con foto',
      monto: 60_00n,
      categoria: 'Otros',
      hora: '12:40',
      comprobante: true,
    },
    {
      id: 'g-1',
      concepto: 'Cambio de tanque de agua',
      detalle: 'Aguas Puras · con foto',
      monto: 45_00n,
      categoria: 'Servicios',
      hora: '08:46',
      comprobante: true,
    },
  ],
};
