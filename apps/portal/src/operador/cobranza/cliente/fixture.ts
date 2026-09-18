import type { CuentaCliente } from './types';

const ANA = 'Ana Robledo · Caja 1';
const LUIS = 'Luis Ortega · Caja 2';

/**
 * `Operador Detalle de cliente.dc.html`: Chuy owes $860.00, Mari $340.00.
 * Chuy's abono today is $120.00 here and $400.00 in Cobranza; each screen
 * follows its own file until O-06 (plan §4b).
 */
export const CUENTAS: Readonly<Record<'chuy' | 'mari', CuentaCliente>> = {
  chuy: {
    id: 'chuy',
    nombre: 'Taller de Chuy',
    iniciales: 'TC',
    telefono: '5533 981 204',
    desde: 'enero 2026',
    limite: 1500_00n,
    plazo: '15 días',
    atrasado: true,
    ventas: [
      {
        folio: 'V-0244',
        concepto: 'Comida para 4',
        fecha: '2026-04-18T13:40',
        dia: '18 abr',
        monto: 300_00n,
        capturo: ANA,
      },
      {
        folio: 'V-0288',
        concepto: 'Comida para 6 · orden de pastor y refrescos',
        fecha: '2026-04-28T13:10',
        dia: '28 abr',
        monto: 520_00n,
        capturo: ANA,
      },
      {
        folio: 'V-0310',
        concepto: 'Comida para 8 · gringas y aguas',
        fecha: '2026-05-02T14:20',
        dia: '2 may',
        monto: 460_00n,
        capturo: LUIS,
      },
    ],
    abonos: [
      {
        id: 'chuy-1',
        fecha: '2026-04-24T17:05',
        dia: '24 abr',
        monto: 300_00n,
        metodo: 'Transferencia',
      },
      {
        id: 'chuy-2',
        fecha: '2026-05-14T13:52',
        dia: 'hoy 13:52',
        monto: 120_00n,
        metodo: 'Efectivo',
      },
    ],
  },
  mari: {
    id: 'mari',
    nombre: 'Doña Mari de la tienda',
    iniciales: 'DM',
    telefono: '5512 447 903',
    desde: 'marzo 2026',
    limite: 800_00n,
    plazo: '7 días',
    atrasado: false,
    ventas: [
      {
        folio: 'V-0340',
        concepto: 'Tacos del sábado',
        fecha: '2026-05-06T13:20',
        dia: '6 may',
        monto: 210_00n,
        capturo: ANA,
      },
      {
        folio: 'V-0361',
        concepto: 'Tacos para la familia',
        fecha: '2026-05-08T19:30',
        dia: '8 may',
        monto: 100_00n,
        capturo: LUIS,
      },
      {
        folio: 'V-0388',
        concepto: 'Orden de pastor y aguas',
        fecha: '2026-05-11T14:05',
        dia: '11 may',
        monto: 150_00n,
        capturo: ANA,
      },
      {
        folio: 'V-0409',
        concepto: 'Volcán y consomé',
        fecha: '2026-05-14T14:04',
        dia: 'hoy',
        monto: 90_00n,
        capturo: ANA,
      },
    ],
    abonos: [
      {
        id: 'mari-1',
        fecha: '2026-05-14T11:18',
        dia: 'hoy 11:18',
        monto: 210_00n,
        metodo: 'Transferencia',
      },
    ],
  },
};
