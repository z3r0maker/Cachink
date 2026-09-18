import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { openSession, resolveSession, throttleKey } from '../src/security';
import { createDb, withBusiness, type Db } from '../src/client';
import { sql } from 'drizzle-orm';
import { integrationSuite } from './support/db';

/**
 * B-16: the Studio saved queries run on the seed, the runbook's SQL unlock
 * computes the same key the app does, and the two support functions do what
 * the runbook says. Aging rows needs the owner connection (`test:db` passes
 * `DATABASE_SUPER_URL`); everything else runs as the app role.
 */
const { url, describe } = integrationSuite();
const STUDIO = join(import.meta.dirname, '../../../supabase/studio');
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';

describe('support tooling', () => {
  let db: Db;
  let owner: postgres.Sql;

  beforeAll(() => {
    db = createDb(url as string);
    owner = postgres(process.env.DATABASE_SUPER_URL as string, {
      max: 1,
      onnotice: () => undefined,
    });
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('every saved query runs on the seed', async () => {
    const files = readdirSync(STUDIO).filter((f) => f.endsWith('.sql'));
    assert.ok(files.length >= 4, `found ${files.join(', ')}`);
    for (const f of files) {
      await owner.unsafe(readFileSync(join(STUDIO, f), 'utf8')).catch((e: Error) => {
        throw new Error(`${f}: ${e.message}`);
      });
    }
    const [rejections] = await owner.unsafe(
      readFileSync(join(STUDIO, 'unresolved-rejections.sql'), 'utf8'),
    );
    assert.ok(rejections, 'the seed has unresolved rejections to find');
  });

  it('the runbook’s SQL unlock computes exactly the app’s throttle key', async () => {
    const address = 'Pedro@Taqueria.mx';
    const [row] = await owner<{ k: string }[]>`
      SELECT encode(sha256(convert_to('login:email:' || lower(${address}), 'UTF8')), 'hex') AS k`;
    assert.equal(row?.k, throttleKey('login', 'email', address.toLowerCase()));
  });

  it('signing a user out everywhere ends every live session of theirs, and only theirs', async () => {
    const user = randomUUID();
    await db.execute(
      sql`INSERT INTO auth.users (id, email) VALUES (${user}::uuid, ${`${user}@t.mx`})`,
    );
    const tokens = [await openSession(db, user, BIZ, 3600), await openSession(db, user, BIZ, 3600)];
    const [ended] = await db.execute<{ n: number }>(
      sql`SELECT xangarro.session_revoke_user(${user}::uuid) AS n`,
    );
    assert.equal(Number(ended?.n), 2);
    for (const t of tokens) assert.equal(await resolveSession(db, t, 600), null);
  });

  it('pruning removes only rows that can no longer matter', async () => {
    const user = randomUUID();
    await db.execute(
      sql`INSERT INTO auth.users (id, email) VALUES (${user}::uuid, ${`${user}@t.mx`})`,
    );
    const old = await openSession(db, user, BIZ, 3600);
    const fresh = await openSession(db, user, BIZ, 3600);
    const staleKey = throttleKey('test', randomUUID());
    await owner`INSERT INTO xangarro.throttle (key, window_start, hits) VALUES (${staleKey}, now() - interval '2 days', 1)`;
    const hash = (t: string) => owner`SELECT encode(sha256(convert_to(${t}, 'UTF8')), 'hex') AS h`;
    const [{ h: oldHash }] = (await hash(old)) as unknown as [{ h: string }];
    await owner`UPDATE xangarro.portal_sessions SET expires_at = now() - interval '2 days' WHERE token_hash = ${oldHash}`;

    await withBusiness(db, BIZ, (tx) => tx.execute(sql`SELECT * FROM xangarro.security_prune()`));

    const left = await owner<{ token_hash: string }[]>`
      SELECT token_hash FROM xangarro.portal_sessions WHERE user_id = ${user}::uuid`;
    assert.equal(left.length, 1, 'the expired session is gone, the live one stays');
    assert.notEqual(await resolveSession(db, fresh, 600), undefined);
    const [gone] = await owner`SELECT 1 FROM xangarro.throttle WHERE key = ${staleKey}`;
    assert.equal(gone, undefined);
  });
});
