'use server';

import { auditedMutation } from '../audited';
import { field, type FormState } from './form-state';

/**
 * «Marcar como revisado» — a deliberately trivial mutation that proves the
 * audited path end to end: gate → transaction → `recordStaffAction`. Its only
 * effect is the audit row itself; N-08's inbox replaces it with a real status
 * change that goes through the same `auditedMutation`.
 */
export async function marcarRevisado(_prev: FormState, form: FormData): Promise<FormState> {
  const nota = field(form, 'nota').slice(0, 280);
  try {
    await auditedMutation(
      { action: 'consola.marcar_revisado', payload: { nota } },
      async () => undefined,
    );
    return { ok: true, message: 'Marcado como revisado. Quedó registrado en la bitácora.' };
  } catch (error) {
    console.error('marcarRevisado failed', error);
    return { ok: false, message: 'No se pudo registrar. Intenta de nuevo.' };
  }
}
