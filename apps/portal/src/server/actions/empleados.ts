'use server';

import { EmployeeSchema, newUlid } from '@xangarro/domain';
import { employees } from '@xangarro/data-pg';
import { revalidatePath } from 'next/cache';

import { requireMember } from '../auth';
import { withTenant } from '../db';
import { recordChange } from '../repositories/sync-log';
import { reportError } from '../observability/report';

/**
 * Add an employee to the payroll roster.
 *
 * `employees` is a DOWN table: the portal owns it and every device pulls it
 * (contract §8). So unlike `notices`, this write **must** append to `sync_log`,
 * in the same transaction — otherwise the roster diverges silently and the
 * phone keeps showing a payroll that no longer exists.
 *
 * Validated through `EmployeeSchema` before it touches Postgres. Drizzle's
 * `text(..., { enum })` is a TypeScript type, not a CHECK constraint, so the
 * database would happily accept `periodo: 'Semanal'` — which is exactly how the
 * seed came to hold rows its own domain rejected.
 */
/**
 * "Created in the portal, not on a device."
 *
 * A valid ULID so it satisfies the domain, and a fixed, greppable one so a row
 * that never came from a phone is obvious in the data rather than looking like
 * a device nobody can find.
 */
const PORTAL_DEVICE_ID = '01HZ8XQN9GZJXV8AKQ5X0WEB01';

export interface NuevoEmpleado {
  readonly nombre: string;
  readonly puesto: string;
  readonly salarioCentavos: number;
  readonly periodo: 'semanal' | 'quincenal' | 'mensual';
}

export type CreateResult = { ok: true; id: string } | { ok: false; message: string };

export async function crearEmpleado(input: NuevoEmpleado): Promise<CreateResult> {
  try {
    const session = await requireMember('admin');
    const now = new Date().toISOString();
    const id = newUlid();

    const row = {
      id,
      nombre: input.nombre.trim(),
      puesto: input.puesto.trim(),
      salarioCentavos: BigInt(input.salarioCentavos),
      periodo: input.periodo,
      businessId: session.business_id,
      // A portal-created row has no device and no operator. Both columns are
      // ULID-typed device ids, and a portal member's `sub` is a UUID from
      // `auth.users` — a different id space entirely, which is what the first
      // attempt at this discovered. `createdByUserId` is nullable and honestly
      // null; `deviceId` is NOT NULL, so it carries a documented sentinel
      // rather than a business id pretending to be a phone.
      deviceId: PORTAL_DEVICE_ID,
      createdByUserId: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    EmployeeSchema.parse({ ...row, salarioCentavos: row.salarioCentavos });

    await withTenant(session.business_id, async (tx) => {
      await tx.insert(employees).values(row);
      await recordChange(tx, session.business_id, 'employees', id, 'insert');
    });

    revalidatePath('/empleados');
    return { ok: true, id };
  } catch (error) {
    reportError(error, { endpoint: 'crearEmpleado' });
    const message =
      error instanceof Error ? error.message : 'No pudimos guardar al empleado. Intenta de nuevo.';
    return { ok: false, message };
  }
}
