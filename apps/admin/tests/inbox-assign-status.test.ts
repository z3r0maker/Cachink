import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { assignSupportItem } from '@/server/inbox/assign';
import { changeSupportItemStatus } from '@/server/inbox/status';

import {
  brokenRepo,
  CFDI,
  item,
  NOW,
  OTHER_STAFF,
  rejectsWith,
  seeded,
  STAFF,
} from './support/inbox';

const clock = { now: () => NOW };
const bug = item();
const factura = item({ kind: 'factura', paymentRef: 'in_1', sourceRef: 'in_1' });

describe('assignSupportItem', () => {
  it('sets the owner and remembers who had it before', async () => {
    const repo = seeded(item({ ownerStaffId: OTHER_STAFF }));
    const { item: after, previousOwner } = await assignSupportItem(
      repo,
      { id: bug.id, staffId: STAFF },
      clock,
    );
    assert.equal(after.ownerStaffId, STAFF);
    assert.equal(previousOwner, OTHER_STAFF);
    assert.equal(after.updatedAt, NOW.toISOString());
    assert.deepEqual(repo.rows.get(bug.id), after);
  });

  it('refuses a malformed id', async () => {
    await rejectsWith(
      assignSupportItem(seeded(bug), { id: 'x', staffId: STAFF }, clock),
      'VALIDATION',
    );
  });

  it('refuses an item that does not exist', async () => {
    await rejectsWith(
      assignSupportItem(seeded(), { id: bug.id, staffId: STAFF }, clock),
      'NOT_FOUND',
    );
  });

  it('refuses a resolved item', async () => {
    const repo = seeded(item({ status: 'resuelto', resolvedAt: bug.createdAt }));
    await rejectsWith(
      assignSupportItem(repo, { id: bug.id, staffId: STAFF }, clock),
      'ALREADY_RESOLVED',
    );
  });

  it('wraps a store failure', async () => {
    await rejectsWith(
      assignSupportItem(brokenRepo(), { id: bug.id, staffId: STAFF }, clock),
      'STORE_FAILED',
    );
  });
});

describe('changeSupportItemStatus', () => {
  it('moves an item along and stamps resolvedAt only when resolved', async () => {
    const repo = seeded(bug);
    const doing = await changeSupportItemStatus(repo, { id: bug.id, status: 'en_curso' }, clock);
    assert.equal(doing.item.status, 'en_curso');
    assert.equal(doing.item.resolvedAt, null);
    const done = await changeSupportItemStatus(repo, { id: bug.id, status: 'resuelto' }, clock);
    assert.equal(done.item.resolvedAt, NOW.toISOString());
    assert.equal(done.previousStatus, 'en_curso');
    const reopened = await changeSupportItemStatus(repo, { id: bug.id, status: 'nuevo' }, clock);
    assert.equal(reopened.item.resolvedAt, null);
  });

  it('resolves a factura item with its folio fiscal, normalised', async () => {
    const repo = seeded(factura);
    const { item: done } = await changeSupportItemStatus(
      repo,
      { id: factura.id, status: 'resuelto', cfdiUuid: CFDI.toLowerCase() },
      clock,
    );
    assert.equal(done.cfdiUuid, CFDI);
    assert.equal(done.status, 'resuelto');
  });

  it('refuses to resolve a factura item without a CFDI UUID', async () => {
    const repo = seeded(factura);
    await rejectsWith(
      changeSupportItemStatus(repo, { id: factura.id, status: 'resuelto' }, clock),
      'CFDI_UUID_REQUIRED',
    );
    assert.equal(repo.rows.get(factura.id)?.status, 'nuevo');
  });

  it('refuses a malformed UUID, and a UUID on an item that is not a factura', async () => {
    await rejectsWith(
      changeSupportItemStatus(
        seeded(factura),
        { id: factura.id, status: 'resuelto', cfdiUuid: '123' },
        clock,
      ),
      'INVALID_CFDI_UUID',
    );
    await rejectsWith(
      changeSupportItemStatus(
        seeded(bug),
        { id: bug.id, status: 'resuelto', cfdiUuid: CFDI },
        clock,
      ),
      'VALIDATION',
    );
  });

  it('refuses an unknown status and a missing item', async () => {
    await rejectsWith(
      changeSupportItemStatus(seeded(bug), { id: bug.id, status: 'cerrado' }, clock),
      'VALIDATION',
    );
    await rejectsWith(
      changeSupportItemStatus(seeded(), { id: bug.id, status: 'resuelto' }, clock),
      'NOT_FOUND',
    );
  });

  it('wraps a store failure', async () => {
    await rejectsWith(
      changeSupportItemStatus(brokenRepo(), { id: bug.id, status: 'resuelto' }, clock),
      'STORE_FAILED',
    );
  });
});
