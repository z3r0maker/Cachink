import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import type { NewPasskey, StoredPasskey } from '@xangarro/auth-core';
import type { StaffMemberId } from '@xangarro/domain';

import type { PasskeyOrigin, PasskeyView, StaffPasskeyRepo } from '../auth/ports';
import type { Db, Tx } from './client';
import { toDate, toDateOrNull } from './parse';
import { staffMembers as m, staffPasskeys as p } from './schema';

/**
 * `StaffPasskeyRepo` over `staff_passkeys` (0023, ADR-160). A passkey counts
 * only while it and its member are both live. Removal locks the member's live
 * passkeys first, so two tabs removing the last two at once cannot both win.
 *
 * No `server-only`: the session store (and so the proxy) shares `Db`.
 */
const livePasskey = (id: string) => and(eq(p.id, id), isNull(p.revokedAt));

async function find(conn: Db, id: string): Promise<StoredPasskey<StaffMemberId> | null> {
  const [row] = await conn
    .select({
      id: p.id,
      ownerId: p.staffId,
      publicKey: p.publicKey,
      counter: p.counter,
      transports: p.transports,
    })
    .from(p)
    .innerJoin(m, eq(m.id, p.staffId))
    .where(and(livePasskey(id), isNull(m.revokedAt)))
    .limit(1);
  return row ? { ...row, ownerId: row.ownerId as StaffMemberId } : null;
}

async function listFor(conn: Db, staffId: StaffMemberId): Promise<readonly PasskeyView[]> {
  const rows = await conn
    .select({
      id: p.id,
      nombre: p.nombre,
      backedUp: p.backedUp,
      createdAt: p.createdAt,
      lastUsedAt: p.lastUsedAt,
    })
    .from(p)
    .where(and(eq(p.staffId, staffId), isNull(p.revokedAt)))
    .orderBy(asc(p.createdAt), asc(p.id));
  return rows.map((r) => ({
    ...r,
    createdAt: toDate(r.createdAt),
    lastUsedAt: toDateOrNull(r.lastUsedAt),
  }));
}

/**
 * Transports are WebAuthn's fixed words (`internal`, `hybrid`, `usb`…), never
 * a comma, so they travel as one text parameter.
 *
 * Inserts a passkey for a live member, inside whatever transaction `conn` is;
 * false when the member is gone or the credential id already exists.
 */
export async function insertPasskey(
  conn: Db | Tx,
  staffId: StaffMemberId,
  passkey: NewPasskey,
  nombre: string,
  origen: PasskeyOrigin,
): Promise<boolean> {
  const rows = await conn.execute(sql`
    INSERT INTO staff_passkeys (id, staff_id, public_key, counter, transports, aaguid, backed_up, nombre, origen)
    SELECT ${passkey.id}, m.id, ${Buffer.from(passkey.publicKey)}, ${passkey.counter},
           string_to_array(${passkey.transports.join(',')}, ','),
           ${passkey.aaguid}, ${passkey.backedUp}, ${nombre}, ${origen}
      FROM staff_members m
     WHERE m.id = ${staffId} AND m.revoked_at IS NULL
    ON CONFLICT (id) DO NOTHING
    RETURNING id`);
  return rows.length === 1;
}

async function remove(conn: Db, staffId: StaffMemberId, id: string) {
  return conn.transaction(async (tx) => {
    const live = await tx.execute<{ id: string }>(sql`
      SELECT id FROM staff_passkeys
       WHERE staff_id = ${staffId} AND revoked_at IS NULL
       FOR UPDATE`);
    if (!live.some((r) => r.id === id)) return 'missing' as const;
    if (live.length <= 1) return 'last' as const;
    await tx
      .update(p)
      .set({ revokedAt: sql`now()` })
      .where(livePasskey(id));
    return 'removed' as const;
  });
}

export function staffPasskeyRepo(conn: Db): StaffPasskeyRepo {
  return {
    find: (id) => find(conn, id),
    recordUse: async (id, counter) => {
      const rows = await conn
        .update(p)
        .set({ counter, lastUsedAt: sql`now()` })
        .where(livePasskey(id))
        .returning({ id: p.id });
      return rows.length === 1;
    },
    listFor: (staffId) => listFor(conn, staffId),
    add: (staffId, passkey, nombre) => insertPasskey(conn, staffId, passkey, nombre, 'mi_acceso'),
    remove: (staffId, id) => remove(conn, staffId, id),
  };
}
