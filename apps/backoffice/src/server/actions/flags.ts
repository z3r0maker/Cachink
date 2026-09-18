'use server';

import { revalidatePath } from 'next/cache';
import { newEntityId, type PlatformFlagEventId } from '@xangarro/domain';

import { auditedMutation } from '../audited';
import { FlagError, type FlagErrorCode } from '../flags/errors';
import { FLAG_AUDIT_ACTION, FLAG_COPY, MODE_LABELS } from '../flags/labels';
import { setPlatformFlag, type FlagChange } from '../flags/set-flag';
import { flagDeps } from '../flags/wiring';
import { NotPermitted } from '../staff';
import { field, type FormState } from './form-state';

/**
 * The flag page's one mutation (N-09): append a platform-flag event. It goes
 * through `auditedMutation`, so the event and its `staff_audit_log` row commit
 * together; the row records before → after, the reason and the reach.
 */
const MESSAGES: Record<FlagErrorCode, string> = {
  VALIDATION:
    'Revisa el cambio: el motivo lleva 3+ letras, y la lista beta necesita al menos un negocio (y solo aplica en modo «Lista beta»).',
  NO_CHANGE: 'Ese flag ya está así; no se guardó nada.',
  NEEDS_CONFIRMATION: 'Apagar para todos necesita confirmación.',
  UNKNOWN_TENANT: 'La lista incluye un negocio que no existe.',
  STORE_FAILED: 'No se pudo guardar. Intenta de nuevo.',
};

function failed(error: unknown): FormState {
  if (error instanceof FlagError) return { ok: false, message: MESSAGES[error.code] };
  if (error instanceof NotPermitted) return { ok: false, message: error.message };
  console.error('cambiarFlag failed', error);
  return { ok: false, message: 'No se pudo guardar. Intenta de nuevo.' };
}

function auditOf(change: FlagChange) {
  const { event, before, affected } = change;
  return {
    action: FLAG_AUDIT_ACTION,
    businessId: null,
    payload: {
      key: event.key,
      before: { mode: before.mode, source: before.source, allowlist: before.allowlistBusinessIds },
      after: { mode: event.mode, allowlist: event.allowlistBusinessIds },
      reason: event.reason,
      affected,
      eventId: event.id,
    },
  };
}

export async function cambiarFlag(_prev: FormState, form: FormData): Promise<FormState> {
  const input = {
    key: field(form, 'key'),
    mode: field(form, 'mode'),
    allowlist: form.getAll('allowlist').filter((v): v is string => typeof v === 'string'),
    reason: field(form, 'reason'),
    confirmacion: field(form, 'confirmacion'),
  };
  try {
    const { result } = await auditedMutation<FlagChange>(auditOf, (tx, ctx) =>
      setPlatformFlag(
        {
          ...flagDeps(tx),
          staffId: ctx.staff.id,
          now: () => new Date(),
          newId: () => newEntityId<PlatformFlagEventId>(),
        },
        input,
      ),
    );
    revalidatePath('/flags');
    const { key, mode } = result.event;
    return {
      ok: true,
      message: `Listo: ${FLAG_COPY[key].nombre} quedó en «${MODE_LABELS[mode]}». Llega a cada dispositivo en su próxima sincronización.`,
    };
  } catch (error) {
    return failed(error);
  }
}
