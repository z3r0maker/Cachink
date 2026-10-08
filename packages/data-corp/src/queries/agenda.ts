import type {
  AgendaRepository,
  DocumentoMeta,
  DocumentRepository,
  NuevoDocumento,
  ObligacionGuardada,
} from '@xangarro/application/corp';
import { newUlid } from '@xangarro/domain';
import { isTipoEvidencia } from '@xangarro/domain/corp';
import { and, asc, eq, inArray } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import { company, documents, obligations } from '../schema/agenda.js';

/**
 * The Agenda's and the Expediente's storage (E-04; ADR-126). Rows are parsed,
 * never asserted: an unknown evidence kind is a broken row.
 */
const COMPANY = 'mexia';
const now = () => new Date().toISOString();

type ObligationRow = typeof obligations.$inferSelect;

function toObligacion(r: ObligationRow): ObligacionGuardada {
  return {
    id: r.id,
    plantillaId: r.templateId,
    periodo: r.period,
    titulo: r.title,
    estado: r.status,
    sinPago: r.noPayment,
  };
}

const META = {
  id: documents.id,
  kind: documents.kind,
  filename: documents.filename,
  mime: documents.mime,
  sizeBytes: documents.sizeBytes,
  sha256: documents.sha256,
  obligationId: documents.obligationId,
  retainUntil: documents.retainUntil,
  supersedesId: documents.supersedesId,
  uploadedBy: documents.uploadedBy,
  uploadedAt: documents.uploadedAt,
} as const;

type MetaRow = Pick<typeof documents.$inferSelect, keyof typeof META>;

function toMeta(r: MetaRow): DocumentoMeta {
  if (!isTipoEvidencia(r.kind)) throw new Error(`corp document ${r.id} has kind ${r.kind}`);
  return {
    id: r.id,
    tipo: r.kind,
    nombre: r.filename,
    mime: r.mime,
    tamano: r.sizeBytes,
    sha256: r.sha256,
    obligacionId: r.obligationId,
    retenerHasta: r.retainUntil,
    reemplazaA: r.supersedesId,
    subidoPor: r.uploadedBy,
    subidoEn: r.uploadedAt,
  };
}

async function buscar(db: CorpDb, plantillaId: string, periodo: string) {
  const rows = await db
    .select()
    .from(obligations)
    .where(and(eq(obligations.templateId, plantillaId), eq(obligations.period, periodo)))
    .limit(1);
  return rows[0] === undefined ? null : toObligacion(rows[0]);
}

async function asegurar(
  db: CorpDb,
  plantillaId: string,
  periodo: string,
  titulo: string | null,
  founderId: string,
): Promise<ObligacionGuardada> {
  const at = now();
  await db
    .insert(obligations)
    .values({
      id: newUlid(),
      templateId: plantillaId,
      period: periodo,
      title: titulo,
      createdBy: founderId,
      createdAt: at,
      updatedBy: founderId,
      updatedAt: at,
    })
    .onConflictDoNothing();
  const row = await buscar(db, plantillaId, periodo);
  if (row === null) throw new Error(`corp obligation ${plantillaId}~${periodo} vanished`);
  return row;
}

async function cambiarEstado(
  db: CorpDb,
  id: string,
  estado: ObligacionGuardada['estado'],
  sinPago: boolean,
  founderId: string,
): Promise<ObligacionGuardada> {
  const rows = await db
    .update(obligations)
    .set({ status: estado, noPayment: sinPago, updatedBy: founderId, updatedAt: now() })
    .where(eq(obligations.id, id))
    .returning();
  if (rows[0] === undefined) throw new Error(`corp obligation ${id} not found`);
  return toObligacion(rows[0]);
}

export function createAgendaRepository(db: CorpDb): AgendaRepository {
  return {
    async inscripcionRfc() {
      const rows = await db.select().from(company).where(eq(company.id, COMPANY)).limit(1);
      return rows[0]?.inscripcionRfc ?? null;
    },
    async guardarInscripcion(fecha, founderId) {
      const set = { inscripcionRfc: fecha, updatedBy: founderId, updatedAt: now() };
      await db
        .insert(company)
        .values({ id: COMPANY, ...set })
        .onConflictDoUpdate({ target: company.id, set });
    },
    async obligaciones() {
      return (await db.select().from(obligations)).map(toObligacion);
    },
    buscar: (plantillaId, periodo) => buscar(db, plantillaId, periodo),
    asegurar: (plantillaId, periodo, titulo, founderId) =>
      asegurar(db, plantillaId, periodo, titulo, founderId),
    cambiarEstado: (id, estado, sinPago, founderId) =>
      cambiarEstado(db, id, estado, sinPago, founderId),
  };
}

export function createDocumentRepository(db: CorpDb): DocumentRepository {
  return {
    async guardar(doc: NuevoDocumento) {
      const id = newUlid();
      const rows = await db
        .insert(documents)
        .values({
          id,
          kind: doc.tipo,
          filename: doc.nombre,
          mime: doc.mime,
          sizeBytes: doc.contenido.byteLength,
          sha256: doc.sha256,
          content: Buffer.from(doc.contenido),
          obligationId: doc.obligacionId,
          retainUntil: doc.retenerHasta,
          uploadedBy: doc.subidoPor,
          uploadedAt: now(),
        })
        .returning(META);
      return toMeta(rows[0]!);
    },
    porObligacion: async (id) => (await documentosDe(db, [id])).get(id) ?? [],
  };
}

/** The current (not superseded) documents of each obligation, oldest first. */
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
  // A new version names the one it supersedes; both share the obligation.
  const superseded = new Set(
    rows.flatMap((r) => (r.supersedesId === null ? [] : [r.supersedesId])),
  );
  const out = new Map<string, DocumentoMeta[]>();
  for (const r of rows) {
    if (superseded.has(r.id)) continue;
    const meta = toMeta(r);
    const key = meta.obligacionId ?? '';
    out.set(key, [...(out.get(key) ?? []), meta]);
  }
  return out;
}

/** A document's bytes, for the download route. */
export async function contenidoDe(
  db: CorpDb,
  id: string,
): Promise<{ readonly meta: DocumentoMeta; readonly contenido: Buffer } | null> {
  const rows = await db
    .select({ ...META, content: documents.content })
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);
  const r = rows[0];
  return r === undefined ? null : { meta: toMeta(r), contenido: r.content };
}
