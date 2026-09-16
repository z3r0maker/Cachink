/**
 * Entitlement verification and resolution (A-10).
 */

import { describe, expect, it } from 'vitest';
import * as ed from '@noble/ed25519';
import { canonicalize } from '@xangarro/contracts';
import type { Entitlement } from '@xangarro/domain';
import {
  anchoredNow,
  base64ToBytes,
  resolveEntitlement,
  verifyEntitlement,
} from '../src/entitlement.js';

const PRIV = '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60';
const PUB = 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a';
const OTHER_PUB = '3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c';

const PAYLOAD: Entitlement = {
  businessId: 'BIZ',
  plan: 'emprendedor',
  limits: { operators: 2, devices: 2, recordsPerMonth: null },
  features: ['stock', 'barcode'],
  validUntil: '2026-10-16T00:00:00.000Z',
  graceUntil: '2026-10-23T00:00:00.000Z',
  issuedAt: '2026-09-16T00:00:00.000Z',
  serverTime: '2026-09-16T00:00:00.000Z',
  version: 1,
};

function sign(payload: Entitlement): { payload: Entitlement; signature: string } {
  const sig = ed.sign(new TextEncoder().encode(canonicalize(payload)), ed.etc.hexToBytes(PRIV));
  return { payload, signature: Buffer.from(sig).toString('base64') };
}

const at = (iso: string) => new Date(iso);

function resolve(over: Partial<Parameters<typeof resolveEntitlement>[0]> = {}) {
  return resolveEntitlement({
    storedJson: JSON.stringify(sign(PAYLOAD)),
    lastServerTime: '2026-09-16T00:00:00.000Z',
    lastPullAt: '2026-09-16T00:00:00.000Z',
    deviceNow: at('2026-09-20T00:00:00.000Z'),
    publicKeyHex: PUB,
    ...over,
  });
}

describe('verifyEntitlement', () => {
  it('accepts a valid signature', () => {
    expect(verifyEntitlement(sign(PAYLOAD), PUB)?.plan).toBe('emprendedor');
  });

  it('rejects a tampered payload', () => {
    const signed = sign(PAYLOAD);
    expect(
      verifyEntitlement({ ...signed, payload: { ...PAYLOAD, plan: 'mipyme_pro' } }, PUB),
    ).toBeNull();
  });

  it('rejects a signature from another key and malformed envelopes', () => {
    expect(verifyEntitlement(sign(PAYLOAD), OTHER_PUB)).toBeNull();
    expect(verifyEntitlement({ payload: PAYLOAD, signature: 'AAAA' }, PUB)).toBeNull();
    expect(verifyEntitlement(null, PUB)).toBeNull();
  });

  it('decodes base64 like Buffer does', () => {
    const bytes = Uint8Array.from([0, 1, 2, 250, 255, 128, 64]);
    expect(base64ToBytes(Buffer.from(bytes).toString('base64'))).toEqual(bytes);
  });
});

describe('resolveEntitlement', () => {
  it('applies the granted plan while active', () => {
    expect(resolve()).toMatchObject({
      plan: 'emprendedor',
      state: 'active',
      recordsPerMonth: null,
    });
  });

  it('falls back to Freelancer when nothing verifiable is stored', () => {
    expect(resolve({ storedJson: null })).toMatchObject({
      plan: 'freelancer',
      recordsPerMonth: 50,
      verified: false,
    });
    expect(resolve({ publicKeyHex: OTHER_PUB }).plan).toBe('freelancer');
  });

  it('keeps the plan during the 7-day payment grace, then falls to Freelancer', () => {
    const grace = resolve({ deviceNow: at('2026-10-18T00:00:00.000Z') });
    expect(grace).toMatchObject({
      plan: 'emprendedor',
      state: 'grace',
      graceUntil: PAYLOAD.graceUntil,
    });
    const lapsed = resolve({ deviceNow: at('2026-10-24T00:00:00.000Z') });
    expect(lapsed).toMatchObject({
      plan: 'freelancer',
      state: 'lapsed',
      grantedPlan: 'emprendedor',
    });
  });

  it('ignores a device clock set back: the last server time anchors now', () => {
    const r = resolve({
      lastServerTime: '2026-10-24T00:00:00.000Z',
      deviceNow: at('2026-09-01T00:00:00.000Z'),
    });
    expect(r.state).toBe('lapsed');
    expect(r.nowAnchored).toBe('2026-10-24T00:00:00.000Z');
  });

  it('a device clock set forward cannot extend a plan', () => {
    expect(resolve({ deviceNow: at('2028-01-01T00:00:00.000Z') }).plan).toBe('freelancer');
  });

  it('warns after 30 days without a pull and recovers on a fresh pull', () => {
    const longPaid = JSON.stringify(
      sign({
        ...PAYLOAD,
        validUntil: '2027-01-01T00:00:00.000Z',
        graceUntil: '2027-01-08T00:00:00.000Z',
      }),
    );
    const deviceNow = at('2026-10-17T00:00:00.000Z');
    expect(resolve({ storedJson: longPaid, deviceNow }).state).toBe('grace');
    expect(
      resolve({ storedJson: longPaid, deviceNow, lastPullAt: '2026-10-16T00:00:00.000Z' }).state,
    ).toBe('active');
    expect(resolve({ storedJson: longPaid, deviceNow: at('2026-10-24T00:00:00.000Z') }).plan).toBe(
      'freelancer',
    );
  });

  it('anchoredNow picks the later of device and server clocks', () => {
    expect(
      anchoredNow(at('2026-01-01T00:00:00.000Z'), '2026-02-01T00:00:00.000Z').toISOString(),
    ).toBe('2026-02-01T00:00:00.000Z');
    expect(anchoredNow(at('2026-03-01T00:00:00.000Z'), null).toISOString()).toBe(
      '2026-03-01T00:00:00.000Z',
    );
  });
});
