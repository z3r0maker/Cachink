'use server';

import { revalidatePath } from 'next/cache';
import { newEntityId, type PlanOverride, type PlanOverrideId } from '@xangarro/domain';

import { auditedMutation } from '../audited';
import { TenantError, type TenantErrorCode } from '../tenants/errors';
import { OVERRIDE_AUDIT_ACTIONS } from '../tenants/labels';
import { createPlanOverride } from '../tenants/overrides';
import { tenantDeps } from '../tenants/wiring';
import { NotPermitted } from '../staff';
import { field, type FormState } from './form-state';

/**
 * The tenant page's one mutation (N-06): record a plan override. It goes
 * through `auditedMutation`, so the override and its `staff_audit_log` row
 * commit together; the row carries the whole override.
 */
const MESSAGES: Record<TenantErrorCode, string> = {
  VALIDATION:
    'Revisa el ajuste: días entre 1 y 90; un regalo necesita motivo (3+ letras) y una fecha futura a menos de un año.',
  NOT_FOUND: 'Ese negocio ya no existe.',
  INVALID_CURSOR: 'La página pedida no es válida.',
  STORE_FAILED: 'No se pudo guardar. Intenta de nuevo.',
};

const DONE: Record<PlanOverride['kind'], string> = {
  extend_trial: 'Listo: la prueba se extendió.',
  comp_plan: 'Listo: el plan quedó regalado hasta la fecha elegida.',
  reissue_entitlement: 'Listo: la licencia se reemite en la próxima sincronización.',
};

function failed(error: unknown): FormState {
  if (error instanceof TenantError) return { ok: false, message: MESSAGES[error.code] };
  if (error instanceof NotPermitted) return { ok: false, message: error.message };
  console.error('aplicarAjuste failed', error);
  return { ok: false, message: 'No se pudo guardar. Intenta de nuevo.' };
}

export async function aplicarAjuste(_prev: FormState, form: FormData): Promise<FormState> {
  const input = {
    businessId: field(form, 'businessId'),
    kind: field(form, 'kind'),
    days: field(form, 'days'),
    planId: field(form, 'planId'),
    reason: field(form, 'reason'),
    hasta: field(form, 'hasta'),
  };
  try {
    const { result } = await auditedMutation<PlanOverride>(
      (o) => ({
        action: OVERRIDE_AUDIT_ACTIONS[o.kind],
        businessId: o.businessId,
        payload: { ...o },
      }),
      (tx, ctx) =>
        createPlanOverride(
          {
            ...tenantDeps(tx),
            staffId: ctx.staff.id,
            now: () => new Date(),
            newId: () => newEntityId<PlanOverrideId>(),
          },
          input,
        ),
    );
    revalidatePath('/tenants');
    revalidatePath(`/tenants/${result.businessId}`);
    return { ok: true, message: DONE[result.kind] };
  } catch (error) {
    return failed(error);
  }
}
