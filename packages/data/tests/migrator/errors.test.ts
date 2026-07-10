/**
 * Migration error types tests.
 */

import { describe, expect, it } from 'vitest';
import { MigrationError, SchemaVersionError } from '../../src/migrator/errors.js';

describe('MigrationError', () => {
  it('sets migrationTag and message from Error cause', () => {
    const err = new MigrationError('0005_users', new Error('syntax error'));
    expect(err.migrationTag).toBe('0005_users');
    expect(err.message).toContain('0005_users');
    expect(err.message).toContain('syntax error');
    expect(err.name).toBe('MigrationError');
  });

  it('handles non-Error cause', () => {
    const err = new MigrationError('0005_users', 'string error');
    expect(err.message).toContain('string error');
    expect(err.cause).toBe('string error');
  });
});

describe('SchemaVersionError', () => {
  it('sets dbVersion and appVersion', () => {
    const err = new SchemaVersionError(5, 3);
    expect(err.dbVersion).toBe(5);
    expect(err.appVersion).toBe(3);
    expect(err.name).toBe('SchemaVersionError');
    expect(err.message).toContain('5');
    expect(err.message).toContain('3');
  });
});
