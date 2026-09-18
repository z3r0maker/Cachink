import type { VentasData } from './types';

/**
 * The design's turno (`Operador Ventas.dc.html`), in centavos. The figures agree
 * with Inicio, Turno and Cierre: 12 active sales, $3,280.00 collected, $2,140.00
 * in cash, $182.00 on credit; V-0405 ($60.00) is cancelled and out of every total.
 */
export const VENTAS_FIXTURE: VentasData = {
  operador: 'Ana Robledo',
  caja: 'Caja 1',
  desde: '08:15',
  ventas: [
    {
      folio: 'V-0412',
      concepto: '8 pastor · 2 gringa · 2 horchata',
      monto: 320_00n,
      metodo: 'Efectivo',
      hora: '14:52',
    },
    {
      folio: 'V-0411',
      concepto: '3 orden de pastor · 4 refresco',
      monto: 396_00n,
      metodo: 'Tarjeta',
      hora: '14:38',
    },
    {
      folio: 'V-0410',
      concepto: '7 suadero · 3 agua · 1 consomé',
      monto: 285_00n,
      metodo: 'Efectivo',
      hora: '14:21',
    },
    {
      folio: 'V-0409',
      concepto: '1 volcán · 1 consomé',
      monto: 90_00n,
      metodo: 'Fiado',
      hora: '14:04',
      cliente: 'Doña Mari de la tienda',
    },
    {
      folio: 'V-0408',
      concepto: '9 bistec · 2 jamaica · 1 guacamole',
      monto: 330_00n,
      metodo: 'Transferencia',
      hora: '13:47',
    },
    {
      folio: 'V-0407',
      concepto: '4 quesadilla · 2 guacamole',
      monto: 240_00n,
      metodo: 'Efectivo',
      hora: '13:30',
    },
    {
      folio: 'V-0406',
      concepto: '6 campechano · 2 horchata',
      monto: 232_00n,
      metodo: 'QR / CoDi',
      hora: '13:12',
    },
    {
      folio: 'V-0405',
      concepto: '1 gringa',
      monto: 60_00n,
      metodo: 'Efectivo',
      hora: '12:58',
      cancelada: { motivo: 'error de captura' },
    },
    {
      folio: 'V-0404',
      concepto: '2 gringa · 5 chorizo · 2 cebollitas',
      monto: 415_00n,
      metodo: 'Efectivo',
      hora: '12:40',
    },
    {
      folio: 'V-0403',
      concepto: '2 tripa · 1 refresco',
      monto: 92_00n,
      metodo: 'Fiado',
      hora: '12:18',
      cliente: 'Taller de Chuy',
    },
    {
      folio: 'V-0402',
      concepto: '2 orden de pastor · 4 agua',
      monto: 360_00n,
      metodo: 'Efectivo',
      hora: '11:55',
    },
    {
      folio: 'V-0401',
      concepto: '8 pastor · 2 salsa extra · 2 jamaica',
      monto: 270_00n,
      metodo: 'Efectivo',
      hora: '11:31',
    },
    {
      folio: 'V-0399',
      concepto: '5 suadero · 1 volcán · 2 refresco',
      monto: 250_00n,
      metodo: 'Efectivo',
      hora: '10:58',
    },
  ],
};
