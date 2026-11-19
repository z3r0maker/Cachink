import { randomUUID } from 'node:crypto';

import type { NuevaSolicitud, PresupuestoRepository } from '@xangarro/application/corp';
import {
  CATEGORIAS_GASTO,
  esCategoriaGasto,
  type CategoriaGasto,
  type Montos,
  type Presupuesto,
  type SolicitudGasto,
} from '@xangarro/domain/corp';
import { and, asc, eq, sql } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import {
  budgetAnswers,
  budgetLines,
  budgets,
  spendRequestAnswers,
  spendRequests,
} from '../schema/presupuesto.js';

/**
 * Presupuesto's storage (E-22). Append-only; the triggers in 0014_zz refuse
 * what the use cases already do (a second budget for a quarter, a founder
 * answering their own), so a bug in the console cannot approve with one.
 */
const ahora = () => new Date().toISOString();

const bigintDe = (value: unknown, que: string): bigint => {
  if (typeof value !== 'bigint') throw new Error(`corp presupuesto: ${que} is not bigint`);
  return value;
};

function categoriaDe(value: string): CategoriaGasto {
  if (!esCategoriaGasto(value)) throw new Error(`corp presupuesto: «${value}» is no category`);
  return value;
}

function montosDe(id: string, lines: readonly { categoria: string; monto: unknown }[]): Montos {
  const m = Object.fromEntries(CATEGORIAS_GASTO.map((c) => [c, 0n])) as Record<
    CategoriaGasto,
    bigint
  >;
  for (const l of lines) m[categoriaDe(l.categoria)] = bigintDe(l.monto, `line of ${id}`);
  return m;
}

export async function listarPresupuestos(db: CorpDb): Promise<readonly Presupuesto[]> {
  const [rows, lines] = await Promise.all([
    db
      .select({ b: budgets, a: budgetAnswers })
      .from(budgets)
      .leftJoin(budgetAnswers, eq(budgetAnswers.budgetId, budgets.id))
      .orderBy(asc(budgets.preparedAt)),
    db.select().from(budgetLines),
  ]);
  return rows.map(({ b, a }) => ({
    id: b.id,
    trimestre: b.quarter,
    montos: montosDe(
      b.id,
      lines.filter((l) => l.budgetId === b.id),
    ),
    preparadoPor: b.preparedBy,
    preparadoAt: b.preparedAt,
    respuesta: a === null ? null : { kind: a.kind, founderId: a.founderId, at: a.at },
  }));
}

type Fila = {
  r: typeof spendRequests.$inferSelect;
  a: typeof spendRequestAnswers.$inferSelect | null;
};

function solicitudDe({ r, a }: Fila): SolicitudGasto {
  return {
    id: r.id,
    periodo: r.period,
    founderId: r.founderId,
    concepto: r.concepto,
    categoria: categoriaDe(r.categoria),
    monto: bigintDe(r.monto, `monto of ${r.id}`),
    automatica: r.automatica,
    at: r.at,
    respuesta:
      a === null
        ? null
        : {
            kind: a.kind,
            monto: a.monto === null ? null : bigintDe(a.monto, `answer of ${r.id}`),
            founderId: a.founderId,
            at: a.at,
          },
  };
}

/** Every request (or one month's), oldest first. */
export async function listarSolicitudes(
  db: CorpDb,
  periodo?: string,
): Promise<readonly SolicitudGasto[]> {
  const rows = await db
    .select({ r: spendRequests, a: spendRequestAnswers })
    .from(spendRequests)
    .leftJoin(spendRequestAnswers, eq(spendRequestAnswers.requestId, spendRequests.id))
    .where(periodo === undefined ? undefined : eq(spendRequests.period, periodo))
    .orderBy(asc(spendRequests.at));
  return rows.map(solicitudDe);
}

async function preparar(db: CorpDb, p: Parameters<PresupuestoRepository['preparar']>[0]) {
  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx
      .insert(budgets)
      .values({ id, quarter: p.trimestre, preparedBy: p.founderId, preparedAt: ahora() });
    await tx
      .insert(budgetLines)
      .values(CATEGORIAS_GASTO.map((c) => ({ budgetId: id, categoria: c, monto: p.montos[c] })));
  });
  return id;
}

/** Reads the founder's month under a lock, so `decidir` sees every request before this one. */
async function pedir(
  db: CorpDb,
  s: NuevaSolicitud,
  decidir: (delMes: readonly SolicitudGasto[]) => boolean,
): Promise<SolicitudGasto> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`corp.spend:${s.periodo}:${s.founderId}`}))`,
    );
    const rows = await tx
      .select({ r: spendRequests, a: spendRequestAnswers })
      .from(spendRequests)
      .leftJoin(spendRequestAnswers, eq(spendRequestAnswers.requestId, spendRequests.id))
      .where(and(eq(spendRequests.period, s.periodo), eq(spendRequests.founderId, s.founderId)));
    const fila = {
      ...s,
      id: randomUUID(),
      automatica: decidir(rows.map(solicitudDe)),
      at: ahora(),
    };
    await tx.insert(spendRequests).values({ ...fila, period: s.periodo });
    return { ...fila, respuesta: null };
  });
}

export function createPresupuestoRepository(db: CorpDb): PresupuestoRepository {
  return {
    presupuestos: () => listarPresupuestos(db),
    preparar: (p) => preparar(db, p),
    async responder(id, kind, founderId) {
      await db.insert(budgetAnswers).values({ budgetId: id, kind, founderId, at: ahora() });
    },
    solicitudes: () => listarSolicitudes(db),
    pedir: (s, decidir) => pedir(db, s, decidir),
    async responderSolicitud(id, r) {
      await db.insert(spendRequestAnswers).values({ requestId: id, ...r, at: ahora() });
    },
  };
}
