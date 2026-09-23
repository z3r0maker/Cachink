import { afterAll, beforeAll, it } from 'vitest';
import assert from 'node:assert/strict';
import postgres from 'postgres';

import { createDb } from '../src/client';
import { recordSignupAttribution } from '../src/security/attribution';
import { integrationSuite } from './support/db';

/**
 * First-touch signup attribution against real Postgres (N-57,
 * `0032_signup_attribution.sql`).
 *
 * The property that matters is that the campaign cannot be rewritten: the one
 * that brought a business is the one that stays, however many times the writer
 * runs. A last-touch record would credit whichever link someone happened to
 * click on the way back in, which is how ad spend gets misattributed.
 */
const { url, describe } = integrationSuite();

const asRole = (appUrl: string, role: string): string => {
  const u = new URL(appUrl);
  u.username = role;
  u.password = role;
  return u.toString();
};

const utm = {
  source: 'facebook',
  medium: 'cpc',
  campaign: 'taquerias-gdl',
  term: '',
  content: 'video-a',
  country: 'MX',
  region: 'JAL',
};

describe('xangarro.signup_attribution: first touch wins, tenants never see it', () => {
  let owner: postgres.Sql;
  let app: postgres.Sql;
  let db: ReturnType<typeof createDb>;
  const business = `biz_attr_${Date.now().toString(36)}`;

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

  it('records the campaign and the state the signup came from', async () => {
    await recordSignupAttribution(db, business, utm);
    const [row] = await owner<{ campaign: string; region: string; country: string }[]>`
      SELECT campaign, region, country FROM xangarro.signup_attribution
      WHERE business_id = ${business}`;
    assert.deepEqual(row, { campaign: 'taquerias-gdl', region: 'JAL', country: 'MX' });
  });

  it('never lets a later touch overwrite the first', async () => {
    await recordSignupAttribution(db, business, { ...utm, campaign: 'retargeting', region: 'CHH' });
    const [row] = await owner<{ campaign: string; region: string }[]>`
      SELECT campaign, region FROM xangarro.signup_attribution WHERE business_id = ${business}`;
    assert.deepEqual(row, { campaign: 'taquerias-gdl', region: 'JAL' });
  });

  it('stores an unknown region honestly rather than guessing', async () => {
    const other = `${business}_zz`;
    await recordSignupAttribution(db, other, { ...utm, country: 'Mexico', region: 'Jalisco' });
    const [row] = await owner<{ country: string; region: string }[]>`
      SELECT country, region FROM xangarro.signup_attribution WHERE business_id = ${other}`;
    assert.deepEqual(row, { country: 'ZZ', region: '' });
  });

  it('refuses a row with no business to attribute', async () => {
    await assert.rejects(
      () => recordSignupAttribution(db, '  ', utm),
      (error: unknown) => {
        const cause = error instanceof Error ? error.cause : undefined;
        assert.match(
          String(cause instanceof Error ? cause.message : cause),
          /needs a business/,
        );
        return true;
      },
    );
  });

  it('keeps the table invisible to the tenant role that writes it', async () => {
    await assert.rejects(
      () => app`SELECT * FROM xangarro.signup_attribution`,
      /permission denied/i,
    );
  });
});
