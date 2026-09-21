import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import * as ed from '@noble/ed25519';
import { SignedEntitlementSchema, canonicalize } from '../src/entitlement.js';

const PAYLOAD = {
  businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
  plan: 'xangarro',
  limits: { operators: 2, devices: 2, transactionsPerMonth: 10_000, activeProducts: 1_000 },
  features: ['stock', 'barcode'],
  capabilities: {
    estadosFinancieros: true,
    informeMensual: true,
    permisosPorUsuario: false,
    asesor: 'diario',
    cobrosIntegrados: true,
  },
  validUntil: '2026-10-11T00:00:00.000Z',
  graceUntil: '2026-10-18T00:00:00.000Z',
  issuedAt: '2026-09-11T00:00:00.000Z',
  serverTime: '2026-09-11T00:00:00.000Z',
  version: 1,
} as const;

/** Dev-only test keypair (also used by the C-09 mock). Never a production key. */
const DEV_PRIVATE_HEX = '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60';

describe('canonicalize', () => {
  it('is independent of key order and drops undefined members', () => {
    const a = canonicalize({ b: 1, a: { d: 2, c: [3, { f: 4, e: 5 }] }, z: undefined });
    const b = canonicalize({ a: { c: [3, { e: 5, f: 4 }], d: 2 }, b: 1 });
    assert.equal(a, b);
    assert.equal(a, '{"a":{"c":[3,{"e":5,"f":4}],"d":2},"b":1}');
  });

  it('keeps numbers and strings distinct and encodes bigint as a string', () => {
    assert.equal(canonicalize({ n: 1, s: '1', big: 10n }), '{"big":"10","n":1,"s":"1"}');
  });

  it('handles unicode and null', () => {
    assert.equal(canonicalize({ ñ: null, 'a b': 'áé' }), '{"a b":"áé","ñ":null}');
  });
});

describe('signed entitlement', () => {
  it('signs and verifies over the canonical form (dev keypair vector)', async () => {
    const priv = ed.etc.hexToBytes(DEV_PRIVATE_HEX);
    const pub = await ed.getPublicKeyAsync(priv);
    const msg = new TextEncoder().encode(canonicalize(PAYLOAD));
    const sig = await ed.signAsync(msg, priv);
    const signature = Buffer.from(sig).toString('base64');
    const parsed = SignedEntitlementSchema.parse({ payload: PAYLOAD, signature });
    assert.equal(parsed.payload.plan, 'xangarro');
    assert.equal(await ed.verifyAsync(sig, msg, pub), true);
    // A reordered-but-equal payload verifies too — that is the point of canonicalize.
    const reordered = {
      ...PAYLOAD,
      limits: { activeProducts: 1_000, transactionsPerMonth: 10_000, devices: 2, operators: 2 },
    };
    assert.equal(
      await ed.verifyAsync(sig, new TextEncoder().encode(canonicalize(reordered)), pub),
      true,
    );
    // A tampered payload does not.
    const tampered = { ...PAYLOAD, plan: 'xangarrote' };
    assert.equal(
      await ed.verifyAsync(sig, new TextEncoder().encode(canonicalize(tampered)), pub),
      false,
    );
  });

  it('rejects a malformed signature or an invalid payload', () => {
    assert.throws(() =>
      SignedEntitlementSchema.parse({ payload: PAYLOAD, signature: 'not base64!' }),
    );
    assert.throws(() =>
      SignedEntitlementSchema.parse({ payload: { ...PAYLOAD, plan: 'gold' }, signature: 'AA==' }),
    );
  });
});
