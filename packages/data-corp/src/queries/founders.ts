import { asc, eq } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import { founders } from '../schema/founders.js';

export interface Founder {
  readonly id: string;
  readonly staffMemberId: string;
  /** The agreement's «Fundador 1» or «Fundador 2». */
  readonly numero: 1 | 2;
  readonly nombre: string;
  readonly rfc: string | null;
}

type Row = typeof founders.$inferSelect;

/** Parsed, never asserted (CLAUDE.md §2.8): a stray number is a corrupt row, not a founder. */
function toFounder(row: Row): Founder {
  if (row.numero !== 1 && row.numero !== 2) {
    throw new Error(`corp.founders ${row.id} has numero ${row.numero}, not 1 or 2.`);
  }
  return {
    id: row.id,
    staffMemberId: row.staffMemberId,
    numero: row.numero,
    nombre: row.nombre,
    rfc: row.rfc,
  };
}

/** The founder a staff member is, or null: the console's founder gate reads this. */
export async function findFounderByStaffId(db: CorpDb, staffId: string): Promise<Founder | null> {
  const rows = await db.select().from(founders).where(eq(founders.staffMemberId, staffId)).limit(1);
  const row = rows[0];
  return row === undefined ? null : toFounder(row);
}

/** Both founders, Fundador 1 first. */
export async function listFounders(db: CorpDb): Promise<readonly Founder[]> {
  const rows = await db.select().from(founders).orderBy(asc(founders.numero));
  return rows.map(toFounder);
}
