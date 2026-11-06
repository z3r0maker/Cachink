import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';

import { BorrarCuentasUseCase, EliminarCuentaUseCase } from '../../src/cuenta/index.js';
import { FakeGateway, FakeRepo, NOW, facts, record } from '../support/billing-fakes.js';
import { FakeDirectory, FakeStore, RecordingNotices } from './fakes.js';

const DAY = 86_400_000;
const at = (days: number) => new Date(NOW.getTime() + days * DAY);

let store: FakeStore;
let repo: FakeRepo;
let gateway: FakeGateway;
let notices: RecordingNotices;
let reported: string[];

const job = () =>
  new BorrarCuentasUseCase({
    store,
    billing: { repo, gateway },
    notices,
    report: (_e, folio) => reported.push(folio),
  });

beforeEach(async () => {
  store = new FakeStore(() => NOW);
  store.owned.u1 = [{ id: 'biz-a', nombre: 'Taquería Don Pedro' }];
  repo = new FakeRepo();
  gateway = new FakeGateway();
  notices = new RecordingNotices();
  reported = [];
  repo.rows.set('sub_1', record({ businessId: 'biz-a' }));
  gateway.subscriptions.set('sub_1', facts({ businessId: 'biz-a' }));
  await new EliminarCuentaUseCase({
    store,
    accounts: new FakeDirectory('pw', store),
    billing: { repo, gateway },
    notices: new RecordingNotices(),
    report: () => undefined,
    now: () => NOW,
  }).execute({ userId: 'u1', email: 'pedro@example.mx', password: 'pw' });
});

describe('BorrarCuentasUseCase (ADR-136)', () => {
  it('does nothing before the reminder window', async () => {
    assert.deepEqual(await job().execute(at(20)), { erased: 0, reminded: 0, failed: 0 });
    assert.equal(notices.sent.length, 0);
  });

  it('three days before: the reminder, once', async () => {
    assert.deepEqual(await job().execute(at(27.5)), { erased: 0, reminded: 1, failed: 0 });
    assert.deepEqual(await job().execute(at(28)), { erased: 0, reminded: 0, failed: 0 });
    assert.equal(notices.sent[0]?.kind, 'reminder');
    assert.equal(notices.sent[0]?.n.undoToken, 'rem-EL-000001', 'a link of its own');
    assert.equal(store.rows[0]?.reminded, true);
  });

  it('on the day: Stripe ends the plan outright, the rows are erased and the last email goes', async () => {
    assert.deepEqual(await job().execute(at(30)), { erased: 1, reminded: 0, failed: 0 });
    assert.deepEqual(gateway.cancelled, ['sub_1']);
    assert.deepEqual(store.erased, ['EL-000001']);
    const last = notices.sent.at(-1);
    assert.equal(last?.kind, 'erased');
    assert.equal(last?.n.blockedUntil, '2036-12-04T12:00:00.000Z');
    assert.deepEqual(
      await job().execute(at(31)),
      { erased: 0, reminded: 0, failed: 0 },
      'never twice',
    );
  });

  it('a request undone in time is never erased', async () => {
    await store.undo('tok1');
    assert.deepEqual(await job().execute(at(30)), { erased: 0, reminded: 0, failed: 0 });
    assert.equal(gateway.cancelled.length, 0);
  });

  it('a Stripe failure leaves the rows for tomorrow and is reported by folio', async () => {
    gateway.subscriptions.clear();
    gateway.cancelSubscription = () => Promise.reject(new Error('stripe down'));
    assert.deepEqual(await job().execute(at(30)), { erased: 0, reminded: 0, failed: 1 });
    assert.deepEqual(store.erased, []);
    assert.deepEqual(reported, ['EL-000001']);
  });

  it('a final email that fails is reported; the erase stands', async () => {
    notices.fail = true;
    assert.deepEqual(await job().execute(at(30)), { erased: 1, reminded: 0, failed: 0 });
    assert.deepEqual(reported, ['EL-000001']);
  });
});
