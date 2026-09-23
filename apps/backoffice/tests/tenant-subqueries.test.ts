import assert from 'node:assert/strict';
import { createDb } from '@xangarro/data-pg';
import { describe, it } from 'vitest';

import { deviceStats, ownerEmails, ownerLastLogin } from '@/server/db/tenant-queries';

/**
 * The tenant list joins three subqueries, and every raw `sql` field one of
 * them exposes needs `.as(alias)` — Drizzle refuses to reference an unaliased
 * raw field from outside and throws while *building* the statement, so
 * `/tenants` 500s before any I/O (`STORE_FAILED`, 2026-09-22).
 *
 * `postgres()` connects lazily, so compiling with `.toSQL()` needs no
 * database: this is the check the in-memory `TenantDirectory` suites, which
 * never build SQL at all, cannot make.
 */
const conn = createDb('postgres://user:pw@127.0.0.1:1/postgres');

describe('tenant list subqueries', () => {
  it('builds a reference to every field of the owner-last-login subquery', () => {
    const li = ownerLastLogin(conn);
    const built = conn.select({ businessId: li.businessId, lastLogin: li.lastLogin }).from(li);
    assert.doesNotThrow(() => built.toSQL());
    const { sql } = built.toSQL();
    assert.match(sql, /as "business_id"/);
    assert.match(sql, /as "last_login"/);
    assert.match(sql, /xangarro\.owner_last_login\(\)/);
  });

  it('builds the device-stats and owner-email references the same way', () => {
    const ds = deviceStats(conn);
    const ow = ownerEmails(conn);
    assert.match(conn.select({ t: ds.total, s: ds.lastSync }).from(ds).toSQL().sql, /as "total"/);
    assert.match(conn.select({ e: ow.email }).from(ow).toSQL().sql, /as "owner_email"/);
  });
});
