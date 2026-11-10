import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';

import { CrearOperadorUseCase } from '@xangarro/application';
import { PIN_LOCKOUT_KEY, lockoutOf, parsePinLockouts } from '@xangarro/caja/nip';
import {
  DrizzleAppConfigRepository,
  DrizzleSalesRepository,
  DrizzleTicketsRepository,
  DrizzleUsersRepository,
} from '@xangarro/data';
import type { BusinessId, TicketId, UserId } from '@xangarro/domain';
import { SYNC_CONFIG_KEYS } from '@xangarro/sync';
import { TEST_DEVICE_ID, makeNewSale, makeNewTicket } from '@xangarro/testing';

import { makeFreshDb } from '../../../../packages/data/tests/helpers/fresh-db';
import { autenticar } from '../../src/operador/runtime/access';
import { cancelarTicket } from '../../src/operador/runtime/cancelar';

/**
 * The web caja's NIP checks go through the register's lockout (audit F-08),
 * over the Worker's real SQLite tables. The count belongs to the user whose
 * NIP is checked: the sign-in, the lock screen and a cancellation share that
 * person's count, kept in app_config; nobody else is locked and nobody
 * else's right NIP clears it; a refusal that is not about the NIP counts
 * nothing; and while the lockout runs neither path looks at the hash. Time
 * is the anchored clock's.
 */

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const DEVICE = TEST_DEVICE_ID as string;

describe('the register’s NIP lockout', () => {
  let db: ReturnType<typeof makeFreshDb>;
  let appConfig: DrizzleAppConfigRepository;
  let ana: UserId;
  let toni: UserId;
  let ticketId: TicketId;

  beforeEach(async () => {
    db = makeFreshDb();
    appConfig = new DrizzleAppConfigRepository(db);
    const users = new DrizzleUsersRepository(db, TEST_DEVICE_ID);
    const crear = new CrearOperadorUseCase(users);
    const base = { businessId: BIZ, pin: '5678', operatorLimit: 10 };
    ana = (await crear.execute({ ...base, nombre: 'Ana' })).id;
    await users.update(ana, { permissions: { canCancelSales: true } });
    toni = (await crear.execute({ ...base, pin: '1234', nombre: 'Toni' })).id;
    const tickets = new DrizzleTicketsRepository(db, TEST_DEVICE_ID);
    const ticket = await tickets.create(
      makeNewTicket({ businessId: BIZ, metodo: 'Efectivo', concepto: 'Venta' }),
    );
    await new DrizzleSalesRepository(db, TEST_DEVICE_ID).create(
      makeNewSale({ businessId: BIZ, monto: 2500n, ticketId: ticket.id }),
    );
    ticketId = ticket.id;
  });

  const entrar = (nip: string, nombre = 'Ana') => autenticar(db as never, BIZ, DEVICE, nombre, nip);
  const cancelar = (pin: string, userId: UserId = ana) =>
    cancelarTicket(db as never, {
      businessId: BIZ,
      deviceId: DEVICE,
      userId,
      ticketId,
      pin,
      motivo: 'Error de captura',
    });
  const book = async () => parsePinLockouts(await appConfig.get(PIN_LOCKOUT_KEY));
  const lockout = async (subject: UserId = ana) => lockoutOf(await book(), subject);
  const cancelled = async (): Promise<boolean> =>
    (await new DrizzleTicketsRepository(db, TEST_DEVICE_ID).findById(ticketId))?.cancelledAt !==
    null;
  const MISS = { success: false, userId: null, esperaMs: 0 };

  it('signs in with the right NIP and reports no wait', async () => {
    assert.deepEqual(await entrar('5678'), { success: true, userId: ana, esperaMs: 0 });
  });

  it('counts a wrong sign-in against that operator and locks on the fifth', async () => {
    for (let i = 0; i < 4; i += 1) assert.deepEqual(await entrar('0000'), MISS);
    assert.deepEqual(await entrar('0000'), { success: false, userId: null, esperaMs: 30_000 });
    const locked = await entrar('5678');
    assert.equal(locked.success, false);
    assert.ok(locked.esperaMs > 0 && locked.esperaMs <= 30_000);
  });

  it('a coworker’s own sign-in does not reset the guesses at someone else’s NIP', async () => {
    for (let i = 0; i < 4; i += 1) assert.deepEqual(await entrar('0000', 'Ana'), MISS);
    assert.deepEqual(await entrar('1234', 'Toni'), { success: true, userId: toni, esperaMs: 0 });
    assert.equal((await lockout(ana)).failures, 4, 'Toni signing in left Ana’s count');
    assert.equal((await entrar('0000', 'Ana')).esperaMs, 30_000);
    assert.equal((await lockout(ana)).level, 1);
  });

  it('locks that operator only: the register keeps working for the others', async () => {
    for (let i = 0; i < 5; i += 1) await entrar('0000', 'Ana');
    assert.equal((await entrar('5678', 'Ana')).success, false);
    assert.deepEqual(await entrar('1234', 'Toni'), { success: true, userId: toni, esperaMs: 0 });
    assert.deepEqual(await entrar('0000', 'Toni'), MISS);
    assert.deepEqual(Object.keys((await book()).by).sort(), [ana, toni].sort());
  });

  it('counts nothing for a name that is nobody’s', async () => {
    assert.deepEqual(await entrar('0000', 'Nadie'), MISS);
    assert.deepEqual((await book()).by, {});
  });

  it('counts a wrong NIP on a cancellation with the use case’s own words', async () => {
    await assert.rejects(cancelar('0000'), /PIN incorrecto/);
    assert.equal((await lockout(ana)).failures, 1);
    assert.equal(await cancelled(), false);
  });

  it('does not count a cancellation refused for something else', async () => {
    await assert.rejects(cancelar('1234', toni), /No tienes permiso/);
    assert.deepEqual((await book()).by, {});
  });

  it('is one count per person: misses at the sign-in and on a cancellation add up', async () => {
    await entrar('0000');
    await entrar('0000');
    await entrar('0000');
    await assert.rejects(cancelar('0000'), /PIN incorrecto/);
    await assert.rejects(cancelar('0000'), /Demasiados intentos\. Espera 30 s\./);
    assert.equal((await entrar('5678')).success, false);
    await assert.rejects(cancelar('5678'), /Demasiados intentos/);
    assert.equal(await cancelled(), false);
  });

  it('cancels with the right NIP and clears what was counted for that person', async () => {
    await entrar('0000');
    await entrar('0000', 'Toni');
    const r = await cancelar('5678');
    assert.equal(r.cashToReturnCentavos, '2500');
    assert.equal(await cancelled(), true);
    assert.deepEqual((await book()).by, {
      [toni]: { failures: 1, lockedUntil: null, level: 0 },
    });
  });

  it('reads what an older build stored as no lockouts', async () => {
    const until = new Date(Date.now() + 60_000).toISOString();
    await appConfig.set(PIN_LOCKOUT_KEY, JSON.stringify({ failures: 0, lockedUntil: until }));
    assert.deepEqual(await entrar('5678'), { success: true, userId: ana, esperaMs: 0 });
    const wide = { failures: 0, lockedUntil: until, level: 2 };
    await appConfig.set(PIN_LOCKOUT_KEY, JSON.stringify(wide));
    assert.deepEqual(await entrar('0000'), MISS);
    assert.deepEqual((await book()).by, { [ana]: { failures: 1, lockedUntil: null, level: 0 } });
  });

  it('decides by the anchored clock, not by the browser’s', async () => {
    // The server was last heard a day ahead of this machine's clock.
    const server = Date.now() + 86_400_000;
    await appConfig.set(SYNC_CONFIG_KEYS.lastServerTime, new Date(server).toISOString());
    const until = new Date(server + 20_000).toISOString();
    const entry = { failures: 0, lockedUntil: until, level: 2 };
    await appConfig.set(PIN_LOCKOUT_KEY, JSON.stringify({ v: 2, by: { [ana]: entry } }));
    assert.deepEqual(await entrar('5678'), { success: false, userId: null, esperaMs: 20_000 });
  });
});
