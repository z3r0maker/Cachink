import type {
  Almacen,
  BlobStore,
  DocumentoMeta,
  DocumentRepository,
  NuevoDocumento,
} from '@xangarro/application/corp';
import { newUlid } from '@xangarro/domain';
import { isCarpeta, isTipoEvidencia } from '@xangarro/domain/corp';
import { asc, eq, inArray } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import { documents } from '../schema/agenda.js';

/**
 * The Expediente's storage (E-05, ADR-127): every kept file's metadata, and
 * where its bytes are. The bytes themselves sit in a `BlobStore` (E-26).
 * Rows are parsed, never asserted: an unknown kind, folder or store is a
 * broken row.
 */
const META = {
  id: documents.id,
  kind: documents.kind,
  folder: documents.folder,
  title: documents.title,
  period: documents.period,
  filename: documents.filename,
  mime: documents.mime,
  sizeBytes: documents.sizeBytes,
  sha256: documents.sha256,
  storage: documents.storage,
  blobKey: documents.blobKey,
  obligationId: documents.obligationId,
  entryId: documents.entryId,
  retainUntil: documents.retainUntil,
  supersedesId: documents.supersedesId,
  uploadedBy: documents.uploadedBy,
  uploadedAt: documents.uploadedAt,
} as const;

type MetaRow = Pick<typeof documents.$inferSelect, keyof typeof META>;

const isAlmacen = (s: string): s is Almacen => s === 'pg' || s === 'azure';

function toMeta(r: MetaRow): DocumentoMeta {
  if (!isTipoEvidencia(r.kind)) throw new Error(`corp document ${r.id} has kind ${r.kind}`);
  if (!isCarpeta(r.folder)) throw new Error(`corp document ${r.id} has folder ${r.folder}`);
  if (!isAlmacen(r.storage)) throw new Error(`corp document ${r.id} has storage ${r.storage}`);
  return {
    id: r.id,
    almacen: r.storage,
    blobKey: r.blobKey,
    tipo: r.kind,
    carpeta: r.folder,
    titulo: r.title,
    periodo: r.period,
    nombre: r.filename,
    mime: r.mime,
    tamano: r.sizeBytes,
    sha256: r.sha256,
    obligacionId: r.obligationId,
    entryId: r.entryId,
    retenerHasta: r.retainUntil,
    reemplazaA: r.supersedesId,
    subidoPor: r.uploadedBy,
    subidoEn: r.uploadedAt,
  };
}

/** The bytes first, then the row: a row never points at a missing file. */
async function guardar(db: CorpDb, store: BlobStore, doc: NuevoDocumento): Promise<DocumentoMeta> {
  const id = newUlid();
  await store.guardar(id, doc.contenido, doc.mime);
  const rows = await db
    .insert(documents)
    .values({
      id,
      kind: doc.tipo,
      folder: doc.carpeta,
      title: doc.titulo,
      period: doc.periodo,
      filename: doc.nombre,
      mime: doc.mime,
      sizeBytes: doc.contenido.byteLength,
      sha256: doc.sha256,
      storage: store.almacen,
      blobKey: id,
      obligationId: doc.obligacionId,
      entryId: doc.entryId,
      retainUntil: doc.retenerHasta,
      supersedesId: doc.reemplazaA,
      uploadedBy: doc.subidoPor,
      uploadedAt: new Date().toISOString(),
    })
    .returning(META);
  const row = rows[0];
  if (row === undefined) throw new Error('corp document insert returned nothing');
  return toMeta(row);
}

/** `store` is where new files go; existing ones stay where their row says. */
export function createDocumentRepository(db: CorpDb, store: BlobStore): DocumentRepository {
  return {
    maxBytes: store.maxBytes,
    guardar: (doc) => guardar(db, store, doc),
    porObligacion: async (id) => (await documentosDe(db, [id])).get(id) ?? [],
    async porId(id) {
      const rows = await db.select(META).from(documents).where(eq(documents.id, id)).limit(1);
      return rows[0] === undefined ? null : toMeta(rows[0]);
    },
    async reemplazadoPor(id) {
      const rows = await db
        .select({ id: documents.id })
        .from(documents)
        .where(eq(documents.supersedesId, id))
        .limit(1);
      return rows[0]?.id ?? null;
    },
  };
}

/** Every kept document's metadata, every version, oldest first. */
export async function listarDocumentos(db: CorpDb): Promise<readonly DocumentoMeta[]> {
  const rows = await db
    .select(META)
    .from(documents)
    .orderBy(asc(documents.uploadedAt), asc(documents.id));
  return rows.map(toMeta);
}

const vigentesDe = (rows: readonly DocumentoMeta[]) => {
  // A new version names the one it supersedes; both share the obligation or the entry.
  const superseded = new Set(rows.flatMap((r) => (r.reemplazaA === null ? [] : [r.reemplazaA])));
  return rows.filter((r) => !superseded.has(r.id));
};

function agrupar(
  rows: readonly DocumentoMeta[],
  key: (d: DocumentoMeta) => string | null,
): ReadonlyMap<string, readonly DocumentoMeta[]> {
  const out = new Map<string, DocumentoMeta[]>();
  for (const d of vigentesDe(rows)) {
    const k = key(d) ?? '';
    out.set(k, [...(out.get(k) ?? []), d]);
  }
  return out;
}

/** The current documents of each obligation, oldest first. */
export async function documentosDe(
  db: CorpDb,
  obligationIds: readonly string[],
): Promise<ReadonlyMap<string, readonly DocumentoMeta[]>> {
  if (obligationIds.length === 0) return new Map();
  const rows = await db
    .select(META)
    .from(documents)
    .where(inArray(documents.obligationId, [...obligationIds]))
    .orderBy(asc(documents.uploadedAt));
  return agrupar(rows.map(toMeta), (d) => d.obligacionId);
}

/** The current documents of a ledger entry (its factura, its statement line). */
export async function documentosDelMovimiento(
  db: CorpDb,
  entryId: string,
): Promise<readonly DocumentoMeta[]> {
  const rows = await db
    .select(META)
    .from(documents)
    .where(eq(documents.entryId, entryId))
    .orderBy(asc(documents.uploadedAt));
  return vigentesDe(rows.map(toMeta));
}
