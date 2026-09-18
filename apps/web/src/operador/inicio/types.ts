import type { Money } from '@xangarro/domain';

import type { EstadoMode } from '../estado';

/** What the «Lo primero» card answers: what should the operator do now. */
export type Situacion = 'vendiendo' | 'turno-cerrado' | 'hora-de-cerrar' | 'corte-por-aclarar';

export type TareaTipo = 'gasto' | 'reponer' | 'cobrar' | 'entrada';

export interface Tarea {
  readonly id: string;
  readonly tipo: TareaTipo;
  readonly titulo: string;
  readonly detalle: string;
}

export interface MensajeDueno {
  readonly id: string;
  /** Severity drives the dot: `alta` red, `normal` yellow. */
  readonly severidad: 'alta' | 'normal';
  readonly titulo: string;
  readonly cuerpo: string;
  readonly hora: string;
}

export type ResultadoCorte =
  | { readonly tipo: 'cuadro' }
  | { readonly tipo: 'sobro'; readonly monto: Money }
  /** `motivo` is the operator's reason, lowercase, quoted in Inicio's «Cerró». */
  | { readonly tipo: 'falto'; readonly monto: Money; readonly motivo?: string };

export interface CorteReciente {
  readonly etiqueta: string;
  readonly resultado: ResultadoCorte;
}

export interface TurnoAbierto {
  readonly ventas: number;
  readonly canceladas: number;
  readonly ultimaCancelada: string | null;
  readonly cobrado: Money;
  readonly esperado: Money;
  readonly fiado: Money;
  readonly clientesFiados: number;
  readonly ultimaVentaHace: string;
  readonly horasAbierto: number;
}

export interface UltimoTurno {
  readonly cobrado: Money;
  readonly cuando: string;
  readonly ventas: number;
  readonly resultado: ResultadoCorte;
  readonly fondoSugerido: Money;
  readonly porCobrar: Money;
  readonly clientesConSaldo: number;
}

export interface InicioData {
  readonly nombre: string;
  readonly fecha: string;
  readonly dueno: string;
  readonly situacion: Situacion;
  readonly offline: boolean;
  readonly pendientes: number;
  readonly turno: TurnoAbierto | null;
  readonly ultimoTurno: UltimoTurno;
  readonly corteAclarar: { readonly dia: string; readonly caja: string; readonly monto: Money };
  readonly tareas: readonly Tarea[];
  readonly mensajes: readonly MensajeDueno[];
  readonly cortes: readonly CorteReciente[];
}

export interface InicioScreenProps {
  /** `happy` or one of the three shared states, which replace «Para hoy» only. */
  readonly state: 'happy' | EstadoMode;
  readonly data: InicioData;
}
