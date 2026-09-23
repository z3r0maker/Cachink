import { afterAll, beforeAll, it } from 'vitest';
import assert from 'node:assert/strict';
import postgres from 'postgres';

import { createDb } from '../src/client';
import { recordGeoCount } from '../src/security/geo';
import { integrationSuite } from './support/db';

/**
 * The geo counter's privacy properties, proved against real Postgres as the
 * real roles (N-55, `0030_geo_counters.sql`, `0031_geo_grants.sql`).
 *
 * `geo-grants.test.ts` reads the migrations as text; this one proves the
 * database actually behaves that way — that the app role can count a visit and
 * cannot read the table back, and that an unknown source is refused rather
 * than quietly recorded under a fourth name.
 */
const { url, describe } = integrationSuite();

function asRole(appUrl: string, role: string): string {
  const u = new URL(appUrl);
  u.username = role;
  u.password = role;
  return u.toString();
}

const countOf = async (sql: postgres.Sql, source: string, region: string): Promise<number> => {
  const rows = await sql<{ hits: number }[]>`
    SELECT hits FROM xangarro.geo_counters
    WHERE source = ${source} AND region = ${region}
      AND day = (now() AT TIME ZONE 'America/Mexico_City')::date`;
  return rows[0]?.hits ?? 0;
};

describe('xangarro.geo_counters: the app counts, nobody reads, nobody deletes', () => {
  let owner: postgres.Sql;
  let app: postgres.Sql;
  let db: ReturnType<typeof createDb>;
  // A region code no real subdivision uses, so parallel suites cannot collide.
  const REGION = 'ZQ9';

  beforeAll(() => {
    owner = postgres(process.env.DATABASE_SUPER_URL ?? (url as string), {
      max: 1,
      onnotice: () => undefined,
    });
    app = postgres(asRole(url as string, 'xangarro_app'), { max: 1, onnotice: () => undefined });
    db = createDb(asRole(url as string, 'xangarro_app'));
  });

  afterAll(async () => {
    await owner?.end({ timeout: 5 });
    await app?.end({ timeout: 5 });
    await db?.$client.end({ timeout: 5 });
  });

  it('inserts on the first visit and increments on the next', async () => {
    const before = await countOf(owner, 'login', REGION);
    await recordGeoCount(db, 'login', 'MX', REGION);
    await recordGeoCount(db, 'login', 'MX', REGION);
    assert.equal(await countOf(owner, 'login', REGION), before + 2);
  });

  it('folds case and whitespace into the same row rather than a second spelling', async () => {
    const before = await countOf(owner, 'landing', REGION);
    await recordGeoCount(db, 'landing', ' mx ', ` ${REGION.toLowerCase()} `);
    assert.equal(await countOf(owner, 'landing', REGION), before + 1);
  });

  it('records an unusable region as unknown instead of guessing', async () => {
    await recordGeoCount(db, 'login', 'MX', 'Jalisco!');
    const rows = await owner<{ region: string }[]>`
      SELECT region FROM xangarro.geo_counters WHERE region = 'Jalisco!'`;
    assert.equal(rows.length, 0);
  });

  it('refuses an unknown source loudly, so a typo cannot invent a fourth', async () => {
    await assert.rejects(
      // A caller outside the GeoSource union is exactly what this guards.
      () => recordGeoCount(db, 'visita' as 'login', 'MX', REGION),
      // The driver wraps: its own Error quotes the statement, and the database's
      // message rides on `cause` (the same shape `infra-failure.ts` walks).
      (error: unknown) => {
        const cause = error instanceof Error ? error.cause : undefined;
        assert.match(String(cause instanceof Error ? cause.message : cause), /unknown geo source/);
        return true;
      },
    );
  });

  it('never lets the app role read back what it counted', async () => {
    await assert.rejects(() => app`SELECT * FROM xangarro.geo_counters`, /permission denied/i);
  });

  it('never lets the app role delete a row', async () => {
    await assert.rejects(
      () => app`DELETE FROM xangarro.geo_counters WHERE region = ${REGION}`,
      /permission denied/i,
    );
  });
});
