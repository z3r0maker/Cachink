'use server';

import { activationCodes } from '@xangarro/data-pg';
import { isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { CODE_TTL_MS, mintActivationCode } from '../activation';
import { requireMember } from '../auth';
import { withTenant } from '../db';
import { reportError } from '../observability/report';

/**
 * "Generar otro" — replace the live activation code with a fresh one.
 *
 * **Replace, not add.** An activation code is a bearer credential: whoever types
 * it binds a phone to this business. Minting a new one while the old stays
 * redeemable doubles the number of live credentials, and the shopkeeper who
 * pressed "Generar otro" almost always did so because the old one leaked, was
 * mistyped, or went to the wrong person. So every unredeemed code for this
 * business is expired in the same transaction the new one is created.
 *
 * No `sync_log`: `activation_codes` exists only in the cloud. The phone learns
 * of a code by being told it, not by pulling it — pulling it would defeat the
 * point.
 *
 * `code` is the primary key, so a collision is a unique violation. At 32^8
 * possibilities it is astronomically unlikely, but it is retried rather than
 * surfaced, because the alternative is a shopkeeper seeing a database error for
 * doing nothing wrong.
 */
export type CodeResult =
  | { ok: true; code: string; expiresAt: string }
  | { ok: false; message: string };

const ATTEMPTS = 3;

export async function generarCodigo(): Promise<CodeResult> {
  try {
    const session = await requireMember('admin');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CODE_TTL_MS).toISOString();

    const code = await withTenant(session.business_id, async (tx) => {
      // Expire, don't delete: a redeemed-then-expired row is the audit trail of
      // which phone joined with which code.
      await tx
        .update(activationCodes)
        .set({ expiresAt: now.toISOString(), updatedAt: now.toISOString() })
        .where(isNull(activationCodes.redeemedAt));

      for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
        const candidate = mintActivationCode();
        const inserted = await tx
          .insert(activationCodes)
          .values({
            code: candidate,
            email: session.email,
            expiresAt,
            businessId: session.business_id,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          })
          .onConflictDoNothing()
          .returning({ code: activationCodes.code });
        if (inserted.length > 0) return candidate;
      }
      throw new Error('No pudimos generar un código. Intenta de nuevo.');
    });

    revalidatePath('/equipo');
    return { ok: true, code, expiresAt };
  } catch (error) {
    reportError(error, { endpoint: 'generarCodigo' });
    const message =
      error instanceof Error ? error.message : 'No pudimos generar el código. Intenta de nuevo.';
    return { ok: false, message };
  }
}
