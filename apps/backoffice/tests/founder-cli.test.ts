import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { parseFounderArgs } from '../scripts/founder-cli';
import { UsageError } from '../scripts/staff-cli';

/**
 * The operator CLI that names a staff member as Fundador 1 or 2 (E-01,
 * ADR-124 §1). The console itself never writes corp.founders.
 */
describe('parseFounderArgs', () => {
  it('reads add with email, numero, nombre and an optional RFC', () => {
    assert.deepEqual(
      parseFounderArgs(['add', '--email', 'Ana@MEXIA.mx', '--numero', '1', '--nombre', 'Ana']),
      { command: 'add', email: 'ana@mexia.mx', numero: 1, nombre: 'Ana', rfc: null },
    );
    assert.equal(
      parseFounderArgs([
        'add',
        '--email',
        'b@mexia.mx',
        '--numero',
        '2',
        '--nombre',
        'Beto',
        '--rfc',
        'bear800101ab1',
      ]).rfc,
      'BEAR800101AB1',
    );
  });

  it('refuses a founder number other than 1 or 2', () => {
    assert.throws(
      () => parseFounderArgs(['add', '--email', 'a@mexia.mx', '--numero', '3', '--nombre', 'A']),
      UsageError,
    );
  });

  it('refuses an RFC that is not 12 or 13 characters of RFC shape', () => {
    assert.throws(
      () =>
        parseFounderArgs([
          'add',
          '--email',
          'a@mexia.mx',
          '--numero',
          '1',
          '--nombre',
          'A',
          '--rfc',
          'XYZ',
        ]),
      UsageError,
    );
  });

  it('refuses an unknown command and a missing email', () => {
    assert.throws(() => parseFounderArgs(['remove', '--email', 'a@mexia.mx']), UsageError);
    assert.throws(() => parseFounderArgs(['add', '--numero', '1', '--nombre', 'A']), UsageError);
  });
});
