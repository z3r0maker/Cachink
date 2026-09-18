import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { parseStaffArgs, readPassword, UsageError } from '../scripts/staff-cli';

describe('parseStaffArgs', () => {
  it('parses create, lower-casing the email', () => {
    assert.deepEqual(
      parseStaffArgs(['create', '--email', 'Ana@Xangarro.MX', '--nombre', 'Ana López']),
      {
        command: 'create',
        email: 'ana@xangarro.mx',
        nombre: 'Ana López',
      },
    );
  });

  it('parses set-password with and without --reset-totp', () => {
    assert.deepEqual(parseStaffArgs(['set-password', '--email', 'a@x.mx']), {
      command: 'set-password',
      email: 'a@x.mx',
      resetTotp: false,
    });
    assert.equal(
      (
        parseStaffArgs(['set-password', '--email', 'a@x.mx', '--reset-totp']) as {
          resetTotp: boolean;
        }
      ).resetTotp,
      true,
    );
  });

  it('refuses an unknown or missing command', () => {
    assert.throws(() => parseStaffArgs(['delete', '--email', 'a@x.mx']), UsageError);
    assert.throws(() => parseStaffArgs([]), UsageError);
  });

  it('refuses a missing or malformed email, and create without a nombre', () => {
    assert.throws(() => parseStaffArgs(['create', '--nombre', 'Ana']), UsageError);
    assert.throws(
      () => parseStaffArgs(['create', '--email', 'ana', '--nombre', 'Ana']),
      UsageError,
    );
    assert.throws(() => parseStaffArgs(['create', '--email', 'a@x.mx']), UsageError);
  });

  it('refuses a password passed as an argument (positional junk)', () => {
    assert.throws(() => parseStaffArgs(['create', 'hunter2', '--email', 'a@x.mx']), UsageError);
  });
});

describe('readPassword', () => {
  it('drops one trailing newline from echo', () => {
    assert.equal(readPassword('una-contraseña-larga\n'), 'una-contraseña-larga');
  });

  it('keeps inner and leading spaces', () => {
    assert.equal(readPassword('  frase con espacios '), '  frase con espacios ');
  });

  it('refuses fewer than 12 characters', () => {
    assert.throws(() => readPassword('corta\n'), UsageError);
    assert.throws(() => readPassword(''), UsageError);
  });

  it('refuses more than bcrypt’s 72 bytes', () => {
    assert.throws(() => readPassword('ñ'.repeat(40)), UsageError);
  });
});
