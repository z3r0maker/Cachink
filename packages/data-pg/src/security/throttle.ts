import type { FailurePolicy, ThrottleStore } from '@xangarro/auth-core';
import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';

/**
 * Throttling in Postgres (B-17): no new vendor, and it works across every
 * server instance. Keys are hashed (`throttleKey`, from auth-core), so the table never holds an email or
 * an IP — only `sha256("login:email:…")`.
 *
 * Every function returns **seconds to wait**; 0 means go.
 */
export { throttleKey, type FailurePolicy } from '@xangarro/auth-core';

async function seconds(db: Db, query: ReturnType<typeof sql>): Promise<number> {
  const [row] = await db.execute<{ wait: number | null }>(query);
  return Number(row?.wait ?? 0);
}

export const throttleWait = (db: Db, key: string) =>
  seconds(db, sql`SELECT xangarro.throttle_wait(${key}) AS wait`);

export const throttleFail = (db: Db, key: string, p: FailurePolicy) =>
  seconds(
    db,
    sql`SELECT xangarro.throttle_fail(${key}, ${p.max}::int, ${p.window}::int, ${p.lockout}::int) AS wait`,
  );

export const throttleTake = (db: Db, key: string, max: number, window: number) =>
  seconds(db, sql`SELECT xangarro.throttle_take(${key}, ${max}::int, ${window}::int) AS wait`);

export async function throttleClear(db: Db, key: string): Promise<void> {
  await db.execute(sql`SELECT xangarro.throttle_clear(${key})`);
}

/** `@xangarro/auth-core`'s `ThrottleStore` port over the functions above. */
export const throttleStore = (db: Db): ThrottleStore => ({
  wait: (key) => throttleWait(db, key),
  fail: (key, policy) => throttleFail(db, key, policy),
  clear: (key) => throttleClear(db, key),
});
