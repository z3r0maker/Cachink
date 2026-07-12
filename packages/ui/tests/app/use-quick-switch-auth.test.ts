/**
 * useQuickSwitchAuth tests — auth gate logic.
 *
 * Tests the maskEmail utility and basic hook structure.
 */

import { describe, expect, it } from 'vitest';
import { maskEmail } from '../../src/app/use-quick-switch-auth';

describe('maskEmail', () => {
  it('masks a standard email', () => {
    expect(maskEmail('alice@gmail.com')).toBe('a***@g***.com');
  });

  it('masks email with subdomain', () => {
    expect(maskEmail('bob@mail.example.co.uk')).toBe('b***@m***.example.co.uk');
  });

  it('handles short local part', () => {
    expect(maskEmail('a@b.com')).toBe('a***@b***.com');
  });

  it('returns *** for invalid email without @', () => {
    expect(maskEmail('invalid')).toBe('***');
  });

  it('handles empty local part', () => {
    const result = maskEmail('@domain.com');
    expect(result).toBe('***');
  });
});
