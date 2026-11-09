import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { integrationSuite } from './support/db';

/**
 * `0054_revoke_supabase_api_roles.sql` (audit SEC-DATA-01, ADR-138), old → new:
 * the grants a hosted Supabase project gives `anon` and `authenticated` by
 * default are recreated inside a transaction, the real file is applied, and
 * nothing is left that the Data API could reach, while Xangarro's own login
 * keeps every privilege it had. Rolled back at the end: the shared database is
 * untouched.
 */
const MIGRATION = join(import.meta.dirname, '../drizzle/0054_revoke_supabase_api_roles.sql');
const { describe } = integrationSuite();

describe('migration: the Supabase API roles lose everything', () => {
  let su: postgres.Sql;
  beforeAll(() => {
    su = postgres(process.env.DATABASE_SUPER_URL as string, { max: 1, onnotice: () => undefined });
  });
  afterAll(async () => {
    await su?.end({ timeout: 5 });
  });

  it('revokes what Supabase grants by default, now and for later tables, and leaves the app alone', async () => {
    await su
      .begin(async (tx) => {
        const appBefore = await tx<{ n: number }[]>`
          SELECT count(*)::int AS n FROM information_schema.role_table_grants
           WHERE grantee = 'xangarro_app' AND table_schema = 'public'`;

        // What a hosted project starts with.
        await tx.unsafe(`
          GRANT USAGE ON SCHEMA public, xangarro TO anon, authenticated;
          GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
          GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
          GRANT ALL ON ALL TABLES IN SCHEMA xangarro TO anon, authenticated;
          ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
            GRANT ALL ON TABLES TO anon, authenticated;`);
        const [granted] = await tx<{ ok: boolean }[]>`
          SELECT has_table_privilege('anon', 'public.sales', 'DELETE') AS ok`;
        assert.equal(granted?.ok, true, 'the Supabase posture is in place before the file');

        await tx.unsafe(readFileSync(MIGRATION, 'utf8'));

        const [left] = await tx<{ tables: number; sequences: number; schema: boolean }[]>`
          SELECT (SELECT count(*)::int FROM information_schema.role_table_grants
                   WHERE grantee IN ('anon', 'authenticated')
                     AND table_schema IN ('public', 'xangarro')) AS tables,
                 (SELECT count(*)::int FROM information_schema.usage_privileges
                   WHERE grantee IN ('anon', 'authenticated') AND object_type = 'SEQUENCE'
                     AND object_schema IN ('public', 'xangarro')) AS sequences,
                 has_schema_privilege('anon', 'xangarro', 'USAGE') AS schema`;
        assert.deepEqual({ ...left }, { tables: 0, sequences: 0, schema: false });

        const defaults = await tx<{ acl: string }[]>`
          SELECT array_to_string(d.defaclacl, ',') AS acl FROM pg_default_acl d
            JOIN pg_namespace n ON n.oid = d.defaclnamespace WHERE n.nspname = 'public'`;
        assert.ok(
          defaults.every((d) => !/\b(anon|authenticated)=/.test(d.acl)),
          'no default privilege hands a later table to the API roles',
        );

        const [appAfter] = await tx<{ n: number }[]>`
          SELECT count(*)::int AS n FROM information_schema.role_table_grants
           WHERE grantee = 'xangarro_app' AND table_schema = 'public'`;
        assert.equal(appAfter?.n, appBefore[0]?.n, 'xangarro_app keeps every privilege');

        await tx`SET LOCAL ROLE authenticated`;
        await assert.rejects(tx`SELECT 1 FROM public.sales LIMIT 1`, /permission denied/);
        throw new Error('rollback');
      })
      .catch((e: Error) => {
        if (e.message !== 'rollback') throw e;
      });
  });

  it('applies twice without error, as the hosted runner may re-run a file', async () => {
    await su
      .begin(async (tx) => {
        await tx.unsafe(readFileSync(MIGRATION, 'utf8'));
        await tx.unsafe(readFileSync(MIGRATION, 'utf8'));
        throw new Error('rollback');
      })
      .catch((e: Error) => {
        if (e.message !== 'rollback') throw e;
      });
  });
});
