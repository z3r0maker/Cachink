/**
 * Cancel a ticket of the open turno (O-32) through the real use case: NIP,
 * permission, stock back, audit log. The NIP is the authorising user's
 * (`userId`, the one the use case verifies) and its check goes through that
 * person's lockout (audit F-08): a wrong NIP counts against them, a refusal
 * for any other reason does not, and while their lockout runs the use case
 * is not called at all.
 */

import {
  DrizzleCancelacionLogsRepository,
  DrizzleInventoryMovementsRepository,
  DrizzleProductsRepository,
  DrizzleSalesRepository,
  DrizzleTicketsRepository,
  DrizzleUsersRepository,
} from '@xangarro/data';
import { CancelarTicketUseCase, isWrongPin } from '@xangarro/application';
import { NipBloqueadoError, attemptNip, type NipCheck } from '@xangarro/caja/nip';
import type { BusinessId, TicketId, UserId } from '@xangarro/domain';

import type { Db } from './db-types';
import { guardiaNip } from './nip-guard';
import { stockDelNegocio } from './tickets';

export interface CancelarTicketParams {
  readonly businessId: BusinessId;
  readonly deviceId: string;
  readonly userId: UserId;
  readonly ticketId: TicketId;
  readonly pin: string;
  readonly motivo: string;
}

export interface TicketCancelado {
  readonly folio: number;
  readonly cashToReturnCentavos: string | null;
}

function casoDeUso(db: Db, p: CancelarTicketParams): CancelarTicketUseCase {
  return new CancelarTicketUseCase(
    new DrizzleTicketsRepository(db as never, p.deviceId as never, p.userId as never),
    new DrizzleSalesRepository(db as never, p.deviceId as never, p.userId as never),
    new DrizzleUsersRepository(db as never, p.deviceId as never),
    new DrizzleProductsRepository(db as never, p.deviceId as never),
    new DrizzleInventoryMovementsRepository(db as never, p.deviceId as never),
    new DrizzleCancelacionLogsRepository(db as never, p.deviceId as never, p.userId as never),
  );
}

/**
 * Throws what the use case throws, or `NipBloqueadoError` while the lockout
 * runs (and on the wrong NIP that starts it).
 */
export async function cancelarTicket(db: Db, p: CancelarTicketParams): Promise<TicketCancelado> {
  const useCase = casoDeUso(db, p);
  const stockEnabled = await stockDelNegocio(db, p.businessId, p.deviceId);
  let nipErrado: unknown = null;
  const check = async (): Promise<NipCheck<TicketCancelado>> => {
    try {
      const r = await useCase.execute({ ...p, stockEnabled });
      const cash = r.cashToReturn?.toString() ?? null;
      return { ok: true, value: { folio: r.ticket.folio, cashToReturnCentavos: cash } };
    } catch (e: unknown) {
      if (!isWrongPin(e)) throw e;
      nipErrado = e;
      return { ok: false };
    }
  };
  const attempt = await attemptNip(guardiaNip(db), p.userId, check);
  if (attempt.status === 'ok') return attempt.value;
  throw attempt.lockedMs > 0 ? new NipBloqueadoError(attempt.lockedMs) : nipErrado;
}
