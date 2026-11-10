import 'server-only';

import { assistedFilesOf, latestAssistedImport } from '@xangarro/data-pg';
import type { PlanId } from '@xangarro/domain';

import { tenantEntitlement } from '../billing/plan';
import { withTenant } from '../db';

/**
 * What the /importar page reads about «Hazlo por mí» (N-18): the business's
 * latest assisted import with its files, and the plan that decides whether
 * the card offers it.
 *
 * Here and not in `actions/hazlo-por-mi.ts` (audit F-03): these take the
 * business from their caller, and an export of a `'use server'` file is an
 * endpoint anyone can call with any id. The page passes the business of the
 * session it just required.
 */
export async function importacionAsistidaActual(businessId: string) {
  return withTenant(businessId, async (tx) => {
    const row = await latestAssistedImport(tx, businessId);
    if (row === null) return null;
    return { ...row, files: await assistedFilesOf(tx, row.id) };
  });
}

export async function planDelNegocio(businessId: string): Promise<PlanId> {
  return withTenant(businessId, (tx) => tenantEntitlement(tx, businessId, new Date())).then(
    (e) => e.plan,
  );
}
