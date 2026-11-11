import assert from 'node:assert/strict';
import { hashRecoveryCode, totpCode } from '@xangarro/auth-core';
import { describe, it } from 'vitest';

import {
  activar,
  desactivar,
  descartarInvitacion,
  estadoSeguridad,
  nuevosCodigos,
  prepararActivacion,
} from '@/server/acceso/seguridad';

import { cuenta, mundo, PASSWORD } from './mundo';

async function activa() {
  const c = cuenta();
  const m = mundo([c]);
  await m.deps.sessions.open(c.id);
  const view = await prepararActivacion(m.deps, c, PASSWORD);
  assert.equal(view.kind, 'ok');
  const secret = view.kind === 'ok' ? view.secret : '';
  const on = await activar(m.deps, c.id, totpCode(secret, m.deps.now()));
  assert.equal(on.kind, 'ok');
  return { c, m, secret, codigos: on.kind === 'ok' ? on.codigos : [] };
}

describe('estadoSeguridad', () => {
  it('off, and invited once', async () => {
    const c = cuenta();
    const m = mundo([c]);
    assert.deepEqual(await estadoSeguridad(m.deps, c.id), {
      activa: false,
      desde: null,
      codigos: 0,
      invitar: true,
    });
    await descartarInvitacion(m.deps, c.id);
    assert.equal((await estadoSeguridad(m.deps, c.id))?.invitar, false);
  });

  it('on: since when, and how many codes are left; never invited', async () => {
    const { c, m } = await activa();
    const e = await estadoSeguridad(m.deps, c.id);
    assert.equal(e?.activa, true);
    assert.ok(e?.desde);
    assert.equal(e?.codigos, 10);
    assert.equal(e?.invitar, false);
  });

  it('nothing for an account that does not exist', async () => {
    const m = mundo([]);
    assert.equal(await estadoSeguridad(m.deps, 'no-such'), null);
  });

  it('a seed that is only pending is still off', async () => {
    const c = cuenta();
    const m = mundo([c]);
    await prepararActivacion(m.deps, c, PASSWORD);
    assert.equal((await estadoSeguridad(m.deps, c.id))?.activa, false);
  });
});

describe('prepararActivacion', () => {
  it('shows the seed and its URI to someone who typed the password', async () => {
    const c = cuenta();
    const m = mundo([c]);
    const r = await prepararActivacion(m.deps, c, PASSWORD);
    assert.equal(r.kind, 'ok');
    assert.match(r.kind === 'ok' ? r.secret : '', /^[A-Z2-7]{32}$/);
    assert.ok((r.kind === 'ok' ? r.uri : '').startsWith('otpauth://totp/Xangarro:'));
  });

  it('refuses a wrong password and stores no seed', async () => {
    const c = cuenta();
    const m = mundo([c]);
    assert.deepEqual(await prepararActivacion(m.deps, c, 'otra'), { kind: 'password' });
    assert.equal(m.factorDe(c.id)?.secretEnc, null);
  });

  it('locks after five wrong passwords', async () => {
    const c = cuenta();
    const m = mundo([c]);
    for (let i = 0; i < 4; i++) await prepararActivacion(m.deps, c, 'otra');
    assert.deepEqual(await prepararActivacion(m.deps, c, 'otra'), { kind: 'locked', wait: 900 });
    assert.equal((await prepararActivacion(m.deps, c, PASSWORD)).kind, 'locked');
  });

  it('has nothing to prepare once it is on', async () => {
    const { c, m } = await activa();
    assert.deepEqual(await prepararActivacion(m.deps, c, PASSWORD), { kind: 'ya-activa' });
  });
});

describe('activar', () => {
  it('turns it on with the first code, returns ten codes once and proves the session', async () => {
    const { c, m, codigos } = await activa();
    assert.equal(codigos.length, 10);
    assert.deepEqual(m.factorDe(c.id)?.recoveryCodes, codigos.map(hashRecoveryCode));
    assert.ok(m.sesion.steppedUpAt, 'enrolling counts as a proof');
  });

  it('refuses a wrong code', async () => {
    const c = cuenta();
    const m = mundo([c]);
    await prepararActivacion(m.deps, c, PASSWORD);
    assert.deepEqual(await activar(m.deps, c.id, '000000'), { kind: 'failed' });
    assert.equal((await estadoSeguridad(m.deps, c.id))?.activa, false);
  });

  it('refuses when nobody prepared a seed', async () => {
    const c = cuenta();
    const m = mundo([c]);
    assert.deepEqual(await activar(m.deps, c.id, '123456'), { kind: 'failed' });
  });

  it('locks after five wrong codes', async () => {
    const c = cuenta();
    const m = mundo([c]);
    await prepararActivacion(m.deps, c, PASSWORD);
    for (let i = 0; i < 4; i++) await activar(m.deps, c.id, '000000');
    assert.deepEqual(await activar(m.deps, c.id, '000000'), { kind: 'locked', wait: 900 });
  });
});

describe('nuevosCodigos', () => {
  it('replaces the ten codes, and the earlier ones stop working', async () => {
    const { c, m, codigos } = await activa();
    const r = await nuevosCodigos(m.deps, c.id);
    assert.equal(r.kind, 'ok');
    const nuevos = r.kind === 'ok' ? r.codigos : [];
    assert.equal(nuevos.length, 10);
    assert.notDeepEqual(nuevos, codigos);
    assert.deepEqual(m.factorDe(c.id)?.recoveryCodes, nuevos.map(hashRecoveryCode));
  });

  it('asks for a code first when the proof is older than fifteen minutes', async () => {
    const { c, m, codigos } = await activa();
    m.avanzar(15 * 60 + 1);
    assert.deepEqual(await nuevosCodigos(m.deps, c.id), { kind: 'reconfirmar' });
    assert.deepEqual(m.factorDe(c.id)?.recoveryCodes, codigos.map(hashRecoveryCode));
  });

  it('has nothing to replace while it is off', async () => {
    const c = cuenta();
    const m = mundo([c]);
    assert.deepEqual(await nuevosCodigos(m.deps, c.id), { kind: 'inactiva' });
  });

  it('has nothing to replace for a stranger', async () => {
    const m = mundo([]);
    assert.deepEqual(await nuevosCodigos(m.deps, 'no-such'), { kind: 'inactiva' });
  });
});

describe('desactivar', () => {
  it('removes the seed and the codes; the invitation does not come back', async () => {
    const { c, m } = await activa();
    assert.equal(await desactivar(m.deps, c.id), 'ok');
    assert.deepEqual(await estadoSeguridad(m.deps, c.id), {
      activa: false,
      desde: null,
      codigos: 0,
      invitar: false,
    });
  });

  it('asks for a code first when the proof is old, and changes nothing', async () => {
    const { c, m } = await activa();
    m.avanzar(15 * 60 + 1);
    assert.equal(await desactivar(m.deps, c.id), 'reconfirmar');
    assert.equal((await estadoSeguridad(m.deps, c.id))?.activa, true);
  });

  it('has nothing to turn off while it is off', async () => {
    const c = cuenta();
    const m = mundo([c]);
    assert.equal(await desactivar(m.deps, c.id), 'inactiva');
  });

  it('can be turned on again afterwards, with a new seed', async () => {
    const { c, m, secret } = await activa();
    await desactivar(m.deps, c.id);
    const again = await prepararActivacion(m.deps, c, PASSWORD);
    assert.equal(again.kind, 'ok');
    assert.notEqual(again.kind === 'ok' ? again.secret : secret, secret);
  });
});
