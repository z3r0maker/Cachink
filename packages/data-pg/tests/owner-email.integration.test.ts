import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { createDb, type Db } from '../src/client';
import { ownerEmailOf } from '../src/queries/metering';
import { integrationSuite } from './support/db';

/**
 * `xangarro.owner_email()` (0011): the usage cron's role gets exactly one
 * business owner's address — the earliest owner, never a viewer — and the
 * tenant role cannot call it at all.
 */
const { url, describe } = integrationSuite();
const run = Date.now().toString(36).toUpperCase();
const BIZ = `01HZ8XQN9GZJXV8AKQ5X0O${run.slice(-4)}`;
const EMPTY = `${BIZ.slice(0, -1)}Y`;

function roleUrl(appUrl: string, role: string): string {
  const u = new URL(appUrl);
  u.username = role;
  u.password = role;
  return u.toString();
}

async function member(owner: postgres.Sql, role: string, email: string, at: string) {
  const id = randomUUID();
  await owner`INSERT INTO auth.users (id, email) VALUES (${id}::uuid, ${email})`;
  await owner`
    INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
    VALUES (${`m-${randomUUID()}`}, ${id}, ${role}, ${BIZ}, ${at}, ${at})`;
}

describe('xangarro.owner_email(): one owner address, for the metering role only', () => {
  let owner: postgres.Sql;
  let metering: Db;
  let app: Db;

  beforeAll(async () => {
    owner = postgres(process.env.DATABASE_SUPER_URL as string, { max: 1, onnotice: () => {} });
    metering = createDb(roleUrl(url as string, 'xangarro_metering'));
    app = createDb(url as string);
    await member(owner, 'viewer', `contador-${run}@test.mx`, '2026-01-01T00:00:00Z');
    await member(owner, 'owner', `duena-${run}@test.mx`, '2026-02-01T00:00:00Z');
    await member(owner, 'owner', `socio-${run}@test.mx`, '2026-03-01T00:00:00Z');
  });

  afterAll(async () => {
    await metering?.$client.end({ timeout: 5 });
    await app?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('returns the earliest owner, never a viewer', async () => {
    assert.equal(await ownerEmailOf(metering, BIZ), `duena-${run}@test.mx`);
  });

  it('returns null for a business with no owner account', async () => {
    assert.equal(await ownerEmailOf(metering, EMPTY), null);
  });

  it('is not callable by the tenant role', async () => {
    const denied = (e: unknown) =>
      /permission denied/.test(String((e as { cause?: unknown }).cause ?? e));
    await assert.rejects(ownerEmailOf(app, BIZ), denied);
  });

  it('does not give the metering role the tables behind it', async () => {
    await assert.rejects(metering.$client`SELECT email FROM auth.users`, /permission denied/);
    await assert.rejects(metering.$client`SELECT 1 FROM business_members`, /permission denied/);
  });
});
