import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { guardarPreferencias, preferenciasDe } from '../src/queries';
import { integrationSuite } from './support/db';

/**
 * P-32's stored aviso choices against the real table: empty until saved,
 * upserted per member, and invisible across tenants.
 */
const { url, describe } = integrationSuite();
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const OTHER = '01HZ8XQN9GZJXV8AKQ5X0CNF01';

describe('notice_preferences', () => {
  let db: Db;
  const userId = randomUUID();

  beforeAll(() => {
    db = createDb(url as string);
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('is empty until the member saves', async () => {
    assert.deepEqual(await withBusiness(db, BIZ, (tx) => preferenciasDe(tx, userId)), {});
  });

  it('saves, then overwrites, one row per member', async () => {
    await withBusiness(db, BIZ, (tx) =>
      guardarPreferencias(tx, BIZ, userId, { stock_bajo: { correo: true } }),
    );
    await withBusiness(db, BIZ, (tx) =>
      guardarPreferencias(tx, BIZ, userId, { stock_bajo: { correo: false, portal: false } }),
    );
    assert.deepEqual(await withBusiness(db, BIZ, (tx) => preferenciasDe(tx, userId)), {
      stock_bajo: { correo: false, portal: false },
    });
    const [n] = await withBusiness(db, BIZ, (tx) =>
      tx.execute<{ n: number }>(
        sql`SELECT count(*)::int AS n FROM notice_preferences WHERE user_id = ${userId}`,
      ),
    );
    assert.equal(n?.n, 1);
  });

  it('another tenant sees nothing, and cannot write into this one', async () => {
    assert.deepEqual(await withBusiness(db, OTHER, (tx) => preferenciasDe(tx, userId)), {});
    await assert.rejects(withBusiness(db, OTHER, (tx) => guardarPreferencias(tx, BIZ, userId, {})));
  });
});
