import type {
  CambiosRegistro,
  CorporativoRepository,
  EventoGuardado,
  Registro,
} from '@xangarro/application/corp';
import { newUlid } from '@xangarro/domain';
import { isCarpeta, type Certificado, type Socio } from '@xangarro/domain/corp';
import { asc, eq } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import { company } from '../schema/agenda.js';
import { certificates, registries, shareEvents } from '../schema/corporativo.js';

/**
 * The corporate book's storage (E-06). Rows are parsed, never asserted: a
 * partner other than 1 or 2, or an unknown folder, is a broken row.
 */
const now = () => new Date().toISOString();

function socio(v: number | null, what: string): Socio {
  if (v !== 1 && v !== 2) throw new Error(`corp ${what} has socio ${v}`);
  return v;
}

function toEvento(r: typeof shareEvents.$inferSelect): EventoGuardado {
  return {
    id: r.id,
    fecha: r.fecha,
    tipo: r.kind,
    de: r.fromSocio === null ? null : socio(r.fromSocio, `share event ${r.id}`),
    a: socio(r.toSocio, `share event ${r.id}`),
    acciones: r.shares,
    nota: r.note,
  };
}

function toRegistro(r: typeof registries.$inferSelect): Registro {
  if (!isCarpeta(r.folder)) throw new Error(`corp registry ${r.id} has folder ${r.folder}`);
  return {
    id: r.id,
    nombre: r.nombre,
    autoridad: r.autoridad,
    estado: r.estado,
    referencia: r.referencia,
    siguiente: r.siguiente,
    alDia: r.alDia,
    carpeta: r.folder,
    documentoId: r.documentId,
  };
}

const toCertificado = (r: typeof certificates.$inferSelect): Certificado => ({
  id: r.id,
  tipo: r.kind,
  titular: r.holder,
  serie: r.serial,
  vence: r.expiresOn,
});

async function actualizar(db: CorpDb, id: string, c: CambiosRegistro, founderId: string) {
  const rows = await db
    .update(registries)
    .set({
      estado: c.estado,
      referencia: c.referencia,
      siguiente: c.siguiente,
      alDia: c.alDia,
      documentId: c.documentoId,
      updatedBy: founderId,
      updatedAt: now(),
    })
    .where(eq(registries.id, id))
    .returning();
  if (rows[0] === undefined) throw new Error(`corp registry ${id} not found`);
  return toRegistro(rows[0]);
}

async function agregarEvento(
  db: CorpDb,
  e: Parameters<CorporativoRepository['agregarEvento']>[0],
  founderId: string,
): Promise<EventoGuardado> {
  const rows = await db
    .insert(shareEvents)
    .values({
      id: newUlid(),
      fecha: e.fecha,
      kind: e.tipo,
      fromSocio: e.de,
      toSocio: e.a,
      shares: e.acciones,
      note: e.nota,
      createdBy: founderId,
      createdAt: now(),
    })
    .returning();
  return toEvento(rows[0]!);
}

async function guardarAdministrador(db: CorpDb, s: Socio, founderId: string) {
  const set = { administrador: s, updatedBy: founderId, updatedAt: now() };
  await db
    .insert(company)
    .values({ id: 'mexia', ...set })
    .onConflictDoUpdate({ target: company.id, set });
}

async function agregarCertificado(
  db: CorpDb,
  c: Omit<Certificado, 'id'>,
  founderId: string,
): Promise<Certificado> {
  const rows = await db
    .insert(certificates)
    .values({
      id: newUlid(),
      kind: c.tipo,
      holder: c.titular,
      serial: c.serie,
      expiresOn: c.vence,
      createdBy: founderId,
      createdAt: now(),
    })
    .returning();
  return toCertificado(rows[0]!);
}

async function administrador(db: CorpDb): Promise<Socio | null> {
  const rows = await db.select({ a: company.administrador }).from(company).limit(1);
  const a = rows[0]?.a ?? null;
  return a === null ? null : socio(a, 'company administrador');
}

export function createCorporativoRepository(db: CorpDb): CorporativoRepository {
  return {
    eventos: async () =>
      (
        await db
          .select()
          .from(shareEvents)
          .orderBy(asc(shareEvents.fecha), asc(shareEvents.createdAt))
      ).map(toEvento),
    agregarEvento: (e, founderId) => agregarEvento(db, e, founderId),
    registros: async () =>
      (await db.select().from(registries).orderBy(asc(registries.sortOrder))).map(toRegistro),
    registro: async (id) => {
      const rows = await db.select().from(registries).where(eq(registries.id, id)).limit(1);
      return rows[0] === undefined ? null : toRegistro(rows[0]);
    },
    actualizarRegistro: (id, c, founderId) => actualizar(db, id, c, founderId),
    certificados: async () =>
      (await db.select().from(certificates).orderBy(asc(certificates.createdAt))).map(
        toCertificado,
      ),
    agregarCertificado: (c, founderId) => agregarCertificado(db, c, founderId),
    administrador: () => administrador(db),
    guardarAdministrador: (s, founderId) => guardarAdministrador(db, s, founderId),
  };
}
