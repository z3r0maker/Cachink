import type { PreferenciasGuardadas } from '@xangarro/domain';
import { and, eq } from 'drizzle-orm';

import { noticePreferences } from '../schema/portal.js';
import type { Db } from '../client.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * A member's stored aviso choices (P-32), inside a tenant transaction — RLS
 * scopes the row to the business, the key to the member. The domain turns the
 * sparse map into the full matrix.
 */
export async function preferenciasDe(tx: Tx, userId: string): Promise<PreferenciasGuardadas> {
  const [row] = await tx
    .select({ prefs: noticePreferences.prefs })
    .from(noticePreferences)
    .where(eq(noticePreferences.userId, userId));
  return (row?.prefs ?? {}) as PreferenciasGuardadas;
}

export async function guardarPreferencias(
  tx: Tx,
  businessId: string,
  userId: string,
  prefs: PreferenciasGuardadas,
): Promise<void> {
  const updatedAt = new Date().toISOString();
  await tx
    .insert(noticePreferences)
    .values({ businessId, userId, prefs, updatedAt })
    .onConflictDoUpdate({
      target: [noticePreferences.businessId, noticePreferences.userId],
      set: { prefs, updatedAt },
      where: and(
        eq(noticePreferences.businessId, businessId),
        eq(noticePreferences.userId, userId),
      ),
    });
}
