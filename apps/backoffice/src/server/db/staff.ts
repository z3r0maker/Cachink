import type { StaffAuditEntry, StaffMemberId } from '@xangarro/domain';

import { recordStaffAction, type AuditSink } from '../audit';
import type { AuthAudit } from '../auth/ports';
import type { Db, Tx } from './client';
import { staffAuditLog } from './schema';

export interface ActiveStaff {
  readonly id: StaffMemberId;
  readonly email: string;
  readonly nombre: string;
}

/** An audit sink bound to one connection — for a mutation, its own transaction. */
export function auditSink(conn: Db | Tx): AuditSink {
  return {
    insert: async (entry: StaffAuditEntry) => {
      await conn.insert(staffAuditLog).values(entry);
    },
  };
}

/** Sign-in events (`auth.*`) have no mutation to share a transaction with. */
export function authAudit(conn: Db): AuthAudit {
  return async (staffId, action, payload) => {
    await recordStaffAction(auditSink(conn), { staffId, action, payload: payload ?? {} });
  };
}
