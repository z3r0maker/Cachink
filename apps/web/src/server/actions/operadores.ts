'use server';

import {
  CambiarPermisosOperadorUseCase,
  CrearOperadorUseCase,
  DesactivarOperadorUseCase,
  RestablecerPinOperadorUseCase,
} from '@xangarro/application';
import type { BusinessId, UserId } from '@xangarro/domain';
import { revalidatePath } from 'next/cache';

import { requireMember } from '../auth';
import { tenantEntitlement } from '../billing/plan';
import { withTenant } from '../db';
import { reportError } from '../observability/report';
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
  'PERMISOS_NO_INCLUIDOS',
]);

function fail(error: unknown, where: string): OperadorResult {
  const code = (error as { code?: string } | null)?.code;
  if (error instanceof Error && code !== undefined && KNOWN.has(code)) {
    return { ok: false, message: error.message };
  }
  reportError(error, { endpoint: where });
  return { ok: false, message: 'No pudimos guardar el cambio. Intenta de nuevo.' };
}

export async function crearOperador(nombre: string, pin: string): Promise<OperadorResult> {
  try {
    const session = await requireMember('admin');
    const businessId = session.business_id as BusinessId;
    await withTenant(businessId, async (tx) =>
      new CrearOperadorUseCase(pgUsersRepository(tx, businessId)).execute({
        businessId,
        nombre,
        pin,
        // The rule is the use case's; the number is the plan's (B-10).
        operatorLimit: (await tenantEntitlement(tx, businessId, new Date())).limits.operators,
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

/** «Editar permisos» (P-05): only where the plan includes per-operator permissions. */
export async function cambiarPermisos(
  operatorId: string,
  permisos: { canCancelSales: boolean },
): Promise<OperadorResult> {
  try {
    const session = await requireMember('admin');
    const businessId = session.business_id as BusinessId;
    await withTenant(businessId, async (tx) =>
      new CambiarPermisosOperadorUseCase(pgUsersRepository(tx, businessId)).execute({
        businessId,
        operatorId: operatorId as UserId,
        permisos,
        incluidoEnPlan: (await tenantEntitlement(tx, businessId, new Date())).capabilities
          .permisosPorUsuario,
      }),
    );
    revalidatePath('/equipo');
    return { ok: true };
  } catch (error) {
    return fail(error, 'cambiarPermisos');
  }
}
