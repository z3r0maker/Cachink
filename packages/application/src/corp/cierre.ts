import type { Money } from '@xangarro/domain';
import {
  assertPuedeCerrar,
  assertPuedePedirReabrir,
  assertPuedeResponder,
  assertSaldoCoincide,
  CierreError,
  estadoDelCierre,
  pasosDelCierre,
  ultimoDia,
  type EventoCierre,
  type FuentesCierre,
  type Reapertura,
} from '@xangarro/domain/corp';

/**
 * Cierre del mes's writes (E-14, boards CD-10 and CD-10b). Closing locks the
 * month in the ledger (`closed_periods`, which its trigger and
 * `assertPeriodOpen` already enforce); reopening needs one founder to ask and
 * the other to approve, and every step is an event kept forever.
 */
export interface CierreRepository {
  cerrados(): Promise<ReadonlySet<string>>;
  /** The month's events, oldest first. */
  eventos(periodo: string): Promise<readonly EventoCierre[]>;
  /** Every month with at least one entry. */
  conMovimientos(): Promise<ReadonlySet<string>>;
  /** Locks the month and records who did, in one transaction. */
  cerrar(periodo: string, founderId: string): Promise<void>;
  pedirReabrir(periodo: string, founderId: string, motivo: string): Promise<void>;
  rechazar(periodo: string, founderId: string): Promise<void>;
  /** Records the approval and unlocks the month, in one transaction. */
  reabrir(periodo: string, founderId: string): Promise<void>;
  saldoConfirmado(periodo: string): Promise<Money | null>;
  confirmarSaldo(periodo: string, saldo: Money, founderId: string): Promise<void>;
}

export interface CierreDeps {
  readonly cierre: CierreRepository;
  /** What the seven steps read, for a month. */
  readonly fuentes: (periodo: string) => Promise<FuentesCierre>;
  /** Bancos summed up to a day, `YYYY-MM-DD` inclusive. */
  readonly saldoDeBancos: (hasta: string) => Promise<Money>;
}

interface Mes {
  readonly periodo: string;
  readonly founderId: string;
}

export async function cerrarMes(
  deps: CierreDeps,
  input: Mes & { readonly mesActual: string },
): Promise<void> {
  const [cerrados, conMovimientos, fuentes] = await Promise.all([
    deps.cierre.cerrados(),
    deps.cierre.conMovimientos(),
    deps.fuentes(input.periodo),
  ]);
  assertPuedeCerrar({
    periodo: input.periodo,
    mesActual: input.mesActual,
    pasos: pasosDelCierre(fuentes),
    cerrados,
    conMovimientos,
  });
  await deps.cierre.cerrar(input.periodo, input.founderId);
}

export async function pedirReabrir(
  deps: Pick<CierreDeps, 'cierre'>,
  input: Mes & { readonly motivo: string },
): Promise<void> {
  const [cerrados, eventos] = await Promise.all([
    deps.cierre.cerrados(),
    deps.cierre.eventos(input.periodo),
  ]);
  assertPuedePedirReabrir({
    periodo: input.periodo,
    cerrados,
    estado: estadoDelCierre(eventos),
    motivo: input.motivo,
  });
  await deps.cierre.pedirReabrir(input.periodo, input.founderId, input.motivo.trim());
}

/** The other founder's answer: approving reopens the month, rejecting keeps it closed. */
export async function responderReapertura(
  deps: Pick<CierreDeps, 'cierre'>,
  input: Mes & { readonly aprobar: boolean },
): Promise<Reapertura> {
  const eventos = await deps.cierre.eventos(input.periodo);
  const pedido = assertPuedeResponder(input.periodo, estadoDelCierre(eventos), input.founderId);
  if (input.aprobar) await deps.cierre.reabrir(input.periodo, input.founderId);
  else await deps.cierre.rechazar(input.periodo, input.founderId);
  return pedido;
}

/** The statement's balance at the month's last day, kept only when it equals the ledger's. */
export async function confirmarSaldo(
  deps: CierreDeps,
  input: Mes & { readonly saldo: Money },
): Promise<void> {
  const cerrados = await deps.cierre.cerrados();
  if (cerrados.has(input.periodo)) throw new CierreError('MES_CERRADO', input.periodo);
  const consola = await deps.saldoDeBancos(ultimoDia(input.periodo));
  assertSaldoCoincide(input.periodo, consola, input.saldo);
  await deps.cierre.confirmarSaldo(input.periodo, input.saldo, input.founderId);
}
