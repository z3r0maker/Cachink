import { colors } from '@xangarro/tokens';

import type { CuentaCliente } from './cliente/types';

/** The handoff's «hoy»: every file is drawn on 14 May 2026. */
export const HOY = '2026-05-14';

const ANA = 'Ana Robledo · Caja 1';
const LUIS = 'Luis Ortega · Caja 2';

/**
 * The credit accounts behind Cobranza and Detalle de cliente — one history,
 * only tickets and abonos (README §10, ADR-074). It reproduces Cobranza's file
 * ($1,780.00 owed; today $760.00 in abonos, $550.00 cash — Turno's figure);
 * decision D7 (plan §1b). Raúl's V-0351 and Delgado's account are not in any
 * file and exist so their cards add up.
 */
export const CUENTAS: readonly CuentaCliente[] = [
  {
    id: 'mari',
    nombre: 'Doña Mari de la tienda',
    iniciales: 'DM',
    telefono: '5512 447 903',
    tint: colors.yellow,
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
        nota: 'Transferencia · se aplicó a V-0340 completa',
      },
    ],
  },
  {
    id: 'chuy',
    nombre: 'Taller de Chuy',
    iniciales: 'TC',
    telefono: '5533 981 204',
    tint: colors.blueSoft,
    desde: 'enero 2026',
    limite: 1500_00n,
    plazo: '15 días',
    atrasado: true,
    ventas: [
      {
        folio: 'V-0288',
        concepto: 'Comida para 6 · orden de pastor y refrescos',
        fecha: '2026-04-28T13:10',
        dia: '28 abr',
        monto: 800_00n,
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
        fecha: '2026-05-14T13:52',
        dia: 'hoy 13:52',
        monto: 400_00n,
        metodo: 'Efectivo',
        nota: 'Efectivo contra saldo de $1,260.00 · se aplicó a V-0288 y parte de V-0310',
      },
    ],
  },
  {
    id: 'raul',
    nombre: 'Raúl (obra de la esquina)',
    iniciales: 'RO',
    telefono: '5521 664 019',
    tint: colors.peachSoft,
    desde: 'abril 2026',
    limite: 1000_00n,
    plazo: '15 días',
    atrasado: false,
    ventas: [
      {
        folio: 'V-0351',
        concepto: 'Comida de la cuadrilla',
        fecha: '2026-05-09T13:30',
        dia: '9 may',
        monto: 150_00n,
        capturo: LUIS,
      },
      {
        folio: 'V-0375',
        concepto: 'Tacos para la obra',
        fecha: '2026-05-10T13:15',
        dia: '10 may',
        monto: 260_00n,
        capturo: ANA,
      },
      {
        folio: 'V-0402',
        concepto: 'Comida de la cuadrilla',
        fecha: '2026-05-13T14:00',
        dia: '13 may',
        monto: 320_00n,
        capturo: ANA,
      },
    ],
    abonos: [
      {
        id: 'raul-1',
        fecha: '2026-05-14T09:40',
        dia: 'hoy 09:40',
        monto: 150_00n,
        metodo: 'Efectivo',
        nota: 'Efectivo · abono parcial a V-0351',
      },
    ],
  },
  {
    id: 'delgado',
    nombre: 'Oficina Delgado',
    iniciales: 'OD',
    telefono: '5544 120 887',
    tint: colors.greenSoft,
    desde: 'febrero 2026',
    limite: 2000_00n,
    plazo: '30 días',
    atrasado: false,
    ventas: [
      {
        folio: 'V-0330',
        concepto: 'Comida de la oficina',
        fecha: '2026-05-05T14:10',
        dia: '5 may',
        monto: 380_00n,
        capturo: ANA,
      },
    ],
    abonos: [
      {
        id: 'delgado-1',
        fecha: '2026-05-09T12:00',
        dia: '9 may',
        monto: 380_00n,
        metodo: 'Transferencia',
      },
    ],
  },
];

export const cuentaPorId = (id: string): CuentaCliente | null =>
  CUENTAS.find((c) => c.id === id) ?? null;
