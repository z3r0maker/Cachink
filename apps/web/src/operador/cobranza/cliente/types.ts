import type { Money } from '@xangarro/domain';

import type { EstadoMode } from '../../estado';
import type { MetodoAbono } from '../types';

/** A fiado ticket, as captured. */
export interface VentaCuenta {
  readonly folio: string;
  readonly concepto: string;
  /** ISO date-time. */
  readonly fecha: string;
  /** «28 abr», «hoy». */
  readonly dia: string;
  readonly monto: Money;
  /** «Ana Robledo · Caja 1». */
  readonly capturo: string;
}

export interface AbonoCuenta {
  readonly id: string;
  /** ISO date-time. */
  readonly fecha: string;
  /** «24 abr», «hoy 13:52». */
  readonly dia: string;
  readonly monto: Money;
  readonly metodo: MetodoAbono;
  /** What the operator wrote, shown instead of the derived line in today's abonos. */
  readonly nota?: string;
}

/**
 * A client's account: its only two facts are fiado tickets and abonos (README
 * §10, ADR-074). Balance, open tickets, credit and history are derived.
 */
export interface CuentaCliente {
  readonly id: string;
  readonly nombre: string;
  readonly iniciales: string;
  readonly telefono: string;
  /** Avatar tint on Cobranza's card. */
  readonly tint: string;
  /** «enero 2026». */
  readonly desde: string;
  /** Set by the owner. */
  readonly limite: Money;
  readonly plazo: string;
  readonly atrasado: boolean;
  readonly ventas: readonly VentaCuenta[];
  readonly abonos: readonly AbonoCuenta[];
}

export interface DetalleClienteData {
  readonly negocio: string;
  readonly dueno: string;
  readonly cuenta: CuentaCliente | null;
}

export interface DetalleClienteProps {
  readonly state: 'happy' | EstadoMode;
  readonly data: DetalleClienteData;
}
