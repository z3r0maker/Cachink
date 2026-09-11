/**
 * PowerSync Sync Stream definitions (ADR-035).
 *
 * Sync Streams are PowerSync's 2026-recommended replication primitive —
 * each stream describes a subset of rows the server should replicate to a
 * client. Streams are parameterised by the authenticated user's JWT
 * (`auth.business_id` + `auth.role`) so a single set of stream definitions
 * serves both the Operativo (90-day window) and Director (full rows)
 * scoping CLAUDE.md §1 requires.
 *
 * These descriptors are plain data; the PowerSync client factory
 * (`client/mobile.ts` / `client/desktop.ts`) translates them into the
 * `@powersync/common` `SyncStream` objects at runtime. Keeping them as
 * data lets tests exercise the descriptor set without needing the
 * PowerSync native module installed.
 */

import type { SyncedTable } from '../schema/index.js';

export type CloudRole = 'Operativo' | 'Director';

export interface StreamDescriptor {
  readonly id: string;
  readonly table: SyncedTable;
  /** Extra SQL `WHERE` predicate applied on top of `business_id` RLS. */
  readonly filter: string | null;
  readonly roles: readonly CloudRole[];
}

/** 90-day window for transactional tables on Operativo clients. */
const LAST_90_DAYS = "fecha >= date('now', '-90 day')";

export const STREAMS: readonly StreamDescriptor[] = [
  // Reference data — full rows for everyone.
  { id: 'stream_businesses', table: 'businesses', filter: null, roles: ['Operativo', 'Director'] },
  { id: 'stream_clients', table: 'clients', filter: null, roles: ['Operativo', 'Director'] },
  { id: 'stream_products', table: 'products', filter: null, roles: ['Operativo', 'Director'] },
  { id: 'stream_employees', table: 'employees', filter: null, roles: ['Director'] },
  {
    id: 'stream_recurring_expenses',
    table: 'recurring_expenses',
    filter: null,
    roles: ['Operativo', 'Director'],
  },

  // Transactional tables — Operativo gets the last 90 days, Director gets all.
  {
    id: 'stream_sales_recent',
    table: 'sales',
    filter: LAST_90_DAYS,
    roles: ['Operativo'],
  },
  { id: 'stream_sales_all', table: 'sales', filter: null, roles: ['Director'] },
  {
    id: 'stream_expenses_recent',
    table: 'expenses',
    filter: LAST_90_DAYS,
    roles: ['Operativo'],
  },
  { id: 'stream_expenses_all', table: 'expenses', filter: null, roles: ['Director'] },
  {
    id: 'stream_inventory_movements_recent',
    table: 'inventory_movements',
    filter: LAST_90_DAYS,
    roles: ['Operativo'],
  },
  {
    id: 'stream_inventory_movements_all',
    table: 'inventory_movements',
    filter: null,
    roles: ['Director'],
  },
  {
    id: 'stream_client_payments',
    table: 'client_payments',
    filter: null,
    roles: ['Operativo', 'Director'],
  },
  { id: 'stream_day_closes', table: 'day_closes', filter: null, roles: ['Director'] },
];

/**
 * Given a role, return the stream IDs that PowerSync should activate.
 * A Director receives every stream whose `roles` contains 'Director';
 * Operativo receives the Operativo-scoped streams plus the common
 * reference streams.
 */
export function streamsForRole(role: CloudRole): readonly StreamDescriptor[] {
  return STREAMS.filter((s) => s.roles.includes(role));
}
