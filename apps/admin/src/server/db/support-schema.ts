/**
 * `support_items` — the inbox (N-08), a portal-only entity (ADR-060) that
 * only `apps/admin` reads and writes. Same temporary home as `./schema.ts`;
 * the SQL, with its CHECKs, grants and RLS, is `./migrations/0002_support_items.sql`.
 *
 * Timestamps use `mode: 'date'` (unlike the insert-only staff tables) because
 * these rows are read back: postgres.js renders a timestamptz *string* as
 * `2026-09-17 12:00:00+00`, which is not the ISO form the domain validates.
 */
import { boolean, index, jsonb, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

import { staffMembers } from './schema';

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const supportItems = pgTable(
  'support_items',
  {
    id: text('id').primaryKey(),
    kind: text('kind').notNull(),
    status: text('status').notNull(),
    urgent: boolean('urgent').notNull(),
    ownerStaffId: text('owner_staff_id').references(() => staffMembers.id),
    businessId: text('business_id'),
    title: text('title').notNull(),
    body: text('body').notNull(),
    attachments: jsonb('attachments').$type<string[]>().notNull(),
    source: text('source').notNull(),
    sourceRef: text('source_ref').notNull(),
    paymentRef: text('payment_ref'),
    cfdiUuid: text('cfdi_uuid'),
    createdAt: instant('created_at').notNull(),
    updatedAt: instant('updated_at').notNull(),
    resolvedAt: instant('resolved_at'),
  },
  (t) => [
    unique('support_items_source_ref_key').on(t.source, t.sourceRef),
    index('support_items_status_kind_created_idx').on(
      t.status,
      t.kind,
      t.createdAt.desc(),
      t.id.desc(),
    ),
    index('support_items_business_idx').on(t.businessId),
  ],
);

export type SupportItemRow = typeof supportItems.$inferSelect;
