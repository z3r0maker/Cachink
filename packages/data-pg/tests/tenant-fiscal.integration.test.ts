import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';
import { validateTenantFiscal } from '@xangarro/application/cfdi';

import { createDb, type Db } from '../src/client';
import { tenantFiscalOf } from '../src/queries/fiscal';
import { integrationSuite } from './support/db';

/**
 * `xangarro.tenant_fiscal()` (0014): the billing role reads one business's
 * receptor fields — `regimen_sat` as the régimen, the owner's email — and
 * nothing else; complete data routes to an individual CFDI, a missing RFC to
 * the global one. The tenant role cannot call it.
 */
const { url, describe } = integrationSuite();
const run = Date.now().toString(36).toUpperCase();
const COMPLETE = `01HZ8XQN9GZJXV8AKQ5XF${run.slice(-5)}`;
const NO_RFC = `${COMPLETE.slice(0, -1)}R`;
const NOW = '2026-09-18T12:00:00.000Z';

function roleUrl(appUrl: string, role: string): string {
  const u = new URL(appUrl);
  u.username = role;
  u.password = role;
  return u.toString();
}

async function business(owner: postgres.Sql, id: string, rfc: string | null) {
  await owner`
    INSERT INTO businesses (id, nombre, regimen_fiscal, regimen_sat, rfc, razon_social,
                            codigo_postal, uso_cfdi, isr_tasa, business_id, device_id,
                            created_at, updated_at)
    VALUES (${id}, 'Ojeda', 'RESICO', '626', ${rfc}, 'INTERNACIONAL OJEDA',
            '06600', 'G03', 125, ${id}, 'dev', ${NOW}, ${NOW})`;
  const user = randomUUID();
  await owner`INSERT INTO auth.users (id, email) VALUES (${user}::uuid, ${`duena-${id}@test.mx`})`;
  await owner`
    INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
    VALUES (${`m-${randomUUID()}`}, ${user}, 'owner', ${id}, ${NOW}, ${NOW})`;
}

describe('xangarro.tenant_fiscal(): the CFDI receptor, for the billing role only', () => {
  let owner: postgres.Sql;
  let billing: Db;
  let app: Db;

  beforeAll(async () => {
    owner = postgres(process.env.DATABASE_SUPER_URL as string, { max: 1, onnotice: () => {} });
    billing = createDb(roleUrl(url as string, 'xangarro_billing'));
    app = createDb(url as string);
    await business(owner, COMPLETE, 'XOJI740919U48');
    await business(owner, NO_RFC, null);
  });

  afterAll(async () => {
    await billing?.$client.end({ timeout: 5 });
    await app?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('complete data → an individual CFDI whose receptor régimen is the SAT code', async () => {
    const fiscal = await tenantFiscalOf(billing, COMPLETE);
    assert.deepEqual(fiscal, {
      rfc: 'XOJI740919U48',
      razonSocial: 'INTERNACIONAL OJEDA',
      regimenFiscal: '626',
      usoCfdi: 'G03',
      codigoPostal: '06600',
      email: `duena-${COMPLETE}@test.mx`,
    });
    const v = validateTenantFiscal(fiscal ?? {});
    assert.ok(v.ok);
    assert.equal(v.receptor.regimenFiscal, '626');
  });

  it('a missing RFC → the global CFDI', async () => {
    const v = validateTenantFiscal((await tenantFiscalOf(billing, NO_RFC)) ?? {});
    assert.ok(!v.ok);
    assert.ok(v.reasons.includes('rfc_missing'));
  });

  it('an unknown business reads as null', async () => {
    assert.equal(await tenantFiscalOf(billing, `${COMPLETE.slice(0, -1)}Z`), null);
  });

  it('is not callable by the tenant role', async () => {
    const denied = (e: unknown) =>
      /permission denied/.test(String((e as { cause?: unknown }).cause ?? e));
    await assert.rejects(tenantFiscalOf(app, COMPLETE), denied);
  });

  it('does not give the billing role the tables behind it', async () => {
    await assert.rejects(billing.$client`SELECT rfc FROM businesses`, /permission denied/);
    await assert.rejects(billing.$client`SELECT 1 FROM business_members`, /permission denied/);
    await assert.rejects(billing.$client`SELECT email FROM auth.users`, /permission denied/);
    await assert.rejects(
      billing.$client`SELECT xangarro.owner_email(${COMPLETE})`,
      /permission denied/,
    );
  });
});
