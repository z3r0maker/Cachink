'use server';

import type { BusinessId } from '@xangarro/domain';
import { revalidatePath } from 'next/cache';

import { requireMember } from '../auth';
import { withTenant, type Tx } from '../db';
import { SheetError } from '../import/read-sheet';
import { templateOf, type ImportTemplate, type PreviewRow } from '../import/templates';
import { reportError } from '../observability/report';

/**
 * The import (P-07, generalised by N-16): pick a template → dry-run preview
 * with row errors → one-transaction commit (≤ 5 000 rows, .xlsx/.csv). Both
 * steps re-read the file on the server through the template's own planner,
 * so what gets written is always re-derived — never taken from a preview the
 * browser sent back. Every row applies through the same use cases as the
 * interactive forms; error rows are skipped because the preview listed them.
 */
export type PreviewResult =
  | { ok: true; rows: readonly PreviewRow[] }
  | { ok: false; message: string };
export type ImportResult =
  | { ok: true; nuevos: number; actualizados: number; sinCambios: number; omitidos: number }
  | { ok: false; message: string };

function failure(error: unknown, endpoint: string): { ok: false; message: string } {
  if (error instanceof SheetError) return { ok: false, message: error.message };
  const code = (error as { code?: string } | null)?.code;
  if (code === 'NOT_PERMITTED') return { ok: false, message: (error as Error).message };
  reportError(error, { endpoint });
  return { ok: false, message: 'No pudimos procesar el archivo. Intenta de nuevo.' };
}

const fileOf = (form: FormData): File => {
  const f = form.get('archivo');
  if (!(f instanceof File)) throw new SheetError('Elige un archivo .xlsx o .csv.');
  return f;
};

export async function previsualizarImportacion(form: FormData): Promise<PreviewResult> {
  const template = templateOf(form);
  try {
    const session = await requireMember('admin');
    const plan = await withTenant(session.business_id, (tx: Tx) => template.plan(tx, fileOf(form)));
    return { ok: true, rows: template.preview(plan) };
  } catch (error) {
    return failure(error, `previsualizarImportacion:${template.id}`);
  }
}

export async function importarDatos(form: FormData): Promise<ImportResult> {
  const template: ImportTemplate = templateOf(form);
  try {
    const session = await requireMember('admin');
    const businessId = session.business_id as BusinessId;
    const plan = await withTenant(businessId, async (tx: Tx) => {
      const planned = await template.plan(tx, fileOf(form));
      await template.apply(tx, businessId, planned as readonly unknown[]);
      return planned;
    });
    revalidatePath(`/${template.entidad}`);
    const count = (k: PreviewRow['kind']) => plan.filter((p) => p.kind === k).length;
    return {
      ok: true,
      nuevos: count('nuevo'),
      actualizados: count('actualizar'),
      sinCambios: count('sin-cambios'),
      omitidos: count('error'),
    };
  } catch (error) {
    return failure(error, `importarDatos:${template.id}`);
  }
}
