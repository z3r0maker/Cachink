import { and, desc, eq, gte, inArray, lt, ne, or, type SQL } from 'drizzle-orm';
import { SupportItemSchema, type SupportItem } from '@xangarro/domain';

import type { SupportItemQuery, SupportItemRepository } from '../inbox/port';
import type { Db, Tx } from './client';
import { supportItems, type SupportItemRow } from './support-schema';

/**
 * Postgres adapter for the inbox port. Rows are re-validated on the way out,
 * so a row the CHECKs let through but the domain would refuse surfaces as an
 * error instead of reaching a screen.
 */
function toItem(row: SupportItemRow): SupportItem {
  return SupportItemSchema.parse({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    dueAt: row.dueAt?.toISOString() ?? null,
  });
}

function toRow(item: SupportItem): SupportItemRow {
  return {
    ...item,
    attachments: [...item.attachments],
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
    resolvedAt: item.resolvedAt === null ? null : new Date(item.resolvedAt),
    dueAt: item.dueAt === null ? null : new Date(item.dueAt),
  };
}

function where(q: SupportItemQuery): SQL | undefined {
  const t = supportItems;
  const conds: (SQL | undefined)[] = [
    q.kinds ? inArray(t.kind, [...q.kinds]) : undefined,
    q.statuses ? inArray(t.status, [...q.statuses]) : undefined,
    q.urgent === undefined ? undefined : eq(t.urgent, q.urgent),
    q.ownerStaffId === undefined ? undefined : eq(t.ownerStaffId, q.ownerStaffId),
    q.businessId === undefined ? undefined : eq(t.businessId, q.businessId),
  ];
  if (q.after) {
    const at = new Date(q.after.createdAt);
    conds.push(or(lt(t.createdAt, at), and(eq(t.createdAt, at), lt(t.id, q.after.id))));
  }
  return and(...conds);
}

type Conn = Db | Tx;

async function insertIfAbsent(conn: Conn, item: SupportItem) {
  const t = supportItems;
  const inserted = await conn
    .insert(t)
    .values(toRow(item))
    .onConflictDoNothing({ target: [t.source, t.sourceRef] })
    .returning();
  if (inserted[0]) return { item: toItem(inserted[0]), created: true };
  const existing = await conn
    .select()
    .from(t)
    .where(and(eq(t.source, item.source), eq(t.sourceRef, item.sourceRef)))
    .limit(1);
  if (!existing[0]) throw new Error('support_items conflict without a row');
  return { item: toItem(existing[0]), created: false };
}

async function listForDigest(conn: Conn, since: string): Promise<SupportItem[]> {
  const t = supportItems;
  const openAttention = and(
    ne(t.status, 'resuelto'),
    or(eq(t.urgent, true), inArray(t.kind, ['factura', 'arco'])),
  );
  const rows = await conn
    .select()
    .from(t)
    .where(or(gte(t.createdAt, new Date(since)), openAttention))
    .orderBy(desc(t.createdAt), desc(t.id));
  return rows.map(toItem);
}

export function drizzleSupportItems(conn: Conn): SupportItemRepository {
  const t = supportItems;
  return {
    async findById(id) {
      const rows = await conn.select().from(t).where(eq(t.id, id)).limit(1);
      return rows[0] ? toItem(rows[0]) : null;
    },
    insertIfAbsent: (item) => insertIfAbsent(conn, item),
    async update(item) {
      const { id, ...rest } = toRow(item);
      await conn.update(t).set(rest).where(eq(t.id, id));
    },
    async list(q) {
      const rows = await conn
        .select()
        .from(t)
        .where(where(q))
        .orderBy(desc(t.createdAt), desc(t.id))
        .limit(q.limit);
      return rows.map(toItem);
    },
    listForDigest: (since) => listForDigest(conn, since),
  };
}
