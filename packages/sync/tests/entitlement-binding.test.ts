/**
 * The entitlement is bound to the device's own business (audit F-15c). A
 * plan validly signed for another business does not verify here, and a
 * pulled page that carries one is refused whole: nothing is applied, no
 * cursor moves, the stored entitlement stays. A page of this device's own
 * business is applied under the device's id.
 */

import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import * as ed from '@noble/ed25519';
import { sql } from 'drizzle-orm';
import { canonicalize, type PullResponse, type ReferenceTables } from '@xangarro/contracts';
import { buildFixtures } from '@xangarro/contracts/mock';
import { DrizzleAppConfigRepository, type XangarroDatabase } from '@xangarro/data';
import type { Entitlement } from '@xangarro/domain';
import { makeFreshDb } from '../../data/tests/helpers/fresh-db.js';
import type { ApiClient } from '../src/api-client.js';
import { resolveEntitlement, verifyEntitlement } from '../src/entitlement.js';
import { ENTITLEMENT_BUSINESS_MISMATCH, pullAll } from '../src/pull.js';
import { SyncEngine } from '../src/sync-engine.js';
import { SYNC_CONFIG_KEYS } from '../src/sync-keys.js';

const PRIV = '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60';
const PUB = 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a';

const fx = buildFixtures();
const MINE = fx.businesses[0]!.id;
const THEIRS = '01JBSN0000000000000000ZZZZ';

function entitlementFor(businessId: string): Entitlement {
  return {
    businessId,
    plan: 'xangarro',
    limits: { operators: 2, devices: 2, transactionsPerMonth: 10_000, activeProducts: 1_000 },
    features: ['stock'],
    capabilities: {
      estadosFinancieros: true,
      informeMensual: true,
      permisosPorUsuario: true,
      asesor: 'diario',
      cobrosIntegrados: true,
    },
    validUntil: '2026-10-16T00:00:00.000Z',
    graceUntil: '2026-10-23T00:00:00.000Z',
    issuedAt: '2026-09-16T00:00:00.000Z',
    serverTime: '2026-09-16T00:00:00.000Z',
    version: 1,
  };
}

/** Signed by the real key: only the business it names differs. */
function signedFor(businessId: string): { payload: Entitlement; signature: string } {
  const payload = entitlementFor(businessId);
  const sig = ed.sign(new TextEncoder().encode(canonicalize(payload)), ed.etc.hexToBytes(PRIV));
  return { payload, signature: Buffer.from(sig).toString('base64') };
}

const resolveAs = (businessId: string | null, signedBusiness: string) =>
  resolveEntitlement({
    storedJson: JSON.stringify(signedFor(signedBusiness)),
    lastServerTime: '2026-09-16T00:00:00.000Z',
    lastPullAt: '2026-09-16T00:00:00.000Z',
    deviceNow: new Date('2026-09-20T00:00:00.000Z'),
    publicKeyHex: PUB,
    businessId,
  });

describe('verifyEntitlement: bound to the device’s business', () => {
  it('accepts the entitlement signed for this business', () => {
    assert.equal(verifyEntitlement(signedFor(MINE), PUB, MINE)?.plan, 'xangarro');
  });

  it('refuses one validly signed for another business', () => {
    assert.equal(verifyEntitlement(signedFor(THEIRS), PUB, MINE), null);
  });

  it('still refuses a payload re-pointed at this business after signing', () => {
    const forged = { ...signedFor(THEIRS), payload: entitlementFor(MINE) };
    assert.equal(verifyEntitlement(forged, PUB, MINE), null);
  });
});

describe('resolveEntitlement: bound to the device’s business', () => {
  it('enforces the granted plan for the matching business', () => {
    const r = resolveAs(MINE, MINE);
    assert.deepEqual([r.plan, r.verified, r.state], ['xangarro', true, 'active']);
  });

  it('falls back exactly as an unverifiable entitlement does for another business', () => {
    const other = resolveAs(MINE, THEIRS);
    const unsigned = resolveEntitlement({
      storedJson: null,
      lastServerTime: '2026-09-16T00:00:00.000Z',
      lastPullAt: '2026-09-16T00:00:00.000Z',
      deviceNow: new Date('2026-09-20T00:00:00.000Z'),
      publicKeyHex: PUB,
      businessId: MINE,
    });
    assert.deepEqual(other, unsigned);
    assert.deepEqual([other.plan, other.verified, other.features], ['xangarrito', false, null]);
  });

  it('verifies nothing for a device that does not know its business', () => {
    assert.equal(resolveAs(null, MINE).verified, false);
  });
});

function tables(over: Partial<Record<keyof ReferenceTables, unknown>> = {}): ReferenceTables {
  return {
    businesses: [],
    products: [],
    clients: [],
    users: [],
    employees: [],
    recurring_expenses: [],
    conversion_recetas: [],
    mensajes_operador: [],
    opening_balances: [],
    opening_balance_clients: [],
    product_images: [],
    inventory_movements: [],
    feature_flags: {},
    ...over,
  } as unknown as ReferenceTables;
}

const FLAGS = { stock: true, barcode: false };

/** A server that answers every pull with one page carrying `signedBusiness`'s plan. */
function serverFor(signedBusiness: string): ApiClient {
  let asked = 0;
  const pull = async () => {
    asked += 1;
    const first = asked === 1;
    const data = {
      serverSeq: 42,
      serverTime: '2026-09-16T12:00:00.000Z',
      // The flag layer rides on every page; the rows only on the first.
      tables: tables({ businesses: first ? fx.businesses : [], feature_flags: FLAGS }),
      entitlement: signedFor(signedBusiness),
      acknowledgedThrough: 7,
    } as unknown as PullResponse;
    return { ok: true as const, data };
  };
  return { pull } as unknown as ApiClient;
}

const count = async (db: XangarroDatabase, table: string): Promise<number> =>
  ((await db.get(sql.raw(`SELECT COUNT(*) AS n FROM ${table}`))) as { n: number }).n;

describe('pullAll: bound to the device’s business', () => {
  it('refuses a page whose entitlement names another business, and applies none of it', async () => {
    const db = makeFreshDb();
    const appConfig = new DrizzleAppConfigRepository(db);
    const mine = JSON.stringify(signedFor(MINE));
    await appConfig.set(SYNC_CONFIG_KEYS.entitlement, mine);
    const out = await pullAll({
      db,
      appConfig,
      client: serverFor(THEIRS),
      token: 't',
      businessId: MINE,
    });
    assert.deepEqual(out.error, { code: ENTITLEMENT_BUSINESS_MISMATCH, status: 0 });
    assert.equal(out.applied, 0);
    assert.equal(await count(db, 'businesses'), 0);
    assert.equal(await appConfig.get(SYNC_CONFIG_KEYS.pullSeq), null);
    assert.equal(await appConfig.get(SYNC_CONFIG_KEYS.lastPullAt), null);
    assert.equal(await appConfig.get(SYNC_CONFIG_KEYS.lastServerTime), null);
    assert.equal(await appConfig.get(SYNC_CONFIG_KEYS.entitlement), mine);
  });

  it('applies its own business’s page under the device’s id', async () => {
    const db = makeFreshDb();
    const appConfig = new DrizzleAppConfigRepository(db);
    const out = await pullAll({
      db,
      appConfig,
      client: serverFor(MINE),
      token: 't',
      businessId: MINE,
    });
    assert.equal(out.error, null);
    assert.equal(await appConfig.get(SYNC_CONFIG_KEYS.pullSeq), '42');
    const row = (await db.get(
      sql`SELECT feature_flags AS flags FROM businesses WHERE id = ${MINE}`,
    )) as { flags: string };
    assert.deepEqual(JSON.parse(row.flags), FLAGS);
    const stored = JSON.parse((await appConfig.get(SYNC_CONFIG_KEYS.entitlement)) ?? '{}') as {
      payload: Entitlement;
    };
    assert.equal(stored.payload.businessId, MINE);
  });
});

describe('SyncEngine: bound to the device’s business', () => {
  const engineFor = (db: XangarroDatabase, businessId: string | null, signed: string) =>
    new SyncEngine({
      db,
      client: {
        ...serverFor(signed),
        push: async () => ({ ok: true as const, data: { accepted: [], rejected: [] } }),
      } as unknown as ApiClient,
      getToken: async () => 't',
      getBusinessId: async () => businessId,
    });

  it('reports the refusal as the run’s error and schedules a retry', async () => {
    const result = await engineFor(makeFreshDb(), MINE, THEIRS).syncNow();
    assert.equal(result.pull?.error?.code, ENTITLEMENT_BUSINESS_MISMATCH);
    assert.equal(result.revoked, false);
    assert.ok(result.retryAt);
  });

  it('pulls as usual for its own business', async () => {
    const result = await engineFor(makeFreshDb(), MINE, MINE).syncNow();
    assert.equal(result.pull?.error, null);
    assert.ok((result.pull?.applied ?? 0) > 0);
  });

  it('does not contact the server before the device knows its business', async () => {
    const result = await engineFor(makeFreshDb(), null, MINE).syncNow();
    assert.deepEqual(result, { push: null, pull: null, revoked: false });
  });
});
