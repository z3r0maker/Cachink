import assert from 'node:assert/strict';
import { hashToken } from '@xangarro/auth-core';
import { describe, it } from 'vitest';

import { finishLinkRegistration, startLinkRegistration } from '@/server/auth/enrol-link';
import {
  finishAddPasskey,
  finishStepUp,
  listPasskeys,
  removePasskey,
  startAddPasskey,
  startStepUp,
} from '@/server/auth/manage-passkeys';
import { finishSignIn, startSignIn } from '@/server/auth/sign-in-passkey';

import { memoryAuth, STAFF_ID } from './support/auth';

/**
 * «Mi acceso» (N-85, ADR-160): list, add and remove passkeys. Adding or
 * removing needs a tap within the last 5 minutes (the sign-in counts), the
 * last passkey stays, and removing a passkey ends the sessions it opened.
 */
async function signedIn() {
  const env = memoryAuth();
  const link = env.mintLink();
  const reg = await startLinkRegistration(env.deps, link);
  assert.ok(reg.kind === 'ok');
  const { response, passkey } = env.authenticator.create(reg.options);
  assert.equal((await finishLinkRegistration(env.deps, link, response)).kind, 'ok');
  const started = await startSignIn(env.deps, '203.0.113.7');
  assert.ok(started.kind === 'ok');
  const signed = await finishSignIn(
    env.deps,
    env.authenticator.get(started.options, passkey),
    '203.0.113.7',
  );
  assert.ok(signed.kind === 'ok');
  const session = async () => {
    const s = await env.deps.sessions.resolve(hashToken(signed.token), 1800);
    if (s === null) throw new Error('session gone');
    return s;
  };
  return { ...env, passkey, token: signed.token, session };
}

type Env = Awaited<ReturnType<typeof signedIn>>;

async function addOne(env: Env) {
  const started = await startAddPasskey(env.deps, await env.session());
  assert.ok(started.kind === 'ok');
  const { response, passkey } = env.authenticator.create(started.options);
  return {
    result: await finishAddPasskey(env.deps, await env.session(), response),
    passkey,
    options: started.options,
  };
}

describe('«Mi acceso»', () => {
  it('lists the member’s passkeys and marks the one this session used', async () => {
    const env = await signedIn();
    const list = await listPasskeys(env.deps, await env.session());
    assert.equal(list.length, 1);
    assert.equal(list[0]?.nombre, 'Llavero de iCloud');
    assert.equal(list[0]?.current, true);
    assert.equal(list[0]?.backedUp, true);
  });

  it('adds a passkey right after sign-in, excluding the ones already there', async () => {
    const env = await signedIn();
    const { result, passkey, options } = await addOne(env);
    assert.deepEqual(result, { kind: 'ok', nombre: 'Llavero de iCloud' });
    assert.deepEqual(
      options.excludeCredentials?.map((c) => c.id),
      [env.passkey.id],
    );
    assert.equal(env.world.passkeys.get(passkey.id)?.origen, 'mi_acceso');
    assert.deepEqual(env.audit.at(-1)?.payload, {
      origen: 'mi_acceso',
      llave: passkey.id,
      nombre: 'Llavero de iCloud',
    });
  });

  it('asks for a fresh tap once 5 minutes have passed, and accepts the owner’s', async () => {
    const env = await signedIn();
    env.advance(301);
    assert.deepEqual(await startAddPasskey(env.deps, await env.session()), { kind: 'stepup' });
    const options = await startStepUp(env.deps, await env.session());
    assert.deepEqual(
      options.allowCredentials?.map((c) => c.id),
      [env.passkey.id],
    );
    const ok = await finishStepUp(
      env.deps,
      await env.session(),
      env.token,
      env.authenticator.get(options, env.passkey),
    );
    assert.equal(ok, true);
    assert.equal((await addOne(env)).result.kind, 'ok');
  });

  it('refuses an add finished after the window closed', async () => {
    const env = await signedIn();
    const started = await startAddPasskey(env.deps, await env.session());
    assert.ok(started.kind === 'ok');
    env.advance(301);
    const { response } = env.authenticator.create(started.options);
    assert.deepEqual(await finishAddPasskey(env.deps, await env.session(), response), {
      kind: 'stepup',
    });
  });

  it('does not let another member’s passkey answer a re-ask', async () => {
    const env = await signedIn();
    env.advance(301);
    const options = await startStepUp(env.deps, await env.session());
    const other = memoryAuth();
    const link = other.mintLink();
    const reg = await startLinkRegistration(other.deps, link);
    assert.ok(reg.kind === 'ok');
    const foreign = other.authenticator.create(reg.options).passkey;
    assert.equal(
      await finishStepUp(
        env.deps,
        await env.session(),
        env.token,
        env.authenticator.get(options, foreign),
      ),
      false,
    );
    assert.deepEqual(await startAddPasskey(env.deps, await env.session()), { kind: 'stepup' });
  });

  it('keeps the last passkey, removes another, and ends the sessions it opened', async () => {
    const env = await signedIn();
    assert.equal(await removePasskey(env.deps, await env.session(), env.passkey.id), 'last');
    const { passkey: second } = await addOne(env);
    assert.equal(await removePasskey(env.deps, await env.session(), 'not-mine'), 'missing');
    assert.equal(await removePasskey(env.deps, await env.session(), second.id), 'removed');
    assert.deepEqual(env.audit.at(-1), {
      staffId: STAFF_ID,
      action: 'auth.quitar_llave',
      payload: { llave: second.id },
    });
    const { passkey: third } = await addOne(env);
    assert.equal(await removePasskey(env.deps, await env.session(), env.passkey.id), 'removed');
    assert.equal(await env.deps.sessions.resolve(hashToken(env.token), 1800), null);
    assert.ok(env.world.passkeys.get(third.id));
  });

  it('asks for a fresh tap before removing, too', async () => {
    const env = await signedIn();
    await addOne(env);
    env.advance(301);
    assert.equal(await removePasskey(env.deps, await env.session(), env.passkey.id), 'stepup');
  });
});
