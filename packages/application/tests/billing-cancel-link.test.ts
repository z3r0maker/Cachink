import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { CancelLinkUseCase, CancelSubscriptionUseCase } from '../src/billing/index.js';
import { BIZ, FakeGateway, FakeRepo, NOW, at, facts, record } from './support/billing-fakes.js';
import { FakeCancellations, FakeConfirmations, FakeNotices } from './support/cancel-fakes.js';

let repo: FakeRepo;
let gateway: FakeGateway;
let notices: FakeNotices;
let ledger: FakeCancellations;
let token: string;
let now: Date;

function link() {
  const cancel = new CancelSubscriptionUseCase({
    repo,
    gateway,
    ledger,
    notices: new FakeConfirmations(),
    report: () => undefined,
    now: () => now,
  });
  return new CancelLinkUseCase({
    store: notices,
    repo,
    cancel,
    customerName: () => Promise.resolve('Taquería Don Pedro'),
    now: () => now,
  });
}

beforeEach(async () => {
  repo = new FakeRepo();
  gateway = new FakeGateway();
  notices = new FakeNotices();
  ledger = new FakeCancellations();
  now = NOW;
  repo.rows.set('sub_1', record());
  gateway.subscriptions.set('sub_1', facts());
  token =
    (await notices.claim({ businessId: BIZ, stripeSubscriptionId: 'sub_1', periodEnd: at(20) })) ??
    '';
});

describe('CancelLinkUseCase', () => {
  it('opening the link only shows what would change, with the total including IVA', async () => {
    assert.deepEqual(await link().peek(token), {
      state: 'confirmar',
      negocio: 'Taquería Don Pedro',
      planId: 'xangarro',
      interval: 'month',
      endsAt: at(20),
      totalCentavos: 23_084,
    });
    assert.equal(gateway.cancelAtPeriodEnd.length, 0, 'opening cancels nothing');
  });

  it('the tap cancels through the same use case, by email, and spends the link', async () => {
    assert.deepEqual(await link().confirm(token), { state: 'listo', endsAt: at(20) });
    assert.equal(ledger.acts[0]?.channel, 'correo');
    assert.equal(ledger.acts[0]?.requestedBy, null);
    assert.notEqual((await notices.find(token))?.usedAt, null);
  });

  it('a link for a subscription already cancelled says so and records nothing', async () => {
    repo.rows.set('sub_1', record({ cancelAt: at(20) }));
    assert.deepEqual(await link().confirm(token), { state: 'ya', endsAt: at(20) });
    assert.equal(ledger.acts.length, 0);
  });

  it('an unknown or empty token is vencido', async () => {
    assert.deepEqual(await link().peek('nope'), { state: 'vencido' });
    assert.deepEqual(await link().confirm(''), { state: 'vencido' });
  });

  it('a link past the charge it announced is vencido', async () => {
    now = new Date(at(21));
    assert.deepEqual(await link().confirm(token), { state: 'vencido' });
    assert.equal(gateway.cancelAtPeriodEnd.length, 0);
  });

  it('a link for a subscription the business no longer has is vencido', async () => {
    repo.rows.set('sub_1', record({ status: 'lapsed' }));
    repo.rows.set('sub_2', record({ stripeSubscriptionId: 'sub_2', currentPeriodEnd: at(300) }));
    assert.deepEqual(await link().peek(token), { state: 'vencido' });
  });

  it('a spent link does not cancel again after «Seguir con mi plan»', async () => {
    await link().confirm(token);
    repo.rows.set('sub_1', record({ cancelAt: null }));
    assert.deepEqual(await link().confirm(token), { state: 'vencido' });
    assert.equal(ledger.acts.length, 1);
  });
});
