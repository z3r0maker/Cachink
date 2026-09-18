import assert from 'node:assert/strict';
import { hashToken, mintToken, TOTP_PER_ACCOUNT, totpCode } from '@xangarro/auth-core';
import { describe, it } from 'vitest';

import { AAL2_TTL_SECONDS } from '@/server/auth/config';
import { confirmEnrolment, prepareEnrolment } from '@/server/auth/enrolment';
import type { StaffSession } from '@/server/auth/ports';
import { verifySecondFactor } from '@/server/auth/second-factor';

import { memoryAuth, newStaff, STAFF_ID } from './support/auth';

const SESSION: StaffSession = {
  staffId: STAFF_ID,
  email: 'ana@xangarro.mx',
  nombre: 'Ana',
  aal: 'aal1',
  enrolled: true,
};

/** An enrolled member, 30 s after enrolment (so the next code is a fresh step). */
async function enrolled() {
  const staff = await newStaff();
  const now = { date: new Date('2026-09-18T12:00:00Z') };
  const auth = memoryAuth([staff], now);
  const view = await prepareEnrolment(auth.deps, { ...SESSION, enrolled: false });
  const secret = view?.secret ?? '';
  const r = await confirmEnrolment(auth.deps, SESSION, totpCode(secret, now.date));
  now.date = new Date(now.date.getTime() + 30_000);
  const oldToken = mintToken();
  await auth.deps.sessions.open(hashToken(oldToken), { staffId: STAFF_ID, aal: 'aal1' }, 900);
  const codes = r.kind === 'ok' ? r.recoveryCodes : [];
  return { ...auth, staff, secret, codes, oldToken };
}

describe('verifySecondFactor — TOTP', () => {
  it('replaces the AAL1 session with a new AAL2 one and audits it', async () => {
    const { deps, secret, oldToken, sessionRows, audit } = await enrolled();
    const r = await verifySecondFactor(deps, SESSION, totpCode(secret, deps.now()), oldToken);
    assert.equal(r.kind, 'ok');
    const fresh = sessionRows.get(hashToken(r.kind === 'ok' ? r.token : 'x'));
    assert.deepEqual(fresh, {
      staffId: STAFF_ID,
      aal: 'aal2',
      ttl: AAL2_TTL_SECONDS,
      revoked: false,
    });
    assert.equal(sessionRows.get(hashToken(oldToken))?.revoked, true);
    assert.equal(audit.at(-1)?.action, 'auth.verificar_totp');
  });

  it('refuses the enrolment code replayed within its window', async () => {
    const { deps, secret, oldToken } = await enrolled();
    const enrolmentCode = totpCode(secret, new Date(deps.now().getTime() - 30_000));
    assert.deepEqual(await verifySecondFactor(deps, SESSION, enrolmentCode, oldToken), {
      kind: 'failed',
    });
  });

  it('refuses the same code twice', async () => {
    const { deps, secret, oldToken } = await enrolled();
    const code = totpCode(secret, deps.now());
    await verifySecondFactor(deps, SESSION, code, oldToken);
    assert.deepEqual(await verifySecondFactor(deps, SESSION, code, undefined), { kind: 'failed' });
  });

  it('refuses a wrong code, keeps the AAL1 session, and audits the failure', async () => {
    const { deps, oldToken, sessionRows, audit } = await enrolled();
    assert.deepEqual(await verifySecondFactor(deps, SESSION, '000000', oldToken), {
      kind: 'failed',
    });
    assert.equal(sessionRows.get(hashToken(oldToken))?.revoked, false);
    assert.deepEqual(audit.at(-1)?.payload, { paso: 'verificar', bloqueo: false });
  });

  it('refuses a member who never enrolled', async () => {
    const { deps } = memoryAuth([await newStaff()]);
    assert.deepEqual(await verifySecondFactor(deps, SESSION, '123456', undefined), {
      kind: 'failed',
    });
  });

  it('locks after five wrong codes, then refuses even the right one', async () => {
    const { deps, secret, oldToken } = await enrolled();
    for (let i = 0; i < TOTP_PER_ACCOUNT.max - 1; i++)
      await verifySecondFactor(deps, SESSION, '000000', oldToken);
    const fifth = await verifySecondFactor(deps, SESSION, '000000', oldToken);
    assert.deepEqual(fifth, { kind: 'locked', wait: TOTP_PER_ACCOUNT.lockout });
    const right = await verifySecondFactor(deps, SESSION, totpCode(secret, deps.now()), oldToken);
    assert.equal(right.kind, 'locked');
  });
});

describe('verifySecondFactor — recovery codes', () => {
  it('accepts an unused recovery code once, and audits how many are left', async () => {
    const { deps, codes, oldToken, staff, audit } = await enrolled();
    const r = await verifySecondFactor(deps, SESSION, codes[2] ?? '', oldToken);
    assert.equal(r.kind, 'ok');
    assert.equal(staff.recoveryCodes.length, 9);
    assert.deepEqual(audit.at(-1), {
      staffId: STAFF_ID,
      action: 'auth.usar_codigo_recuperacion',
      payload: { restantes: 9 },
    });
  });

  it('refuses a recovery code already used', async () => {
    const { deps, codes, oldToken } = await enrolled();
    await verifySecondFactor(deps, SESSION, codes[0] ?? '', oldToken);
    assert.deepEqual(await verifySecondFactor(deps, SESSION, codes[0] ?? '', undefined), {
      kind: 'failed',
    });
  });

  it('refuses a code-shaped value that was never issued', async () => {
    const { deps, oldToken, staff } = await enrolled();
    const r = await verifySecondFactor(deps, SESSION, 'aaaa-bbbb-cccc-dddd', oldToken);
    assert.deepEqual(r, { kind: 'failed' });
    assert.equal(staff.recoveryCodes.length, 10);
  });

  it('accepts a recovery code typed in capitals without dashes', async () => {
    const { deps, codes, oldToken } = await enrolled();
    const typed = (codes[5] ?? '').replace(/-/g, '').toUpperCase();
    assert.equal((await verifySecondFactor(deps, SESSION, typed, oldToken)).kind, 'ok');
  });
});
