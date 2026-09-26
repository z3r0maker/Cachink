import 'server-only';

import { sql } from 'drizzle-orm';

import type { Role } from '@/session/types';

import { db } from './db';

/**
 * Which businesses an account belongs to, and as what (P-02's switcher).
 *
 * The list comes from `xangarro.memberships_for_user` — the one lookup that is
 * not tenant-scoped, and which skips archived businesses (0016). The switcher's
 * names come from its twin `negocios_for_user` (0046) in the same single call:
 * it used to open one tenant transaction per membership on every navigation
 * (audit DB2-PAGE-01). Both return only the caller's own memberships.
 */
export interface Membership {
  readonly businessId: string;
  readonly role: Role;
}

export interface NegocioDelUsuario extends Membership {
  readonly nombre: string;
}

export async function membershipsOf(userId: string): Promise<readonly Membership[]> {
  const rows = await db().execute<{ business_id: string; role: Role }>(
    sql`SELECT business_id, role FROM xangarro.memberships_for_user(${userId})`,
  );
  return [...rows].map((r) => ({ businessId: r.business_id, role: r.role }));
}

export async function negociosOf(userId: string): Promise<readonly NegocioDelUsuario[]> {
  const rows = await db().execute<{ business_id: string; role: Role; nombre: string | null }>(
    sql`SELECT business_id, role, nombre FROM xangarro.negocios_for_user(${userId})`,
  );
  return [...rows].map((r) => ({
    businessId: r.business_id,
    role: r.role,
    nombre: r.nombre ?? 'Tu negocio',
  }));
}
