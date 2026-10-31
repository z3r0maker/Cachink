import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import { compare } from 'bcryptjs';
import postgres from 'postgres';
import { ACTIVATION_CODE_REGEX } from '@xangarro/contracts';
import { ExpenseSchema, PLAN_LIMITS, ProductSchema } from '@xangarro/domain';

import { createDb, withBusiness, type Db } from '../src/client.js';
import { expenses, products } from '../src/schema/index.js';
import { DEMO, demoId } from '../scripts/seed-demo-data.js';
import { seedDemo } from '../scripts/seed-demo.js';
import { integrationSuite } from './support/db';

/**
 * B-04's acceptance for the App Review tenant: the seed runs in under ten
 * seconds, the owner can sign in, the activation code is live, the rows pass
 * the domain schemas, and a second run changes nothing but the code — there
 * is no wipe, because the app role cannot DELETE (0036), and the password
 * sticks, because the app role cannot rewrite `auth.users`.
 */
// Both passwords are named for `.gitleaks.toml`'s allowlist: a reviewer-shaped
// credential reads as live to gitleaks' generic-api-key rule. The seed imposes
// no shape — it only bcrypts what it is given — and all that matters here is
// that the two differ, so every assertion is unchanged.
const PASSWORD = 'ci-only-not-a-real-secret';
/** The rotation the second run must ignore: the first password sticks. */
const SECOND_PASSWORD = 'ci-only-not-a-real-secret-2';
const TODAY = new Date('2026-09-23T18:00:00.000Z');
const { url, describe } = integrationSuite();

describe('the App Review demo tenant (B-04)', () => {
  let app: postgres.Sql;
  let owner: postgres.Sql;
  let db: Db;
  let elapsedMs = 0;

  beforeAll(async () => {
    app = postgres(url as string, { max: 1, onnotice: () => undefined });
    owner = postgres(process.env.DATABASE_SUPER_URL as string, {
      max: 1,
      onnotice: () => undefined,
    });
    db = createDb(url as string);
    const started = Date.now();
    await seedDemo(app, { password: PASSWORD, today: TODAY });
    elapsedMs = Date.now() - started;
  });

  afterAll(async () => {
    await app?.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
    await db?.$client.end({ timeout: 5 });
  });

  it('runs in under ten seconds', () => {
    assert.ok(elapsedMs < 10_000, `took ${elapsedMs} ms`);
  });

  it('lets the owner sign in with the password the run was given', async () => {
    const [row] = await app<{ hash: string | null }[]>`
      SELECT encrypted_password AS hash FROM xangarro.login_lookup(${DEMO.owner.email})`;
    assert.ok(row?.hash, 'login_lookup knows the demo owner');
    assert.equal(await compare(PASSWORD, row.hash), true);
    const [member] = await app<{ role: string }[]>`
      SELECT role FROM business_members WHERE id = ${DEMO.owner.memberId}`;
    assert.equal(member?.role, 'owner');
  });

  it('mints one live code per device slot, each one the contract accepts', async () => {
    // A code links one device, once. A review on an iPhone and an iPad needs two,
    // and more codes than the plan has slots would only mint a refusal.
    assert.equal(DEMO.activationCodes.length, PLAN_LIMITS.xangarro.devices);
    assert.equal(new Set(DEMO.activationCodes).size, DEMO.activationCodes.length);
    for (const c of DEMO.activationCodes) {
      assert.match(c, ACTIVATION_CODE_REGEX);
      const [code] = await app<{ redeemed_at: string | null; expires_at: string }[]>`
        SELECT redeemed_at, expires_at FROM activation_codes WHERE code = ${c}`;
      assert.equal(code?.redeemed_at, null, `${c} is live`);
      assert.ok(new Date(code?.expires_at ?? 0).getTime() > TODAY.getTime() + 300 * 86_400_000);
    }
  });

  it('seeds twenty products and a month of ventas and gastos that pass the domain schemas', async () => {
    const rows = await withBusiness(db, DEMO.businessId, (tx) => tx.select().from(products));
    assert.equal(rows.length, 20);
    for (const row of rows) {
      const candidate = {
        ...row,
        atributos: JSON.parse(row.atributos) as Record<string, string>,
        createdAt: new Date(row.createdAt).toISOString(),
        updatedAt: new Date(row.updatedAt).toISOString(),
        deletedAt: row.deletedAt === null ? null : new Date(row.deletedAt).toISOString(),
      };
      assert.ok(ProductSchema.safeParse(candidate).success, `${row.id} is not a domain Product`);
    }
    const gastos = await withBusiness(db, DEMO.businessId, (tx) => tx.select().from(expenses));
    assert.ok(gastos.length >= 10);
    for (const g of gastos) {
      const parsed = ExpenseSchema.safeParse({
        ...g,
        createdAt: new Date(g.createdAt).toISOString(),
        updatedAt: new Date(g.updatedAt).toISOString(),
        deletedAt: g.deletedAt === null ? null : new Date(g.deletedAt).toISOString(),
      });
      assert.ok(parsed.success, `${g.id}: ${parsed.success ? '' : parsed.error.message}`);
    }
    const [{ tickets, days }] = await app<{ tickets: string; days: string }[]>`
      SELECT count(*)::text AS tickets, count(DISTINCT fecha)::text AS days FROM tickets`;
    assert.equal(Number(tickets), 90);
    assert.equal(Number(days), 30);
  });

  it('never lets a product net negative — every sale had stock to sell (ADR-095)', async () => {
    const short = await app<{ producto_id: string }[]>`
      SELECT producto_id FROM inventory_movements
      GROUP BY producto_id
      HAVING sum(CASE WHEN tipo = 'entrada' THEN cantidad ELSE -cantidad END) < 0`;
    assert.equal(short.length, 0, `net negative: ${short.map((r) => r.producto_id).join(', ')}`);
  });

  it('is idempotent: a second run adds nothing, re-mints the codes, keeps the password', async () => {
    const count = async () =>
      (await app<{ n: string }[]>`SELECT count(*)::text AS n FROM sales`)[0]?.n;
    const before = await count();
    await owner`UPDATE activation_codes SET redeemed_at = now() WHERE code = ANY(${DEMO.activationCodes})`;
    await seedDemo(app, { password: SECOND_PASSWORD, today: TODAY });
    assert.equal(await count(), before);
    const live = await app<{ code: string }[]>`
      SELECT code FROM activation_codes WHERE code = ANY(${DEMO.activationCodes}) AND redeemed_at IS NULL`;
    assert.equal(live.length, DEMO.activationCodes.length, 'the next reviewer gets live codes');
    const [row] = await app<{ hash: string }[]>`
      SELECT encrypted_password AS hash FROM xangarro.login_lookup(${DEMO.owner.email})`;
    assert.equal(await compare(PASSWORD, row?.hash ?? ''), true, 'the first password sticks');
    assert.equal(await compare(SECOND_PASSWORD, row?.hash ?? ''), false);
  });

  it("frees the last review's device slots, so the next review can link", async () => {
    // A slot is a device that is not revoked; the app role can revoke but not delete.
    for (const i of [0, 1]) {
      await owner`
        INSERT INTO devices (id, nombre, plataforma, business_id, created_at, updated_at)
        VALUES (${demoId(`RVW0${i}`)}, ${`Revisor ${i}`}, 'ios', ${DEMO.businessId}, now(), now())
        ON CONFLICT (id) DO UPDATE SET revoked_at = NULL`;
    }
    await seedDemo(app, { password: PASSWORD, today: TODAY });
    const [held] = await owner<{ n: string }[]>`
      SELECT count(*)::text AS n FROM devices
      WHERE business_id = ${DEMO.businessId} AND revoked_at IS NULL`;
    assert.equal(held?.n, '0');
  });

  it('stays out of the dev seed: nothing of Tacos La Esquina is visible to Taquería Don Pedro', async () => {
    await app`SELECT set_config('xangarro.business_id', '01HZ8XQN9GZJXV8AKQ5X0C7BJZ', false)`;
    const [row] = await app<{ n: string }[]>`
      SELECT count(*)::text AS n FROM products WHERE id LIKE '01HZDEMK7M3%'`;
    assert.equal(row?.n, '0');
  });
});
