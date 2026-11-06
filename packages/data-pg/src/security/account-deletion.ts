import { hashToken as hash, isPlausibleToken, mintToken } from '@xangarro/auth-core';
import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';

/**
 * Account deletion (ADR-136, `0051_account_deletion.sql`). Every call goes
 * through a SECURITY DEFINER function: the app role cannot read the ledger.
 * The undo link is 256 random bits; only its SHA-256 is stored. Timestamps
 * travel as JSON so they arrive ISO-8601.
 */
const iso = (v: string): string => new Date(v).toISOString();

export interface DeletionRequested {
  readonly folio: string;
  readonly eraseAt: string;
  readonly businessIds: readonly string[];
  /** The undo link's token, for the confirmation email only. */
  readonly undoToken: string;
}

/** Close every business `userId` owns and record the folio. Throws when it owns none. */
export async function requestAccountDeletion(
  db: Db,
  input: {
    readonly userId: string;
    readonly email: string;
    readonly stoppedRenewals: readonly string[];
    readonly days: number;
  },
): Promise<DeletionRequested> {
  const undoToken = mintToken();
  const [row] = await db.execute<{ folio: string; erase_at: string; business_ids: string[] }>(sql`
    SELECT r.folio, to_json(r.erase_at) #>> '{}' AS erase_at, r.business_ids
      FROM xangarro.account_delete_request(${input.userId}::uuid, ${input.email}, ${hash(undoToken)},
        ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(input.stoppedRenewals)}::jsonb)),
        ${input.days}::int) r`);
  if (row === undefined) throw new Error('account_delete_request returned nothing');
  return { folio: row.folio, eraseAt: iso(row.erase_at), businessIds: row.business_ids, undoToken };
}

export interface DeletionView {
  readonly folio: string;
  readonly email: string;
  readonly eraseAt: string;
  readonly negocios: readonly string[];
  readonly estado: 'pendiente' | 'vencido';
}

/** What an undo link points at, or `null` for a token that is not ours. */
export async function peekAccountDeletion(db: Db, token: string): Promise<DeletionView | null> {
  if (!isPlausibleToken(token)) return null;
  const [row] = await db.execute<{
    folio: string;
    email: string;
    erase_at: string;
    negocios: string[];
    estado: 'pendiente' | 'vencido';
  }>(sql`
    SELECT p.folio, p.email, to_json(p.erase_at) #>> '{}' AS erase_at, p.negocios, p.estado
      FROM xangarro.account_delete_peek(${hash(token)}) p`);
  if (row === undefined) return null;
  return { ...row, eraseAt: iso(row.erase_at) };
}

export interface DeletionUndone {
  readonly folio: string;
  readonly userId: string;
  readonly businessIds: readonly string[];
  readonly stoppedRenewals: readonly string[];
}

/** Spend the undo link: the businesses reopen. `null` when it could not be undone. */
export async function undoAccountDeletion(db: Db, token: string): Promise<DeletionUndone | null> {
  if (!isPlausibleToken(token)) return null;
  const [row] = await db.execute<{
    folio: string;
    user_id: string;
    business_ids: string[];
    stopped_renewals: string[];
  }>(sql`SELECT * FROM xangarro.account_delete_undo(${hash(token)})`);
  if (row === undefined) return null;
  return {
    folio: row.folio,
    userId: row.user_id,
    businessIds: row.business_ids,
    stoppedRenewals: row.stopped_renewals,
  };
}

export interface OpenDeletion {
  readonly folio: string;
  readonly email: string;
  readonly businessIds: readonly string[];
  readonly negocios: readonly string[];
  readonly stoppedRenewals: readonly string[];
  readonly eraseAt: string;
  readonly reminded: boolean;
}

/** Requests nobody undid whose erase day is at or before `until`, soonest first. */
export async function openAccountDeletions(db: Db, until: string): Promise<OpenDeletion[]> {
  const rows = await db.execute<{
    folio: string;
    email: string;
    business_ids: string[];
    negocios: string[];
    stopped_renewals: string[];
    erase_at: string;
    reminded: boolean;
  }>(sql`
    SELECT o.folio, o.email, o.business_ids, o.negocios, o.stopped_renewals,
           to_json(o.erase_at) #>> '{}' AS erase_at, o.reminded
      FROM xangarro.account_deletions_open(${until}::timestamptz) o`);
  return rows.map((r) => ({
    folio: r.folio,
    email: r.email,
    businessIds: r.business_ids,
    negocios: r.negocios,
    stoppedRenewals: r.stopped_renewals,
    eraseAt: iso(r.erase_at),
    reminded: r.reminded,
  }));
}

/** Record the reminder with a link of its own; its token, or `null` when already reminded. */
export async function markDeletionReminded(db: Db, folio: string): Promise<string | null> {
  const token = mintToken();
  const [row] = await db.execute<{ ok: boolean }>(
    sql`SELECT xangarro.account_delete_reminded(${folio}, ${hash(token)}) AS ok`,
  );
  return row?.ok === true ? token : null;
}

/** Erase a due request; returns until when its billing rows stay blocked. */
export async function eraseAccount(db: Db, folio: string): Promise<string> {
  const [row] = await db.execute<{ until: string }>(
    sql`SELECT to_json(xangarro.account_erase(${folio})) #>> '{}' AS until`,
  );
  if (row === undefined) throw new Error('account_erase returned nothing');
  return iso(row.until);
}
