/**
 * `recordStaffAction()` — the one way a staff mutation is written to
 * `staff_audit_log` (N-05, ADR-063).
 *
 * It takes a sink rather than a database so the rule — validate, stamp,
 * write, and fail loudly — is testable without Postgres. In the app the sink
 * is bound to the **same transaction** as the mutation (`audited.ts`), so a
 * mutation cannot commit without its audit row, and an audit row cannot exist
 * for a mutation that rolled back.
 */

import {
  newEntityId,
  StaffAuditEntrySchema,
  type StaffAuditEntry,
  type StaffAuditEntryId,
  type StaffMemberId,
} from '@xangarro/domain';

export interface AuditSink {
  insert(entry: StaffAuditEntry): Promise<void>;
}

export interface AuditDeps {
  readonly now: () => Date;
  readonly newId: () => StaffAuditEntryId;
}

export interface StaffActionInput {
  readonly staffId: StaffMemberId;
  /** `area.verbo`, e.g. `tenant.extender_prueba` — see `StaffActionSchema`. */
  readonly action: string;
  readonly businessId?: string | null;
  readonly payload?: Readonly<Record<string, unknown>>;
}

export class StaffAuditError extends Error {
  constructor(
    readonly code: 'INVALID_AUDIT_ENTRY' | 'AUDIT_WRITE_FAILED',
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'StaffAuditError';
  }
}

const defaultDeps: AuditDeps = {
  now: () => new Date(),
  newId: () => newEntityId<StaffAuditEntryId>(),
};

/** The payload as jsonb will store it; throws on bigint, cycles and the like. */
function jsonRoundTrip(payload: Readonly<Record<string, unknown>>): unknown {
  try {
    return JSON.parse(JSON.stringify(payload));
  } catch (cause) {
    throw new StaffAuditError('INVALID_AUDIT_ENTRY', 'El payload no es JSON válido.', { cause });
  }
}

export async function recordStaffAction(
  sink: AuditSink,
  input: StaffActionInput,
  deps: AuditDeps = defaultDeps,
): Promise<StaffAuditEntry> {
  const parsed = StaffAuditEntrySchema.safeParse({
    id: deps.newId(),
    staffId: input.staffId,
    action: input.action,
    businessId: input.businessId ?? null,
    payload: jsonRoundTrip(input.payload ?? {}),
    at: deps.now().toISOString(),
  });
  if (!parsed.success) {
    throw new StaffAuditError('INVALID_AUDIT_ENTRY', parsed.error.message);
  }

  try {
    await sink.insert(parsed.data);
  } catch (cause) {
    throw new StaffAuditError('AUDIT_WRITE_FAILED', 'No se pudo registrar la acción.', { cause });
  }
  return parsed.data;
}
