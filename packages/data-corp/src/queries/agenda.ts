import type { AgendaRepository, ObligacionGuardada } from '@xangarro/application/corp';
import { newUlid } from '@xangarro/domain';
import { and, eq } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import { company, obligations } from '../schema/agenda.js';

/**
 * The Agenda's storage (E-04): MEXIA's SAT registration and each obligation
 * period a founder acted on.
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
