/**
 * «Hazlo por mí» request rows (N-18, migration 0026): types plus the
 * create/read lifecycle. The terminal transitions live in
 * `assisted-imports-resolution.ts`, the files in `assisted-imports-files.ts`.
 */

import { and, desc, eq, isNull, sql } from 'drizzle-orm';

import { newUlid } from '@xangarro/domain';
import { PORTAL_DEVICE_ID } from '@xangarro/domain/usage';

import type { Db } from '../client';
import { assistedImportFiles, assistedImports } from '../schema/index';

/** A drizzle db or tx handle — the tenant RLS rides on the caller's role. */
export type AssistedConn = Db | Parameters<Parameters<Db['transaction']>[0]>[0];

export interface AssistedImportRow {
  readonly id: string;
  readonly businessId: string;
  readonly status: 'revision' | 'esperando_aprobacion' | 'aplicada' | 'rechazada' | 'expirada';
  readonly sistemaActual: string;
  readonly notas: string;
  readonly plantilla: 'productos' | 'clientes' | null;
  readonly requestedBy: string | null;
  readonly resolvedAt: string | null;
  readonly filesPurgedAt: string | null;
  readonly createdAt: string;
}

export interface AssistedFileMeta {
  readonly id: string;
  readonly assistedImportId: string;
  readonly role: 'solicitud' | 'mapeado';
  readonly filename: string;
  readonly mime: string;
  readonly sizeBytes: number;
  readonly uploadedAt: string;
}

export interface NewAssistedImport {
  readonly businessId: string;
  readonly sistemaActual: string;
  readonly notas: string;
  readonly requestedBy: string | null;
  readonly files: readonly {
    readonly filename: string;
    readonly mime: string;
    readonly bytes: Uint8Array;
  }[];
}

const iso = (t: string | null): string | null => t;

function toRow(r: typeof assistedImports.$inferSelect): AssistedImportRow {
  return { ...r, resolvedAt: iso(r.resolvedAt), filesPurgedAt: iso(r.filesPurgedAt) };
}
/** The business's most recent request, whatever its state; null if none. */
export async function latestAssistedImport(
  conn: AssistedConn,
  businessId: string,
): Promise<AssistedImportRow | null> {
  const [row] = await conn
    .select()
    .from(assistedImports)
    .where(and(eq(assistedImports.businessId, businessId), isNull(assistedImports.deletedAt)))
    .orderBy(desc(assistedImports.createdAt))
    .limit(1);
  return row === undefined ? null : toRow(row);
}

/** True when a request is still in flight (the use case's one-at-a-time guard). */
export async function hasActiveAssistedImport(
  conn: AssistedConn,
  businessId: string,
): Promise<boolean> {
  const rows = await conn
    .select({ id: assistedImports.id })
    .from(assistedImports)
    .where(
      and(
        eq(assistedImports.businessId, businessId),
        sql`${assistedImports.status} IN ('revision', 'esperando_aprobacion')`,
        isNull(assistedImports.deletedAt),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function createAssistedImport(
  conn: AssistedConn,
  input: NewAssistedImport,
): Promise<AssistedImportRow> {
  const stamp = new Date().toISOString();
  const id = newUlid();
  const [row] = await conn
    .insert(assistedImports)
    .values({
      id,
      businessId: input.businessId,
      status: 'revision',
      sistemaActual: input.sistemaActual,
      notas: input.notas,
      requestedBy: input.requestedBy,
      resolvedAt: null,
      filesPurgedAt: null,
      deviceId: PORTAL_DEVICE_ID,
      createdByUserId: null,
      createdAt: stamp,
      updatedAt: stamp,
      deletedAt: null,
    })
    .returning();
  if (row === undefined) throw new Error('assisted import insert returned no row');
  for (const f of input.files) {
    await conn.insert(assistedImportFiles).values({
      id: newUlid(),
      assistedImportId: id,
      businessId: input.businessId,
      role: 'solicitud',
      filename: f.filename,
      mime: f.mime,
      sizeBytes: f.bytes.byteLength,
      // The column speaks Buffer (drizzle bytea); callers may hand us any
      // Uint8Array, so the view is made here, at the one boundary.
      bytes: Buffer.isBuffer(f.bytes) ? f.bytes : Buffer.from(f.bytes),
      uploadedAt: stamp,
    });
  }
  return toRow(row);
}

/** File metadata for one request (no bytes) — both roles, oldest first. */
