import { describe, it, expect } from 'vitest';
import { AppConfigSchema } from '../../src/entities/index.js';

describe('AppConfigSchema', () => {
  it('accepts a valid key/value pair', () => {
    const parsed = AppConfigSchema.parse({
      key: 'mode',
      value: '"local-standalone"',
    });
    expect(parsed.key).toBe('mode');
  });

  it('accepts a complex JSON-encoded value', () => {
    const parsed = AppConfigSchema.parse({
      key: 'notification-prefs',
      value: '{"lowStock":true,"dailyDigest":false}',
    });
    expect(parsed.value).toContain('lowStock');
  });

  it('rejects an empty key', () => {
    expect(() => AppConfigSchema.parse({ key: '', value: 'x' })).toThrow();
  });

  it('rejects a missing value field', () => {
    expect(() => AppConfigSchema.parse({ key: 'mode' })).toThrow();
  });

  it('rejects non-string value types', () => {
    expect(() => AppConfigSchema.parse({ key: 'mode', value: 42 })).toThrow();
  });
});
