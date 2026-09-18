import 'server-only';

import { getBusiness } from '@xangarro/data-pg';

import { PLAN_FIXTURE } from '@/fixtures/business';
import type { Role, Session } from '@/session/types';

import { requireSession } from './auth';
import { withTenant } from './db';

/**
 * The `Session` the screens render from, assembled server-side.
 *
 * Identity and role are real — the signed cookie and `business_members`.
 * The business name is read from the row rather than hardcoded in the shell,
 * which is what made `Taquería Don Pedro` appear on every route regardless of
 * who was looking.
 *
 * `planId`, `capabilities` and `features` are still fixtures. They ride in the
 * signed entitlement, which has no issuer until B-06; putting the seam here
 * means that lands as one change instead of nine.
 */
export async function currentSession(): Promise<Session> {
  const claims = await requireSession();

  const business = await withTenant(claims.business_id, (tx) => getBusiness(tx)).catch(() => null);

  return {
    role: claims.member_role as Role,
    businessId: claims.business_id,
    businessName: business?.nombre ?? 'Tu negocio',
    ...PLAN_FIXTURE,
  };
}
