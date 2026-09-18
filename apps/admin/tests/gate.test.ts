import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { decideAccess, isPublicPath, mfaStep, toAal, type GateInput } from '@/server/gate';

const STAFF_AT_AAL2: GateInput = {
  path: '/tenants',
  userId: '4f1c2b9e-8a57-4c1e-9d0b-6c2f1e3a7b55',
  isStaff: true,
  aal: 'aal2',
};

describe('decideAccess', () => {
  it('lets an allowlisted staff member at AAL2 through', () => {
    assert.deepEqual(decideAccess(STAFF_AT_AAL2), { kind: 'allow' });
  });

  it('sends an anonymous visitor to /login', () => {
    const d = decideAccess({ ...STAFF_AT_AAL2, userId: null, isStaff: false, aal: null });
    assert.deepEqual(d, { kind: 'redirect', to: '/login' });
  });

  it('refuses a signed-in user who is not on the allowlist, even at AAL2', () => {
    assert.deepEqual(decideAccess({ ...STAFF_AT_AAL2, isStaff: false }), { kind: 'forbidden' });
  });

  it('sends an allowlisted user at AAL1 to /mfa', () => {
    const d = decideAccess({ ...STAFF_AT_AAL2, aal: 'aal1' });
    assert.deepEqual(d, { kind: 'redirect', to: '/mfa' });
  });

  it('treats a missing AAL claim as AAL1, never as AAL2', () => {
    const d = decideAccess({ ...STAFF_AT_AAL2, aal: null });
    assert.deepEqual(d, { kind: 'redirect', to: '/mfa' });
  });

  it('lets an AAL1 staff member reach /mfa itself', () => {
    const d = decideAccess({ ...STAFF_AT_AAL2, path: '/mfa', aal: 'aal1' });
    assert.deepEqual(d, { kind: 'allow' });
  });

  it('does not let a non-staff user reach /mfa (no enrolment for strangers)', () => {
    const d = decideAccess({ ...STAFF_AT_AAL2, path: '/mfa', isStaff: false, aal: 'aal1' });
    assert.deepEqual(d, { kind: 'forbidden' });
  });

  it('sends an AAL2 staff member away from /mfa to the console', () => {
    const d = decideAccess({ ...STAFF_AT_AAL2, path: '/mfa' });
    assert.deepEqual(d, { kind: 'redirect', to: '/' });
  });

  it('always serves the public pages, whoever is asking', () => {
    for (const path of ['/login', '/prohibido']) {
      const d = decideAccess({ path, userId: null, isStaff: false, aal: null });
      assert.deepEqual(d, { kind: 'allow' }, path);
    }
  });

  it('does not treat a path that merely starts like a public one as public', () => {
    assert.equal(isPublicPath('/login-admin'), false);
    assert.equal(isPublicPath('/login'), true);
  });
});

describe('mfaStep', () => {
  it('asks to enrol when there is no verified factor', () => {
    assert.equal(mfaStep({ aal: 'aal1', verifiedFactors: 0 }), 'enrol');
  });

  it('asks for a code when a verified factor exists', () => {
    assert.equal(mfaStep({ aal: 'aal1', verifiedFactors: 1 }), 'challenge');
  });

  it('is done at AAL2', () => {
    assert.equal(mfaStep({ aal: 'aal2', verifiedFactors: 1 }), 'done');
  });
});

describe('toAal', () => {
  it('accepts the two levels and nothing else', () => {
    assert.equal(toAal('aal2'), 'aal2');
    assert.equal(toAal('aal1'), 'aal1');
    assert.equal(toAal('aal3'), null);
    assert.equal(toAal(undefined), null);
  });
});
