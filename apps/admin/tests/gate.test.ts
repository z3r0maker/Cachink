import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  decideAccess,
  isMachinePath,
  isPublicPath,
  mfaPathFor,
  toAal,
  type GateInput,
} from '@/server/gate';

const STAFF_AT_AAL2: GateInput = {
  path: '/tenants',
  staffId: '01J9Z6Q4ZC9R7Y8V2M3N4P5Q6R',
  isStaff: true,
  aal: 'aal2',
  enrolled: true,
};
const ENROLLED_AT_AAL1: GateInput = { ...STAFF_AT_AAL2, aal: 'aal1' };
const NEW_AT_AAL1: GateInput = { ...ENROLLED_AT_AAL1, enrolled: false };

describe('decideAccess', () => {
  it('lets an allowlisted staff member at AAL2 through', () => {
    assert.deepEqual(decideAccess(STAFF_AT_AAL2), { kind: 'allow' });
  });

  it('sends an anonymous visitor to /login', () => {
    const d = decideAccess({ ...STAFF_AT_AAL2, staffId: null, isStaff: false, aal: null });
    assert.deepEqual(d, { kind: 'redirect', to: '/login' });
  });

  it('refuses a session whose staff member is not on the allowlist, even at AAL2', () => {
    assert.deepEqual(decideAccess({ ...STAFF_AT_AAL2, isStaff: false }), { kind: 'forbidden' });
  });

  it('sends an enrolled staff member at AAL1 to /mfa/verify', () => {
    assert.deepEqual(decideAccess(ENROLLED_AT_AAL1), { kind: 'redirect', to: '/mfa/verify' });
  });

  it('sends a staff member with no authenticator yet to /mfa/enroll', () => {
    assert.deepEqual(decideAccess(NEW_AT_AAL1), { kind: 'redirect', to: '/mfa/enroll' });
  });

  it('treats a missing AAL as AAL1, never as AAL2', () => {
    const d = decideAccess({ ...STAFF_AT_AAL2, aal: null });
    assert.deepEqual(d, { kind: 'redirect', to: '/mfa/verify' });
  });

  it('lets an AAL1 staff member reach exactly the MFA step they need', () => {
    assert.deepEqual(decideAccess({ ...ENROLLED_AT_AAL1, path: '/mfa/verify' }), { kind: 'allow' });
    assert.deepEqual(decideAccess({ ...NEW_AT_AAL1, path: '/mfa/enroll' }), { kind: 'allow' });
  });

  it('never offers enrolment to someone already enrolled (no silent factor reset)', () => {
    const d = decideAccess({ ...ENROLLED_AT_AAL1, path: '/mfa/enroll' });
    assert.deepEqual(d, { kind: 'redirect', to: '/mfa/verify' });
  });

  it('does not let a not-yet-enrolled member skip enrolment via /mfa/verify', () => {
    const d = decideAccess({ ...NEW_AT_AAL1, path: '/mfa/verify' });
    assert.deepEqual(d, { kind: 'redirect', to: '/mfa/enroll' });
  });

  it('does not let a non-staff session reach MFA (no enrolment for strangers)', () => {
    const d = decideAccess({ ...NEW_AT_AAL1, path: '/mfa/enroll', isStaff: false });
    assert.deepEqual(d, { kind: 'forbidden' });
  });

  it('sends an AAL2 staff member away from the MFA pages to the console', () => {
    for (const path of ['/mfa/verify', '/mfa/enroll']) {
      assert.deepEqual(decideAccess({ ...STAFF_AT_AAL2, path }), { kind: 'redirect', to: '/' });
    }
  });

  it('always serves the public pages, whoever is asking', () => {
    for (const path of ['/login', '/prohibido']) {
      const d = decideAccess({ path, staffId: null, isStaff: false, aal: null, enrolled: false });
      assert.deepEqual(d, { kind: 'allow' }, path);
    }
  });

  it('does not treat a path that merely starts like a public one as public', () => {
    assert.equal(isPublicPath('/login-admin'), false);
    assert.equal(isPublicPath('/login'), true);
  });
});

describe('mfaPathFor', () => {
  it('is /mfa/enroll with no authenticator, /mfa/verify with one', () => {
    assert.equal(mfaPathFor(false), '/mfa/enroll');
    assert.equal(mfaPathFor(true), '/mfa/verify');
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

describe('isMachinePath', () => {
  it('matches the ingestion and cron API routes only', () => {
    assert.equal(isMachinePath('/api/internal/support-items'), true);
    assert.equal(isMachinePath('/api/cron/digest'), true);
  });

  it('does not match console pages or look-alike prefixes', () => {
    for (const p of ['/inbox', '/api/internal', '/api/cronx/digest', '/apis/cron/digest', '/']) {
      assert.equal(isMachinePath(p), false, p);
    }
  });

  it('does not match a traversal out of the prefix', () => {
    assert.equal(isMachinePath('/api/cron/../../inbox'), false);
  });
});
