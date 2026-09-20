/**
 * «Hazlo por mí» (N-18) — the files of a request: tenant/staff reads and the
 * staff write that attaches the mapped file. Bytes are `bytea` in the tenant
 * DB (the N-19-ratified private pattern); reads stay RLS-scoped to the
 * caller's connection.
 */

import { and, eq } from 'drizzle-orm';

import { newUlid } from '@xangarro/domain';

import { assistedImportFiles, assistedImports } from '../schema/index';
import type { AssistedConn, AssistedFileMeta } from './assisted-imports';

/** File metadata for one request (no bytes) — both roles, oldest first. */
export async function assistedFilesOf(
  conn: AssistedConn,
  assistedImportId: string,
): Promise<readonly AssistedFileMeta[]> {
  const rows = await conn
    .select({
      id: assistedImportFiles.id,
      assistedImportId: assistedImportFiles.assistedImportId,
      role: assistedImportFiles.role,
      filename: assistedImportFiles.filename,
      mime: assistedImportFiles.mime,
      sizeBytes: assistedImportFiles.sizeBytes,
      uploadedAt: assistedImportFiles.uploadedAt,
    })
    .from(assistedImportFiles)
    .where(eq(assistedImportFiles.assistedImportId, assistedImportId))
    .orderBy(assistedImportFiles.uploadedAt);
  return rows;
}

/** File bytes by id (tenant-scoped through RLS on the caller's connection). */
export async function assistedFileBytes(
  conn: AssistedConn,
  fileId: string,
): Promise<{ filename: string; mime: string; bytes: Buffer } | null> {
  const [row] = await conn
    .select({
      filename: assistedImportFiles.filename,
      mime: assistedImportFiles.mime,
      bytes: assistedImportFiles.bytes,
    })
    .from(assistedImportFiles)
    .where(eq(assistedImportFiles.id, fileId));
  return row === undefined
    ? null
    : { filename: row.filename, mime: row.mime, bytes: Buffer.from(row.bytes) };
}

/**
 * Staff side: attach the mapped file and send the request to the tenant.
 * Guarded on `status = 'revision'` — false when already sent or resolved.
 */
export async function markForApproval(
  conn: AssistedConn,
  input: {
    readonly id: string;
    readonly businessId: string;
    readonly plantilla: 'productos' | 'clientes';
    readonly file: { readonly filename: string; readonly mime: string; readonly bytes: Buffer };
  },
): Promise<boolean> {
  const stamp = new Date().toISOString();
  const rows = await conn
    .update(assistedImports)
    .set({ status: 'esperando_aprobacion', plantilla: input.plantilla, updatedAt: stamp })
    .where(
      and(
        eq(assistedImports.id, input.id),
        eq(assistedImports.businessId, input.businessId),
        eq(assistedImports.status, 'revision'),
      ),
    )
    .returning({ id: assistedImports.id });
  if (rows.length === 0) return false;
  await conn.insert(assistedImportFiles).values({
    id: newUlid(),
    assistedImportId: input.id,
    businessId: input.businessId,
    role: 'mapeado',
    filename: input.file.filename,
    mime: input.file.mime,
    sizeBytes: input.file.bytes.byteLength,
    bytes: input.file.bytes,
    uploadedAt: stamp,
  });
  return true;
}
