/**
 * Portal-only tables.
 *
 * These live **only** in Postgres. They are absent from `scope.ts`, so nothing
 * here crosses the wire and the device never learns about them — which is what
 * makes them portal-only entities under the shortened checklist in ADR-060,
 * rather than synced entities under CLAUDE.md §11 in full.
 */

import { bigint, boolean, index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { centavos, tenantStamps } from './_columns';

/**
 * `notices` — **one table, two surfaces** (ADR-060).
 *
 * Avisos and the Asesor's "Para ti" feed share this row because they have the
 * same shape and the same lifecycle. `source` discriminates them; the header
 * bell counts unread excluding `asesor`. Plan tiering governs how many
 * `source='asesor'` rows the generator writes, never what the store looks like.
 */
export const notices = pgTable(
  'notices',
  {
    id: text('id').primaryKey(),
    source: text('source', { enum: ['sistema', 'operacion', 'asesor'] }).notNull(),
    severity: text('severity', { enum: ['critical', 'warning', 'info', 'success'] }).notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    ctaLabel: text('cta_label'),
    ctaHref: text('cta_href'),
    state: text('state', { enum: ['nuevo', 'leido', 'listo', 'descartado'] })
      .notNull()
      .default('nuevo'),
    /** Per-insight payload: price tables, product references, goal snapshots. */
    data: jsonb('data'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true, mode: 'string' }),
    ...tenantStamps,
  },
  (t) => [index('notices_business_created_idx').on(t.businessId, t.createdAt)],
);

/** `metas` — the Asesor's goals. Deterministic arithmetic, portal-only. */
export const metas = pgTable('metas', {
  id: text('id').primaryKey(),
  /** Ganar más · Vender más · Gastar menos. */
  objetivo: text('objetivo', { enum: ['ganar', 'vender', 'gastar'] }).notNull(),
  /** Comprar algo · Tener un colchón · Pagar deudas. */
  motivo: text('motivo', { enum: ['comprar', 'colchon', 'deudas'] }).notNull(),
  nivel: text('nivel', { enum: ['empujon', 'reto', 'ambicioso'] }).notNull(),
  objetivoCentavos: centavos('objetivo_centavos').notNull(),
  periodo: text('periodo').notNull(),
  lograda: boolean('lograda'),
  resultadoCentavos: centavos('resultado_centavos'),
  cerradaAt: timestamp('cerrada_at', { withTimezone: true, mode: 'string' }),
  ...tenantStamps,
});

/** Portal members. Many-to-many; the contador is a `viewer` (ADR-053 Q11). */
export const businessMembers = pgTable('business_members', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  role: text('role', { enum: ['owner', 'admin', 'viewer'] }).notNull(),
  ...tenantStamps,
});

/** Device slots. A code is single-use, 8 chars, no 0/O/1/I, 48 h (ADR-053 Q5). */
export const devices = pgTable('devices', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  plataforma: text('plataforma', { enum: ['ios', 'android'] }).notNull(),
  modelo: text('modelo'),
  lastPushAt: timestamp('last_push_at', { withTimezone: true, mode: 'string' }),
  lastPullAt: timestamp('last_pull_at', { withTimezone: true, mode: 'string' }),
  revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
  /** Highest serverSeq this device's pushes were accepted at — its purge bound (A-11). */
  acknowledgedThrough: bigint('acknowledged_through', { mode: 'number' }).notNull().default(0),
  ...tenantStamps,
});

export const activationCodes = pgTable('activation_codes', {
  code: text('code').primaryKey(),
  email: text('email').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
  redeemedAt: timestamp('redeemed_at', { withTimezone: true, mode: 'string' }),
  redeemedByDeviceId: text('redeemed_by_device_id'),
  ...tenantStamps,
});
