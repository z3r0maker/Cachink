import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import type { SupportItem } from '@xangarro/domain';

import { createSupportItem } from '@/server/inbox/create';
import { InMemorySupportItems } from '@/server/inbox/memory';

import { BUSINESS, brokenRepo, idSeq, NOW, rejectsWith } from './support/inbox';

const input = {
  kind: 'bug',
  title: 'La venta no se guarda',
  body: 'Al tocar Guardar no pasa nada.',
  businessId: BUSINESS,
  attachments: ['bug-reports/a/captura.png'],
  source: 'bug-report',
  sourceRef: 'evt_1',
};

function deps(notified: SupportItem[] = [], fail = false) {
  return {
    now: () => NOW,
    newId: idSeq(),
    log: () => undefined,
    notifier: {
      notifyUrgent: async (i: SupportItem) => {
        if (fail) throw new Error('webhook 500');
        notified.push(i);
      },
    },
  };
}

describe('createSupportItem', () => {
  it('files an ARCO request with its deadline, and refuses one without (N-34)', async () => {
    const repo = new InMemorySupportItems();
    const arco = {
      ...input,
      kind: 'arco',
      businessId: null,
      attachments: [],
      source: 'portal-arco',
      dueAt: '2026-10-21T23:59:59-06:00',
    };
    const { item } = await createSupportItem(repo, arco, deps());
    assert.equal(item.kind, 'arco');
    assert.equal(item.dueAt, '2026-10-21T23:59:59-06:00');
    await rejectsWith(
      createSupportItem(repo, { ...arco, sourceRef: 'evt_2', dueAt: null }, deps()),
      'VALIDATION',
    );
    await rejectsWith(
      createSupportItem(repo, { ...input, sourceRef: 'evt_3', dueAt: arco.dueAt }, deps()),
      'VALIDATION',
    );
  });

  it('files a new, unassigned item stamped with the clock', async () => {
    const repo = new InMemorySupportItems();
    const { item, created, notified } = await createSupportItem(repo, input, deps());
    assert.equal(created, true);
    assert.equal(notified, false);
    assert.equal(item.status, 'nuevo');
    assert.equal(item.urgent, false);
    assert.equal(item.ownerStaffId, null);
    assert.equal(item.createdAt, NOW.toISOString());
    assert.deepEqual([...repo.rows.values()], [item]);
  });

  it('is idempotent by (source, sourceRef): a retry returns the first item', async () => {
    const repo = new InMemorySupportItems();
    const d = deps();
    const first = await createSupportItem(repo, input, d);
    const again = await createSupportItem(repo, { ...input, title: 'Otro título' }, d);
    assert.equal(again.created, false);
    assert.deepEqual(again.item, first.item);
    assert.equal(repo.rows.size, 1);
  });

  it('notifies an urgent item once, and never on a retry', async () => {
    const repo = new InMemorySupportItems();
    const sent: SupportItem[] = [];
    const d = deps(sent);
    const urgent = { ...input, urgent: true };
    const first = await createSupportItem(repo, urgent, d);
    await createSupportItem(repo, urgent, d);
    assert.equal(first.notified, true);
    assert.deepEqual(sent, [first.item]);
  });

  it('keeps the item when the urgent notification fails', async () => {
    const repo = new InMemorySupportItems();
    const result = await createSupportItem(repo, { ...input, urgent: true }, deps([], true));
    assert.equal(result.created, true);
    assert.equal(result.notified, false);
    assert.equal(repo.rows.size, 1);
  });

  it('refuses invalid input and files nothing', async () => {
    const repo = new InMemorySupportItems();
    await rejectsWith(createSupportItem(repo, { ...input, kind: 'queja' }, deps()), 'VALIDATION');
    await rejectsWith(createSupportItem(repo, { ...input, title: '' }, deps()), 'VALIDATION');
    await rejectsWith(createSupportItem(repo, null, deps()), 'VALIDATION');
    assert.equal(repo.rows.size, 0);
  });

  it('refuses a factura item without the payment it is owed for', async () => {
    const repo = new InMemorySupportItems();
    await rejectsWith(createSupportItem(repo, { ...input, kind: 'factura' }, deps()), 'VALIDATION');
    const ok = await createSupportItem(
      repo,
      { ...input, kind: 'factura', paymentRef: 'in_1' },
      deps(),
    );
    assert.equal(ok.item.paymentRef, 'in_1');
  });

  it('wraps a store failure', async () => {
    await rejectsWith(createSupportItem(brokenRepo(), input, deps()), 'STORE_FAILED');
  });
});
