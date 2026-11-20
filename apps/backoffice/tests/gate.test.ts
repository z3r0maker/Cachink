import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { decideAccess, isMachinePath, isPublicPath, type GateInput } from '@/server/gate';

/**
 * The gate with passkeys (ADR-160): one tap opens a full session, so a
 * request either has a live staff session or it does not. No AAL1 step, no
 * `/mfa/*` pages.
 */
const STAFF: GateInput = { path: '/inbox', staffId: 'staff-1', isStaff: true };
const NOBODY: GateInput = { path: '/inbox', staffId: null, isStaff: false };

describe('decideAccess', () => {
  it('lets a live staff session through', () => {
    assert.deepEqual(decideAccess(STAFF), { kind: 'allow' });
  });

  it('sends a visitor without a session to /login', () => {
    assert.deepEqual(decideAccess(NOBODY), { kind: 'redirect', to: '/login' });
  });

  it('forbids a session whose staff row is no longer live', () => {
    assert.deepEqual(decideAccess({ ...STAFF, isStaff: false }), { kind: 'forbidden' });
  });

  it('no longer knows the MFA pages: they are ordinary gated paths', () => {
    for (const path of ['/mfa/verify', '/mfa/enroll']) {
      assert.deepEqual(decideAccess({ ...NOBODY, path }), { kind: 'redirect', to: '/login' });
    }
  });

  it('always serves the public pages, whoever is asking', () => {
    for (const path of ['/login', '/prohibido', '/acceso/registrar']) {
      assert.deepEqual(decideAccess({ ...NOBODY, path }), { kind: 'allow' }, path);
    }
  });

  it('does not treat a path that merely starts like a public one as public', () => {
    assert.equal(isPublicPath('/login-admin'), false);
    assert.equal(isPublicPath('/acceso/registrar/otra'), false);
    assert.equal(isPublicPath('/acceso'), false);
    assert.equal(isPublicPath('/login'), true);
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
