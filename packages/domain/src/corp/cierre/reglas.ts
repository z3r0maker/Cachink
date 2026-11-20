import type { Money } from '../../money/index.js';
import { periodOf } from '../ledger/rules.js';
import { CierreError } from './errors.js';
import { pasosPendientes, type PasoDelCierre } from './pasos.js';

/**
 * Who may close and reopen a month (E-14, board CD-10b). Either founder
 * closes once the seven steps are done; reopening takes both: one asks with
 * a reason and the other approves. Months close in order and reopen from the
 * newest back, so a reopened month never sits under a closed one. Pure.
 */
export type KindEventoCierre =
  'cerrado' | 'reapertura_pedida' | 'reapertura_rechazada' | 'reabierto';

export interface EventoCierre {
  readonly kind: KindEventoCierre;
  readonly founderId: string;
  readonly motivo: string | null;
  /** ISO timestamp. */
  readonly at: string;
}

export interface Reapertura {
  readonly founderId: string;
  readonly motivo: string;
  readonly at: string;
}

export interface EstadoDelCierre {
  readonly cerrado: boolean;
  /** An open request to reopen, waiting on the other founder. */
  readonly pedido: Reapertura | null;
}

/** The month's state from its events, oldest first. */
export function estadoDelCierre(eventos: readonly EventoCierre[]): EstadoDelCierre {
  let cerrado = false;
  let pedido: Reapertura | null = null;
  for (const e of eventos) {
    if (e.kind === 'cerrado') cerrado = true;
    if (e.kind === 'reabierto') cerrado = false;
    if (e.kind === 'reapertura_pedida') {
      pedido = { founderId: e.founderId, motivo: e.motivo ?? '', at: e.at };
    } else {
      pedido = null;
    }
  }
  return { cerrado, pedido: cerrado ? pedido : null };
}

const esMes = (periodo: string) => periodOf(`${periodo}-01`) !== null;

export interface CerrarInput {
  readonly periodo: string;
  /** This month, `YYYY-MM` in Mexico. */
  readonly mesActual: string;
  readonly pasos: readonly PasoDelCierre[];
  readonly cerrados: ReadonlySet<string>;
  /** Every month with at least one entry. */
  readonly conMovimientos: ReadonlySet<string>;
}

export function assertPuedeCerrar(i: CerrarInput): void {
  if (!esMes(i.periodo)) throw new CierreError('MES_INVALIDO', i.periodo);
  if (i.cerrados.has(i.periodo)) throw new CierreError('MES_CERRADO', i.periodo);
  if (i.periodo >= i.mesActual) throw new CierreError('MES_EN_CURSO', i.periodo);
  const anterior = [...i.conMovimientos]
    .filter((m) => m < i.periodo && !i.cerrados.has(m))
    .sort()[0];
  if (anterior !== undefined) throw new CierreError('MES_ANTERIOR_ABIERTO', i.periodo, anterior);
  const faltan = pasosPendientes(i.pasos);
  if (faltan > 0) throw new CierreError('PASOS_PENDIENTES', i.periodo, String(faltan));
}

export interface PedirInput {
  readonly periodo: string;
  readonly cerrados: ReadonlySet<string>;
  readonly estado: EstadoDelCierre;
  readonly motivo: string;
}

export function assertPuedePedirReabrir(i: PedirInput): void {
  if (!esMes(i.periodo)) throw new CierreError('MES_INVALIDO', i.periodo);
  if (!i.cerrados.has(i.periodo)) throw new CierreError('MES_ABIERTO', i.periodo);
  const posterior = [...i.cerrados]
    .filter((m) => m > i.periodo)
    .sort()
    .at(-1);
  if (posterior !== undefined) throw new CierreError('MES_POSTERIOR_CERRADO', i.periodo, posterior);
  if (i.estado.pedido !== null) throw new CierreError('REAPERTURA_PENDIENTE', i.periodo);
  if (i.motivo.trim() === '') throw new CierreError('MOTIVO_REAPERTURA', i.periodo);
}

/** Only the other founder answers a request, to approve it or to reject it. */
export function assertPuedeResponder(
  periodo: string,
  estado: EstadoDelCierre,
  founderId: string,
): Reapertura {
  if (estado.pedido === null) throw new CierreError('SIN_REAPERTURA', periodo);
  if (estado.pedido.founderId === founderId) throw new CierreError('MISMO_SOCIO', periodo);
  return estado.pedido;
}

/** The statement's balance is confirmed only when it equals the ledger's. */
export function assertSaldoCoincide(periodo: string, consola: Money, banco: Money): void {
  if (consola !== banco) throw new CierreError('SALDO_NO_COINCIDE', periodo);
}

/** The day a month's bank balance is read at: its last. */
export function ultimoDia(periodo: string): string {
  const [y, m] = periodo.split('-').map(Number);
  if (y === undefined || m === undefined) throw new CierreError('MES_INVALIDO', periodo);
  const dia = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${periodo}-${String(dia).padStart(2, '0')}`;
}
