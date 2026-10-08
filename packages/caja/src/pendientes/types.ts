import type { Money } from '@xangarro/domain';

import type { EstadoMode } from '../estado';

/** A record captured on this register and not yet accepted by the server. */
export interface RegistroEnCola {
  readonly id: string;
  readonly tipo: 'venta' | 'gasto' | 'abono' | 'movimiento';
  /** «Venta V-0412», «Gasto · Gas», «Abono · Chuy», «Apertura de caja». */
  readonly titulo: string;
  readonly detalle: string;
  /** Always positive; a gasto shows with «−». Null when the record carries no money. */
  readonly monto: Money | null;
  readonly hora: string;
  /** Tried at least once and retrying by itself (DS-07). */
  readonly reintento?: boolean;
  /** When one of its rows was last sent (ISO); null or absent if never. */
  readonly ultimoIntento?: string | null;
  /** When one of its rows goes again by itself (ISO). */
  readonly proximoIntento?: string | null;
}

export interface PendientesScreenProps {
  readonly state: 'happy' | EstadoMode;
  readonly cola: readonly RegistroEnCola[];
  /** The owner's name in the copy; null on a linked caja, which doesn't know it. */
  readonly dueno?: string | null;
  /** A linked caja: «Reintentar ahora» runs the real flush. */
  readonly vivo?: EnvioVivo;
}

/** A linked caja's send: the real flush, then a fresh read of the outbox. */
export interface EnvioVivo {
  /** False until the first read: nothing to retry before the queue is known. */
  readonly listo: boolean;
  readonly enviar: () => Promise<void>;
}
