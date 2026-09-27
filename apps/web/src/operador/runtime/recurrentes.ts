/**
 * Paying a recurring gasto from the caja (plan 11 §3.3): Gastos' drawer opens
 * filled from the template (`gastoRecurrente`), and saving goes through
 * `ProcesarGastoRecurrenteUseCase` with what the operator captured
 * (`pagarRecurrente`): the egreso is linked to the template, scoped to the
 * turno, and the template's `proximoDisparo` advances, so Mi turno's
 * «Pendientes de registrar» and Inicio's «Para hoy» drop it. The schedule
 * lives on this device (`recurring_expenses` is DOWN-only), as on the phone.
 */

import { ProcesarGastoRecurrenteUseCase } from '@xangarro/application';
import { DrizzleExpensesRepository, DrizzleRecurringExpensesRepository } from '@xangarro/data';
import type { BusinessId, CajaTurnoId, UserId } from '@xangarro/domain';

import { categoriaDominio, categoriaOperador } from '../vocabulario';
import type { Db } from './db-types';
import { hoyLocal } from './fechas';
import { registrarGasto } from './gastos';

/** A due template as the drawer fills itself: money as centavos, the operator's category. */
export interface RecurrenteGastoPara {
  readonly id: string;
  readonly concepto: string;
  readonly montoCentavos: string;
  readonly categoria: string;
  readonly proveedor: string | null;
}

export type RecurrenteRequest =
  | {
      readonly id: number;
      readonly method: 'gastoRecurrente';
      readonly businessId: string;
      readonly deviceId: string;
      readonly recurrenteId: string;
    }
  | {
      readonly id: number;
      readonly method: 'pagarRecurrente';
      readonly businessId: string;
      readonly deviceId: string;
      readonly userId: string;
      readonly turnoId: string;
      readonly recurrenteId: string;
      readonly concepto: string;
      /** The operator's category word; the worker maps it to the domain's. */
      readonly categoria: string;
      readonly montoCentavos: string;
      readonly proveedor: string | null;
    };

type Pagar = Extract<RecurrenteRequest, { readonly method: 'pagarRecurrente' }>;

/** The template, only while it is this business's, active and due: else there is nothing to pay. */
export async function gastoRecurrente(
  db: Db,
  businessId: string,
  deviceId: string,
  recurrenteId: string,
): Promise<RecurrenteGastoPara | null> {
  const repo = new DrizzleRecurringExpensesRepository(db as never, deviceId as never);
  const r = await repo.findById(recurrenteId as never);
  const vivo = r !== null && r.deletedAt === null && r.activo && r.businessId === businessId;
  if (!vivo || r.proximoDisparo > hoyLocal()) return null;
  return {
    id: r.id,
    concepto: r.concepto,
    montoCentavos: r.montoCentavos.toString(),
    categoria: categoriaOperador(r.categoria),
    proveedor: r.proveedor,
  };
}

/**
 * Record the payment and advance the schedule in one use case. When the
 * template is no longer due (another screen paid it, or the owner changed it)
 * the money still left the drawer: it is recorded as a plain gasto.
 */
export async function pagarRecurrente(db: Db, p: Pagar): Promise<{ readonly id: string }> {
  const recurring = new DrizzleRecurringExpensesRepository(db as never, p.deviceId as never);
  const template = await recurring.findById(p.recurrenteId as never);
  const monto = BigInt(p.montoCentavos);
  if (template !== null && template.businessId === p.businessId) {
    const r = await new ProcesarGastoRecurrenteUseCase(
      new DrizzleExpensesRepository(db as never, p.deviceId as never, p.userId as never),
      recurring,
    ).execute({
      template,
      today: hoyLocal() as never,
      captura: {
        concepto: p.concepto,
        categoria: categoriaDominio(p.categoria as never),
        monto,
        proveedor: p.proveedor,
        cajaTurnoId: p.turnoId as CajaTurnoId,
      },
    });
    if (r.processed && r.egreso !== null) return { id: r.egreso.id };
  }
  return registrarGasto(db, {
    businessId: p.businessId as BusinessId,
    deviceId: p.deviceId,
    userId: p.userId as UserId,
    turnoId: p.turnoId as CajaTurnoId,
    concepto: p.concepto,
    categoria: p.categoria,
    monto,
    proveedor: p.proveedor,
  });
}

/** The router's entry for both methods (router.ts is at budget). */
export function porRecurrente(
  request: RecurrenteRequest,
  rt: { readonly db: Db },
): Promise<unknown> {
  if (request.method === 'gastoRecurrente') {
    return gastoRecurrente(rt.db, request.businessId, request.deviceId, request.recurrenteId);
  }
  return pagarRecurrente(rt.db, request);
}
