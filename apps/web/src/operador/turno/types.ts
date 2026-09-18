import type { Money } from '@xangarro/domain';

import type { EstadoMode } from '../estado';

/** A line of «Movimientos de tu turno»; the kind picks the tint and glyph. */
export type MovimientoTipo = 'venta' | 'gasto' | 'credito' | 'abono' | 'merma';

export interface Movimiento {
  readonly id: string;
  readonly tipo: MovimientoTipo;
  readonly titulo: string;
  readonly detalle: string;
  readonly hora: string;
  /** Signed centavos; zero for movements that move no money (mermas). */
  readonly monto: Money;
}

/** A recurring expense nobody has captured yet; `vence` is days from today. */
export interface PendienteRecurrente {
  readonly id: string;
  readonly nombre: string;
  readonly detalle: string;
  readonly monto: Money;
  readonly vence: number;
}

export interface TurnoData {
  readonly operador: string;
  readonly caja: string;
  readonly desde: string;
  /** The four parts of the expected cash, and its total from the domain calculator (O-03). */
  readonly fondo: Money;
  readonly ventasEfectivo: Money;
  readonly abonosEfectivo: Money;
  readonly gastosEfectivo: Money;
  readonly esperado: Money;
  readonly ventas: number;
  readonly canceladas: number;
  readonly ultimaCancelada: string | null;
  readonly cobrado: Money;
  readonly fiado: Money;
  readonly clientesFiados: number;
  readonly gastos: Money;
  readonly comprobantes: number;
  readonly pendientes: readonly PendienteRecurrente[];
  readonly movimientos: readonly Movimiento[];
}

export interface TurnoScreenProps {
  /** The shared states replace «Movimientos de tu turno» only. */
  readonly state: 'happy' | EstadoMode;
  readonly data: TurnoData;
}
