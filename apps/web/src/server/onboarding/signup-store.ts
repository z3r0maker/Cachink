import 'server-only';

import { SignupError, type NewOwner, type SignupStore } from '@xangarro/application';
import {
  accountEmailTaken,
  businessMembers,
  businesses,
  createAccount,
  recordPrivacyConsent,
} from '@xangarro/data-pg';
import { sql } from 'drizzle-orm';

import type { Tx } from '../db';
import { recordChange } from '../repositories/sync-log';

/**
 * `SignupStore` over Postgres, inside one transaction. `createOwner` scopes
 * that transaction to the business it is creating (a transaction-local
 * `xangarro.business_id`), so the three inserts commit or roll back together
 * and pass RLS's `WITH CHECK` for that tenant and no other.
 *
 * - `auth.users`: never touched directly — `xangarro.account_email_taken` /
 *   `account_create` (0018) answer the one question each, so the app role
 *   needs no grant on the table (hosted Supabase gives none).
 * - `businesses` is a DOWN table, so its insert is logged for the phones in
 *   the same transaction (ADR-062). `business_members` is portal-only.
 * - A unique violation on the email (two signups racing) becomes the same
 *   `EMAIL_TAKEN` the pre-check gives.
 * - The consent ledger rows (N-34) are the last writes of the same transaction:
 *   no account can commit without its proof of consent.
 */

/** What the ledger records about the act besides the grant itself. */
export interface ConsentEvidence {
  readonly ipHash: string;
  readonly userAgent: string;
}

/** Rows created in the portal have no originating phone (as `users.ts`). */
const PORTAL_DEVICE_ID = '01HZ8XQN9GZJXV8AKQ5X0WEB01';

/**
 * The identity row goes through `xangarro.account_create` (0018): the app role
 * has no grant on `auth.users` on hosted Supabase. A lost race comes back as
 * `false`, which is the same `EMAIL_TAKEN` the pre-check gives.
 */
async function insertIdentity(tx: Tx, o: NewOwner): Promise<void> {
  const created = await createAccount(tx, {
    id: o.userId,
    email: o.email,
    passwordHash: o.passwordHash,
    nombre: o.nombre ?? '',
    at: o.at,
  });
  if (!created) throw new SignupError('EMAIL_TAKEN', 'Ya existe una cuenta con ese correo.');
}

export function pgSignupStore(tx: Tx, evidence: ConsentEvidence): SignupStore {
  return {
    emailTaken: (email: string) => accountEmailTaken(tx, email),
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
      const ctx = { userId: o.userId, businessId: o.businessId, ...evidence };
      for (const grant of o.consentimientos) await recordPrivacyConsent(tx, ctx, grant);
    },
  };
}
