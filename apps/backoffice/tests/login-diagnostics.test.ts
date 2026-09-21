import assert from 'node:assert/strict';
import { LOGIN_PER_EMAIL } from '@xangarro/auth-core';
import { describe, it } from 'vitest';

import { loginRefusalMessage } from '@/server/auth/login-message';
import type { RefusedSignIn } from '@/server/auth/login-message';
import { dbFingerprint } from '@/server/db/fingerprint';

const DB = 'xangarro_admin.jijggmddzacwcldwnmzj@aws-0-us-west-2.pooler.supabase.com:5432/postgres';
const off = { on: false, db: DB };
const on = { on: true, db: DB };

const failed = (reason: 'no-account' | 'no-password-set' | 'wrong-password'): RefusedSignIn => ({
  kind: 'failed',
  reason,
});

describe('loginRefusalMessage', () => {
  it('shows one identical generic sentence for every credential failure while diagnostics are off', () => {
    // SEC-AUTH-02, at the banner: an unknown address and a wrong password
    // must stay indistinguishable to whoever is typing at the form.
    const messages = [
      loginRefusalMessage(failed('no-account'), off),
      loginRefusalMessage(failed('no-password-set'), off),
      loginRefusalMessage(failed('wrong-password'), off),
    ];
    assert.deepEqual(messages, [
      'Correo o contraseña incorrectos.',
      'Correo o contraseña incorrectos.',
      'Correo o contraseña incorrectos.',
    ]);
  });

  it('names the missing account and the database when diagnostics are on', () => {
    assert.equal(
      loginRefusalMessage(failed('no-account'), on),
      `Correo o contraseña incorrectos — ese correo no existe en ${DB}.`,
    );
  });

  it('says the account has no password yet, so it is not read as a typo', () => {
    assert.equal(
      loginRefusalMessage(failed('no-password-set'), on),
      `Correo o contraseña incorrectos — esa cuenta aún no tiene contraseña (${DB}).`,
    );
  });

  it('separates a known address from a wrong password when diagnostics are on', () => {
    assert.equal(
      loginRefusalMessage(failed('wrong-password'), on),
      `Correo o contraseña incorrectos — el correo existe; la contraseña no coincide (${DB}).`,
    );
  });

  it('keeps the empty-fields and lockout messages regardless of the flag', () => {
    for (const diag of [off, on]) {
      assert.equal(
        loginRefusalMessage({ kind: 'invalid', reason: 'empty-input' }, diag),
        'Escribe tu correo y tu contraseña.',
      );
      assert.match(
        loginRefusalMessage({ kind: 'locked', wait: LOGIN_PER_EMAIL.lockout }, diag),
        /^Demasiados intentos\./,
      );
    }
  });
});

describe('dbFingerprint', () => {
  it('reads user, host and database — never the password', () => {
    const url =
      'postgres://user%40x.sfx:se-cr-et@aws-0-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require';
    const fp = dbFingerprint(url);
    assert.equal(fp, 'user@x.sfx@aws-0-us-west-2.pooler.supabase.com:6543/postgres');
    assert.ok(!fp.includes('se-cr-et'));
  });

  it('says so when the URL is missing or unparseable', () => {
    assert.equal(dbFingerprint(undefined), 'sin DATABASE_URL');
    assert.equal(dbFingerprint('not a url'), 'DATABASE_URL no parseable');
  });
});
