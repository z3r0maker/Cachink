import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { enrolmentUrl, parseStaffArgs, UsageError } from '../scripts/staff-cli';

/** The operator CLI with passkeys (ADR-160): no password anywhere, a printed link instead. */
describe('parseStaffArgs', () => {
  it('parses create, lower-casing the email', () => {
    assert.deepEqual(
      parseStaffArgs(['create', '--email', 'Ana@Xangarro.MX', '--nombre', 'Ana López']),
      { command: 'create', email: 'ana@xangarro.mx', nombre: 'Ana López' },
    );
  });

  it('parses passkey-link with and without --reset', () => {
    assert.deepEqual(parseStaffArgs(['passkey-link', '--email', 'a@x.mx']), {
      command: 'passkey-link',
      email: 'a@x.mx',
      reset: false,
    });
    assert.deepEqual(parseStaffArgs(['passkey-link', '--email', 'a@x.mx', '--reset']), {
      command: 'passkey-link',
      email: 'a@x.mx',
      reset: true,
    });
  });

  it('no longer knows set-password, and refuses an unknown or missing command', () => {
    assert.throws(() => parseStaffArgs(['set-password', '--email', 'a@x.mx']), UsageError);
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

  it('refuses positional junk', () => {
    assert.throws(() => parseStaffArgs(['create', 'hunter2', '--email', 'a@x.mx']), UsageError);
  });
});

describe('enrolmentUrl', () => {
  it('puts the token in the fragment of the console’s link page', () => {
    assert.equal(
      enrolmentUrl('tok_en', undefined),
      'https://admin.xangarro.mx/acceso/registrar#tok_en',
    );
    assert.equal(
      enrolmentUrl('tok_en', 'http://localhost:3200/'),
      'http://localhost:3200/acceso/registrar#tok_en',
    );
  });
});
