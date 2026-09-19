'use server';

import { revalidatePath } from 'next/cache';

import { marcarCfdiEmitido, marcarCfdiGlobal } from '@xangarro/data-pg';

import { auditedMutation } from '../audited';
import { drizzleSupportItems } from '../db/support-items';
import { assignSupportItem, type AssignResult } from '../inbox/assign';
import { markPaymentInvoiced } from '../inbox/cfdi-payment';
import { SupportItemError, type SupportItemErrorCode } from '../inbox/errors';
import { changeSupportItemStatus, type StatusResult } from '../inbox/status';
import { NotPermitted } from '../staff';
import { field, type FormState } from './form-state';

/**
 * The inbox's two mutations (N-08). Both go through `auditedMutation`: the
 * change and its `staff_audit_log` row commit together, and the row records
 * what changed — owner before → after, status before → after, the folio.
 */
const MESSAGES: Record<SupportItemErrorCode, string> = {
  VALIDATION: 'Revisa los datos: algo no es válido.',
  NOT_FOUND: 'Ese item ya no existe.',
  ALREADY_RESOLVED: 'El item ya está resuelto; reábrelo para asignarlo.',
  CFDI_UUID_REQUIRED: 'Para resolver un pago sin CFDI escribe el UUID (folio fiscal) del CFDI.',
  INVALID_CFDI_UUID: 'El UUID no tiene el formato del SAT (8-4-4-4-12 caracteres hexadecimales).',
  INVALID_CURSOR: 'La página pedida no es válida.',
  STORE_FAILED: 'No se pudo guardar. Intenta de nuevo.',
};

function failed(where: string, error: unknown): FormState {
  if (error instanceof SupportItemError) return { ok: false, message: MESSAGES[error.code] };
  if (error instanceof NotPermitted) return { ok: false, message: error.message };
  console.error(`${where} failed`, error);
  return { ok: false, message: 'No se pudo guardar. Intenta de nuevo.' };
}

function refresh(id: string): void {
  revalidatePath('/inbox');
  revalidatePath(`/inbox/${id}`);
}

export async function asignarme(_prev: FormState, form: FormData): Promise<FormState> {
  const id = field(form, 'id');
  try {
    await auditedMutation<AssignResult>(
      ({ item, previousOwner }) => ({
        action: 'inbox.asignar',
        businessId: item.businessId,
        payload: { itemId: item.id, antes: previousOwner, despues: item.ownerStaffId },
      }),
      (tx, ctx) =>
        assignSupportItem(
          drizzleSupportItems(tx),
          { id, staffId: ctx.staff.id },
          { now: () => new Date() },
        ),
    );
    refresh(id);
    return { ok: true, message: 'Listo: el item es tuyo.' };
  } catch (error) {
    return failed('asignarme', error);
  }
}

export async function cambiarEstado(_prev: FormState, form: FormData): Promise<FormState> {
  const id = field(form, 'id');
  const input = { id, status: field(form, 'status'), cfdiUuid: field(form, 'cfdiUuid') };
  try {
    await auditedMutation<StatusResult>(
      ({ item, previousStatus }) => ({
        action: 'inbox.cambiar_estado',
        businessId: item.businessId,
        payload: {
          itemId: item.id,
          antes: previousStatus,
          despues: item.status,
          cfdiUuid: item.cfdiUuid,
        },
      }),
      async (tx) => {
        const clock = { now: () => new Date() };
        const result = await changeSupportItemStatus(drizzleSupportItems(tx), input, clock);
        await markPaymentInvoiced(
          (mark) => marcarCfdiEmitido(tx, mark),
          result,
          (mark) => marcarCfdiGlobal(tx, mark),
        );
        return result;
      },
    );
    refresh(id);
    return { ok: true, message: 'Estado actualizado.' };
  } catch (error) {
    return failed('cambiarEstado', error);
  }
}
