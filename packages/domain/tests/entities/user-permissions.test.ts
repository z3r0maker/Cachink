import { describe, it, expect } from 'vitest';
import {
  UserPermissionsSchema,
  parseUserPermissions,
  canUserCancelSales,
} from '../../src/entities/index.js';

describe('UserPermissionsSchema', () => {
  it('defaults canCancelSales to false', () => {
    const parsed = UserPermissionsSchema.parse({});
    expect(parsed.canCancelSales).toBe(false);
  });

  it('accepts canCancelSales = true', () => {
    const parsed = UserPermissionsSchema.parse({ canCancelSales: true });
    expect(parsed.canCancelSales).toBe(true);
  });
});

describe('parseUserPermissions', () => {
  it('parses valid JSON', () => {
    const result = parseUserPermissions('{"canCancelSales":true}');
    expect(result.canCancelSales).toBe(true);
  });

  it('returns defaults for empty JSON', () => {
    const result = parseUserPermissions('{}');
    expect(result.canCancelSales).toBe(false);
  });

  it('returns defaults for invalid JSON', () => {
    const result = parseUserPermissions('not json');
    expect(result.canCancelSales).toBe(false);
  });

  it('returns defaults for empty string', () => {
    const result = parseUserPermissions('');
    expect(result.canCancelSales).toBe(false);
  });
});

describe('canUserCancelSales', () => {
  it('allows an operator the portal granted the permission', () => {
    expect(canUserCancelSales({ canCancelSales: true })).toBe(true);
  });

  it('refuses an operator without the permission', () => {
    expect(canUserCancelSales({ canCancelSales: false })).toBe(false);
  });

  it('refuses by default when permissions are missing or corrupt', () => {
    expect(canUserCancelSales(parseUserPermissions('not json'))).toBe(false);
  });
});
