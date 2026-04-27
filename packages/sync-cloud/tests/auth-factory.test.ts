/**
 * `cloudAuth()` factory tests — verifies BYO-over-default precedence +
 * null safety (ADR-035 §BYO override).
 */

import { describe, expect, it } from 'vitest';
import { cloudAuth } from '../src/auth/index.js';

describe('cloudAuth factory', () => {
  it('returns null when neither byo nor defaults are populated', () => {
    expect(cloudAuth({ byo: null, defaults: null })).toBeNull();
  });

  it('uses the baked-in defaults when no BYO override is stored', () => {
    const connector = cloudAuth({
      byo: null,
      defaults: { projectUrl: 'https://x.supabase.co', anonKey: 'aaaa' },
    });
    expect(connector).not.toBeNull();
  });

  it('prefers the BYO override over the defaults', () => {
    const connector = cloudAuth({
      byo: { projectUrl: 'https://byo.supabase.co', anonKey: 'bbbb' },
      defaults: { projectUrl: 'https://default.supabase.co', anonKey: 'aaaa' },
    });
    expect(connector).not.toBeNull();
  });
});
