import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { ADMIN_COOKIE, relyingParty, sessionCookieOptions } from '@/server/auth/config';

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

const passkeys = readFileSync(
  new URL('../src/server/db/migrations/0023_staff_passkeys.sql', import.meta.url),
  'utf8',
).replace(/--.*$/gm, '');

describe('0023_staff_passkeys.sql', () => {
  it('never lets the console mint, void or delete an enrolment link', () => {
    assert.match(passkeys, /GRANT SELECT ON public\.staff_enrolment_links TO xangarro_admin/);
    assert.match(
      passkeys,
      /GRANT UPDATE \(used_at\) ON public\.staff_enrolment_links TO xangarro_admin/,
    );
    assert.doesNotMatch(passkeys, /GRANT[^;]*(INSERT|DELETE|ALL)[^;]*staff_enrolment_links/);
  });

  it('lets the console add and retire passkeys but never rewrite or delete one', () => {
    assert.match(passkeys, /GRANT SELECT, INSERT ON public\.staff_passkeys TO xangarro_admin/);
    assert.match(
      passkeys,
      /GRANT UPDATE \(counter, last_used_at, revoked_at\) ON public\.staff_passkeys TO xangarro_admin/,
    );
    assert.doesNotMatch(passkeys, /GRANT[^;]*DELETE[^;]*staff_passkeys/);
  });

  it('hides all three tables from the portal role, under forced RLS', () => {
    for (const t of ['staff_passkeys', 'staff_enrolment_links', 'staff_webauthn_challenges']) {
      assert.match(passkeys, new RegExp(`REVOKE ALL ON public\\.${t} FROM xangarro_app`));
      assert.match(passkeys, new RegExp(`ALTER TABLE public\\.${t} FORCE ROW LEVEL SECURITY`));
    }
  });

  it('stores only hashes of link tokens and challenges, and leaves the old columns in place', () => {
    assert.match(
      passkeys,
      /token_hash\s+text PRIMARY KEY CHECK \(token_hash ~ '\^\[0-9a-f\]\{64\}\$'\)/,
    );
    assert.match(
      passkeys,
      /challenge_hash\s+text PRIMARY KEY CHECK \(challenge_hash ~ '\^\[0-9a-f\]\{64\}\$'\)/,
    );
    assert.doesNotMatch(passkeys, /DROP COLUMN/);
  });
});

describe('session cookie', () => {
  it('is __Host-, HttpOnly, Secure, SameSite=Strict, Path=/, 12 h', () => {
    assert.equal(ADMIN_COOKIE, '__Host-xg_admin');
    assert.deepEqual(sessionCookieOptions(), {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 12 * 60 * 60,
    });
  });
});

describe('relyingParty', () => {
  it('binds passkeys to the console host and checks its exact origin', () => {
    assert.deepEqual(relyingParty(undefined), {
      id: 'admin.xangarro.mx',
      origin: 'https://admin.xangarro.mx',
      name: 'Xangarro Consola',
    });
    assert.deepEqual(relyingParty('http://localhost:3200/'), {
      id: 'localhost',
      origin: 'http://localhost:3200',
      name: 'Xangarro Consola',
    });
  });

  it('throws on a base URL that is not a URL', () => {
    assert.throws(() => relyingParty('admin.xangarro.mx'), { code: 'ERR_INVALID_URL' });
  });
});
