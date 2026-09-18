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

export async function auditedMutation<T>(
  intent: AuditedIntent,
  mutate: (tx: Tx, ctx: StaffContext) => Promise<T>,
): Promise<{ result: T; audit: StaffAuditEntry }> {
  const ctx = await requireStaff();
  return db().transaction(async (tx) => {
    const result = await mutate(tx, ctx);
    const audit = await recordStaffAction(auditSink(tx), {
      staffId: ctx.staff.id,
      action: intent.action,
      businessId: intent.businessId ?? null,
      payload: intent.payload ?? {},
    });
    return { result, audit };
  });
}
