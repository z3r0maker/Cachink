import type { CierreRepository } from '@xangarro/application/corp';
import type { EventoCierre, KindEventoCierre } from '@xangarro/domain/corp';
import { asc, eq, sql } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import { bankBalances, periodEvents } from '../schema/cierre.js';
import { closedPeriods, entries } from '../schema/ledger.js';

/**
 * Cierre del mes's storage (E-14). Closing writes the lock and its event
 * together; reopening goes through `corp.reabrir_periodo`, the one way a lock
 * is lifted (0013_zz). The triggers there refuse what the use cases already
 * do, so a bug in the console cannot reopen a month with one founder.
 */
const KINDS: readonly KindEventoCierre[] = [
  'cerrado',
  'reapertura_pedida',
  'reapertura_rechazada',
  'reabierto',
];

function kindDe(value: string): KindEventoCierre {
  const k = KINDS.find((x) => x === value);
  if (k === undefined) throw new Error(`corp cierre: «${value}» is not an event kind`);
  return k;
}

const bigintDe = (value: unknown, que: string): bigint => {
  if (typeof value !== 'bigint') throw new Error(`corp cierre: ${que} is not bigint`);
  return value;
};

const ahora = () => new Date().toISOString();

async function evento(
  db: CorpDb,
  periodo: string,
  kind: KindEventoCierre,
  founderId: string,
  motivo: string | null = null,
): Promise<void> {
  await db.insert(periodEvents).values({ period: periodo, kind, founderId, motivo, at: ahora() });
}

/** Every month's events (or one month's), oldest first: the history and each month's state. */
export async function eventosDeCierre(
  db: CorpDb,
  periodo?: string,
): Promise<ReadonlyMap<string, readonly EventoCierre[]>> {
  const rows = await db
    .select()
    .from(periodEvents)
    .where(periodo === undefined ? undefined : eq(periodEvents.period, periodo))
    .orderBy(asc(periodEvents.seq));
  const out = new Map<string, EventoCierre[]>();
  for (const r of rows) {
    const e = { kind: kindDe(r.kind), founderId: r.founderId, motivo: r.motivo, at: r.at };
    out.set(r.period, [...(out.get(r.period) ?? []), e]);
  }
  return out;
}

type Lecturas = Pick<
  CierreRepository,
  'cerrados' | 'eventos' | 'conMovimientos' | 'saldoConfirmado'
>;

function lecturas(db: CorpDb): Lecturas {
  return {
    async cerrados() {
      const rows = await db.select({ period: closedPeriods.period }).from(closedPeriods);
      return new Set(rows.map((r) => r.period));
    },
    async eventos(periodo) {
      return (await eventosDeCierre(db, periodo)).get(periodo) ?? [];
    },
    async conMovimientos() {
      const rows = await db
        .selectDistinct({ mes: sql<string>`to_char(${entries.fecha}, 'YYYY-MM')` })
        .from(entries);
      return new Set(rows.map((r) => String(r.mes)));
    },
    async saldoConfirmado(periodo) {
      const [row] = await db.select().from(bankBalances).where(eq(bankBalances.period, periodo));
      return row === undefined ? null : bigintDe(row.saldo, `saldo of ${periodo}`);
    },
  };
}

async function cerrar(db: CorpDb, periodo: string, founderId: string): Promise<void> {
  const at = ahora();
  await db.transaction(async (tx) => {
    await tx.insert(closedPeriods).values({ period: periodo, closedBy: founderId, closedAt: at });
    await tx
      .insert(periodEvents)
      .values({ period: periodo, kind: 'cerrado', founderId, motivo: null, at });
  });
}

async function confirmar(db: CorpDb, periodo: string, saldo: bigint, founderId: string) {
  const at = ahora();
  await db
    .insert(bankBalances)
    .values({ period: periodo, saldo, confirmedBy: founderId, confirmedAt: at })
    .onConflictDoUpdate({
      target: bankBalances.period,
      set: { saldo, confirmedBy: founderId, confirmedAt: at },
    });
}

export function createCierreRepository(db: CorpDb): CierreRepository {
  return {
    ...lecturas(db),
    cerrar: (periodo, founderId) => cerrar(db, periodo, founderId),
    pedirReabrir: (periodo, founderId, motivo) =>
      evento(db, periodo, 'reapertura_pedida', founderId, motivo),
    rechazar: (periodo, founderId) => evento(db, periodo, 'reapertura_rechazada', founderId),
    async reabrir(periodo, founderId) {
      await db.execute(sql`SELECT corp.reabrir_periodo(${periodo}, ${founderId}, ${ahora()})`);
    },
    confirmarSaldo: (periodo, saldo, founderId) => confirmar(db, periodo, saldo, founderId),
  };
}
