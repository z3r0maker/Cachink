/**
 * The phone's NIP guard (audit F-08): the shared lockout of
 * `@xangarro/caja/nip` over this device's app_config, decided by the
 * anchored clock. The ladder and the per-subject map are tested in
 * `packages/caja`.
 */

import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  NO_LOCKOUT,
  attemptNip,
  lockoutOf,
  parsePinLockouts,
  type NipCheck,
} from '@xangarro/caja/nip';
import { InMemoryAppConfigRepository } from '@xangarro/testing';
import { APP_CONFIG_KEYS } from '../../src/app-config/index';
import { deviceNipGuard, nipRefusal } from '../../src/app/pin-lockout';

const SERVER = new Date('2026-09-16T12:00:00.000Z');
const after = (ms: number): Date => new Date(SERVER.getTime() + ms);
const ANA = '01JPRS00000000000000000002';
const TONI = '01JPRS00000000000000000001';

const wrong = async (): Promise<NipCheck<null>> => ({ ok: false });
const right = async (): Promise<NipCheck<null>> => ({ ok: true, value: null });

/** A phone that last heard the server at SERVER, with Ana's NIP locked for 20 s more. */
async function phoneWithAnaLocked(): Promise<InMemoryAppConfigRepository> {
  const appConfig = new InMemoryAppConfigRepository();
  await appConfig.set(APP_CONFIG_KEYS.lastServerTime, SERVER.toISOString());
  const ana = { failures: 0, lockedUntil: after(20_000).toISOString(), level: 1 };
  await appConfig.set(APP_CONFIG_KEYS.pinLockout, JSON.stringify({ v: 2, by: { [ANA]: ana } }));
  return appConfig;
}

const stored = async (appConfig: InMemoryAppConfigRepository, subject: string) =>
  lockoutOf(parsePinLockouts(await appConfig.get(APP_CONFIG_KEYS.pinLockout)), subject);

describe('deviceNipGuard', () => {
  it('keeps each subject’s count in app_config, under the key it always used', async () => {
    const appConfig = new InMemoryAppConfigRepository();
    const guard = deviceNipGuard(appConfig, () => SERVER);
    assert.deepEqual(await attemptNip(guard, ANA, wrong), { status: 'wrong', lockedMs: 0 });
    assert.deepEqual(JSON.parse((await appConfig.get(APP_CONFIG_KEYS.pinLockout)) ?? ''), {
      v: 2,
      by: { [ANA]: { failures: 1, lockedUntil: null, level: 0 } },
    });
  });

  it('reads what either older build stored as no lockouts', async () => {
    const until = after(20_000).toISOString();
    const older = [
      `{"failures":4,"lockedUntil":"${until}"}`,
      `{"failures":4,"lockedUntil":"${until}","level":2}`,
    ];
    for (const raw of older) {
      const appConfig = new InMemoryAppConfigRepository();
      await appConfig.set(APP_CONFIG_KEYS.pinLockout, raw);
      const guard = deviceNipGuard(appConfig, () => SERVER);
      assert.deepEqual(await attemptNip(guard, ANA, wrong), { status: 'wrong', lockedMs: 0 });
      assert.deepEqual(await stored(appConfig, ANA), { ...NO_LOCKOUT, failures: 1 });
    }
  });

  it('does not shorten a lock when the phone’s date is set back', async () => {
    const appConfig = await phoneWithAnaLocked();
    const yesterday = (): Date => after(-86_400_000);
    const result = await attemptNip(deviceNipGuard(appConfig, yesterday), ANA, right);
    // Decided at the last server time, not at the phone's: exactly what was left.
    assert.deepEqual(result, { status: 'locked', lockedMs: 20_000 });
  });

  it('counts down by the phone’s clock once it is past the server’s', async () => {
    const appConfig = await phoneWithAnaLocked();
    const guard = deviceNipGuard(appConfig, () => after(15_000));
    assert.deepEqual(await attemptNip(guard, ANA, right), { status: 'locked', lockedMs: 5_000 });
  });

  it('leaves everyone else working while one NIP is locked', async () => {
    const appConfig = await phoneWithAnaLocked();
    const guard = deviceNipGuard(appConfig, () => SERVER);
    assert.equal((await attemptNip(guard, TONI, right)).status, 'ok');
    assert.equal((await stored(appConfig, ANA)).level, 1, 'Toni’s NIP did not clear Ana’s');
  });

  it('lets the subject’s right NIP through once the lock is over and clears their level', async () => {
    const appConfig = await phoneWithAnaLocked();
    const guard = deviceNipGuard(appConfig, () => after(20_000));
    assert.equal((await attemptNip(guard, ANA, right)).status, 'ok');
    assert.deepEqual(await stored(appConfig, ANA), NO_LOCKOUT);
  });
});

describe('nipRefusal', () => {
  it('says how long to wait while a lockout runs, and the screen’s own words otherwise', () => {
    assert.equal(nipRefusal({ lockedMs: 0 }, 'Ese NIP no es.'), 'Ese NIP no es.');
    assert.equal(nipRefusal({ lockedMs: 30_000 }, 'x'), 'Demasiados intentos. Espera 30 s.');
    assert.equal(nipRefusal({ lockedMs: 300_000 }, 'x'), 'Demasiados intentos. Espera 5 min.');
  });
});
