import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { ADMIN_COOKIE, sessionCookieOptions, ttlFor } from '@/server/auth/config';
import { groupKey, qrDataUri } from '@/server/auth/qr';

/**
 * 0008 checked as text (no Postgres in this unit run; it was also applied to
 * a throwaway Postgres on top of data-pg's migrations — see N-05's progress
 * line). What it must and must not grant is the security boundary.
 */
const code = readFileSync(
  new URL('../src/server/db/migrations/0008_staff_inhouse_auth.sql', import.meta.url),
  'utf8',
).replace(/--.*$/gm, '');

describe('0008_staff_inhouse_auth.sql', () => {
  it('lets the console write only the second-factor columns — never a password', () => {
    const [grant] = [...code.matchAll(/GRANT UPDATE \(([^)]*)\)\s+ON public\.staff_members/g)];
    assert.ok(grant);
    const cols = (grant[1] ?? '').split(',').map((c) => c.trim());
    assert.deepEqual(cols, [
      'totp_secret_enc',
      'totp_enrolled_at',
      'totp_last_step',
      'recovery_codes',
    ]);
    assert.doesNotMatch(code, /GRANT (INSERT|DELETE|ALL)[^;]*staff_members/);
  });

  it('gives sessions no DELETE, and hides them from the portal role', () => {
    assert.match(code, /GRANT SELECT, INSERT, UPDATE ON public\.staff_sessions TO xangarro_admin/);
    assert.doesNotMatch(code, /GRANT[^;]*DELETE[^;]*staff_sessions/);
    assert.match(code, /REVOKE ALL ON public\.staff_sessions FROM xangarro_app/);
    assert.match(code, /ALTER TABLE public\.staff_sessions FORCE ROW LEVEL SECURITY/);
  });

  it('reuses the shared throttle through its functions — no table of its own', () => {
    assert.match(code, /GRANT EXECUTE ON FUNCTION\s+xangarro\.throttle_wait\(text\)/);
    assert.doesNotMatch(code, /CREATE TABLE[^;]*throttle/);
    assert.doesNotMatch(code, /GRANT[^;]*ON (TABLE )?xangarro\.throttle\b/);
  });

  it('stores only token hashes and bounds the assurance level', () => {
    assert.match(
      code,
      /token_hash\s+text PRIMARY KEY CHECK \(token_hash ~ '\^\[0-9a-f\]\{64\}\$'\)/,
    );
    assert.match(code, /CHECK \(aal IN \('aal1', 'aal2'\)\)/);
  });
});

describe('session cookie', () => {
  it('is __Host-, HttpOnly, Secure, SameSite=Strict, Path=/', () => {
    assert.equal(ADMIN_COOKIE, '__Host-xg_admin');
    const o = sessionCookieOptions('aal2');
    assert.deepEqual(
      { ...o, maxAge: undefined },
      {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: undefined,
      },
    );
  });

  it('lives 15 min before the second factor and 12 h after', () => {
    assert.equal(ttlFor('aal1'), 15 * 60);
    assert.equal(ttlFor('aal2'), 12 * 60 * 60);
    assert.equal(sessionCookieOptions('aal1').maxAge, 15 * 60);
  });
});

describe('qr', () => {
  it('renders the URI as an SVG data URI on the server', () => {
    const uri = qrDataUri('otpauth://totp/X:a?secret=JBSWY3DP');
    assert.ok(uri.startsWith('data:image/svg+xml;utf8,'));
    assert.match(decodeURIComponent(uri), /^data:image\/svg\+xml;utf8,<svg /);
  });

  it('groups a key in fours for typing', () => {
    assert.equal(groupKey('ABCDEFGHIJ'), 'ABCD EFGH IJ');
    assert.equal(groupKey(''), '');
  });
});
