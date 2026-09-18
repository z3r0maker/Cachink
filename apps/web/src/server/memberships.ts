import 'server-only';

import { getBusiness } from '@xangarro/data-pg';
import { sql } from 'drizzle-orm';

import type { Role } from '@/session/types';

import { db, withTenant } from './db';

/**
 * Which businesses an account belongs to, and as what (P-02's switcher).
 *
 * The list comes from `xangarro.memberships_for_user` — the one lookup that is
 * not tenant-scoped, and which skips archived businesses (0016). Each name is
 * then read **inside that business's own tenant transaction**, so no query
 * here crosses a tenant the account is not a member of.
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
  const memberships = await membershipsOf(userId);
  return Promise.all(
    memberships.map(async (m) => ({
      ...m,
      nombre: (await withTenant(m.businessId, (tx) => getBusiness(tx)))?.nombre ?? 'Tu negocio',
    })),
  );
}
