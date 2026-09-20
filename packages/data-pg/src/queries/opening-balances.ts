/**
 * Opening balances (C-20, 0025): the header and the per-cliente lines, read
 * and written inside the tenant transaction. `lockedAt` is the read-only
 * gate (N-17's owner lock); the queries expose it, the use cases enforce it.
 */

import { and, eq, isNull } from 'drizzle-orm';

import { newUlid } from '@xangarro/domain';
import { PORTAL_DEVICE_ID } from '@xangarro/domain/usage';

import { openingBalanceClients, openingBalances } from '../schema/index.js';
import type { Db } from '../client.js';

type Conn = Db | Parameters<Parameters<Db['transaction']>[0]>[0];

export interface OpeningBalanceRow {
  readonly id: string;
  readonly businessId: string;
  readonly fechaApertura: string;
  readonly cajaCentavos: bigint;
  readonly bancosCentavos: bigint;
  readonly lockedAt: string | null;
}

export interface OpeningBalanceClientRow {
  readonly id: string;
  readonly businessId: string;
  readonly clienteId: string;
  readonly saldoCentavos: bigint;
}

const iso = (t: Date | string | null): string | null =>
  t === null ? null : t instanceof Date ? t.toISOString() : t;

/** The business's opening balance, or null when none was captured yet. */
export async function openingBalanceOf(
  db: Conn,
  businessId: string,
): Promise<OpeningBalanceRow | null> {
  const [row] = await db
    .select()
    .from(openingBalances)
    .where(and(eq(openingBalances.businessId, businessId), isNull(openingBalances.deletedAt)));
  if (row === undefined) return null;
  return {
    id: row.id,
    businessId: row.businessId,
    fechaApertura: row.fechaApertura,
    cajaCentavos: row.cajaCentavos,
    bancosCentavos: row.bancosCentavos,
    lockedAt: iso(row.lockedAt),
  };
}

/** The per-cliente lines, ordered by cliente for a stable diff. */
export async function openingBalanceClientsOf(
  db: Conn,
  businessId: string,
): Promise<readonly OpeningBalanceClientRow[]> {
  const rows = await db
    .select()
    .from(openingBalanceClients)
    .where(
      and(
        eq(openingBalanceClients.businessId, businessId),
        isNull(openingBalanceClients.deletedAt),
      ),
    )
    .orderBy(openingBalanceClients.clienteId);
  return rows.map((r) => ({
    id: r.id,
    businessId: r.businessId,
    clienteId: r.clienteId,
    saldoCentavos: r.saldoCentavos,
  }));
}

export interface SaveOpeningBalanceInput {
  readonly id: string;
  readonly businessId: string;
  readonly fechaApertura: string;
  readonly cajaCentavos: bigint;
  readonly bancosCentavos: bigint;
  readonly lines: readonly { readonly clienteId: string; readonly saldoCentavos: bigint }[];
}

/**
 * Replace-style save in ONE statement set: upsert the header, soft-delete the
 * lines that left, upsert the rest. Same transaction as the caller's.
 */
/** Upsert the header; a re-save never touches the lock (the use case gates it). */
async function saveHeader(db: Conn, input: SaveOpeningBalanceInput): Promise<void> {
  const stamp = new Date().toISOString();
  await db
    .insert(openingBalances)
    .values({
      id: input.id,
      businessId: input.businessId,
      fechaApertura: input.fechaApertura,
      cajaCentavos: input.cajaCentavos,
      bancosCentavos: input.bancosCentavos,
      lockedAt: null,
      deviceId: PORTAL_DEVICE_ID,
      createdByUserId: null,
      createdAt: stamp,
      updatedAt: stamp,
      deletedAt: null,
    })
    .onConflictDoUpdate({
      target: openingBalances.id,
      set: {
        fechaApertura: input.fechaApertura,
        cajaCentavos: input.cajaCentavos,
        bancosCentavos: input.bancosCentavos,
        updatedAt: stamp,
        deletedAt: null,
      },
    });
}

/** Replace the lines: a cliente that left the import is soft-deleted. */
async function replaceLines(db: Conn, input: SaveOpeningBalanceInput): Promise<void> {
  const stamp = new Date().toISOString();
  const existing = await openingBalanceClientsOf(db, input.businessId);
  const wanted = new Map(input.lines.map((l) => [l.clienteId, l]));
  for (const row of existing) {
    if (!wanted.has(row.clienteId)) {
      await db
        .update(openingBalanceClients)
        .set({ deletedAt: stamp, updatedAt: stamp })
        .where(eq(openingBalanceClients.id, row.id));
    }
  }
  for (const line of input.lines) {
    const prior = existing.find((r) => r.clienteId === line.clienteId);
    if (prior !== undefined) {
      await db
        .update(openingBalanceClients)
        .set({ saldoCentavos: line.saldoCentavos, updatedAt: stamp, deletedAt: null })
        .where(eq(openingBalanceClients.id, prior.id));
    } else {
      await db.insert(openingBalanceClients).values({
        id: newUlid(),
        businessId: input.businessId,
        clienteId: line.clienteId,
        saldoCentavos: line.saldoCentavos,
        deviceId: PORTAL_DEVICE_ID,
        createdByUserId: null,
        createdAt: stamp,
        updatedAt: stamp,
        deletedAt: null,
      });
    }
  }
}

export async function saveOpeningBalance(db: Conn, input: SaveOpeningBalanceInput): Promise<void> {
  await saveHeader(db, input);
  await replaceLines(db, input);
}

/** N-17's explicit lock: the rows become read-only. False when already locked. */
export async function lockOpeningBalance(db: Conn, businessId: string): Promise<boolean> {
  const stamp = new Date().toISOString();
  const rows = await db
    .update(openingBalances)
    .set({ lockedAt: stamp, updatedAt: stamp })
    .where(and(eq(openingBalances.businessId, businessId), isNull(openingBalances.lockedAt)))
    .returning({ id: openingBalances.id });
  return rows.length > 0;
}
