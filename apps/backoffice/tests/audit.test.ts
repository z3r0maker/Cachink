import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import type { StaffAuditEntry, StaffAuditEntryId, StaffMemberId } from '@xangarro/domain';

import { recordStaffAction, StaffAuditError, type AuditSink } from '@/server/audit';

const STAFF = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as StaffMemberId;
const BUSINESS = '01HZ8XQN9GZJXV8AKQ5X0C7BK0';
const ENTRY_ID = '01HZ8XQN9GZJXV8AKQ5X0C7BK1' as StaffAuditEntryId;
const NOW = new Date('2026-09-17T12:00:00.000Z');

const deps = { now: () => NOW, newId: () => ENTRY_ID };

function memorySink(): AuditSink & { rows: StaffAuditEntry[] } {
  const rows: StaffAuditEntry[] = [];
  return {
    rows,
    insert: async (entry) => {
      rows.push(entry);
    },
  };
}

async function rejects(p: Promise<unknown>, code: StaffAuditError['code']): Promise<void> {
  await assert.rejects(p, (e: unknown) => e instanceof StaffAuditError && e.code === code);
}

describe('recordStaffAction', () => {
  it('writes one validated row with its own id and timestamp', async () => {
    const sink = memorySink();
    const entry = await recordStaffAction(
      sink,
      {
        staffId: STAFF,
        action: 'consola.marcar_revisado',
        businessId: BUSINESS,
        payload: { a: 1 },
      },
      deps,
    );
    assert.deepEqual(sink.rows, [entry]);
    assert.deepEqual(entry, {
      id: ENTRY_ID,
      staffId: STAFF,
      action: 'consola.marcar_revisado',
      businessId: BUSINESS,
      payload: { a: 1 },
      at: '2026-09-17T12:00:00.000Z',
    });
  });

  it('defaults to no tenant and an empty payload', async () => {
    const sink = memorySink();
    const entry = await recordStaffAction(sink, { staffId: STAFF, action: 'flags.cambiar' }, deps);
    assert.equal(entry.businessId, null);
    assert.deepEqual(entry.payload, {});
  });

  it('refuses a free-text action and writes nothing', async () => {
    const sink = memorySink();
    await rejects(
      recordStaffAction(sink, { staffId: STAFF, action: 'marqué algo' }, deps),
      'INVALID_AUDIT_ENTRY',
    );
    assert.equal(sink.rows.length, 0);
  });

  it('refuses a businessId that is not a ULID', async () => {
    await rejects(
      recordStaffAction(
        memorySink(),
        { staffId: STAFF, action: 'tenant.ver', businessId: 'taqueria' },
        deps,
      ),
      'INVALID_AUDIT_ENTRY',
    );
  });

  it('refuses a payload that jsonb could not store', async () => {
    await rejects(
      recordStaffAction(
        memorySink(),
        { staffId: STAFF, action: 'tenant.ver', payload: { monto: 10n } },
        deps,
      ),
      'INVALID_AUDIT_ENTRY',
    );
  });

  it('surfaces a failed write so the surrounding transaction rolls back', async () => {
    const failing: AuditSink = {
      insert: async () => {
        throw new Error('connection reset');
      },
    };
    await rejects(
      recordStaffAction(failing, { staffId: STAFF, action: 'tenant.ver' }, deps),
      'AUDIT_WRITE_FAILED',
    );
  });
});
