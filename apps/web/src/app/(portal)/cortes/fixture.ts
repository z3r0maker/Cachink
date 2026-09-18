import { colors } from '@xangarro/tokens';

import type { Corte, TurnoCorte } from './types';

/**
 * `Cortes de turno.dc.html`, in centavos. Each corte carries its own count by
 * denomination, which adds up to its «Contado», and its own turno summary.
 */
const t = (
  ventas: number,
  [n, monto]: readonly [number, bigint],
  fiado: bigint,
  inventario: string,
  creados: number,
): TurnoCorte => ({ ventas, canceladas: { n, monto }, fiado, inventario, creados });

const ANA = {
  operador: 'Ana Robledo',
  iniciales: 'AR',
  tint: colors.yellow,
  caja: 'Caja 1',
} as const;
const LUIS = {
  operador: 'Luis Ortega',
  iniciales: 'LO',
  tint: colors.blueSoft,
  caja: 'Caja 2',
} as const;
const SOFIA = {
  operador: 'Sofía Márquez',
  iniciales: 'SM',
  tint: colors.purpleSoft,
  caja: 'Caja 2',
} as const;

export const CORTES_FIXTURE: readonly Corte[] = [
  {
    id: 'c-0514-ana',
    ...ANA,
    dia: '14 may',
    horario: '08:15 a 21:04',
    fondo: 800_00n,
    ventasEfectivo: 1980_00n,
    abonosEfectivo: 550_00n,
    gastosCaja: 620_00n,
    conteo: { 1000: 2, 500: 1, 200: 1, 10: 1 },
    estado: 'Cuadró',
    turno: t(12, [1, 60_00n], 182_00n, '3 entradas · 2 mermas', 1),
  },
  {
    id: 'c-0513-luis',
    ...LUIS,
    dia: '13 may',
    horario: '12:00 a 22:10',
    fondo: 600_00n,
    ventasEfectivo: 1880_00n,
    abonosEfectivo: 0n,
    gastosCaja: 240_00n,
    conteo: { 1000: 2, 100: 1, 50: 1, 20: 1, 10: 1 },
    motivo: 'Cambio mal dado',
    nota: 'Le di cambio de 200 a un cliente que pagó con 100, ya no lo alcancé',
    estado: 'Por aclarar',
    turno: t(9, [0, 0n], 0n, '1 entrada', 0),
  },
  {
    id: 'c-0513-ana',
    ...ANA,
    dia: '13 may',
    horario: '08:00 a 20:40',
    fondo: 800_00n,
    ventasEfectivo: 2450_00n,
    abonosEfectivo: 300_00n,
    gastosCaja: 180_00n,
    conteo: { 1000: 3, 200: 1, 100: 1, 50: 1, 20: 1 },
    estado: 'Cuadró',
    turno: t(15, [1, 45_00n], 260_00n, '2 entradas · 1 merma', 0),
  },
  {
    id: 'c-0512-sofia',
    ...SOFIA,
    dia: '12 may',
    horario: '08:10 a 15:30',
    fondo: 600_00n,
    ventasEfectivo: 1240_00n,
    abonosEfectivo: 150_00n,
    gastosCaja: 95_00n,
    conteo: { 1000: 1, 500: 1, 200: 2, 20: 1, 10: 1, 5: 1 },
    motivo: 'Venta no registrada',
    nota: 'Creo que cobré unos tacos y no los capturé en la hora de la comida',
    estado: 'Aclarado',
    turno: t(7, [0, 0n], 120_00n, '1 merma', 2),
  },
  {
    id: 'c-0511-luis',
    ...LUIS,
    dia: '11 may',
    horario: '12:00 a 22:00',
    fondo: 600_00n,
    ventasEfectivo: 1720_00n,
    abonosEfectivo: 200_00n,
    gastosCaja: 310_00n,
    conteo: { 1000: 2, 100: 1, 50: 1 },
    motivo: 'No sé',
    nota: 'Conté tres veces y no encontré de dónde sale',
    estado: 'Por aclarar',
    turno: t(11, [2, 130_00n], 95_00n, '2 entradas', 0),
  },
  {
    id: 'c-0511-ana',
    ...ANA,
    dia: '11 may',
    horario: '08:05 a 20:55',
    fondo: 800_00n,
    ventasEfectivo: 2310_00n,
    abonosEfectivo: 0n,
    gastosCaja: 150_00n,
    conteo: { 1000: 2, 500: 1, 200: 2, 50: 1, 10: 1 },
    estado: 'Cuadró',
    turno: t(14, [0, 0n], 340_00n, '3 entradas', 1),
  },
];
