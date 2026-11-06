import type { Almacen, BlobStore, DocumentoPorMover } from '@xangarro/application/corp';
import { MAX_BYTES_EVIDENCIA } from '@xangarro/domain/corp';
import { and, asc, eq } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import { blobs, documents } from '../schema/agenda.js';

/**
 * The Postgres `BlobStore` (E-26, ADR-127 §5): `corp.blobs`, bytes by key.
 * The console may insert and read, never update or delete, and the primary
 * key refuses a second write under one key. A file here travelled in a
 * request to the console, so the 4 MB limit holds.
 */
export function createPgBlobStore(db: CorpDb): BlobStore {
  return {
    almacen: 'pg',
    maxBytes: MAX_BYTES_EVIDENCIA,
    async guardar(key, bytes) {
      await db.insert(blobs).values({ key, content: Buffer.from(bytes) });
    },
    async leer(key) {
      const rows = await db
        .select({ content: blobs.content })
        .from(blobs)
        .where(eq(blobs.key, key))
        .limit(1);
      const content = rows[0]?.content;
      return content === undefined ? null : new Uint8Array(content);
    },
  };
}

/** The documents whose bytes are still in `almacen`, oldest first (E-26's move). */
export async function documentosEnAlmacen(
  db: CorpDb,
  almacen: Almacen,
): Promise<readonly DocumentoPorMover[]> {
  return db
    .select({
      id: documents.id,
      blobKey: documents.blobKey,
      sha256: documents.sha256,
      mime: documents.mime,
    })
    .from(documents)
    .where(eq(documents.storage, almacen))
    .orderBy(asc(documents.uploadedAt), asc(documents.id));
}

/**
 * Points a document at the store that now holds its bytes. Only the move runs
 * this, as the schema's owner: the console's role cannot update documents.
 */
export async function marcarAlmacen(
  db: CorpDb,
  id: string,
  de: Almacen,
  a: Almacen,
): Promise<void> {
  await db
    .update(documents)
    .set({ storage: a })
    .where(and(eq(documents.id, id), eq(documents.storage, de)));
}
