import 'server-only';

import type { StaffAuditEntry } from '@xangarro/domain';

import { recordStaffAction } from './audit';
import { db, type Tx } from './db/client';
import { auditSink } from './db/staff';
import { requireStaff, type StaffContext } from './staff';

/**
 * The composition every mutating server action in the console goes through:
 * gate → mutation → audit row, the last two in **one** transaction. If the
 * audit insert fails, the mutation rolls back with it; there is no path that
 * writes without being recorded.
 */
export interface AuditedIntent {
  /** `area.verbo`, e.g. `tenant.extender_prueba`. */
  readonly action: string;
  readonly businessId?: string | null;
  readonly payload?: Readonly<Record<string, unknown>>;
}

/**
 * `intent` may be a function of the mutation's result, for audit rows that
 * record what changed (before → after) or a tenant only known after loading.
 */
export async function auditedMutation<T>(
  intent: AuditedIntent | ((result: NoInfer<T>) => AuditedIntent),
  mutate: (tx: Tx, ctx: StaffContext) => Promise<T>,
): Promise<{ result: T; audit: StaffAuditEntry }> {
  const ctx = await requireStaff();
  return db().transaction(async (tx) => {
    const result = await mutate(tx, ctx);
    const { action, businessId, payload } = typeof intent === 'function' ? intent(result) : intent;
    const audit = await recordStaffAction(auditSink(tx), {
      staffId: ctx.staff.id,
      action,
      businessId: businessId ?? null,
      payload: payload ?? {},
    });
    return { result, audit };
  });
}
