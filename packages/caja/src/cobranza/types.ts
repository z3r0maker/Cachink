import type { EstadoMode } from '../estado';
import type { CuentaCliente } from './cliente/types';

export const METODOS_ABONO = ['Efectivo', 'Transferencia', 'Tarjeta'] as const;
/** What an abono is captured with: Efectivo, Transferencia or Tarjeta (fiado is not a payment). */
export type MetodoAbono = (typeof METODOS_ABONO)[number];

export type FiltroCobranza = 'Todos' | 'Con saldo' | 'Atrasados';

export interface CobranzaData {
  readonly cuentas: readonly CuentaCliente[];
  /** ISO date of the turno's day: its abonos are «los que recibiste hoy». */
  readonly hoy: string;
  /** Named in the WhatsApp reminder («Te escribimos de Taquería Don Pedro»). */
  readonly negocio: string;
}

export interface CobranzaScreenProps {
  readonly state: 'happy' | EstadoMode;
  readonly data: CobranzaData;
}
