/**
 * What the open turno's live read hands Mi turno and Inicio (O-39): the close
 * figures Cierre already computes, plus the turno's detail: money always as
 * centavos strings, times already local «HH:MM».
 */

import type { CierrePara } from './shapes';

export type MetodoTurno = 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Fiado';

export interface MovimientoPara {
  readonly id: string;
  readonly tipo: 'venta' | 'gasto' | 'credito' | 'abono';
  readonly titulo: string;
  readonly detalle: string;
  readonly hora: string;
  /** Signed: gastos are negative. */
  readonly montoCentavos: string;
}

/** A recurring expense already due (`proximoDisparo <= hoy`). */
export interface RecurrentePara {
  readonly id: string;
  readonly concepto: string;
  readonly frecuencia: 'semanal' | 'quincenal' | 'mensual';
  readonly diaDelMes: number | null;
  readonly proveedor: string | null;
  readonly montoCentavos: string;
  /** Days from today; zero or negative (late). */
  readonly vence: number;
}

/** A closed turno of this caja (the current one too, once closed), newest first. */
export interface CortePara {
  readonly fecha: string;
  /** Counted minus expected; positive is a surplus. */
  readonly diferenciaCentavos: string;
}

export interface TurnoVivoPara {
  readonly cierre: CierrePara;
  /** UTC ISO of the apertura, for «hace cuántas horas». */
  readonly aperturaAt: string;
  readonly porMetodo: Readonly<Record<MetodoTurno, string>>;
  /** Names of the clients who took fiado this turno, first sale first. */
  readonly fiadoClientes: readonly string[];
  readonly ultimaCancelada: string | null;
  /** UTC ISO of the newest standing sale; null before the first. */
  readonly ultimaVentaAt: string | null;
  readonly gastos: number;
  readonly movimientos: readonly MovimientoPara[];
  readonly recurrentes: readonly RecurrentePara[];
  readonly cortes: readonly CortePara[];
}
