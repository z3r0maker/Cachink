import assert from 'node:assert/strict';
import { totpCode } from '@xangarro/auth-core';
import { describe, it } from 'vitest';

import { trasCredencial } from '@/server/acceso/entrar';
import {
  confirmarIdentidad,
  reconfirmado,
  retoPendiente,
  verificarSegundoPaso,
} from '@/server/acceso/segundo-paso';
import { activar, prepararActivacion } from '@/server/acceso/seguridad';

import { cuenta, mundo, PASSWORD } from './mundo';

/** An owner with the second factor on, signed out, holding the challenge of a fresh sign-in. */
async function conReto() {
  const c = cuenta();
  const m = mundo([c]);
  const view = await prepararActivacion(m.deps, c, PASSWORD);
  assert.equal(view.kind, 'ok');
  const secret = view.kind === 'ok' ? view.secret : '';
  const on = await activar(m.deps, c.id, totpCode(secret, m.deps.now()));
  assert.equal(on.kind, 'ok');
  const codigos = on.kind === 'ok' ? on.codigos : [];
  m.sesion.userId = null;
  m.sesion.steppedUpAt = null;
  m.avanzar(60);
  const r = await trasCredencial(m.deps, c, 'password');
  assert.equal(r.kind, 'segundo-paso');
  const reto = r.kind === 'segundo-paso' ? r.reto : '';
  return { c, m, secret, codigos, reto, code: () => totpCode(secret, m.deps.now()) };
}

describe('verificarSegundoPaso', () => {
  it('the app code opens the session and counts as a fresh proof', async () => {
    const { c, m, reto, code } = await conReto();
    assert.deepEqual(await verificarSegundoPaso(m.deps, reto, code()), {
      kind: 'ok',
      usado: { method: 'totp' },
    });
    assert.equal(m.sesion.userId, c.id);
    assert.equal(await reconfirmado(m.deps, c.id), true, 'no re-ask right after signing in');
    assert.equal(await retoPendiente(m.deps, reto), null, 'the challenge is spent');
  });

  it('a recovery code opens it too, once, and says how many are left', async () => {
    const { m, codigos, reto } = await conReto();
    const r = await verificarSegundoPaso(m.deps, reto, codigos[0] ?? '');
    assert.deepEqual(r, { kind: 'ok', usado: { method: 'recovery', left: 9 } });
  });

  it('a wrong code opens nothing and leaves the challenge standing', async () => {
    const { c, m, reto } = await conReto();
    assert.deepEqual(await verificarSegundoPaso(m.deps, reto, '000000'), { kind: 'failed' });
    assert.equal(m.sesion.userId, null);
    assert.equal((await retoPendiente(m.deps, reto))?.id, c.id);
  });

  it('five wrong codes lock the account for fifteen minutes, even for the right code', async () => {
    const { m, reto, code } = await conReto();
    for (let i = 0; i < 4; i++) await verificarSegundoPaso(m.deps, reto, '000000');
    const fifth = await verificarSegundoPaso(m.deps, reto, '000000');
    assert.deepEqual(fifth, { kind: 'locked', wait: 900 });
    assert.equal((await verificarSegundoPaso(m.deps, reto, code())).kind, 'locked');
    assert.equal(m.sesion.userId, null);
  });

  it('a challenge older than ten minutes is gone: sign in again', async () => {
    const { m, reto, code } = await conReto();
    m.avanzar(10 * 60 + 1);
    assert.deepEqual(await verificarSegundoPaso(m.deps, reto, code()), { kind: 'sin-reto' });
  });

  it('without a challenge, or with a made-up one, there is nothing to verify', async () => {
    const { m, code } = await conReto();
    assert.deepEqual(await verificarSegundoPaso(m.deps, undefined, code()), { kind: 'sin-reto' });
    assert.deepEqual(await verificarSegundoPaso(m.deps, 'r'.repeat(43), code()), {
      kind: 'sin-reto',
    });
  });

  it('the same code cannot be used twice (replay)', async () => {
    const { c, m, reto, code } = await conReto();
    const usado = code();
    await verificarSegundoPaso(m.deps, reto, usado);
    m.sesion.userId = null;
    const otra = await trasCredencial(m.deps, c, 'password');
    const reto2 = otra.kind === 'segundo-paso' ? otra.reto : '';
    assert.deepEqual(await verificarSegundoPaso(m.deps, reto2, usado), { kind: 'failed' });
  });
});

describe('reconfirmado y confirmarIdentidad', () => {
  it('an account without the second factor is never asked', async () => {
    const c = cuenta();
    const m = mundo([c]);
    await m.deps.sessions.open(c.id);
    assert.equal(await reconfirmado(m.deps, c.id), true);
  });

  it('asks again once the proof is older than fifteen minutes, and a code renews it', async () => {
    const { c, m, reto, code } = await conReto();
    await verificarSegundoPaso(m.deps, reto, code());
    m.avanzar(15 * 60 + 1);
    assert.equal(await reconfirmado(m.deps, c.id), false);
    assert.deepEqual(await confirmarIdentidad(m.deps, c.id, code()), {
      kind: 'ok',
      usado: { method: 'totp' },
    });
    assert.equal(await reconfirmado(m.deps, c.id), true);
  });

  it('a wrong code renews nothing', async () => {
    const { c, m, reto, code } = await conReto();
    await verificarSegundoPaso(m.deps, reto, code());
    m.avanzar(15 * 60 + 1);
    assert.deepEqual(await confirmarIdentidad(m.deps, c.id, '111111'), { kind: 'failed' });
    assert.equal(await reconfirmado(m.deps, c.id), false);
  });

  it('a recovery code renews it and is spent', async () => {
    const { c, m, reto, code, codigos } = await conReto();
    await verificarSegundoPaso(m.deps, reto, code());
    m.avanzar(15 * 60 + 1);
    const r = await confirmarIdentidad(m.deps, c.id, codigos[3] ?? '');
    assert.deepEqual(r, { kind: 'ok', usado: { method: 'recovery', left: 9 } });
    assert.deepEqual(await confirmarIdentidad(m.deps, c.id, codigos[3] ?? ''), { kind: 'failed' });
  });

  it('shares the lock with the sign-in step: five wrong codes in the dialog lock it', async () => {
    const { c, m, reto, code } = await conReto();
    await verificarSegundoPaso(m.deps, reto, code());
    for (let i = 0; i < 4; i++) await confirmarIdentidad(m.deps, c.id, '111111');
    assert.deepEqual(await confirmarIdentidad(m.deps, c.id, '111111'), {
      kind: 'locked',
      wait: 900,
    });
  });
});
