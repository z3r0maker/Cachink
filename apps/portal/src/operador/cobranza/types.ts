import type { EstadoMode } from '../estado';
import type { CuentaCliente } from './cliente/types';

export const METODOS_ABONO = ['Efectivo', 'Transferencia', 'Tarjeta', 'QR / CoDi'] as const;
export type MetodoAbono = (typeof METODOS_ABONO)[number];

export type FiltroCobranza = 'Todos' | 'Con saldo' | 'Atrasados';

export interface CobranzaData {
  readonly cuentas: readonly CuentaCliente[];
  /** ISO date of the turno's day: its abonos are «los que recibiste hoy». */
  readonly hoy: string;
}

export interface CobranzaScreenProps {
  readonly state: 'happy' | EstadoMode;
  readonly data: CobranzaData;
}
