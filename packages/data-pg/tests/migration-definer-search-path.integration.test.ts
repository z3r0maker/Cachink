import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { integrationSuite } from './support/db';

/**
 * `0055_definer_search_path.sql` (audit F-15b): a SECURITY DEFINER function
 * runs with its owner's rights, so what its unqualified names resolve to is
 * part of its privilege. Six of them pinned `search_path = public, pg_catalog`
 * — `public` first, where anything able to create an object could shadow a
 * built-in. The file reorders them; the posture test below holds every definer
 * the repository owns, so a later `CREATE OR REPLACE` cannot bring it back.
 */
const MIGRATION = join(import.meta.dirname, '../drizzle/0055_definer_search_path.sql');
const { describe } = integrationSuite();

/** The six functions the file alters, by exact signature, as `regprocedure` spells them. */
const REORDERED = [
  'xangarro.memberships_for_user(text)',
  'xangarro.negocios_for_user(text)',
  'xangarro.redeem_activation_code(text,text,text)',
  'xangarro.redeem_pairing_token(text,text)',
  'xangarro.tenant_plan_overrides()',
  'xangarro.tenant_platform_flags()',
] as const;

interface Definer {
  fn: string;
  /** The function's `search_path` setting, or null when it pins none. */
  path: string | null;
}

/** Every SECURITY DEFINER function in the schemas this repository owns. */
const definers = (sql: postgres.Sql | postgres.TransactionSql) => sql<Definer[]>`
  SELECT p.oid::regprocedure::text AS fn,
         (SELECT substring(c FROM 'search_path=(.*)') FROM unnest(p.proconfig) AS c
           WHERE c LIKE 'search_path=%') AS path
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE p.prosecdef AND n.nspname IN ('public', 'xangarro', 'corp')
   ORDER BY 1`;

const firstSchema = (path: string) => (path.split(',')[0] ?? '').trim().replaceAll('"', '');

const rollback = (e: Error) => {
  if (e.message !== 'rollback') throw e;
};

describe('migration: no SECURITY DEFINER function searches public first', () => {
  let su: postgres.Sql;
  beforeAll(() => {
    su = postgres(process.env.DATABASE_SUPER_URL as string, { max: 1, onnotice: () => undefined });
  });
  afterAll(async () => {
    await su?.end({ timeout: 5 });
  });

  it('every definer pins a search_path that does not start with public', async () => {
    const rows = await definers(su);
    assert.ok(rows.length >= REORDERED.length, 'the definers are there to be checked');
    for (const { fn, path } of rows) {
      assert.ok(path !== null && path !== '', `${fn} pins no search_path`);
      assert.ok(
        !['public', '$user'].includes(firstSchema(path)),
        `${fn} searches ${firstSchema(path)} first: search_path = ${path}`,
      );
    }
  });

  it('old → new: the six public-first functions are reordered, and nothing else changes', async () => {
    await su
      .begin(async (tx) => {
        for (const fn of REORDERED) {
          await tx.unsafe(`ALTER FUNCTION ${fn} SET search_path = public, pg_catalog`);
        }
        const before = await definers(tx);
        assert.equal(before.filter((d) => d.path === 'public, pg_catalog').length, 6);

        await tx.unsafe(readFileSync(MIGRATION, 'utf8'));

        const after = await definers(tx);
        const moved = after.filter((d, i) => d.path !== before[i]?.path);
        assert.deepEqual(moved.map((d) => d.fn).sort(), [...REORDERED].sort());
        assert.ok(moved.every((d) => d.path === 'pg_catalog, public'));
        throw new Error('rollback');
      })
      .catch(rollback);
  });

  it('applies twice without error, as the hosted runner may re-run a file', async () => {
    await su
      .begin(async (tx) => {
        await tx.unsafe(readFileSync(MIGRATION, 'utf8'));
        await tx.unsafe(readFileSync(MIGRATION, 'utf8'));
        throw new Error('rollback');
      })
      .catch(rollback);
  });

  it('the reordered functions still answer for the app role', async () => {
    const app = postgres(process.env.DATABASE_URL as string, { max: 1, onnotice: () => undefined });
    try {
      const none = await app`SELECT * FROM xangarro.memberships_for_user('no-such-user')`;
      assert.equal(none.length, 0);
      const [code] = await app<{ outcome: string }[]>`
        SELECT outcome FROM xangarro.redeem_activation_code('NOPE', 'nadie@example.com', 'D1')`;
      assert.equal(code?.outcome, 'CODE_INVALID');
      const [token] = await app<{ outcome: string }[]>`
        SELECT outcome FROM xangarro.redeem_pairing_token('no-such-hash', 'D1')`;
      assert.equal(token?.outcome, 'CODE_INVALID');
      assert.equal((await app`SELECT * FROM xangarro.negocios_for_user('no-such-user')`).length, 0);
      assert.equal((await app`SELECT * FROM xangarro.tenant_plan_overrides()`).length, 0);
      await app`SELECT * FROM xangarro.tenant_platform_flags()`;
    } finally {
      await app.end({ timeout: 5 });
    }
  });
});
