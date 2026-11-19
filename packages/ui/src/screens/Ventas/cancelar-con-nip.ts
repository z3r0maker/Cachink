/**
 * Cancels a ticket through `CancelarTicketUseCase` behind the device's NIP
 * guard (audit F-08). The NIP checked is the authorising user's
 * (`input.userId`, the one the use case verifies), so a wrong one counts
 * toward that person's lockout, the same one their sign-in counts toward,
 * and while it runs the use case is not called at all. A refusal that is
 * not about the NIP (no permission, already cancelled) counts nothing.
 */

import { CancelarTicketError, CancelarTicketUseCase, isWrongPin } from '@xangarro/application';
import { attemptNip, type NipCheck } from '@xangarro/caja/nip';
import type { BusinessId, TicketId, UserId } from '@xangarro/domain';
import { deviceNipGuard, nipRefusal } from '../../app/pin-lockout';
import type { Repositories } from '../../app/repository-provider';

export type CancelarRepos = Pick<
  Repositories,
  | 'appConfig'
  | 'tickets'
  | 'sales'
  | 'users'
  | 'products'
  | 'inventoryMovements'
  | 'cancelacionLogs'
>;

export interface CancelarConNipInput {
  readonly ticketId: TicketId;
  readonly userId: UserId;
  readonly businessId: BusinessId;
  readonly pin: string;
  readonly motivo: string;
}

const noSePudo = (e: unknown): string =>
  `No se pudo cancelar: ${e instanceof Error ? e.message : String(e)}`;

const casoDeUso = (repos: CancelarRepos): CancelarTicketUseCase =>
  new CancelarTicketUseCase(
    repos.tickets,
    repos.sales,
    repos.users,
    repos.products,
    repos.inventoryMovements,
    repos.cancelacionLogs,
  );

/** Null when the cancel may go on; else what to say, and whether it is the permission. */
export type VerificacionCancelar = null | {
  readonly texto: string;
  readonly sinPermiso: boolean;
};

const NIP_NO = 'Ese NIP no es. La venta sigue igual: no devuelvas dinero.';

/**
 * Checks the NIP and the permission before anything is said or handed back
 * (M2), behind the same guard: a wrong NIP counts toward the lockout here,
 * as it would at the write.
 */
export async function verificarConNip(
  repos: CancelarRepos,
  input: { readonly userId: UserId; readonly pin: string },
): Promise<VerificacionCancelar> {
  const uc = casoDeUso(repos);
  const check = async (): Promise<NipCheck<null>> => {
    try {
      await uc.verificar(input.userId, input.pin);
      return { ok: true, value: null };
    } catch (e: unknown) {
      if (!isWrongPin(e)) throw e;
      return { ok: false };
    }
  };
  try {
    const attempt = await attemptNip(deviceNipGuard(repos.appConfig), input.userId, check);
    return attempt.status === 'ok'
      ? null
      : { texto: nipRefusal(attempt, NIP_NO), sinPermiso: false };
  } catch (e: unknown) {
    const sinPermiso = e instanceof CancelarTicketError && e.code === 'SIN_PERMISO';
    return { texto: noSePudo(e), sinPermiso };
  }
}

/** Resolves the sentence to show, or null once the ticket stands cancelled. */
export async function cancelarConNip(
  repos: CancelarRepos,
  input: CancelarConNipInput,
): Promise<string | null> {
  const uc = casoDeUso(repos);
  let wrongPin = '';
  const check = async (): Promise<NipCheck<null>> => {
    try {
      await uc.execute(input);
      return { ok: true, value: null };
    } catch (e: unknown) {
      if (!isWrongPin(e)) throw e;
      wrongPin = noSePudo(e);
      return { ok: false };
    }
  };
  try {
    const attempt = await attemptNip(deviceNipGuard(repos.appConfig), input.userId, check);
    return attempt.status === 'ok' ? null : nipRefusal(attempt, wrongPin);
  } catch (e: unknown) {
    return noSePudo(e);
  }
}
