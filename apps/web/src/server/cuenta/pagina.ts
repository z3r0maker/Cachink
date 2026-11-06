import 'server-only';

import { billingStatusSnapshot } from '@xangarro/application/billing';
import { DIAS_PARA_BORRAR } from '@xangarro/application/cuenta';
import { subscriptionsOfBusinesses } from '@xangarro/data-pg';
import { PLAN_NOMBRE } from '@xangarro/domain';

import { billingDb } from '../billing/config';
import { negociosOf } from '../memberships';

/**
 * What «Eliminar tu cuenta» shows (ElEliminar, ADR-136): the businesses the
 * account owns, each with its plan, whether any plan would renew (the note),
 * and the day the erase would fall on if the owner confirmed now.
 */
export interface NegocioAEliminar {
  readonly id: string;
  readonly nombre: string;
  /** «Plan Xangarro», «Xangarrito». */
  readonly plan: string;
}

export interface EliminarData {
  readonly email: string;
  readonly negocios: readonly NegocioAEliminar[];
  /** The name of a plan that renews today, for «Tu plan … ya no se renueva»; null when none does. */
  readonly planQueRenueva: string | null;
  readonly eraseAt: string;
}

export async function loadEliminar(
  userId: string,
  email: string,
  now: Date,
): Promise<EliminarData> {
  const owned = (await negociosOf(userId)).filter((n) => n.role === 'owner');
  const rows = await subscriptionsOfBusinesses(
    billingDb(),
    owned.map((n) => n.businessId),
  );
  let planQueRenueva: string | null = null;
  const negocios = owned.map((n) => {
    const s = billingStatusSnapshot(rows.filter((r) => r.businessId === n.businessId));
    const vivo = s !== null && s.status !== 'lapsed';
    if (vivo && s.cancelAt === null) planQueRenueva ??= PLAN_NOMBRE[s.planId];
    return {
      id: n.businessId,
      nombre: n.nombre,
      plan: vivo ? `Plan ${PLAN_NOMBRE[s.planId]}` : PLAN_NOMBRE.xangarrito,
    };
  });
  const eraseAt = new Date(now.getTime() + DIAS_PARA_BORRAR * 86_400_000).toISOString();
  return { email, negocios, planQueRenueva, eraseAt };
}
