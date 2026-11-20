import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  finishPasskeyAssertion,
  finishPasskeyRegistration,
  passkeyUserHandle,
  startPasskeyAssertion,
  startPasskeyRegistration,
  type PasskeyDeps,
} from '../src/index.js';
import {
  ICLOUD_AAGUID,
  memoryChallengeStore,
  memoryPasskeyRepo,
  softAuthenticator,
  type MemoryPasskeyRow,
  type SoftPasskey,
} from '../src/testing.js';

const RP = {
  id: 'admin.xangarro.test',
  name: 'Xangarro Consola',
  origin: 'https://admin.xangarro.test',
};
const OWNER = 'staff-1';
const USER = { id: OWNER, name: 'ana@xangarro.mx', displayName: 'Ana' };
const REGISTER = `register:${OWNER}`;

function setup() {
  const rows = new Map<string, MemoryPasskeyRow>();
  const clock = { t: 0 };
  const deps: PasskeyDeps = {
    rp: RP,
    challenges: memoryChallengeStore(clock),
    passkeys: memoryPasskeyRepo(rows),
  };
  return { deps, rows, clock, auth: softAuthenticator({ origin: RP.origin }) };
}

type Setup = ReturnType<typeof setup>;

/** Registers through the real ceremony and stores the result, the way the app does. */
async function registered(s: Setup): Promise<SoftPasskey> {
  const options = await startPasskeyRegistration(s.deps, REGISTER, USER, []);
  const { response, passkey } = s.auth.create(options);
  const result = await finishPasskeyRegistration(s.deps, REGISTER, response);
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error('unreachable');
  const p = result.passkey;
  s.rows.set(p.id, {
    ownerId: OWNER,
    publicKey: p.publicKey,
    counter: p.counter,
    transports: [...p.transports],
    revoked: false,
  });
  return passkey;
}

describe('passkey registration', () => {
  it('asks for a discoverable, user-verified passkey and returns what to store', async () => {
    const s = setup();
    const options = await startPasskeyRegistration(s.deps, REGISTER, USER, ['old-id']);
    assert.equal(options.rp.id, RP.id);
    assert.equal(options.user.id, passkeyUserHandle(OWNER));
    assert.equal(options.authenticatorSelection?.residentKey, 'required');
    assert.equal(options.authenticatorSelection?.userVerification, 'required');
    assert.equal(options.attestation, 'none');
    assert.deepEqual(
      options.excludeCredentials?.map((c) => c.id),
      ['old-id'],
    );

    const { response, passkey } = s.auth.create(options);
    const result = await finishPasskeyRegistration(s.deps, REGISTER, response);
    assert.ok(result.ok);
    assert.equal(result.passkey.id, passkey.id);
    assert.deepEqual(Buffer.from(result.passkey.publicKey), Buffer.from(passkey.cosePublicKey));
    assert.equal(result.passkey.aaguid, ICLOUD_AAGUID);
    assert.equal(result.passkey.backedUp, true);
    assert.deepEqual(result.passkey.transports, ['internal', 'hybrid']);
  });

  it('refuses a response from another origin', async () => {
    const s = setup();
    const options = await startPasskeyRegistration(s.deps, REGISTER, USER, []);
    const { response } = s.auth.create(options, { origin: 'https://evil.test' });
    assert.deepEqual(await finishPasskeyRegistration(s.deps, REGISTER, response), {
      ok: false,
      reason: 'invalid',
    });
  });

  it('uses each challenge once, and only for its own purpose', async () => {
    const s = setup();
    const options = await startPasskeyRegistration(s.deps, REGISTER, USER, []);
    const { response } = s.auth.create(options);
    const other = await finishPasskeyRegistration(s.deps, 'register:staff-2', response);
    assert.deepEqual(other, { ok: false, reason: 'challenge' });
    const fresh = await startPasskeyRegistration(s.deps, REGISTER, USER, []);
    const again = s.auth.create(fresh);
    assert.ok((await finishPasskeyRegistration(s.deps, REGISTER, again.response)).ok);
    assert.deepEqual(await finishPasskeyRegistration(s.deps, REGISTER, again.response), {
      ok: false,
      reason: 'challenge',
    });
  });

  it('refuses an expired challenge', async () => {
    const s = setup();
    const options = await startPasskeyRegistration(s.deps, REGISTER, USER, []);
    s.clock.t += 301;
    const { response } = s.auth.create(options);
    assert.deepEqual(await finishPasskeyRegistration(s.deps, REGISTER, response), {
      ok: false,
      reason: 'challenge',
    });
  });

  it('refuses a passkey made without user verification', async () => {
    const s = setup();
    const options = await startPasskeyRegistration(s.deps, REGISTER, USER, []);
    const { response } = s.auth.create(options, { userVerified: false });
    assert.deepEqual(await finishPasskeyRegistration(s.deps, REGISTER, response), {
      ok: false,
      reason: 'invalid',
    });
  });

  it('refuses a response whose client data is not JSON', async () => {
    const s = setup();
    const options = await startPasskeyRegistration(s.deps, REGISTER, USER, []);
    const { response } = s.auth.create(options);
    const broken = {
      ...response,
      response: { ...response.response, clientDataJSON: 'bm90LWpzb24' },
    };
    assert.deepEqual(await finishPasskeyRegistration(s.deps, REGISTER, broken), {
      ok: false,
      reason: 'invalid',
    });
  });
});

describe('passkey assertion', () => {
  it('names the owner of a stored passkey and records the new counter', async () => {
    const s = setup();
    const passkey = await registered(s);
    const options = await startPasskeyAssertion(s.deps, 'login');
    assert.equal(options.userVerification, 'required');
    assert.equal(options.allowCredentials, undefined);
    const result = await finishPasskeyAssertion(s.deps, 'login', s.auth.get(options, passkey));
    assert.deepEqual(result, { ok: true, ownerId: OWNER, credentialId: passkey.id });
    assert.equal(s.rows.get(passkey.id)?.counter, 1);
  });

  it('accepts a synced passkey whose counter stays at zero', async () => {
    const s = setup();
    const passkey = await registered(s);
    for (let i = 0; i < 2; i += 1) {
      const options = await startPasskeyAssertion(s.deps, 'login');
      const result = await finishPasskeyAssertion(
        s.deps,
        'login',
        s.auth.get(options, passkey, { counter: 0 }),
      );
      assert.equal(result.ok, true);
    }
  });

  it('refuses a counter that goes backwards (a cloned key)', async () => {
    const s = setup();
    const passkey = await registered(s);
    const first = await startPasskeyAssertion(s.deps, 'login');
    assert.ok(
      (await finishPasskeyAssertion(s.deps, 'login', s.auth.get(first, passkey, { counter: 5 })))
        .ok,
    );
    const second = await startPasskeyAssertion(s.deps, 'login');
    const result = await finishPasskeyAssertion(
      s.deps,
      'login',
      s.auth.get(second, passkey, { counter: 5 }),
    );
    assert.deepEqual(result, {
      ok: false,
      reason: 'counter',
      credentialId: passkey.id,
      ownerId: OWNER,
    });
  });

  it('refuses a passkey it does not know, or one that was removed', async () => {
    const s = setup();
    const passkey = await registered(s);
    const stranger = s.auth.create(
      await startPasskeyRegistration(s.deps, REGISTER, USER, []),
    ).passkey;
    const options = await startPasskeyAssertion(s.deps, 'login');
    assert.deepEqual(await finishPasskeyAssertion(s.deps, 'login', s.auth.get(options, stranger)), {
      ok: false,
      reason: 'unknown',
    });
    const row = s.rows.get(passkey.id);
    if (row) row.revoked = true;
    const again = await startPasskeyAssertion(s.deps, 'login');
    assert.deepEqual(await finishPasskeyAssertion(s.deps, 'login', s.auth.get(again, passkey)), {
      ok: false,
      reason: 'unknown',
    });
  });

  it('refuses another origin, a bad signature and a replayed challenge', async () => {
    const s = setup();
    const passkey = await registered(s);
    const o1 = await startPasskeyAssertion(s.deps, 'login');
    const wrongOrigin = s.auth.get(o1, passkey, { origin: 'https://evil.test' });
    assert.deepEqual(await finishPasskeyAssertion(s.deps, 'login', wrongOrigin), {
      ok: false,
      reason: 'invalid',
    });

    const o2 = await startPasskeyAssertion(s.deps, 'login');
    const good = s.auth.get(o2, passkey);
    const forged = {
      ...good,
      response: { ...good.response, signature: Buffer.from('nope').toString('base64url') },
    };
    assert.deepEqual(await finishPasskeyAssertion(s.deps, 'login', forged), {
      ok: false,
      reason: 'invalid',
    });
    assert.deepEqual(await finishPasskeyAssertion(s.deps, 'login', good), {
      ok: false,
      reason: 'challenge',
    });
  });

  it('refuses a user handle that is not the passkey owner', async () => {
    const s = setup();
    const passkey = await registered(s);
    const options = await startPasskeyAssertion(s.deps, 'login');
    const response = s.auth.get(options, passkey, { userHandle: passkeyUserHandle('staff-2') });
    assert.deepEqual(await finishPasskeyAssertion(s.deps, 'login', response), {
      ok: false,
      reason: 'invalid',
    });
  });

  it('refuses an assertion made without user verification', async () => {
    const s = setup();
    const passkey = await registered(s);
    const options = await startPasskeyAssertion(s.deps, 'login');
    const response = s.auth.get(options, passkey, { userVerified: false });
    assert.deepEqual(await finishPasskeyAssertion(s.deps, 'login', response), {
      ok: false,
      reason: 'invalid',
    });
  });

  it('limits a step-up to the passkeys it names', async () => {
    const s = setup();
    const passkey = await registered(s);
    const options = await startPasskeyAssertion(s.deps, `stepup:${OWNER}`, [
      { id: passkey.id, transports: ['internal'] },
    ]);
    assert.deepEqual(
      options.allowCredentials?.map((c) => c.id),
      [passkey.id],
    );
    const result = await finishPasskeyAssertion(
      s.deps,
      `stepup:${OWNER}`,
      s.auth.get(options, passkey),
    );
    assert.equal(result.ok, true);
  });
});
