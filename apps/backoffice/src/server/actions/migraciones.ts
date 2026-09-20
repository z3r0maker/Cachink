'use server';

import { revalidatePath } from 'next/cache';

import { auditedMutation } from '../audited';
import { db } from '../db/client';
import { fileBytes, markForApproval } from '../db/assisted-imports';
import { requireStaff } from '../staff';

/**
 * The staff side of «Hazlo por mí» (N-18): one audited mutation — upload
 * the staff-mapped file against the request and send it to the tenant's
 * approval. Applying is the tenant's claim alone (0026's guarded UPDATE);
 * staff never write data on a tenant's behalf.
 */

export type EnviarMigracionResult = { ok: true } | { ok: false; message: string };

const MIMES = new Set([
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export async function enviarMigracion(form: FormData): Promise<EnviarMigracionResult> {
  try {
    const staff = await requireStaff();
    const v = validarFormulario(form);
    if (typeof v === 'string') return { ok: false, message: v };
    const { id, businessId, plantilla, file } = v;

    const bytes = Buffer.from(await file.arrayBuffer());
    const { audit } = await auditedMutation(
      { action: 'migracion.enviar', businessId, payload: { id, plantilla, filename: file.name } },
      (tx) =>
        markForApproval(tx, {
          id,
          businessId,
          plantilla,
          file: { filename: file.name, mime: file.type, bytes },
        }),
    );
    void audit;
    void staff;
    revalidatePath(`/migraciones/${id}`);
    return { ok: true };
  } catch {
    return { ok: false, message: 'No pudimos enviar la migración. Intenta de nuevo.' };
  }
}

/** The form's fields, or the user-facing reason it cannot be sent. */
function validarFormulario(form: FormData):
  | string
  | {
      readonly id: string;
      readonly businessId: string;
      readonly plantilla: 'productos' | 'clientes';
      readonly file: File;
    } {
  const id = String(form.get('id') ?? '');
  const businessId = String(form.get('business_id') ?? '');
  const plantilla = String(form.get('plantilla') ?? '');
  const file = form.get('archivo');
  if (id === '' || businessId === '') return 'Solicitud desconocida.';
  if (plantilla !== 'productos' && plantilla !== 'clientes') {
    return 'Elige la plantilla a la que mapeaste el archivo.';
  }
  if (!(file instanceof File) || file.size === 0) return 'Sube el archivo mapeado (.xlsx o .csv).';
  if (!MIMES.has(file.type)) return 'Solo .xlsx o .csv.';
  if (file.size > 20 * 1024 * 1024) return 'El archivo pesa más de 20 MB.';
  return { id, businessId, plantilla, file };
}

/** Staff never apply; this read exists only for the detail page's preview link. */
export async function archivoMapeado(fileId: string) {
  return fileBytes(db(), fileId);
}
