import type { Money } from '@xangarro/domain';

import type { EstadoMode } from '../estado';

export const METODOS_ABONO = ['Efectivo', 'Transferencia', 'Tarjeta', 'QR / CoDi'] as const;
export type MetodoAbono = (typeof METODOS_ABONO)[number];

/** An open fiado ticket and what is still owed on it. */
export interface VentaFiada {
  readonly folio: string;
  /** ISO date; the oldest is settled first (ADR-074). */
  readonly fecha: string;
  /** «14 may». */
  readonly dia: string;
  readonly pendiente: Money;
}

export interface ClienteCobranza {
  readonly id: string;
  readonly nombre: string;
  readonly iniciales: string;
  readonly telefono: string;
  readonly tint: string;
  /** Newest first, as the cards and the detail list them. */
  readonly abiertas: readonly VentaFiada[];
  /** Past the owner's term (`plazoDias`, ADR-074). */
  readonly atrasado: boolean;
  /** «9 may»: when the last ticket was settled, for a client who owes nothing. */
  readonly ultimaLiquidada?: string;
}

export interface AbonoHoy {
  readonly id: string;
  readonly clienteId: string;
  readonly detalle: string;
  readonly monto: Money;
  readonly metodo: MetodoAbono;
  readonly hora: string;
}

export type FiltroCobranza = 'Todos' | 'Con saldo' | 'Atrasados';

export interface CobranzaData {
  readonly clientes: readonly ClienteCobranza[];
  readonly abonos: readonly AbonoHoy[];
}

export interface CobranzaScreenProps {
  readonly state: 'happy' | EstadoMode;
  readonly data: CobranzaData;
}
