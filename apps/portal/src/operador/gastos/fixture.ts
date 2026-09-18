import type { GastosData } from './types';

/**
 * The design's turno (`Operador Gastos.dc.html`), in centavos: six expenses,
 * $1,530.00 out of the drawer, two without a receipt.
 */
export const GASTOS_FIXTURE: GastosData = {
  operador: 'Ana Robledo',
  caja: 'Caja 1',
  desde: '08:15',
  gastos: [
    {
      id: 'g-6',
      concepto: 'Cilindro de gas 30 kg',
      detalle: 'Gas Express · con foto',
      monto: 620_00n,
      categoria: 'Servicios',
      hora: '14:10',
      comprobante: true,
    },
    {
      id: 'g-5',
      concepto: 'Bolsas y servilletas',
      detalle: 'Abarrotes Don Beto · con foto',
      monto: 180_00n,
      categoria: 'Insumos',
      hora: '11:22',
      comprobante: true,
    },
    {
      id: 'g-4',
      concepto: 'Taxi por insumos',
      detalle: 'Sin comprobante · autorizado por Pedro',
      monto: 95_00n,
      categoria: 'Transporte',
      hora: '10:05',
      comprobante: false,
    },
    {
      id: 'g-3',
      concepto: 'Carbón',
      detalle: 'Carbonería La Flama · con foto',
      monto: 240_00n,
      categoria: 'Insumos',
      hora: '09:18',
      comprobante: true,
    },
    {
      id: 'g-2',
      concepto: 'Cambio de tanque de agua',
      detalle: 'Aguas Puras · con foto',
      monto: 45_00n,
      categoria: 'Servicios',
      hora: '08:46',
      comprobante: true,
    },
    {
      id: 'g-1',
      concepto: 'Reparación de parrilla',
      detalle: 'Herrero de la esquina · sin comprobante',
      monto: 350_00n,
      categoria: 'Mantenimiento',
      hora: '08:30',
      comprobante: false,
    },
  ],
};
