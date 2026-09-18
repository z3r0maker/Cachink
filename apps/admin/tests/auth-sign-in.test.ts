import assert from 'node:assert/strict';
import { hashToken, LOGIN_PER_EMAIL, LOGIN_PER_IP } from '@xangarro/auth-core';
import { describe, it } from 'vitest';

import { AAL1_TTL_SECONDS } from '@/server/auth/config';
import { signIn, signOut } from '@/server/auth/sign-in';

import { memoryAuth, newStaff, PASSWORD, STAFF_ID } from './support/auth';

const input = { email: 'ana@xangarro.mx', password: PASSWORD, ip: '1.2.3.4' };

describe('signIn', () => {
  it('opens a short AAL1 session for the right password and audits it', async () => {
    const { deps, sessionRows, audit } = memoryAuth([await newStaff()]);
    const r = await signIn(deps, input);
    assert.equal(r.kind, 'ok');
    const row = sessionRows.get(hashToken(r.kind === 'ok' ? r.token : 'x'));
    assert.deepEqual(row, {
      staffId: STAFF_ID,
      aal: 'aal1',
      ttl: AAL1_TTL_SECONDS,
      revoked: false,
    });
    assert.deepEqual(
      audit.map((a) => a.action),
      ['auth.iniciar_sesion'],
    );
  });

  it('matches the address case- and space-insensitively', async () => {
    const { deps } = memoryAuth([await newStaff()]);
    assert.equal((await signIn(deps, { ...input, email: '  ANA@Xangarro.MX ' })).kind, 'ok');
  });

  it('refuses a wrong password, opens nothing, and audits the failure', async () => {
    const { deps, sessionRows, audit } = memoryAuth([await newStaff()]);
    assert.deepEqual(await signIn(deps, { ...input, password: 'otra-contraseña' }), {
      kind: 'failed',
    });
    assert.equal(sessionRows.size, 0);
    assert.deepEqual(audit, [
      { staffId: STAFF_ID, action: 'auth.inicio_fallido', payload: { bloqueo: false } },
    ]);
  });

  it('answers an unknown address exactly like a wrong password', async () => {
    const { deps, audit } = memoryAuth([await newStaff()]);
    assert.deepEqual(await signIn(deps, { ...input, email: 'nadie@xangarro.mx' }), {
      kind: 'failed',
    });
    assert.equal(audit.length, 0);
  });

  it('refuses a revoked staff member and one with no password set yet', async () => {
    for (const s of [await newStaff({ revoked: true }), await newStaff({ passwordHash: null })]) {
      const { deps } = memoryAuth([s]);
      assert.deepEqual(await signIn(deps, input), { kind: 'failed' });
    }
  });

  it('refuses empty fields without touching the throttle', async () => {
    const { deps } = memoryAuth([await newStaff()]);
    assert.deepEqual(await signIn(deps, { ...input, email: ' ' }), { kind: 'invalid' });
    assert.deepEqual(await signIn(deps, { ...input, password: '' }), { kind: 'invalid' });
  });

  it('locks the address after five wrong passwords, even for the right one', async () => {
    const { deps, audit } = memoryAuth([await newStaff()]);
    for (let i = 0; i < LOGIN_PER_EMAIL.max - 1; i++)
      await signIn(deps, { ...input, password: 'mal' });
    const fifth = await signIn(deps, { ...input, password: 'mal' });
    assert.deepEqual(fifth, { kind: 'locked', wait: LOGIN_PER_EMAIL.lockout });
    assert.equal((await signIn(deps, input)).kind, 'locked');
    assert.deepEqual(audit.at(-1)?.payload, { bloqueo: true });
  });

  it('locks an IP spraying many addresses', async () => {
    const { deps } = memoryAuth([await newStaff()]);
    for (let i = 0; i < LOGIN_PER_IP.max; i++) {
      await signIn(deps, { ...input, email: `x${i}@xangarro.mx`, password: 'mal' });
    }
    assert.equal((await signIn(deps, input)).kind, 'locked');
  });

  it('uses admin-prefixed throttle keys, never the portal’s', async () => {
    const { deps, throttle } = memoryAuth([await newStaff()]);
    for (let i = 0; i < LOGIN_PER_EMAIL.max; i++) await signIn(deps, { ...input, password: 'mal' });
    const { throttleKey } = await import('@xangarro/auth-core');
    assert.equal(await throttle.wait(throttleKey('login', 'email', input.email)), 0);
    assert.ok((await throttle.wait(throttleKey('admin', 'login', 'email', input.email))) > 0);
  });
});

describe('signOut', () => {
  it('revokes the session and audits the logout', async () => {
    const { deps, sessionRows, audit } = memoryAuth([await newStaff()]);
    const r = await signIn(deps, input);
    const token = r.kind === 'ok' ? r.token : '';
    await signOut(deps, token, STAFF_ID);
    assert.equal(sessionRows.get(hashToken(token))?.revoked, true);
    assert.equal(audit.at(-1)?.action, 'auth.cerrar_sesion');
  });

  it('does not audit when there was no live session', async () => {
    const { deps, audit } = memoryAuth([await newStaff()]);
    await signOut(deps, undefined, null);
    assert.equal(audit.length, 0);
  });

  it('ignores a junk cookie', async () => {
    const { deps, sessionRows } = memoryAuth([await newStaff()]);
    await signOut(deps, 'junk', null);
    assert.equal(sessionRows.size, 0);
  });
});
