import assert from 'node:assert/strict';
import { hashToken } from '@xangarro/auth-core';
import type { SoftPasskey } from '@xangarro/auth-core/testing';
import { describe, it } from 'vitest';

import { finishLinkRegistration, startLinkRegistration } from '@/server/auth/enrol-link';
import { finishSignIn, signOut, startSignIn } from '@/server/auth/sign-in-passkey';

import { memoryAuth, STAFF_ID } from './support/auth';

/**
 * Sign-in with a passkey (N-85, ADR-160): one tap opens a full session bound
 * to that passkey. Refusals are counted per IP; a counter that goes backwards
 * is refused and audited, because it is what a cloned key looks like.
 */
const IP = '203.0.113.7';

async function enrolled() {
  const env = memoryAuth();
  const token = env.mintLink();
  const started = await startLinkRegistration(env.deps, token);
  assert.ok(started.kind === 'ok');
  const { response, passkey } = env.authenticator.create(started.options);
  assert.equal((await finishLinkRegistration(env.deps, token, response)).kind, 'ok');
  return { ...env, passkey };
}

async function tap(
  env: Awaited<ReturnType<typeof enrolled>>,
  passkey: SoftPasskey = env.passkey,
  counter?: number,
) {
  const started = await startSignIn(env.deps, IP);
  assert.ok(started.kind === 'ok');
  const response = env.authenticator.get(
    started.options,
    passkey,
    counter === undefined ? {} : { counter },
  );
  return finishSignIn(env.deps, response, IP);
}

describe('passkey sign-in', () => {
  it('opens a session bound to the passkey, and audits it', async () => {
    const env = await enrolled();
    const result = await tap(env);
    assert.ok(result.kind === 'ok');
    const session = await env.deps.sessions.resolve(hashToken(result.token), 1800);
    assert.equal(session?.staffId, STAFF_ID);
    assert.equal(session?.passkeyId, env.passkey.id);
    assert.deepEqual(env.audit.at(-1), {
      staffId: STAFF_ID,
      action: 'auth.entrar_llave',
      payload: { llave: env.passkey.id },
    });
  });

  it('asks for any discoverable passkey: no email, no allow list', async () => {
    const env = await enrolled();
    const started = await startSignIn(env.deps, IP);
    assert.ok(started.kind === 'ok');
    assert.equal(started.options.allowCredentials, undefined);
    assert.equal(started.options.userVerification, 'required');
  });

  it('refuses a passkey that is not the team’s, without naming anyone', async () => {
    const env = await enrolled();
    const stranger = memoryAuth();
    const token = stranger.mintLink();
    const s = await startLinkRegistration(stranger.deps, token);
    assert.ok(s.kind === 'ok');
    const foreign = stranger.authenticator.create(s.options).passkey;
    assert.deepEqual(await tap(env, foreign), { kind: 'failed', reason: 'unknown' });
    assert.equal(env.audit.at(-1)?.action, 'auth.registrar_llave');
  });

  it('refuses and audits a counter that goes backwards', async () => {
    const env = await enrolled();
    assert.equal((await tap(env, env.passkey, 7)).kind, 'ok');
    assert.deepEqual(await tap(env, env.passkey, 3), { kind: 'failed', reason: 'counter' });
    assert.deepEqual(env.audit.at(-1), {
      staffId: STAFF_ID,
      action: 'auth.llave_contador_invalido',
      payload: { llave: env.passkey.id },
    });
  });

  it('locks an IP after too many refusals, before checking anything', async () => {
    const env = await enrolled();
    const started = await startSignIn(env.deps, IP);
    assert.ok(started.kind === 'ok');
    const replayed = env.authenticator.get(started.options, env.passkey);
    assert.equal((await finishSignIn(env.deps, replayed, IP)).kind, 'ok');
    let last = await finishSignIn(env.deps, replayed, IP);
    for (let i = 0; i < 25 && last.kind !== 'locked'; i += 1)
      last = await finishSignIn(env.deps, replayed, IP);
    assert.equal(last.kind, 'locked');
    assert.equal((await startSignIn(env.deps, IP)).kind, 'locked');
    assert.equal((await startSignIn(env.deps, '198.51.100.1')).kind, 'ok');
  });

  it('ends the session on sign-out and audits it', async () => {
    const env = await enrolled();
    const result = await tap(env);
    assert.ok(result.kind === 'ok');
    await signOut(env.deps, result.token, STAFF_ID);
    assert.equal(await env.deps.sessions.resolve(hashToken(result.token), 1800), null);
    assert.equal(env.audit.at(-1)?.action, 'auth.cerrar_sesion');
  });
});
