import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { PLAN_LIMITS } from '@xangarro/domain';

import { signedTestEntitlement, signTestPayload } from '../src/entitlement.js';
import type { Entitlement } from '@xangarro/domain';

/**
 * The package's entitlement signer: it mints what the server would — the
 * plan's limits, features filtered to what the platform released (N-09),
 * thirty days plus grace — and any hand-shaped payload can be signed the
 * same way. The base64 arm covers its own padding tails.
 */

const AHORA = new Date('2026-09-28T12:00:00.000Z');

describe('signedTestEntitlement', () => {
  it('mints the plan with platform-released features, validity and grace', () => {
    const { payload, signature } = signedTestEntitlement('xangarro', AHORA);
    const limits = PLAN_LIMITS.xangarro!;
    assert.equal(payload.plan, 'xangarro');
    assert.equal(payload.limits.devices, limits.devices);
    assert.ok(payload.features.every((k) => limits.features.includes(k)));
    assert.equal(payload.validUntil, new Date(AHORA.getTime() + 30 * 86_400_000).toISOString());
    assert.equal(payload.graceUntil, new Date(AHORA.getTime() + 37 * 86_400_000).toISOString());
    assert.equal(payload.issuedAt, AHORA.toISOString());
    assert.ok(signature.length > 0);
  });

  it('the free plan mints its own limits', () => {
    const { payload } = signedTestEntitlement('xangarrito', AHORA);
    assert.equal(payload.limits.transactionsPerMonth, PLAN_LIMITS.xangarrito!.transactionsPerMonth);
    assert.equal(payload.businessId, 'TEST');
  });
});

describe('signTestPayload', () => {
  it('signs a hand-shaped payload and a different payload differently', () => {
    const base: Entitlement = signedTestEntitlement('xangarro', AHORA).payload;
    const otra: Entitlement = { ...base, businessId: 'OTRO' };
    const a = signTestPayload(base);
    const b = signTestPayload(otra);
    assert.equal(a.payload.businessId, 'TEST');
    assert.notEqual(a.signature, b.signature);
  });
});
