/**
 * Mi turno over the register's own rows (O-39): the Worker's live read as the
 * screen's data. Pure, so the mapping is tested without a Worker.
 */

import type { RecurrentePara, TurnoVivoPara } from '../lectura/turno-shapes';
import type { CobroPorMetodo, Movimiento, PendienteRecurrente, TurnoData } from './types';

/** Where each method's money went, under its bar. */
const NOTA: Readonly<Record<Exclude<CobroPorMetodo['metodo'], 'Fiado'>, string>> = {
  Efectivo: 'entra a la caja',
  Tarjeta: 'en la terminal',
  Transferencia: 'a la cuenta del negocio',
};

/** «Doña Mari», «Doña Mari y otro cliente», «Doña Mari y 3 clientes más». */
export function notaFiado(clientes: readonly string[]): string {
  const [primero] = clientes;
  if (primero === undefined) return 'nadie se llevó fiado';
  if (clientes.length === 1) return primero;
  if (clientes.length === 2) return `${primero} y otro cliente`;
  return `${primero} y ${clientes.length - 1} clientes más`;
}

const CADA: Readonly<Record<RecurrentePara['frecuencia'], string>> = {
  semanal: 'Cada semana',
  quincenal: 'Cada quincena',
  mensual: 'Cada mes',
};

/** «Cada mes · día 15 · Aguas Puras». */
export function detalleRecurrente(r: RecurrentePara): string {
  const partes = [CADA[r.frecuencia]];
  if (r.frecuencia === 'mensual' && r.diaDelMes !== null) partes.push(`día ${r.diaDelMes}`);
  if (r.proveedor !== null) partes.push(r.proveedor);
  return partes.join(' · ');
}

export const comoPendiente = (r: RecurrentePara): PendienteRecurrente => ({
  id: r.id,
  nombre: r.concepto,
  detalle: detalleRecurrente(r),
  monto: BigInt(r.montoCentavos),
  vence: r.vence,
});

export function porMetodoDe(v: TurnoVivoPara): readonly CobroPorMetodo[] {
  return [
    { metodo: 'Efectivo', monto: BigInt(v.porMetodo.Efectivo), nota: NOTA.Efectivo },
    { metodo: 'Tarjeta', monto: BigInt(v.porMetodo.Tarjeta), nota: NOTA.Tarjeta },
    {
      metodo: 'Transferencia',
      monto: BigInt(v.porMetodo.Transferencia),
      nota: NOTA.Transferencia,
    },
    { metodo: 'Fiado', monto: BigInt(v.porMetodo.Fiado), nota: notaFiado(v.fiadoClientes) },
  ];
}

const comoMovimiento = (m: TurnoVivoPara['movimientos'][number]): Movimiento => ({
  ...m,
  monto: BigInt(m.montoCentavos),
});

/** The live read as Mi turno's data; the operator comes from the session. */
export function comoTurno(v: TurnoVivoPara, operador: string, caja: string): TurnoData {
  const c = v.cierre;
  const gastosEfectivo = BigInt(c.gastosEfectivoCentavos);
  return {
    operador,
    caja,
    desde: c.desde,
    fondo: BigInt(c.fondoCentavos),
    ventasEfectivo: BigInt(c.ventasEfectivoCentavos),
    abonosEfectivo: BigInt(c.abonosEfectivoCentavos),
    gastosEfectivo,
    esperado: BigInt(c.esperadoCentavos),
    ventas: c.resumen.ventas,
    canceladas: c.resumen.canceladas,
    ultimaCancelada: v.ultimaCancelada,
    cobrado: BigInt(c.resumen.cobradoCentavos),
    porMetodo: porMetodoDe(v),
    fiado: BigInt(c.resumen.fiadoCentavos),
    clientesFiados: v.fiadoClientes.length,
    gastos: gastosEfectivo,
    // Receipt photos wait for the storage bucket (ADR-083 D3): none yet.
    comprobantes: 0,
    pendientes: v.recurrentes.map(comoPendiente),
    movimientos: v.movimientos.map(comoMovimiento),
  };
}
