import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  StaffActionSchema,
  StaffAuditEntrySchema,
  StaffMemberSchema,
} from '../../src/entities/staff.js';

const ULID = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
// A random uuid next to a name containing `auth` is read as a live credential
// by gitleaks' generic-api-key rule, so this one is spelled to be obviously a
// fixture. It is still a valid v4 uuid, so `z.uuid()` accepts it exactly as
// before and every assertion is unchanged.
const AUTH_UID = '00000000-0000-4000-8000-000000000001';
const AT = '2026-09-17T12:00:00.000Z';

const member = {
  id: ULID,
  userId: AUTH_UID,
  email: 'soporte@xangarro.mx',
  nombre: 'Soporte',
  createdAt: AT,
  revokedAt: null,
};

const entry = {
  id: ULID,
  staffId: ULID,
  action: 'consola.marcar_revisado',
  businessId: null,
  payload: { nota: 'ok' },
  at: AT,
};

describe('StaffMemberSchema', () => {
  it('accepts an allowlisted staff member', () => {
    assert.equal(StaffMemberSchema.safeParse(member).success, true);
  });

  it('accepts a staff member with no auth.users id (in-house auth, ADR-080)', () => {
    assert.equal(StaffMemberSchema.safeParse({ ...member, userId: null }).success, true);
  });

  it('rejects a userId that is not an auth.users uuid', () => {
    assert.equal(StaffMemberSchema.safeParse({ ...member, userId: ULID }).success, false);
  });

  it('rejects a malformed email', () => {
    assert.equal(StaffMemberSchema.safeParse({ ...member, email: 'soporte' }).success, false);
  });

  it('rejects a non-ULID id', () => {
    assert.equal(StaffMemberSchema.safeParse({ ...member, id: 'staff-1' }).success, false);
  });
});

describe('StaffActionSchema', () => {
  it('accepts a dotted snake_case verb', () => {
    assert.equal(StaffActionSchema.safeParse('tenant.extender_prueba').success, true);
  });

  it('rejects a bare word, spaces and uppercase', () => {
    for (const bad of ['revisado', 'marcar revisado', 'Tenant.Extend', '']) {
      assert.equal(StaffActionSchema.safeParse(bad).success, false, bad);
    }
  });
});

describe('StaffAuditEntrySchema', () => {
  it('accepts an entry with no tenant', () => {
    assert.equal(StaffAuditEntrySchema.safeParse(entry).success, true);
  });

  it('accepts an entry scoped to a tenant', () => {
    assert.equal(StaffAuditEntrySchema.safeParse({ ...entry, businessId: ULID }).success, true);
  });

  it('rejects a missing staffId', () => {
    const { staffId: _omit, ...rest } = entry;
    assert.equal(StaffAuditEntrySchema.safeParse(rest).success, false);
  });

  it('rejects a non-ULID businessId', () => {
    assert.equal(StaffAuditEntrySchema.safeParse({ ...entry, businessId: 'x' }).success, false);
  });

  it('rejects a timestamp that is not ISO 8601', () => {
    const r = StaffAuditEntrySchema.safeParse({ ...entry, at: '2026-09-17 12:00:00+00' });
    assert.equal(r.success, false);
  });
});
