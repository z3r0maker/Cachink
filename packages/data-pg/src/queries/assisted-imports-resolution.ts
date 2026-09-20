/**
 * «Hazlo por mí» (N-18) — how a request ends. Every terminal transition is a
 * guarded UPDATE: the tenant's approve is `claimForApproval` (atomic on
 * `status = 'esperando_aprobacion'`, returns the mapped file for the apply),
 * reject/cancel and the 14-day expiry close it without applying, and the
 * 30-day LFPDPPP purge deletes resolved files. Staff never transitions.
 */

import { and, desc, eq, isNull, sql } from 'drizzle-orm';

import { assistedImportFiles, assistedImports } from '../schema/index';
import type { AssistedConn } from './assisted-imports';

/** The cron queries take any drizzle connection — the backoffice cron uses its
 * own `db()` (admin role, policy from its 0014 migration lets it see every
 * row; RLS is FORCEd, so the role's policy is what scopes the sweep). */
type SqlConn = AssistedConn;

async function run(conn: SqlConn, query: ReturnType<typeof sql>): Promise<unknown[]> {
  return conn.execute(query) as Promise<unknown[]>;
}

/**
 * The tenant's approve step, part 1: atomically claim the request. True with
 * the mapped file only while `status = 'esperando_aprobacion'`; the caller
 * applies the import and finishes with `finishApproval`. A failed apply must
 * roll the claim back with it — run both in one transaction.
 */
export async function claimForApproval(
  conn: AssistedConn,
  businessId: string,
): Promise<{
  readonly id: string;
  readonly plantilla: 'productos' | 'clientes';
  readonly file: { filename: string; bytes: Buffer };
} | null> {
  const stamp = new Date().toISOString();
  const rows = await conn
    .update(assistedImports)
    .set({ status: 'aplicada', resolvedAt: stamp, updatedAt: stamp })
    .where(
      and(
        eq(assistedImports.businessId, businessId),
        eq(assistedImports.status, 'esperando_aprobacion'),
        isNull(assistedImports.deletedAt),
      ),
    )
    .returning({ id: assistedImports.id, plantilla: assistedImports.plantilla });
  const row = rows[0];
  if (row === undefined) return null;
  if (row.plantilla !== 'productos' && row.plantilla !== 'clientes') return null;
  const file = await archivoMapeado(conn, row.id);
  return file === null ? null : { id: row.id, plantilla: row.plantilla, file };
}

/** The staff-mapped file the claim hands the apply step (latest, by role). */
async function archivoMapeado(
  conn: AssistedConn,
  assistedImportId: string,
): Promise<{ filename: string; bytes: Buffer } | null> {
  const [file] = await conn
    .select({ filename: assistedImportFiles.filename, bytes: assistedImportFiles.bytes })
    .from(assistedImportFiles)
    .where(
      and(
        eq(assistedImportFiles.assistedImportId, assistedImportId),
        eq(assistedImportFiles.role, 'mapeado'),
      ),
    )
    .orderBy(desc(assistedImportFiles.uploadedAt))
    .limit(1);
  return file === undefined ? null : { filename: file.filename, bytes: Buffer.from(file.bytes) };
}

/** The tenant's reject (or cancel of a `revision` request); false if not theirs to decide. */
export async function rejectAssistedImport(
  conn: AssistedConn,
  businessId: string,
): Promise<boolean> {
  const stamp = new Date().toISOString();
  const rows = await conn
    .update(assistedImports)
    .set({ status: 'rechazada', resolvedAt: stamp, updatedAt: stamp })
    .where(
      and(
        eq(assistedImports.businessId, businessId),
        sql`${assistedImports.status} IN ('revision', 'esperando_aprobacion')`,
        isNull(assistedImports.deletedAt),
      ),
    )
    .returning({ id: assistedImports.id });
  return rows.length > 0;
}

/** Cron: requests awaiting the tenant for 14+ days expire. Returns how many. */
export async function expireStaleAssistedImports(conn: SqlConn): Promise<number> {
  const rows = await run(
    conn,
    sql`UPDATE assisted_imports SET status = 'expirada', resolved_at = now(), updated_at = now()
         WHERE status = 'esperando_aprobacion'
           AND updated_at < now() - interval '14 days'
         RETURNING 1`,
  );
  return rows.length;
}

/** Cron (LFPDPPP): purge files of rows resolved 30+ days ago. Returns how many files. */
export async function purgeResolvedAssistedImportFiles(conn: SqlConn): Promise<number> {
  const rows = await run(
    conn,
    sql`DELETE FROM assisted_import_files f
         USING assisted_imports a
         WHERE f.assisted_import_id = a.id
           AND a.resolved_at IS NOT NULL
           AND a.resolved_at < now() - interval '30 days'
           AND f.id IS NOT NULL
         RETURNING f.id`,
  );
  // Stamp every due row once, files or not — the purge is idempotent and the
  // stamp is what the cron's log line reads.
  await run(
    conn,
    sql`UPDATE assisted_imports SET files_purged_at = now(), updated_at = now()
         WHERE resolved_at < now() - interval '30 days'
           AND files_purged_at IS NULL`,
  );
  return rows.length;
}
