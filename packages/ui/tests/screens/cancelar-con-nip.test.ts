/**
 * cancelarConNip (audit F-08): the phone's cancellation goes through the
 * device's NIP guard, as the authorising user. A wrong NIP counts toward
 * that person's lockout, the one their sign-in counts toward; a refusal that
 * is not about the NIP counts nothing; while their lockout runs nothing is
 * cancelled, right NIP or not; and somebody else's lockout does not stop it.
 */

import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { CrearOperadorUseCase } from '@xangarro/application';
import { lockoutOf, parsePinLockouts } from '@xangarro/caja/nip';
import type { BusinessId, TicketId, UserId } from '@xangarro/domain';
import { InMemoryTicketsRepository, makeNewSale, makeNewTicket } from '@xangarro/testing';
import { APP_CONFIG_KEYS } from '../../src/app-config/index';
import type { Repositories } from '../../src/app/repository-provider';
import { cancelarConNip } from '../../src/screens/Ventas/cancelar-con-nip';
import { buildTestRepos } from '../build-test-repos';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

describe('cancelarConNip', () => {
  let repos: Repositories;
  let ana: UserId;
  let toni: UserId;
  let ticketId: TicketId;

  beforeEach(async () => {
    repos = buildTestRepos({ tickets: new InMemoryTicketsRepository() });
    const crear = new CrearOperadorUseCase(repos.users);
    const base = { businessId: BIZ, pin: '5678', operatorLimit: 10 };
    ana = (await crear.execute({ ...base, nombre: 'Ana' })).id;
    await repos.users.update(ana, { permissions: { canCancelSales: true } });
    toni = (await crear.execute({ ...base, nombre: 'Toni' })).id;
    const ticket = await repos.tickets.create(
      makeNewTicket({ businessId: BIZ, metodo: 'Efectivo', concepto: 'Venta' }),
    );
    await repos.sales.create(makeNewSale({ businessId: BIZ, monto: 2500n, ticketId: ticket.id }));
    ticketId = ticket.id;
  });

  const cancelar = (pin: string, userId: UserId = ana): Promise<string | null> =>
    cancelarConNip(repos, { ticketId, userId, businessId: BIZ, pin, motivo: 'Error de captura' });

  const book = async () => parsePinLockouts(await repos.appConfig.get(APP_CONFIG_KEYS.pinLockout));
  /** The count kept for the user whose NIP the cancellation checks. */
  const lockout = async (subject: UserId = ana) => lockoutOf(await book(), subject);
  const seed = (subject: UserId, entry: object): Promise<void> =>
    repos.appConfig.set(
      APP_CONFIG_KEYS.pinLockout,
      JSON.stringify({ v: 2, by: { [subject]: entry } }),
    );
  const cancelled = async (): Promise<boolean> =>
    (await repos.tickets.findById(ticketId))?.cancelledAt !== null;

  it('cancels with the right NIP and leaves no count behind', async () => {
    assert.equal(await cancelar('5678'), null);
    assert.equal(await cancelled(), true);
    assert.deepEqual((await book()).by, {});
  });

  it('counts a wrong NIP against the authorising user, in the use case’s words', async () => {
    assert.equal(await cancelar('0000'), 'No se pudo cancelar: PIN incorrecto');
    assert.equal((await lockout(ana)).failures, 1);
    assert.equal((await lockout(toni)).failures, 0);
    assert.equal(await cancelled(), false);
  });

  it('does not count a refusal that is not about the NIP', async () => {
    assert.equal(
      await cancelar('5678', toni),
      'No se pudo cancelar: No tienes permiso para cancelar ventas',
    );
    const nadie = '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as UserId;
    assert.equal(await cancelar('5678', nadie), 'No se pudo cancelar: Usuario no encontrado');
    assert.deepEqual((await book()).by, {});
  });

  it('locks on the fifth wrong NIP and says how long remains', async () => {
    for (let i = 0; i < 4; i += 1) await cancelar('0000');
    assert.equal(await cancelar('0000'), 'Demasiados intentos. Espera 30 s.');
    assert.equal((await lockout()).level, 1);
  });

  it('cancels nothing while that NIP is locked, even with the right one', async () => {
    const until = new Date(Date.now() + 60_000).toISOString();
    await seed(ana, { failures: 0, lockedUntil: until, level: 2 });
    assert.match((await cancelar('5678')) ?? '', /^Demasiados intentos\. Espera (1 min|\d+ s)\.$/);
    assert.equal(await cancelled(), false);
  });

  it('is not held up by somebody else’s locked NIP', async () => {
    const until = new Date(Date.now() + 60_000).toISOString();
    await seed(toni, { failures: 0, lockedUntil: until, level: 2 });
    assert.equal(await cancelar('5678'), null);
    assert.equal(await cancelled(), true);
    assert.equal((await lockout(toni)).level, 2, 'Ana’s right NIP did not clear Toni’s');
  });

  it('adds its misses to the ones the sign-in counted for the same person', async () => {
    await seed(ana, { failures: 4, lockedUntil: null, level: 0 });
    assert.equal(await cancelar('0000'), 'Demasiados intentos. Espera 30 s.');
  });
});
