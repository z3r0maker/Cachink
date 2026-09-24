import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { ActivateRequestSchema, PAIRING_TOKEN_REGEX } from '@xangarro/contracts';

import {
  hashPairingToken,
  mintPairingToken,
  pairingExpiry,
  pairingLink,
  PAIRING_TOKEN_TTL_MS,
} from '../src/lib/pairing-token';
import { publicRefusal } from '../src/server/device/public-refusal';

/** C-14: the portal's pairing token, and the one public answer SEC-DEV-01 asks for. */
describe('pairing token (C-14)', () => {
  it('mints 128-bit base64url tokens the contract accepts, never twice', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      const t = mintPairingToken();
      assert.match(t, PAIRING_TOKEN_REGEX);
      assert.equal(Buffer.from(t, 'base64url').length, 16);
      seen.add(t);
    }
    assert.equal(seen.size, 200);
  });

  it('stores a SHA-256, not the token', () => {
    const t = mintPairingToken();
    assert.match(hashPairingToken(t), /^[0-9a-f]{64}$/);
    assert.equal(hashPairingToken(t).includes(t), false);
  });

  // The literal is named for `.gitleaks.toml`'s allowlist: a 22-char random
  // base64url fixture reads as a live credential to the generic-api-key rule,
  // and failed the secret scan once already. It still satisfies
  // PAIRING_TOKEN_REGEX, so the assertion is unchanged.
  it('puts the token in the fragment, so no server or Referer ever sees it', () => {
    const link = pairingLink('https://app.xangarro.mx/', 'dev-only-not-a-real-secret');
    assert.equal(link, 'https://app.xangarro.mx/activar#c=dev-only-not-a-real-secret');
    const url = new URL(link);
    assert.equal(url.search, '');
    assert.equal(url.pathname, '/activar');
  });

  it('lives 15 minutes, never past its code', () => {
    const now = new Date('2026-09-23T12:00:00.000Z');
    assert.equal(
      pairingExpiry(now, '2026-09-25T12:00:00.000Z'),
      new Date(now.getTime() + PAIRING_TOKEN_TTL_MS).toISOString(),
    );
    assert.equal(pairingExpiry(now, '2026-09-23T12:05:00.000Z'), '2026-09-23T12:05:00.000Z');
  });

  it('is what the scan path of /activate parses', () => {
    const parsed = ActivateRequestSchema.parse({
      qrToken: mintPairingToken(),
      device: { name: 'Pixel', platform: 'android', appVersion: '1', osVersion: '15' },
    });
    assert.ok('qrToken' in parsed);
  });
});

describe('publicRefusal (SEC-DEV-01)', () => {
  it('answers a wrong email as CODE_INVALID and passes every other refusal through', () => {
    assert.equal(publicRefusal('EMAIL_MISMATCH'), 'CODE_INVALID');
    for (const c of [
      'CODE_INVALID',
      'CODE_EXPIRED',
      'CODE_USED',
      'NO_DEVICE_SLOTS',
      'BUSINESS_SUSPENDED',
    ] as const)
      assert.equal(publicRefusal(c), c);
  });
});
