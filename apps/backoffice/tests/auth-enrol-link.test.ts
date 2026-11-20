import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { finishLinkRegistration, startLinkRegistration, viewLink } from '@/server/auth/enrol-link';

import { memoryAuth, newStaff, STAFF_ID } from './support/auth';

/**
 * The page a printed link opens (N-85, ADR-160): it names who the link is for,
 * registers one passkey, and is spent by it. A cancelled ceremony spends
 * nothing; an expired, used, voided or made-up link registers nothing.
 */
async function registerWith(env: ReturnType<typeof memoryAuth>, token: string) {
  const started = await startLinkRegistration(env.deps, token);
  assert.equal(started.kind, 'ok');
  if (started.kind !== 'ok') throw new Error('unreachable');
  const { response, passkey } = env.authenticator.create(started.options);
  return {
    result: await finishLinkRegistration(env.deps, token, response),
    passkey,
    options: started.options,
  };
}

describe('viewLink', () => {
  it('names the member and the expiry of a live link', async () => {
    const env = memoryAuth();
    const token = env.mintLink();
    const view = await viewLink(env.deps, token);
    assert.equal(view.state, 'valido');
    assert.ok(view.state === 'valido');
    assert.equal(view.nombre, 'Ana');
    assert.equal(view.expiresAt.toISOString(), '2026-11-20T16:15:00.000Z');
  });

  it('tells an expired link from a used one, and never names anyone for either', async () => {
    const env = memoryAuth();
    const expired = env.mintLink(STAFF_ID, 1);
    env.advance(61);
    assert.deepEqual(await viewLink(env.deps, expired), { state: 'vencido' });
    const used = env.mintLink();
    assert.equal((await registerWith(env, used)).result.kind, 'ok');
    assert.deepEqual(await viewLink(env.deps, used), { state: 'usado' });
  });

  it('treats junk, an unknown token, a voided link and a revoked member as invalid', async () => {
    const env = memoryAuth([newStaff({ revoked: true })]);
    const revoked = env.mintLink();
    assert.deepEqual(await viewLink(env.deps, revoked), { state: 'invalido' });
    assert.deepEqual(await viewLink(env.deps, 'not-a-token'), { state: 'invalido' });
    assert.deepEqual(await viewLink(env.deps, 'A'.repeat(43)), { state: 'invalido' });
    const live = memoryAuth();
    const voided = live.mintLink();
    for (const l of live.world.links.values()) l.voided = true;
    assert.deepEqual(await viewLink(live.deps, voided), { state: 'invalido' });
  });
});

describe('link registration', () => {
  it('registers a passkey for the link owner, spends the link and audits it', async () => {
    const env = memoryAuth();
    const token = env.mintLink();
    const { result, passkey, options } = await registerWith(env, token);
    assert.deepEqual(result, { kind: 'ok', nombre: 'Llavero de iCloud' });
    assert.equal(options.user.name, 'ana@xangarro.mx');
    assert.equal(options.user.displayName, 'Ana');
    const stored = env.world.passkeys.get(passkey.id);
    assert.equal(stored?.staffId, STAFF_ID);
    assert.equal(stored?.origen, 'enlace');
    assert.deepEqual(env.audit.at(-1), {
      staffId: STAFF_ID,
      action: 'auth.registrar_llave',
      payload: { origen: 'enlace', llave: passkey.id, nombre: 'Llavero de iCloud' },
    });
  });

  it('keeps the link alive when the ceremony is abandoned, and refuses its second use', async () => {
    const env = memoryAuth();
    const token = env.mintLink();
    await startLinkRegistration(env.deps, token);
    assert.equal((await viewLink(env.deps, token)).state, 'valido');
    assert.equal((await registerWith(env, token)).result.kind, 'ok');
    assert.deepEqual(await startLinkRegistration(env.deps, token), {
      kind: 'refused',
      view: { state: 'usado' },
    });
  });

  it('registers nothing when the link expires between the options and the answer', async () => {
    const env = memoryAuth();
    const token = env.mintLink(STAFF_ID, 1);
    const started = await startLinkRegistration(env.deps, token);
    assert.ok(started.kind === 'ok');
    env.advance(61);
    const { response } = env.authenticator.create(started.options);
    assert.deepEqual(await finishLinkRegistration(env.deps, token, response), {
      kind: 'failed',
      reason: 'link',
    });
    assert.equal(env.world.passkeys.size, 0);
  });

  it('refuses an answer to another link’s challenge', async () => {
    const env = memoryAuth();
    const mine = env.mintLink();
    const other = memoryAuth().mintLink();
    const started = await startLinkRegistration(env.deps, mine);
    assert.ok(started.kind === 'ok');
    const { response } = env.authenticator.create(started.options);
    assert.deepEqual(await finishLinkRegistration(env.deps, other, response), {
      kind: 'failed',
      reason: 'link',
    });
    const second = env.mintLink();
    assert.deepEqual(await finishLinkRegistration(env.deps, second, response), {
      kind: 'failed',
      reason: 'challenge',
    });
  });

  it('refuses a response from another origin', async () => {
    const env = memoryAuth();
    const token = env.mintLink();
    const started = await startLinkRegistration(env.deps, token);
    assert.ok(started.kind === 'ok');
    const { response } = env.authenticator.create(started.options, { origin: 'https://evil.test' });
    assert.deepEqual(await finishLinkRegistration(env.deps, token, response), {
      kind: 'failed',
      reason: 'invalid',
    });
    assert.equal((await viewLink(env.deps, token)).state, 'valido');
  });
});
