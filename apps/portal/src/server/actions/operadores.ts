'use server';

import {
  CrearOperadorUseCase,
  DesactivarOperadorUseCase,
  RestablecerPinOperadorUseCase,
} from '@xangarro/application';
import { PLAN_LIMITS, type BusinessId, type UserId } from '@xangarro/domain';
import { revalidatePath } from 'next/cache';

import { PLAN_FIXTURE } from '@/fixtures/business';

import { requireMember } from '../auth';
import { withTenant } from '../db';
import { pgUsersRepository } from '../repositories/users';

/**
 * Operator management from the portal (B-13).
 *
 * Composition roots and nothing else: the allowance, PIN format and name rules
 * are in `@xangarro/application`, run over the Postgres repository inside one
 * tenant transaction, which also appends to `sync_log` so every phone pulls the
 * change.
 *
 * The domain errors carry sentences written for the shopkeeper, so they are
 * passed through as the message. Anything else is logged and replaced by a
 * generic line — never a stack trace in a toast.
 */
export type OperadorResult = { ok: true; warning?: string } | { ok: false; message: string };

const KNOWN = new Set([
  'OPERATOR_LIMIT',
  'INVALID_PIN',
  'OPERATOR_NOT_FOUND',
  'DUPLICATE_OPERATOR',
  'NOT_PERMITTED',
]);

function fail(error: unknown, where: string): OperadorResult {
  const code = (error as { code?: string } | null)?.code;
  if (error instanceof Error && code !== undefined && KNOWN.has(code)) {
    return { ok: false, message: error.message };
  }
  console.error(`[${where}]`, error);
  return { ok: false, message: 'No pudimos guardar el cambio. Intenta de nuevo.' };
}

export async function crearOperador(nombre: string, pin: string): Promise<OperadorResult> {
  try {
    const session = await requireMember('admin');
    const businessId = session.business_id as BusinessId;
    await withTenant(businessId, (tx) =>
      new CrearOperadorUseCase(pgUsersRepository(tx, businessId)).execute({
        businessId,
        nombre,
        pin,
        // The rule is the use case's; the number is the plan's. Still the
        // fixture plan until billing (B-10) gives each business its own.
        operatorLimit: PLAN_LIMITS[PLAN_FIXTURE.planId].operators,
      }),
    );
    revalidatePath('/equipo');
    return { ok: true };
  } catch (error) {
    return fail(error, 'crearOperador');
  }
}

export async function restablecerPin(operatorId: string, pin: string): Promise<OperadorResult> {
  try {
    const session = await requireMember('admin');
    const businessId = session.business_id as BusinessId;
    await withTenant(businessId, (tx) =>
      new RestablecerPinOperadorUseCase(pgUsersRepository(tx, businessId)).execute({
        businessId,
        operatorId: operatorId as UserId,
        pin,
      }),
    );
    return { ok: true };
  } catch (error) {
    return fail(error, 'restablecerPin');
  }
}

export async function desactivarOperador(operatorId: string): Promise<OperadorResult> {
  try {
    const session = await requireMember('admin');
    const businessId = session.business_id as BusinessId;
    const { lastActive } = await withTenant(businessId, (tx) =>
      new DesactivarOperadorUseCase(pgUsersRepository(tx, businessId)).execute({
        businessId,
        operatorId: operatorId as UserId,
      }),
    );
    revalidatePath('/equipo');
    return lastActive
      ? {
          ok: true,
          warning: 'Ya no queda ningún operador activo: nadie podrá entrar en los teléfonos.',
        }
      : { ok: true };
  } catch (error) {
    return fail(error, 'desactivarOperador');
  }
}
