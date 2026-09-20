import { desc, eq } from 'drizzle-orm';

import {
  assistedFileBytes,
  assistedFilesOf,
  markForApproval as guardedMarkForApproval,
  type AssistedFileMeta,
} from '@xangarro/data-pg';
import { assistedImportFiles, assistedImports } from '@xangarro/data-pg';

import type { Db, Tx } from './client';

/**
 * The console's read side of «Hazlo por mí» (N-18, data-pg 0026 + admin
 * 0014): cross-tenant triage of the `migracion` inbox items. Staff download
 * the tenant's files, map them to an N-16 template, upload the mapped file
 * and send the request to the tenant's approval — the one write path here,
 * audited at the action layer. Applying is the tenant's alone.
 */

export interface AssistedImportListItem {
  readonly id: string;
  readonly businessId: string;
  readonly status: string;
  readonly sistemaActual: string;
  readonly notas: string;
  readonly plantilla: string | null;
  readonly createdAt: string;
}

export type { AssistedFileMeta };

export function assistedImportsList(conn: Db) {
  return conn
    .select({
      id: assistedImports.id,
      businessId: assistedImports.businessId,
      status: assistedImports.status,
      sistemaActual: assistedImports.sistemaActual,
      notas: assistedImports.notas,
      plantilla: assistedImports.plantilla,
      createdAt: assistedImports.createdAt,
    })
    .from(assistedImports)
    .orderBy(desc(assistedImports.createdAt))
    .limit(100);
}

export function assistedImportDetail(conn: Db, id: string) {
  return conn
    .select({
      id: assistedImports.id,
      businessId: assistedImports.businessId,
      status: assistedImports.status,
      sistemaActual: assistedImports.sistemaActual,
      notas: assistedImports.notas,
      plantilla: assistedImports.plantilla,
      createdAt: assistedImports.createdAt,
    })
    .from(assistedImports)
    .where(eq(assistedImports.id, id))
    .limit(1);
}

export function filesOf(conn: Db, id: string) {
  return assistedFilesOf(conn, id);
}

export function fileBytes(conn: Db, fileId: string) {
  return assistedFileBytes(conn, fileId);
}

export function fileRow(conn: Db, fileId: string) {
  return conn
    .select({
      id: assistedImportFiles.id,
      filename: assistedImportFiles.filename,
      mime: assistedImportFiles.mime,
      businessId: assistedImportFiles.businessId,
    })
    .from(assistedImportFiles)
    .where(eq(assistedImportFiles.id, fileId))
    .limit(1);
}

/** Staff write: attach the mapped file and send for the tenant's approval. */
export function markForApproval(
  conn: Tx,
  input: {
    readonly id: string;
    readonly businessId: string;
    readonly plantilla: 'productos' | 'clientes';
    readonly file: { readonly filename: string; readonly mime: string; readonly bytes: Buffer };
  },
) {
  return guardedMarkForApproval(conn, input);
}
