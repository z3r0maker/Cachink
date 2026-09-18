import type { TurnoData } from './types';

/**
 * The design's open turno (`Operador Turno.dc.html`), in centavos:
 * $800 + $2,140 + $550 − $620 = $2,870 expected. Replaced in O-06.
 */
export const TURNO_FIXTURE: TurnoData = {
  operador: 'Ana Robledo',
  caja: 'Caja 1',
  desde: '08:15',
  fondo: 80_000n,
  ventasEfectivo: 214_000n,
  abonosEfectivo: 55_000n,
  gastosEfectivo: 62_000n,
  esperado: 287_000n,
  ventas: 12,
  canceladas: 1,
  ultimaCancelada: '12:58',
  cobrado: 328_000n,
  fiado: 18_200n,
  clientesFiados: 2,
  gastos: 62_000n,
  comprobantes: 1,
  pendientes: [
    {
      id: 'gas',
      nombre: 'Gas',
      detalle: 'Cada semana · la última vez fueron $620.00',
      monto: 62_000n,
      vence: 0,
    },
    {
      id: 'renta',
      nombre: 'Renta del local',
      detalle: 'Cada mes · día 15',
      monto: 850_000n,
      vence: 1,
    },
    {
      id: 'agua',
      nombre: 'Agua embotellada',
      detalle: 'Cada tercer día · Aguas Puras',
      monto: 22_000n,
      vence: -1,
    },
  ],
  movimientos: [
    {
      id: 'v412',
      tipo: 'venta',
      titulo: 'Venta V-0412',
      detalle: '3 pastor · 1 gringa · 1 horchata',
      hora: '14:52',
      monto: 16_000n,
    },
    {
      id: 'v411',
      tipo: 'venta',
      titulo: 'Venta V-0411',
      detalle: '2 orden de pastor · 2 refresco · tarjeta',
      hora: '14:38',
      monto: 29_600n,
    },
    {
      id: 'gas',
      tipo: 'gasto',
      titulo: 'Gasto · Gas',
      detalle: 'Cilindro de 30 kg · con comprobante',
      hora: '14:10',
      monto: -62_000n,
    },
    {
      id: 'v409',
      tipo: 'credito',
      titulo: 'Venta V-0409',
      detalle: '1 volcán · 1 consomé · fiado a Doña Mari',
      hora: '14:04',
      monto: 9_000n,
    },
    {
      id: 'abono',
      tipo: 'abono',
      titulo: 'Abono · Taller de Chuy',
      detalle: 'Efectivo contra saldo de $1,260.00',
      hora: '13:52',
      monto: 40_000n,
    },
    {
      id: 'merma',
      tipo: 'merma',
      titulo: 'Merma · Queso oaxaca',
      detalle: '1 kg · se cayó al piso',
      hora: '13:04',
      monto: 0n,
    },
  ],
};
