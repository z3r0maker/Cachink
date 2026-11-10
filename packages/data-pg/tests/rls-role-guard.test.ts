import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  assertRlsBoundRole,
  ensureRlsBoundRole,
  RlsBypassRoleError,
  type RoleProbe,
} from '../src/security/rls-role';

/**
 * The runtime guard on the connected role (audit F-02), without a database:
 * what it makes of Postgres's answer, and that a pool is asked once. The real
 * roles are in `rls-role-guard.integration.test.ts`.
 */
type Answer = Record<string, unknown>[] | Error;

/** A pool that answers the guard's one question from a script, and counts. */
function pool(...answers: Answer[]): RoleProbe & { asked: number } {
  const probe = {
    asked: 0,
    async execute() {
      const answer = answers[Math.min(probe.asked, answers.length - 1)];
      probe.asked += 1;
      if (answer instanceof Error) throw answer;
      return answer ?? [];
    },
  };
  return probe;
}

const APP = [{ rolname: 'xangarro_app', rolsuper: false, rolbypassrls: false }];
const SUPER = [{ rolname: 'postgres', rolsuper: true, rolbypassrls: true }];
const BYPASS = [{ rolname: 'service_role', rolsuper: false, rolbypassrls: true }];

const refusal = (attribute: string) => (e: unknown) =>
  e instanceof RlsBypassRoleError && e.code === 'RLS_BYPASS_ROLE' && e.attribute === attribute;

describe('assertRlsBoundRole', () => {
  it('passes a role that is neither superuser nor BYPASSRLS', async () => {
    await assertRlsBoundRole(pool(APP));
  });

  it('refuses a superuser, naming the role and the attribute', async () => {
    await assert.rejects(assertRlsBoundRole(pool(SUPER)), (e: unknown) => {
      assert.ok(refusal('SUPERUSER')(e));
      assert.match((e as Error).message, /postgres.*SUPERUSER/);
      return true;
    });
  });

  it('refuses BYPASSRLS on a role that is not a superuser', async () => {
    await assert.rejects(assertRlsBoundRole(pool(BYPASS)), refusal('BYPASSRLS'));
  });

  it('refuses when Postgres does not know the role: no answer is not a pass', async () => {
    await assert.rejects(assertRlsBoundRole(pool([])), refusal('UNKNOWN'));
  });

  it('parses the answer rather than trusting it: a value that is not false is a refusal', async () => {
    const odd = [{ rolname: 'xangarro_app', rolsuper: 'f', rolbypassrls: null }];
    await assert.rejects(assertRlsBoundRole(pool(odd)), refusal('UNKNOWN'));
  });
});

describe('ensureRlsBoundRole', () => {
  it('asks a pool once, however many transactions it then serves', async () => {
    const db = pool(APP);
    for (let i = 0; i < 5; i += 1) await ensureRlsBoundRole(db);
    assert.equal(db.asked, 1);
  });

  it('shares one question between the transactions that arrive together', async () => {
    const db = pool(APP);
    await Promise.all([ensureRlsBoundRole(db), ensureRlsBoundRole(db), ensureRlsBoundRole(db)]);
    assert.equal(db.asked, 1);
  });

  it('asks each pool for itself', async () => {
    const app = pool(APP);
    const exports = pool(SUPER);
    await ensureRlsBoundRole(app);
    await assert.rejects(ensureRlsBoundRole(exports), refusal('SUPERUSER'));
    await ensureRlsBoundRole(app);
    assert.deepEqual([app.asked, exports.asked], [1, 1]);
  });

  it('fails closed: a refused pool stays refused, without asking again', async () => {
    // Even if the role were fixed underneath it, this pool's connections were
    // opened as the role that bypasses RLS.
    const db = pool(SUPER, APP);
    await assert.rejects(ensureRlsBoundRole(db), refusal('SUPERUSER'));
    await assert.rejects(ensureRlsBoundRole(db), refusal('SUPERUSER'));
    assert.equal(db.asked, 1);
  });

  it('does not take an unanswered question for a verdict: the caller fails, the next one asks', async () => {
    const db = pool(new Error('CONNECT_TIMEOUT'), APP);
    await assert.rejects(ensureRlsBoundRole(db), /CONNECT_TIMEOUT/);
    await ensureRlsBoundRole(db);
    await ensureRlsBoundRole(db);
    assert.equal(db.asked, 2);
  });
});
