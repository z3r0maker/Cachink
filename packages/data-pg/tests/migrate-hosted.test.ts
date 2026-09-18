import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, it } from 'vitest';

import { connectionHint, loadEnvLocal, maskUrl, urlProblem } from '../scripts/hosted/env';
import {
  checksum,
  listMigrations,
  MIGRATION_SETS,
  MigrationPlanError,
  pendingMigrations,
} from '../scripts/hosted/plan';
import { LOGIN_ROLES, passwordProblem, scramVerifier } from '../scripts/hosted/roles';

/**
 * The pure half of `db:migrate:hosted` (B-01). The database half — roles,
 * ledger, rollback, drift against a real Postgres — is proven by
 * `pnpm db:migrate:hosted:selftest` on a throwaway container.
 */
const REPO = resolve(import.meta.dirname, '../../..');
const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function tree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'mig-'));
  dirs.push(root);
  for (const { dir } of MIGRATION_SETS) mkdirSync(join(root, dir), { recursive: true });
  for (const [path, body] of Object.entries(files)) writeFileSync(join(root, path), body);
  return root;
}

describe('listMigrations', () => {
  it('orders hosted, then data-pg, then admin, each by file name', () => {
    const root = tree({
      'apps/admin/src/server/db/migrations/0001_staff.sql': 'a',
      'packages/data-pg/drizzle/0001_users_active.sql': 'c',
      'packages/data-pg/drizzle/0001_rls.sql': 'b',
      'packages/data-pg/drizzle/README.md': 'not sql',
      'packages/data-pg/hosted/0000_x.sql': 'h',
    });
    assert.deepEqual(
      listMigrations(root).map((f) => f.name),
      [
        'hosted/0000_x.sql',
        'data-pg/0001_rls.sql',
        'data-pg/0001_users_active.sql',
        'admin/0001_staff.sql',
      ],
    );
  });

  it('covers every SQL file of the real repository, and never local/', () => {
    const names = listMigrations(REPO).map((f) => f.name);
    const drizzle = readdirSync(join(REPO, 'packages/data-pg/drizzle')).filter((f) =>
      f.endsWith('.sql'),
    );
    assert.equal(names.filter((n) => n.startsWith('data-pg/')).length, drizzle.length);
    assert.ok(names[0]?.startsWith('hosted/'));
    assert.ok(!names.some((n) => n.includes('supabase_compat')));
  });
});

describe('pendingMigrations', () => {
  const root = () =>
    tree({
      'packages/data-pg/drizzle/0000_a.sql': 'A',
      'packages/data-pg/drizzle/0001_b.sql': 'B',
    });

  it('returns everything on a fresh database and nothing once all is applied', () => {
    const files = listMigrations(root());
    assert.equal(pendingMigrations(files, []).length, 2);
    assert.deepEqual(pendingMigrations(files, files), []);
  });

  it('returns only the files the ledger lacks', () => {
    const files = listMigrations(root());
    const first = files.slice(0, 1);
    assert.deepEqual(
      pendingMigrations(files, first).map((f) => f.name),
      ['data-pg/0001_b.sql'],
    );
  });

  it('refuses an applied file whose bytes changed', () => {
    const files = listMigrations(root());
    const drifted = [{ name: 'data-pg/0000_a.sql', checksum: checksum('A edited') }];
    assert.throws(
      () => pendingMigrations(files, drifted),
      (e: unknown) => e instanceof MigrationPlanError && e.code === 'CHECKSUM_MISMATCH',
    );
  });

  it('refuses an applied file that left the repository', () => {
    const files = listMigrations(root());
    assert.throws(
      () => pendingMigrations(files, [{ name: 'data-pg/0099_gone.sql', checksum: checksum('x') }]),
      (e: unknown) => e instanceof MigrationPlanError && e.code === 'MISSING_FILE',
    );
  });
});

describe('roles', () => {
  it('provisions exactly the four app logins', () => {
    assert.deepEqual(
      LOGIN_ROLES.map((r) => r.role),
      ['xangarro_app', 'xangarro_billing', 'xangarro_metering', 'xangarro_admin'],
    );
  });

  it('accepts an openssl base64 password and rejects weak or odd ones', () => {
    assert.equal(passwordProblem('q3J9v0x2Zb7mT1kLp8Wn4sYc6Hd5Rf0g+/aB='), null);
    assert.equal(passwordProblem(undefined), 'is not set');
    assert.equal(passwordProblem('short'), 'is shorter than 24 characters');
    assert.match(passwordProblem('has a space in it but is long enough') ?? '', /ASCII/);
  });

  it('sends a SCRAM verifier, never the password, salted afresh each time', () => {
    const password = 'q3J9v0x2Zb7mT1kLp8Wn4sYc6Hd5Rf0g';
    const v = scramVerifier(password);
    assert.match(
      v,
      /^SCRAM-SHA-256\$4096:[A-Za-z0-9+/=]{24}\$[A-Za-z0-9+/=]{44}:[A-Za-z0-9+/=]{44}$/,
    );
    assert.ok(!v.includes(password));
    assert.notEqual(v, scramVerifier(password));
    const salt = Buffer.alloc(16, 7);
    assert.equal(scramVerifier(password, salt), scramVerifier(password, salt));
  });
});

describe('env', () => {
  it('masks the password and drops the query', () => {
    assert.equal(
      maskUrl(
        'postgres://postgres.ref:s3cret@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require',
      ),
      'postgres://postgres.ref:***@aws-0-us-west-2.pooler.supabase.com:5432/postgres',
    );
    assert.equal(maskUrl('not a url'), '<unparseable URL>');
  });

  it('refuses the transaction pooler and a missing URL', () => {
    assert.equal(urlProblem('postgres://u:p@h:6543/postgres'), 'transaction-pooler');
    assert.equal(urlProblem(undefined), 'missing');
    assert.equal(urlProblem('postgres://u:p@db.ref.supabase.co:5432/postgres'), null);
  });

  it('loads .env.local without overriding the real environment', () => {
    const root = tree({});
    writeFileSync(
      join(root, '.env.local'),
      'SUPERUSER_URL=from-file\nXANGARRO_APP_PASSWORD=file\n',
    );
    const env: NodeJS.ProcessEnv = { SUPERUSER_URL: 'from-shell' };
    assert.equal(loadEnvLocal(join(root, '.env.local'), env), true);
    assert.equal(env.SUPERUSER_URL, 'from-shell');
    assert.equal(env.XANGARRO_APP_PASSWORD, 'file');
    assert.equal(loadEnvLocal(join(root, 'absent'), env), false);
  });

  it('hints at the Session pooler only for unreachable-host errors', () => {
    assert.match(connectionHint({ code: 'ENETUNREACH' }) ?? '', /Session pooler/);
    assert.equal(connectionHint({ code: '42501' }), null);
    assert.equal(connectionHint(new Error('boom')), null);
  });
});
