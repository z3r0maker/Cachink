import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';

import {
  CancelarEliminacionUseCase,
  CuentaError,
  EliminarCuentaUseCase,
} from '../../src/cuenta/index.js';
import { FakeGateway, FakeRepo, NOW, facts, record } from '../support/billing-fakes.js';
import { FakeDirectory, FakeStore, RecordingNotices } from './fakes.js';

const USER = 'user-1';
const code = (c: string) => (e: unknown) => e instanceof CuentaError && e.code === c;

let store: FakeStore;
let repo: FakeRepo;
let gateway: FakeGateway;
let notices: RecordingNotices;
let reported: unknown[];

function eliminar(password = 'secreta-2026') {
  return new EliminarCuentaUseCase({
    store,
    accounts: new FakeDirectory('secreta-2026', store),
    billing: { repo, gateway },
    notices,
    report: (e) => reported.push(e),
    now: () => NOW,
  }).execute({ userId: USER, email: 'pedro@example.mx', password });
}

beforeEach(() => {
  store = new FakeStore(() => NOW);
  store.owned[USER] = [
    { id: 'biz-a', nombre: 'Taquería Don Pedro' },
    { id: 'biz-b', nombre: 'Tortas La Güera' },
  ];
  repo = new FakeRepo();
  gateway = new FakeGateway();
  notices = new RecordingNotices();
  reported = [];
  repo.rows.set('sub_1', record({ businessId: 'biz-a' }));
  gateway.subscriptions.set('sub_1', facts({ businessId: 'biz-a' }));
});

describe('EliminarCuentaUseCase (ADR-136)', () => {
  it('stops the plan, closes both businesses for 30 days and mails the folio and the undo link', async () => {
    const r = await eliminar();
    assert.equal(r.folio, 'EL-000001');
    assert.deepEqual(r.negocios, ['Taquería Don Pedro', 'Tortas La Güera']);
    assert.equal(r.eraseAt, new Date(NOW.getTime() + 30 * 86_400_000).toISOString());
    assert.deepEqual(gateway.cancelAtPeriodEnd, [{ id: 'sub_1', cancel: true }]);
    assert.equal(gateway.cancelled.length, 0, 'nothing ends outright before the erase');
    assert.notEqual(repo.rows.get('sub_1')?.cancelAt, null);
    assert.deepEqual(store.rows[0]?.stoppedRenewals, ['sub_1']);
    const [mail] = notices.sent;
    assert.equal(mail?.kind, 'requested');
    assert.equal(mail?.n.undoToken, 'tok1');
  });

  it('a wrong password changes nothing', async () => {
    await assert.rejects(eliminar('otra'), code('WRONG_PASSWORD'));
    assert.equal(store.rows.length, 0);
    assert.equal(gateway.cancelAtPeriodEnd.length, 0);
  });

  it('an account that owns no business is refused', async () => {
    store.owned[USER] = [];
    await assert.rejects(eliminar(), code('NO_BUSINESS'));
  });

  it('a plan the owner had already cancelled is left as it is, and not resumed by an undo', async () => {
    repo.rows.set('sub_1', record({ businessId: 'biz-a', cancelAt: facts().currentPeriodEnd }));
    await eliminar();
    assert.equal(gateway.cancelAtPeriodEnd.length, 0);
    assert.deepEqual(store.rows[0]?.stoppedRenewals, []);
  });

  it('a ledger failure after Stripe resumes the plan and rethrows', async () => {
    store.failRequest = true;
    await assert.rejects(eliminar(), /db down/);
    assert.deepEqual(gateway.cancelAtPeriodEnd, [
      { id: 'sub_1', cancel: true },
      { id: 'sub_1', cancel: false },
    ]);
    assert.equal(repo.rows.get('sub_1')?.cancelAt, null);
    assert.equal(notices.sent.length, 0);
  });

  it('a confirmation email that fails is reported; the deletion stands', async () => {
    notices.fail = true;
    const r = await eliminar();
    assert.equal(r.folio, 'EL-000001');
    assert.equal(reported.length, 1);
  });
});

describe('CancelarEliminacionUseCase', () => {
  const undo = () =>
    new CancelarEliminacionUseCase({
      store,
      billing: { repo, gateway },
      report: (e) => reported.push(e),
    });

  it('opening the link only reads; the tap reopens and resumes the plan it stopped', async () => {
    await eliminar();
    const view = await undo().peek('tok1');
    assert.equal(view.state, 'deshacer');
    assert.equal(gateway.cancelAtPeriodEnd.length, 1, 'peek changed nothing');
    assert.deepEqual(await undo().confirm('tok1'), { state: 'reabierta' });
    assert.deepEqual(gateway.cancelAtPeriodEnd.at(-1), { id: 'sub_1', cancel: false });
    assert.equal(repo.rows.get('sub_1')?.cancelAt, null);
  });

  it('a spent link is vencido', async () => {
    await eliminar();
    await undo().confirm('tok1');
    assert.deepEqual(await undo().confirm('tok1'), { state: 'vencido' });
    assert.deepEqual(await undo().peek('tok1'), { state: 'vencido' });
  });

  it('an unknown or empty token is vencido', async () => {
    assert.deepEqual(await undo().peek('nope'), { state: 'vencido' });
    assert.deepEqual(await undo().confirm(''), { state: 'vencido' });
  });

  it('a plan Stripe cannot resume is reported; the account still reopens', async () => {
    await eliminar();
    gateway.subscriptions.clear();
    assert.deepEqual(await undo().confirm('tok1'), { state: 'reabierta' });
    assert.equal(reported.length, 1);
  });
});
