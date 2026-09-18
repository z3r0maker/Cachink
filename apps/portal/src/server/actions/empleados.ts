'use server';

import {
  DarDeBajaEmpleadoUseCase,
  GuardarEmpleadoUseCase,
  type EmpleadoForm,
} from '@xangarro/application';
import {
  EmpleadoInvalidoError,
  EmpleadoNoEncontradoError,
  type BusinessId,
  type EmployeeId,
} from '@xangarro/domain';
import { revalidatePath } from 'next/cache';

import { requireMember } from '../auth';
import { withTenant } from '../db';
import { reportError } from '../observability/report';
import { pgEmployeesRepository } from '../repositories/employees';

/**
 * The payroll roster from the portal (P-12): add, edit, dar de baja. Admins
 * and owners; the use cases hold the rules, the repository logs every write
 * for the phones (`employees` is DOWN).
 */
export type EmpleadoResult =
  | { ok: true }
  | { ok: false; message: string; campos: Readonly<Record<string, string>> };

function failure(error: unknown, endpoint: string): EmpleadoResult {
  if (error instanceof EmpleadoInvalidoError) {
    return { ok: false, message: error.message, campos: error.campos };
  }
  if (
    error instanceof EmpleadoNoEncontradoError ||
    (error as { code?: string } | null)?.code === 'NOT_PERMITTED'
  ) {
    return { ok: false, message: (error as Error).message, campos: {} };
  }
  reportError(error, { endpoint });
  return { ok: false, message: 'No pudimos guardar. Intenta de nuevo.', campos: {} };
}

export async function guardarEmpleado(
  id: string | null,
  form: EmpleadoForm,
): Promise<EmpleadoResult> {
  try {
    const session = await requireMember('admin');
    const biz = session.business_id as BusinessId;
    await withTenant(biz, (tx) =>
      new GuardarEmpleadoUseCase(pgEmployeesRepository(tx, biz)).execute({
        businessId: biz,
        id: id as EmployeeId | null,
        form,
      }),
    );
    revalidatePath('/empleados');
    return { ok: true };
  } catch (error) {
    return failure(error, 'guardarEmpleado');
  }
}

export async function darDeBajaEmpleado(id: string): Promise<EmpleadoResult> {
  try {
    const session = await requireMember('admin');
    const biz = session.business_id;
    await withTenant(biz, (tx) =>
      new DarDeBajaEmpleadoUseCase(pgEmployeesRepository(tx, biz)).execute(id as EmployeeId),
    );
    revalidatePath('/empleados');
    return { ok: true };
  } catch (error) {
    return failure(error, 'darDeBajaEmpleado');
  }
}
