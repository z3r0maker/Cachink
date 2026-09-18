import 'server-only';

import { SignupError, type NewOwner, type SignupStore } from '@xangarro/application';
import { businessMembers, businesses } from '@xangarro/data-pg';
import { sql } from 'drizzle-orm';

import type { Tx } from '../db';
import { recordChange } from '../repositories/sync-log';

/**
 * `SignupStore` over Postgres, inside one transaction. `createOwner` scopes
 * that transaction to the business it is creating (a transaction-local
 * `xangarro.business_id`), so the three inserts commit or roll back together
 * and pass RLS's `WITH CHECK` for that tenant and no other.
 *
 * - `auth.users`: the app role may insert identities (compat layer) but not
 *   read hashes. On hosted Supabase this is GoTrue's job — a change of issuer
 *   only (see `local/0000_supabase_compat.sql`).
 * - `businesses` is a DOWN table, so its insert is logged for the phones in
 *   the same transaction (ADR-062). `business_members` is portal-only.
 * - A unique violation on the email (two signups racing) becomes the same
 *   `EMAIL_TAKEN` the pre-check gives.
 */

/** Rows created in the portal have no originating phone (as `users.ts`). */
const PORTAL_DEVICE_ID = '01HZ8XQN9GZJXV8AKQ5X0WEB01';
const UNIQUE_VIOLATION = '23505';

async function insertIdentity(tx: Tx, o: NewOwner): Promise<void> {
  try {
    await tx.execute(sql`
      INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at)
      VALUES (${o.userId}::uuid, ${o.email}, ${o.passwordHash}, ${o.at}, ${o.at})`);
  } catch (error) {
    const code = (error as { code?: string; cause?: { code?: string } }).cause?.code;
    if ((error as { code?: string }).code === UNIQUE_VIOLATION || code === UNIQUE_VIOLATION) {
      throw new SignupError('EMAIL_TAKEN', 'Ya existe una cuenta con ese correo.');
    }
    throw error;
  }
}

export function pgSignupStore(tx: Tx): SignupStore {
  return {
    async emailTaken(email: string): Promise<boolean> {
      const rows = await tx.execute(sql`SELECT 1 FROM auth.users WHERE lower(email) = ${email}`);
      return rows.length > 0;
    },
    async createOwner(o: NewOwner): Promise<void> {
      // Transaction-local: the tenant is the business this call creates.
      await tx.execute(sql`SELECT set_config('xangarro.business_id', ${o.businessId}, true)`);
      await insertIdentity(tx, o);
      await tx.insert(businesses).values({
        id: o.businessId,
        nombre: o.nombreNegocio,
        regimenFiscal: o.regimenFiscal,
        isrTasa: o.isrTasa,
        businessId: o.businessId,
        deviceId: PORTAL_DEVICE_ID,
        createdAt: o.at,
        updatedAt: o.at,
      });
      await recordChange(tx, o.businessId, 'businesses', o.businessId, 'insert');
      await tx.insert(businessMembers).values({
        id: o.memberId,
        userId: o.userId,
        role: 'owner',
        businessId: o.businessId,
        createdAt: o.at,
        updatedAt: o.at,
      });
    },
  };
}
