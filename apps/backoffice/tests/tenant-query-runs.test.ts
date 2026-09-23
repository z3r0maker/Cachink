import assert from 'node:assert/strict';
import { createDb } from '@xangarro/data-pg';
import { describe, it } from 'vitest';

import { tenantSummariesQuery } from '@/server/db/tenants';

/**
 * The tenant list, compiled as one statement (N-06).
 *
 * `tenant-subqueries.test.ts` compiles each subquery on its own, and that is
 * exactly why it missed 42702 in production: an ambiguous column reference
 * cannot exist until the subqueries are joined together. This compiles the
 * real query — the whole point being that the failure lives in the seams.
 *
 * Three relations in this join expose a `business_id`, so every reference to
 * one must name its relation. Drizzle does that for a real column but not for
 * an aliased raw SQL field, which is the trap.
 */
const conn = createDb('postgres://user:pw@127.0.0.1:1/postgres');
const query = tenantSummariesQuery(conn, { onlyIds: undefined, after: null, limit: 51 });
const { sql } = query.toSQL();

describe('the tenant list query', () => {
  it('joins the owner-last-login subquery on a qualified column', () => {
    assert.match(sql, /"li"\."business_id" = "businesses"\."id"/);
  });

  it('selects that subquery last_login qualified too', () => {
    assert.match(sql, /"li"\."last_login"/);
  });

  it('leaves no bare business_id anywhere a relation is ambiguous', () => {
    // Inside the subqueries a bare `business_id` is correct — there is only
    // one relation in scope. Outside them it is 42702 waiting to happen, so
    // every `business_id` in the outer query must carry a relation name.
    const outer = sql
      .replace(/\(select[\s\S]*?\) "(?:ds|ow|li)"/g, '<subquery>')
      // Drop every properly qualified reference; whatever is left is a bug.
      .replace(/"\w+"\."business_id"/g, '<qualified>');
    assert.ok(
      !outer.includes('business_id'),
      `unqualified business_id in the outer query: ${outer}`,
    );
  });

  it('still reads every column the page renders', () => {
    for (const fragment of ['"businesses"."nombre"', 'owner_email', 'last_sync', 'last_login']) {
      assert.ok(sql.includes(fragment), `missing ${fragment}`);
    }
  });
});
