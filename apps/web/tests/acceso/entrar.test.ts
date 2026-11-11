import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { trasCredencial } from '@/server/acceso/entrar';
import { activar, prepararActivacion } from '@/server/acceso/seguridad';
import { totpCode } from '@xangarro/auth-core';

import { cuenta, mundo, PASSWORD } from './mundo';

/** What opens once a credential has been proven: a password, a sign-in link or a reset. */
describe('trasCredencial', () => {
  it('opens the session of a confirmed account without a second factor', async () => {
    const c = cuenta();
    const m = mundo([c]);
    assert.deepEqual(await trasCredencial(m.deps, c, 'password'), { kind: 'sesion' });
    assert.equal(m.sesion.userId, c.id);
    assert.equal(m.correos.length, 0);
  });

  it('a password on an unconfirmed address opens nothing: a pass and a fresh email', async () => {
    const c = cuenta({ confirmed: false });
    const m = mundo([c]);
    const r = await trasCredencial(m.deps, c, 'password');
    assert.equal(r.kind, 'confirmar');
    assert.equal(m.sesion.userId, null, 'acceptance: no session with a password alone');
    assert.deepEqual(
      m.correos.map((x) => [x.kind, x.to]),
      [['confirmacion', c.email]],
    );
    const pase = r.kind === 'confirmar' ? r.pase : '';
    assert.equal((await m.deps.links.peek(pase, 'pending'))?.state, 'fresh');
  });

  it('a sign-in link claims an unconfirmed account and asks for a new password', async () => {
    const c = cuenta({ confirmed: false, password: 'la-de-quien-la-registro' });
    const m = mundo([c]);
    const r = await trasCredencial(m.deps, c, 'enlace');
    assert.equal(r.kind, 'nueva-contrasena');
    assert.equal(c.confirmed, true);
    assert.equal(c.password, null, 'whoever registered the address loses the password');
    assert.equal(m.sesion.userId, null);
    const reset = r.kind === 'nueva-contrasena' ? r.reset : '';
    assert.equal((await m.deps.links.peek(reset, 'reset'))?.state, 'fresh');
  });

  it('a password reset confirms the address and keeps the password it just set', async () => {
    const c = cuenta({ confirmed: false, password: 'la-nueva' });
    const m = mundo([c]);
    assert.deepEqual(await trasCredencial(m.deps, c, 'reset'), { kind: 'sesion' });
    assert.equal(c.confirmed, true);
    assert.equal(c.password, 'la-nueva');
  });

  it('with the second factor on, a credential yields a challenge and no session', async () => {
    const c = cuenta();
    const m = mundo([c]);
    const view = await prepararActivacion(m.deps, c, PASSWORD);
    assert.equal(view.kind, 'ok');
    await activar(m.deps, c.id, totpCode(view.kind === 'ok' ? view.secret : '', m.deps.now()));
    m.sesion.userId = null;

    for (const via of ['password', 'enlace', 'reset'] as const) {
      const r = await trasCredencial(m.deps, c, via);
      assert.equal(r.kind, 'segundo-paso', via);
      assert.equal(m.sesion.userId, null, 'acceptance: nothing opens after the password alone');
    }
  });

  it('an account that belongs to no business is told so, not let in', async () => {
    const c = cuenta({ negocio: null });
    const m = mundo([c]);
    assert.deepEqual(await trasCredencial(m.deps, c, 'password'), { kind: 'sin-negocio' });
  });

  it('an account that vanished mid-flow opens nothing', async () => {
    const m = mundo([]);
    const fantasma = { id: 'no-such', email: 'nadie@x.test.mx' };
    assert.deepEqual(await trasCredencial(m.deps, fantasma, 'password'), { kind: 'sin-negocio' });
  });

  it('too many confirmation emails stop the email, never the pass', async () => {
    const c = cuenta({ confirmed: false });
    const m = mundo([c]);
    for (let i = 0; i < 5; i++) await trasCredencial(m.deps, c, 'password');
    assert.equal(m.correos.length, 3, 'three per address in the window');
    const r = await trasCredencial(m.deps, c, 'password');
    assert.equal(r.kind, 'confirmar');
  });
});
