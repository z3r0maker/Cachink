/**
 * Retention purge (A-11, Q9): keeps the phone small by deleting transactional
 * rows the server has durably stored, once they are older than 90 days.
 *
 * Safety rules, all required:
 *   - "now" is the server's clock at the last pull, never the device clock —
 *     moving the phone's date forward deletes nothing;
 *   - never before a first successful pull;
 *   - only rows `accepted` with `serverSeq <= acknowledgedThrough`;
 *   - never a row with a later local edit still waiting to be pushed;
 *   - never a row the device still uses (see `retention-rules.ts`).
 * Movements are folded into `__stock_baseline` before deletion so stock does
 * not change. The work runs in one transaction. `VACUUM` is not run here:
 * SQLite reuses the freed pages, and a VACUUM would block the UI.
 */

import { sql, type SQL } from 'drizzle-orm';
import type { AppConfigRepository, CachinkDatabase } from '@xangarro/data';
import { RETENTION_DAYS, RETENTION_RULES, type RetentionRule } from './retention-rules.js';
import { SYNC_CONFIG_KEYS } from './sync-keys.js';

const DAY_MS = 86_400_000;

export interface PurgeOutcome {
  readonly skipped: 'never-pulled' | null;
  readonly cutoff: string | null;
  readonly deleted: Readonly<Record<string, number>>;
}

interface Bounds {
  readonly cutoff: string;
  readonly acknowledgedThrough: number;
  readonly pushHwm: number;
}

async function readBounds(appConfig: AppConfigRepository): Promise<Bounds | null> {
  const [lastPullAt, serverTime] = await Promise.all([
    appConfig.get(SYNC_CONFIG_KEYS.lastPullAt),
    appConfig.get(SYNC_CONFIG_KEYS.lastServerTime),
  ]);
  if (!lastPullAt || !serverTime) return null;
  const num = async (key: string): Promise<number> => Number((await appConfig.get(key)) ?? 0) || 0;
  return {
    cutoff: new Date(new Date(serverTime).getTime() - RETENTION_DAYS * DAY_MS).toISOString(),
    acknowledgedThrough: await num(SYNC_CONFIG_KEYS.acknowledgedThrough),
    pushHwm: await num(SYNC_CONFIG_KEYS.pushHwm),
  };
}

/** SQL predicate over alias `t` selecting the rows of `rule.table` that may go. */
function purgeable(rule: RetentionRule, b: Bounds): SQL {
  const table = rule.table;
  const parts: SQL[] = [
    sql`t.created_at < ${b.cutoff}`,
    sql`t.id IN (SELECT s.row_id FROM __sync_row_status s WHERE s.table_name = ${table}
      AND s.status = 'accepted' AND s.server_seq IS NOT NULL AND s.server_seq <= ${b.acknowledgedThrough})`,
    sql`NOT EXISTS (SELECT 1 FROM __cachink_change_log c WHERE c.table_name = ${table}
      AND c.row_id = t.id AND c.id > ${b.pushHwm})`,
  ];
  if (rule.keep) parts.push(sql.raw(`NOT (${rule.keep})`));
  for (const [child, column] of rule.guards ?? []) {
    parts.push(sql.raw(`NOT EXISTS (SELECT 1 FROM ${child} g WHERE g.${column} = t.id)`));
  }
  return sql.join(parts, sql` AND `);
}

async function foldMovementsIntoBaseline(db: CachinkDatabase, where: SQL): Promise<void> {
  await db.run(sql`INSERT INTO __stock_baseline (producto_id, cantidad)
    SELECT t.producto_id, SUM(CASE WHEN t.tipo = 'entrada' THEN t.cantidad ELSE -t.cantidad END)
    FROM inventory_movements t WHERE ${where} AND t.deleted_at IS NULL GROUP BY t.producto_id
    ON CONFLICT(producto_id) DO UPDATE SET cantidad = cantidad + excluded.cantidad`);
}

async function purgeTable(db: CachinkDatabase, rule: RetentionRule, b: Bounds): Promise<number> {
  const table = sql.raw(rule.table);
  const where = purgeable(rule, b);
  const row = await db.get<{ n: number }>(sql`SELECT COUNT(*) AS n FROM ${table} t WHERE ${where}`);
  const n = row?.n ?? 0;
  if (n === 0) return 0;
  if (rule.table === 'inventory_movements') await foldMovementsIntoBaseline(db, where);
  await db.run(sql`DELETE FROM ${table} AS t WHERE ${where}`);
  await db.run(sql`DELETE FROM __sync_row_status WHERE table_name = ${rule.table}
    AND row_id NOT IN (SELECT id FROM ${table})`);
  await db.run(sql`DELETE FROM __cachink_change_log WHERE table_name = ${rule.table}
    AND row_id NOT IN (SELECT id FROM ${table})`);
  return n;
}

export async function purgeAcknowledged(deps: {
  readonly db: CachinkDatabase;
  readonly appConfig: AppConfigRepository;
}): Promise<PurgeOutcome> {
  const bounds = await readBounds(deps.appConfig);
  if (!bounds) return { skipped: 'never-pulled', cutoff: null, deleted: {} };
  const deleted: Record<string, number> = {};
  await deps.db.run(sql`BEGIN`);
  try {
    for (const rule of RETENTION_RULES) {
      const n = await purgeTable(deps.db, rule, bounds);
      if (n > 0) deleted[rule.table] = n;
    }
    await deps.db.run(sql`COMMIT`);
  } catch (e) {
    await deps.db.run(sql`ROLLBACK`);
    throw e;
  }
  return { skipped: null, cutoff: bounds.cutoff, deleted };
}
