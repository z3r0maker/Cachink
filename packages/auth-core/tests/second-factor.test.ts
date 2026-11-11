import { randomBytes } from 'node:crypto';

import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  confirmTotpEnrolment,
  hashRecoveryCode,
  openSecret,
  prepareTotpEnrolment,
  totpCode,
  totpStep,
  useSecondFactor,
  type SecondFactorDeps,
} from '../src/index.js';
import { memorySecondFactorRepo, type MemoryFactorRow } from '../src/testing.js';

const ID = 'user-1';
const LABEL = { account: 'pedro@taqueria.mx', issuer: 'Xangarro' } as const;
const NOW = new Date('2026-11-10T18:00:00Z');

function setup(row: Partial<MemoryFactorRow> | null = {}) {
  const rows = new Map<string, MemoryFactorRow>();
  if (row !== null) {
    rows.set(ID, { secretEnc: null, enrolledAt: null, lastStep: null, recoveryCodes: [], ...row });
  }
  const clock = { date: NOW };
  const deps: SecondFactorDeps = {
    repo: memorySecondFactorRepo(rows),
    totpKey: randomBytes(32),
    now: () => clock.date,
  };
  return { deps, rows, clock, row: () => rows.get(ID) };
}

async function enrolled() {
  const s = setup();
  const view = await prepareTotpEnrolment(s.deps, ID, LABEL);
  assert.ok(view);
  const set = await confirmTotpEnrolment(s.deps, ID, totpCode(view.secret, NOW));
  assert.ok(set);
  return { ...s, secret: view.secret, codes: set.codes };
}

describe('prepareTotpEnrolment', () => {
  it('creates a seed, stores it sealed and bound to the id, and builds the URI', async () => {
    const { deps, row } = setup();
    const view = await prepareTotpEnrolment(deps, ID, LABEL);
    assert.ok(view);
    assert.match(view.secret, /^[A-Z2-7]{32}$/);
    assert.ok(view.uri.startsWith('otpauth://totp/Xangarro:pedro%40taqueria.mx?'));
    assert.doesNotMatch(row()?.secretEnc ?? '', new RegExp(view.secret));
    assert.equal(openSecret(deps.totpKey, row()?.secretEnc ?? '', ID), view.secret);
  });

  it('shows the same seed on reload, so a scanned QR stays valid', async () => {
    const { deps } = setup();
    const a = await prepareTotpEnrolment(deps, ID, LABEL);
    const b = await prepareTotpEnrolment(deps, ID, LABEL);
    assert.equal(a?.secret, b?.secret);
  });

  it('offers nothing to someone already enrolled', async () => {
    const { deps } = setup({ enrolledAt: '2026-09-01T00:00:00Z', secretEnc: 'x' });
    assert.equal(await prepareTotpEnrolment(deps, ID, LABEL), null);
  });

  it('offers nothing when the account is gone', async () => {
    const { deps } = setup(null);
    assert.equal(await prepareTotpEnrolment(deps, ID, LABEL), null);
  });

  it('replaces a pending seed that no longer opens (key rotated)', async () => {
    const { deps, row } = setup({ secretEnc: 'v1.garbage.garbage.garbage' });
    const view = await prepareTotpEnrolment(deps, ID, LABEL);
    assert.ok(view);
    assert.equal(openSecret(deps.totpKey, row()?.secretEnc ?? '', ID), view.secret);
  });

  it('yields to a concurrent enrolment that stored its seed first', async () => {
    const { deps, row } = setup();
    const repo = deps.repo;
    const racing: SecondFactorDeps = {
      ...deps,
      repo: {
        ...repo,
        savePendingSecret: async (id, previous, sealed) => {
          const r = row();
          if (r) r.secretEnc = 'v1.other.tab.won';
          return repo.savePendingSecret(id, previous, sealed);
        },
      },
    };
    assert.equal(await prepareTotpEnrolment(racing, ID, LABEL), null);
  });
});

describe('confirmTotpEnrolment', () => {
  it('enrols on the current code and stores ten hashed recovery codes', async () => {
    const { deps, row } = setup();
    const view = await prepareTotpEnrolment(deps, ID, LABEL);
    const set = await confirmTotpEnrolment(deps, ID, totpCode(view?.secret ?? '', NOW));
    assert.ok(set);
    assert.equal(set.codes.length, 10);
    assert.deepEqual(row()?.recoveryCodes, set.codes.map(hashRecoveryCode));
    assert.ok(row()?.enrolledAt);
    assert.equal(row()?.lastStep, totpStep(NOW));
  });

  it('refuses a wrong code and leaves the account unenrolled', async () => {
    const { deps, row } = setup();
    await prepareTotpEnrolment(deps, ID, LABEL);
    assert.equal(await confirmTotpEnrolment(deps, ID, '000000'), null);
    assert.equal(row()?.enrolledAt, null);
  });

  it('refuses when no seed is pending', async () => {
    const { deps } = setup();
    assert.equal(await confirmTotpEnrolment(deps, ID, '123456'), null);
  });

  it('refuses a second enrolment once enrolled', async () => {
    const { deps, secret } = await enrolled();
    const later = new Date(NOW.getTime() + 60_000);
    assert.equal(await confirmTotpEnrolment(deps, ID, totpCode(secret, later)), null);
  });

  it('refuses input that is not six digits', async () => {
    const { deps } = setup();
    await prepareTotpEnrolment(deps, ID, LABEL);
    assert.equal(await confirmTotpEnrolment(deps, ID, 'abcdef'), null);
  });
});

describe('useSecondFactor', () => {
  it('accepts the next TOTP code and records its step', async () => {
    const { deps, secret, clock, row } = await enrolled();
    clock.date = new Date(NOW.getTime() + 60_000);
    const used = await useSecondFactor(deps, ID, totpCode(secret, clock.date));
    assert.deepEqual(used, { method: 'totp' });
    assert.equal(row()?.lastStep, totpStep(clock.date));
  });

  it('refuses a code whose step was already used (replay)', async () => {
    const { deps, secret } = await enrolled();
    assert.equal(await useSecondFactor(deps, ID, totpCode(secret, NOW)), null);
  });

  it('refuses a wrong code', async () => {
    const { deps } = await enrolled();
    assert.equal(await useSecondFactor(deps, ID, '000000'), null);
  });

  it('refuses everything for an account that never enrolled', async () => {
    const { deps } = setup();
    assert.equal(await useSecondFactor(deps, ID, '123456'), null);
    assert.equal(await useSecondFactor(deps, ID, 'abcd-efgh-ijkl-mnop'), null);
  });

  it('accepts a recovery code once and says how many are left', async () => {
    const { deps, codes } = await enrolled();
    const code = codes[0] ?? '';
    assert.deepEqual(await useSecondFactor(deps, ID, code), { method: 'recovery', left: 9 });
    assert.equal(await useSecondFactor(deps, ID, code), null);
  });

  it('reads a recovery code typed in capitals and without dashes', async () => {
    const { deps, codes } = await enrolled();
    const typed = (codes[1] ?? '').replaceAll('-', '').toUpperCase();
    assert.deepEqual(await useSecondFactor(deps, ID, typed), { method: 'recovery', left: 9 });
  });
});
