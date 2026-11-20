import assert from 'node:assert/strict';

import { beforeAll, describe, it } from 'vitest';

import { accessLines } from '../src/runner/act';
import { watchConfirmation } from '../src/runner/confirm';
import { evaluateSuccess } from '../src/runner/success';
import { seedRun } from '../src/seed/seed';
import { ScenarioSchema } from '../src/schemas/scenario';
import { PRIMERA_VENTA } from './fixtures';

/**
 * A scenario that starts with no account (S-10, `sin-cuenta`): the actor signs
 * up, the runner opens the emailed confirmation link in its tab when the
 * email lands, and success is looked up by the address it signed up with.
 */
const SIGNUP = ScenarioSchema.parse({
  ...PRIMERA_VENTA,
  id: 'onboarding-camino-a',
  start: { seed: 'sin-cuenta', auth_as: 'owner', url: '/signup' },
});

const LOCAL = 'postgres://synth:synth@127.0.0.1:5432/xangarro';
beforeAll(() => {
  process.env.DATABASE_URL = LOCAL;
  process.env.DATABASE_SUPER_URL = LOCAL;
  process.env.BILLING_DATABASE_URL = LOCAL;
});

const signup = (label = 'lupita-abarrotes') =>
  seedRun({
    seed: 'sin-cuenta',
    authAs: 'owner',
    today: '2026-11-20',
    allowedHosts: ['127.0.0.1'],
    label,
  });

describe('seedRun for «sin-cuenta»', () => {
  it('mints no tenant, and gives the actor an address and a password of its own', async () => {
    const access = await signup();
    assert.equal(access.tenant, null);
    assert.match(access.account.email, /^lupita-abarrotes-.+@ejemplo\.mx$/);
    assert.ok(access.account.password.length >= 8);
    assert.deepEqual(access.operators, []);
    assert.equal(access.activationCode, null);
  });

  it('never gives two runs the same address, so their signups and throttles stay apart', async () => {
    const [a, b] = [await signup(), await signup()];
    assert.notEqual(a.account.email, b.account.email);
  });

  it('still refuses a database outside allowed_hosts', async () => {
    process.env.DATABASE_URL = 'postgres://synth:synth@db.xangarro.mx:5432/xangarro';
    try {
      await assert.rejects(signup(), /db\.xangarro\.mx/);
    } finally {
      process.env.DATABASE_URL = LOCAL;
    }
  });
});

describe('accessLines for a signup', () => {
  it('tells the persona the address and password to sign up with, and that the email opens itself', async () => {
    const access = await signup();
    const lines = accessLines(SIGNUP, access).join('\n');
    assert.ok(lines.includes(access.account.email));
    assert.ok(lines.includes(access.account.password));
    assert.match(lines, /correo.*se abre solo/i);
    assert.doesNotMatch(lines, /Ya entraste/);
  });
});

describe('watchConfirmation', () => {
  const quick = { everyMs: 1 };

  it('opens the link once, as soon as the email is there', async () => {
    const opened: string[] = [];
    let polls = 0;
    const w = watchConfirmation({
      ...quick,
      find: async () => (++polls >= 3 ? '/signup/confirmar?t=x' : null),
      open: async (link) => void opened.push(link),
    });
    await w.done;
    assert.deepEqual(opened, ['/signup/confirmar?t=x']);
  });

  it('opens nothing when it is stopped before any email arrives', async () => {
    const opened: string[] = [];
    const w = watchConfirmation({
      ...quick,
      find: async () => null,
      open: async (l) => void opened.push(l),
    });
    await new Promise((r) => setTimeout(r, 20));
    w.stop();
    await w.done;
    assert.deepEqual(opened, []);
  });

  it('keeps watching through a read that fails, and opens the link once it can', async () => {
    const opened: string[] = [];
    let polls = 0;
    const w = watchConfirmation({
      ...quick,
      find: async () => {
        polls += 1;
        if (polls === 1) throw new Error('EBUSY');
        return '/signup/confirmar?t=y';
      },
      open: async (link) => void opened.push(link),
    });
    await w.done;
    assert.deepEqual(opened, ['/signup/confirmar?t=y']);
  });

  it('settles even when opening the link fails, and says so', async () => {
    const w = watchConfirmation({
      ...quick,
      find: async () => '/signup/confirmar?t=z',
      open: async () => {
        throw new Error('page closed');
      },
    });
    assert.deepEqual(await w.done, { opened: null, error: 'page closed' });
  });
});

describe('evaluateSuccess with no business', () => {
  it('fails every check at once when the actor never signed up', async () => {
    const results = await evaluateSuccess(null, SIGNUP.success, 60_000);
    assert.deepEqual(results, [{ check: 'venta-efectivo', passed: false }]);
  });
});
