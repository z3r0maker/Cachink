import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'vitest';

/**
 * On hosted Supabase `auth.users` belongs to supabase_auth_admin and the
 * migrating `postgres` role holds no GRANT OPTION on it, so any migration that
 * grants on `auth` fails there. Reads go through pinned SECURITY DEFINER
 * functions instead (owner_email, tenant_fiscal, admin_user_email, …).
 * `local/` is the Docker-only compat layer and never runs on hosted.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const DIRS = [
  join(HERE, '..', 'drizzle'),
  join(HERE, '..', '..', '..', 'apps', 'backoffice', 'src', 'server', 'db', 'migrations'),
];
const GRANT_ON_AUTH =
  /\bGRANT\b[^;]*\bON\s+(?:TABLE\s+)?auth\.|\bGRANT\b[^;]*\bON\s+SCHEMA\s+auth\b/i;

function sqlFiles(dir: string): { name: string; body: string }[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .map((f) => ({ name: f, body: readFileSync(join(dir, f), 'utf8').replace(/--.*$/gm, '') }));
}

describe('hosted-safe migrations', () => {
  it('no migration that runs on hosted grants anything on the auth schema', () => {
    const offenders = DIRS.flatMap(sqlFiles)
      .filter((f) => GRANT_ON_AUTH.test(f.body))
      .map((f) => f.name);
    assert.deepEqual(offenders, []);
  });

  it('the pattern catches a table grant and a schema grant', () => {
    assert.ok(GRANT_ON_AUTH.test('GRANT SELECT (id, email) ON auth.users TO x;'));
    assert.ok(GRANT_ON_AUTH.test('GRANT USAGE ON SCHEMA auth TO x;'));
    assert.ok(!GRANT_ON_AUTH.test('REVOKE SELECT (id, email) ON auth.users FROM x;'));
  });
});
