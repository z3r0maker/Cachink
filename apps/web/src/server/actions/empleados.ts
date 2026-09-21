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
import { pagosDeEmpleado } from '@xangarro/data-pg';
import { revalidatePath } from 'next/cache';

import { requireMember } from '../auth';
import { withTenant } from '../db';
import { reportError } from '../observability/report';
import { readSession } from '../session';
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

/**
 * P-12's employee drawer: the recent payroll payments, by the `empleado_id`
 * link (O-26) — never by matching «Nómina {nombre}», which a rename breaks.
 */
export type PagosEmpleadoResult =
  | {
      ok: true;
      pagos: readonly { id: string; fecha: string; concepto: string; monto: bigint }[];
    }
  | { ok: false; message: string };

export async function pagosDelEmpleado(empleadoId: string): Promise<PagosEmpleadoResult> {
  try {
    const session = await readSession();
    if (session === null) return { ok: false, message: 'Inicia sesión para continuar.' };
    const pagos = await withTenant(session.business_id, (tx) => pagosDeEmpleado(tx, empleadoId));
    return { ok: true, pagos };
  } catch (error) {
    reportError(error, { endpoint: 'pagosDelEmpleado' });
    return { ok: false, message: 'No pudimos leer los pagos. Intenta de nuevo.' };
  }
}
