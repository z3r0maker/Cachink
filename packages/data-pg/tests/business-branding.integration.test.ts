import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { logoPublico, upsertLogo } from '../src/queries/logos';
import { integrationSuite } from './support/db';
import { BIZ_A, BIZ_B, seedTwoTenants } from './support/tenants';

/**
 * 0023: the branding columns are additive (a pre-0023 business reads the
 * defaults), a tenant writes its own row, and the logo bytes are public
 * through `xangarro.logo_publico()` while the table itself stays
 * tenant-isolated.
 */
const { url, describe } = integrationSuite();

describe('0023 business branding + logos', () => {
  let app: Db;
  let owner: postgres.Sql;
  /** Fresh each run, so the defaults test never reads a row a later test wrote. */
  let FRESH: string;

  beforeAll(async () => {
    app = createDb(url as string);
    owner = postgres(url as string, { max: 1, onnotice: () => undefined });
    await seedTwoTenants(owner);
    FRESH = `01HZ8XQN9GZJXV8AKQ5XBRAND${Date.now().toString(36).toUpperCase().slice(-4).padEnd(4, '0')}`;
    await owner`SELECT set_config('xangarro.business_id', ${FRESH}, false)`;
    await owner`
      INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
      VALUES (${FRESH}, 'Negocio fresh', 'RESICO', 125, ${FRESH}, 'dev', now(), now())
      ON CONFLICT (id) DO NOTHING`;
  });

  afterAll(async () => {
    await app?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('a pre-0023 business reads the defaults, not errors', async () => {
    const rows = await withBusiness(app, FRESH, (tx) =>
      tx.execute<
        {
          brand_color: string | null;
          receipt_template: string;
          address_print: boolean;
          social_links: string;
        }[]
      >(
        sql`SELECT brand_color, receipt_template, address_print, social_links FROM businesses WHERE id = ${FRESH}`,
      ),
    );
    const row = rows[0];
    assert.equal(row?.brand_color ?? null, null);
    assert.equal(row?.receipt_template, 'clasico');
    assert.equal(row?.address_print, false);
    assert.equal(row?.social_links, '{}');
  });

  it('a tenant writes its branding row; another tenant never sees it', async () => {
    await withBusiness(app, BIZ_A, (tx) =>
      tx.execute(
        sql`
          UPDATE businesses SET brand_color = '#d4a017', receipt_template = 'ticket',
                                whatsapp = '55 1234 5678', receipt_leyenda = '¡Gracias!'
           WHERE id = ${BIZ_A}`,
      ),
    );
    const mine = await withBusiness(app, BIZ_A, (tx) =>
      tx.execute<{ brand_color: string | null; receipt_template: string }[]>(
        sql`SELECT brand_color, receipt_template FROM businesses WHERE id = ${BIZ_A}`,
      ),
    );
    assert.equal(mine[0]?.brand_color, '#d4a017');
    assert.equal(mine[0]?.receipt_template, 'ticket');

    const theirs = await withBusiness(app, BIZ_B, (tx) =>
      tx.execute<{ brand_color: string | null }[]>(
        sql`SELECT brand_color FROM businesses WHERE id = ${BIZ_A}`,
      ),
    );
    assert.equal(theirs.length, 0);
  });

  it('a tenant upserts its logo; the public function serves it without a claim', async () => {
    await withBusiness(app, BIZ_A, (tx) =>
      upsertLogo(tx, {
        businessId: BIZ_A,
        mime: 'image/svg+xml',
        bytes: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      }),
    );
    // No tenant claim: exactly what the public route does.
    const logo = await logoPublico(app, BIZ_A);
    assert.equal(logo?.mime, 'image/svg+xml');
    assert.equal(logo?.bytes.toString(), '<svg xmlns="http://www.w3.org/2000/svg"/>');

    // Replace round-trips.
    await withBusiness(app, BIZ_A, (tx) =>
      upsertLogo(tx, { businessId: BIZ_A, mime: 'image/png', bytes: Buffer.from([1, 2, 3]) }),
    );
    const replaced = await logoPublico(app, BIZ_A);
    assert.equal(replaced?.mime, 'image/png');
  });

  it('a business with no logo serves nothing', async () => {
    assert.equal(await logoPublico(app, BIZ_B), null);
  });

  it('the logo table is not writable without the tenant claim', async () => {
    await assert.rejects(() =>
      app.execute(
        sql`
          INSERT INTO business_logos (business_id, mime, bytes, updated_at)
          VALUES (${BIZ_B}, 'image/png', ${Buffer.from([9])}, now())
        `,
      ),
    );
    assert.equal(await logoPublico(app, BIZ_B), null, 'nothing was written');
  });
});
