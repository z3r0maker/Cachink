/**
 * checkSchemaCompatibility tests.
 */

import { describe, expect, it } from 'vitest';
import {
  checkSchemaCompatibility,
  SCHEMA_VERSION,
} from '../../src/migrator/schema-version.js';

describe('checkSchemaCompatibility', () => {
  it('returns ok when versions match', () => {
    expect(checkSchemaCompatibility(1, 1)).toEqual({ status: 'ok' });
  });

  it('returns needs_migration when db is behind app', () => {
    expect(checkSchemaCompatibility(0, 1)).toEqual({ status: 'needs_migration' });
  });

  it('returns app_too_old when db is ahead of app', () => {
    expect(checkSchemaCompatibility(2, 1)).toEqual({
      status: 'app_too_old',
      dbVersion: 2,
      appVersion: 1,
    });
  });

  it('returns ok when both are zero', () => {
    expect(checkSchemaCompatibility(0, 0)).toEqual({ status: 'ok' });
  });
});

describe('SCHEMA_VERSION', () => {
  it('is a positive integer', () => {
    expect(SCHEMA_VERSION).toBeGreaterThan(0);
    expect(Number.isInteger(SCHEMA_VERSION)).toBe(true);
  });
});
