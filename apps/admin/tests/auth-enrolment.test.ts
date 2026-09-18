import assert from 'node:assert/strict';
import {
  hashRecoveryCode,
  openSecret,
  sealSecret,
  TOTP_PER_ACCOUNT,
  totpCode,
  totpStep,
} from '@xangarro/auth-core';
import { describe, it } from 'vitest';

import { confirmEnrolment, prepareEnrolment } from '@/server/auth/enrolment';
import type { StaffSession } from '@/server/auth/ports';

import { memoryAuth, newStaff, STAFF_ID } from './support/auth';

const SESSION: StaffSession = {
  staffId: STAFF_ID,
  email: 'ana@xangarro.mx',
  nombre: 'Ana',
  aal: 'aal1',
  enrolled: false,
};

describe('prepareEnrolment', () => {
  it('creates a seed, stores it sealed and bound to the staff id, and builds the URI', async () => {
    const staff = await newStaff();
    const { deps } = memoryAuth([staff]);
    const view = await prepareEnrolment(deps, SESSION);
    assert.ok(view);
    assert.match(view.secret, /^[A-Z2-7]{32}$/);
    assert.ok(view.uri.startsWith('otpauth://totp/Xangarro%20Consola:ana%40xangarro.mx?'));
    assert.doesNotMatch(staff.secretEnc ?? '', new RegExp(view.secret));
    assert.equal(openSecret(deps.totpKey, staff.secretEnc ?? '', STAFF_ID), view.secret);
  });

  it('shows the same seed on reload, so a scanned QR stays valid', async () => {
    const { deps } = memoryAuth([await newStaff()]);
    const a = await prepareEnrolment(deps, SESSION);
    const b = await prepareEnrolment(deps, SESSION);
    assert.equal(a?.secret, b?.secret);
  });

  it('offers nothing to someone already enrolled', async () => {
    const { deps } = memoryAuth([
      await newStaff({ enrolledAt: '2026-09-01T00:00:00Z', secretEnc: 'x' }),
    ]);
    assert.equal(await prepareEnrolment(deps, SESSION), null);
  });

  it('offers nothing to a revoked staff member', async () => {
    const { deps } = memoryAuth([await newStaff({ revoked: true })]);
    assert.equal(await prepareEnrolment(deps, SESSION), null);
  });

  it('replaces a pending seed that no longer opens (key rotated)', async () => {
    const staff = await newStaff({ secretEnc: 'v1.garbage.garbage.garbage' });
    const { deps } = memoryAuth([staff]);
    const view = await prepareEnrolment(deps, SESSION);
    assert.ok(view);
    assert.equal(openSecret(deps.totpKey, staff.secretEnc ?? '', STAFF_ID), view.secret);
  });
});

describe('confirmEnrolment', () => {
  async function pending() {
    const staff = await newStaff();
    const auth = memoryAuth([staff]);
    const view = await prepareEnrolment(auth.deps, SESSION);
    return { ...auth, staff, secret: view?.secret ?? '' };
  }

  it('enrols on the current code, stores ten hashed recovery codes and returns them once', async () => {
    const { deps, staff, secret, audit, sessionRows } = await pending();
    const r = await confirmEnrolment(deps, SESSION, totpCode(secret, deps.now()));
    assert.equal(r.kind, 'ok');
    const codes = r.kind === 'ok' ? r.recoveryCodes : [];
    assert.equal(codes.length, 10);
    assert.deepEqual(staff.recoveryCodes, codes.map(hashRecoveryCode));
    assert.ok(staff.enrolledAt);
    assert.equal(staff.lastStep, totpStep(deps.now()));
    assert.equal(sessionRows.size, 0, 'the session is not raised here — /mfa/verify does that');
    assert.deepEqual(audit.at(-1), {
      staffId: STAFF_ID,
      action: 'auth.enrolar_totp',
      payload: { codigos_recuperacion: 10 },
    });
  });

  it('refuses a wrong code and leaves the member unenrolled', async () => {
    const { deps, staff, audit } = await pending();
    assert.deepEqual(await confirmEnrolment(deps, SESSION, '000000'), { kind: 'failed' });
    assert.equal(staff.enrolledAt, null);
    assert.equal(audit.at(-1)?.action, 'auth.segundo_factor_fallido');
  });

  it('refuses when there is no pending seed', async () => {
    const { deps } = memoryAuth([await newStaff()]);
    assert.deepEqual(await confirmEnrolment(deps, SESSION, '123456'), { kind: 'failed' });
  });

  it('refuses a second enrolment over an existing one', async () => {
    const { deps, staff, secret } = await pending();
    await confirmEnrolment(deps, SESSION, totpCode(secret, deps.now()));
    const again = await confirmEnrolment(deps, SESSION, totpCode(secret, deps.now()));
    assert.deepEqual(again, { kind: 'failed' });
    assert.equal(staff.recoveryCodes.length, 10);
  });

  it('locks after five wrong codes', async () => {
    const { deps, secret } = await pending();
    for (let i = 0; i < TOTP_PER_ACCOUNT.max - 1; i++)
      await confirmEnrolment(deps, SESSION, '000000');
    const fifth = await confirmEnrolment(deps, SESSION, '000000');
    assert.deepEqual(fifth, { kind: 'locked', wait: TOTP_PER_ACCOUNT.lockout });
    const right = await confirmEnrolment(deps, SESSION, totpCode(secret, deps.now()));
    assert.equal(right.kind, 'locked');
  });

  it('throws on a seed sealed for someone else (copied row)', async () => {
    const { deps, staff } = await pending();
    staff.secretEnc = sealSecret(deps.totpKey, 'JBSWY3DPEHPK3PXP', 'otro-staff');
    await assert.rejects(confirmEnrolment(deps, SESSION, '123456'), {
      code: 'INVALID_SEALED_SECRET',
    });
  });
});
