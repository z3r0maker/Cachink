import { randomUUID } from 'node:crypto';

import type { CodigosRepository } from '@xangarro/application/corp';
import {
  isAccountKey,
  type AccountKey,
  type ListaDeCodigos,
  type SumaDelTramo,
  type Tramo,
  type ValidacionDeCodigos,
} from '@xangarro/domain/corp';
import { and, asc, eq, gte, lt, sql } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import { accountCodeLists, accountCodes, accountCodeValidations } from '../schema/contador.js';
import { receivedInvoices } from '../schema/facturas.js';
import { entries, entryLines } from '../schema/ledger.js';
import { monthBounds } from './movimientos.js';

/**
 * The contador's export (E-43): the ledger summed per account over the three
 * stretches a balanza reads, the códigos agrupadores (append-only lists, the
 * newest counts) and the month's received XMLs. Rows are parsed, never
 * asserted.
 */
const ahora = () => new Date().toISOString();

const bigintDe = (value: unknown, que: string): bigint => {
  if (typeof value !== 'bigint') throw new Error(`corp contador: ${que} is not bigint`);
  return value;
};

const TRAMOS: readonly Tramo[] = ['anterior', 'ejercicio', 'mes'];

function tramoDe(value: unknown): Tramo {
  const t = TRAMOS.find((x) => x === value);
  if (t === undefined) throw new Error(`corp contador: «${String(value)}» is no stretch`);
  return t;
}

function bounds(mes: string): readonly [string, string] {
  const b = monthBounds(mes);
  if (b === null) throw new Error(`corp contador: «${mes}» is not a month`);
  return b;
}

/** Every account's debits and credits up to the month's end, by stretch. */
export async function sumasPorTramo(db: CorpDb, mes: string): Promise<readonly SumaDelTramo[]> {
  const [desde, hasta] = bounds(mes);
  const tramo = sql`CASE WHEN ${entries.fecha} < ${`${mes.slice(0, 4)}-01-01`}::date THEN 'anterior'
    WHEN ${entries.fecha} < ${desde}::date THEN 'ejercicio' ELSE 'mes' END`;
  const rows = await db
    .select({
      cuenta: entryLines.cuenta,
      tramo,
      debe: sql`sum(${entryLines.debe})::bigint`.mapWith(entryLines.debe),
      haber: sql`sum(${entryLines.haber})::bigint`.mapWith(entryLines.haber),
    })
    .from(entryLines)
    .innerJoin(entries, eq(entries.id, entryLines.entryId))
    .where(lt(entries.fecha, hasta))
    // By position: the stretch's days are parameters (see `sumasAl`).
    .groupBy(sql`1, 2`)
    .orderBy(asc(entryLines.cuenta));
  return rows.map((r) => ({
    cuenta: r.cuenta,
    tramo: tramoDe(r.tramo),
    debe: bigintDe(r.debe, `${r.cuenta} debe`),
    haber: bigintDe(r.haber, `${r.cuenta} haber`),
  }));
}

function cuentaDe(value: string): AccountKey {
  if (!isAccountKey(value)) throw new Error(`corp contador: «${value}» is no account`);
  return value;
}

async function listas(db: CorpDb): Promise<readonly ListaDeCodigos[]> {
  const [cabezas, codigos] = await Promise.all([
    db
      .select()
      .from(accountCodeLists)
      .orderBy(asc(accountCodeLists.capturedAt), asc(accountCodeLists.id)),
    db.select().from(accountCodes),
  ]);
  return cabezas.map((l) => ({
    id: l.id,
    codigos: new Map(
      codigos.filter((c) => c.listId === l.id).map((c) => [cuentaDe(c.account), c.code] as const),
    ),
    capturadaPor: l.capturedBy,
    capturadaAt: new Date(l.capturedAt).toISOString(),
  }));
}

async function validaciones(db: CorpDb): Promise<readonly ValidacionDeCodigos[]> {
  const rows = await db
    .select()
    .from(accountCodeValidations)
    .orderBy(asc(accountCodeValidations.markedAt));
  return rows.map((v) => ({
    id: v.id,
    listaId: v.listId,
    validadaEl: v.validatedOn,
    marcadaPor: v.markedBy,
    marcadaAt: new Date(v.markedAt).toISOString(),
  }));
}

async function guardar(db: CorpDb, l: Parameters<CodigosRepository['guardar']>[0]) {
  const lista = { id: randomUUID(), capturedBy: l.founderId, capturedAt: ahora() };
  await db.transaction(async (tx) => {
    await tx.insert(accountCodeLists).values(lista);
    if (l.codigos.size > 0)
      await tx
        .insert(accountCodes)
        .values([...l.codigos].map(([account, code]) => ({ listId: lista.id, account, code })));
  });
  return {
    id: lista.id,
    codigos: l.codigos,
    capturadaPor: l.founderId,
    capturadaAt: lista.capturedAt,
  };
}

export function createCodigosRepository(db: CorpDb): CodigosRepository {
  return {
    listas: () => listas(db),
    validaciones: () => validaciones(db),
    guardar: (l) => guardar(db, l),
    async validar(v) {
      const fila = {
        id: randomUUID(),
        listId: v.listaId,
        validatedOn: v.fecha,
        markedBy: v.founderId,
        markedAt: ahora(),
      };
      await db.insert(accountCodeValidations).values(fila);
      return {
        id: fila.id,
        listaId: v.listaId,
        validadaEl: v.fecha,
        marcadaPor: v.founderId,
        marcadaAt: fila.markedAt,
      };
    },
  };
}

export interface RecibidaDelPaquete {
  readonly uuid: string;
  readonly archivo: string;
}

function registradasDelMes(mes: string) {
  const [desde, hasta] = bounds(mes);
  return and(
    eq(receivedInvoices.estado, 'registrada'),
    gte(receivedInvoices.fecha, desde),
    lt(receivedInvoices.fecha, hasta),
  );
}

/** The month's registered received invoices by issue date, without their bytes. */
export async function recibidasDelPaquete(
  db: CorpDb,
  mes: string,
): Promise<readonly RecibidaDelPaquete[]> {
  return db
    .select({ uuid: receivedInvoices.uuid, archivo: receivedInvoices.archivo })
    .from(receivedInvoices)
    .where(registradasDelMes(mes))
    .orderBy(asc(receivedInvoices.fecha), asc(receivedInvoices.uuid));
}

/** The same invoices with their XML, as uploaded. */
export async function xmlsDelPaquete(
  db: CorpDb,
  mes: string,
): Promise<readonly { readonly nombre: string; readonly xml: Uint8Array }[]> {
  const rows = await db
    .select({ archivo: receivedInvoices.archivo, xml: receivedInvoices.xml })
    .from(receivedInvoices)
    .where(registradasDelMes(mes))
    .orderBy(asc(receivedInvoices.fecha), asc(receivedInvoices.uuid));
  return rows.map((r) => ({ nombre: r.archivo, xml: new Uint8Array(r.xml) }));
}
