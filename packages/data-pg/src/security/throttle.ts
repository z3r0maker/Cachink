import { createHash } from 'node:crypto';

import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';

/**
 * Throttling in Postgres (B-17): no new vendor, and it works across every
 * server instance. Keys are hashed here, so the table never holds an email or
 * an IP — only `sha256("login:email:…")`.
 *
 * Every function returns **seconds to wait**; 0 means go.
 */
export const throttleKey = (...parts: readonly string[]): string =>
  createHash('sha256').update(parts.join(':')).digest('hex');

async function seconds(db: Db, query: ReturnType<typeof sql>): Promise<number> {
  const [row] = await db.execute<{ wait: number | null }>(query);
  return Number(row?.wait ?? 0);
}

export const throttleWait = (db: Db, key: string) =>
  seconds(db, sql`SELECT xangarro.throttle_wait(${key}) AS wait`);

export interface FailurePolicy {
  readonly max: number;
  /** Seconds the failures are counted over. */
  readonly window: number;
  /** Seconds the key is locked once `max` is reached. */
  readonly lockout: number;
}

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
