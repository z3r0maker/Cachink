'use server';

import { CrearProductoUseCase, EditarProductoUseCase } from '@xangarro/application';
import type { BusinessId, ProductId } from '@xangarro/domain';
import { revalidatePath } from 'next/cache';

import type { PlannedRow } from '@/lib/import-plan';

import { requireMember } from '../auth';
import { withTenant, type Tx } from '../db';
import { planFromFile } from '../import/plan-productos';
import { SheetError } from '../import/read-sheet';
import { reportError } from '../observability/report';
import { pgProductsRepository } from '../repositories/products';

/**
 * The product import (P-07): a dry-run preview, then the commit. Both re-read
 * the file on the server. The commit applies every Nuevo and Actualizar row in
 * **one** transaction — all of them or none — through the same use cases as
 * «Nuevo producto» and «Editar». Error rows are skipped; the preview listed them.
 * Imported products start at zero stock (ADR-081).
 */
export interface PreviewRow {
  readonly line: number;
  readonly kind: PlannedRow['kind'];
  readonly sku: string;
  readonly nombre: string;
  readonly errors: readonly string[];
}
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
  if (!(f instanceof File)) throw new SheetError('Elige un archivo .xlsx.');
  return f;
};

export async function previsualizarImportacion(form: FormData): Promise<PreviewResult> {
  try {
    const session = await requireMember('admin');
    const plan = await withTenant(session.business_id, (tx) => planFromFile(tx, fileOf(form)));
    const rows = plan.map((p) => ({
      line: p.line,
      kind: p.kind,
      sku: p.values?.sku ?? '',
      nombre: p.values?.nombre ?? '',
      errors: p.errors,
    }));
    return { ok: true, rows };
  } catch (error) {
    return failure(error, 'previsualizarImportacion');
  }
}

async function apply(tx: Tx, businessId: BusinessId, plan: readonly PlannedRow[]): Promise<void> {
  const repo = pgProductsRepository(tx, businessId);
  for (const p of plan) {
    if (p.values === null) continue;
    const { seguirStock: _s, costoUnitCentavos: _c, ...patch } = p.values;
    if (p.kind === 'actualizar' && p.id !== undefined) {
      await new EditarProductoUseCase(repo).execute({ id: p.id as ProductId, patch });
    } else if (p.kind === 'nuevo') {
      await new CrearProductoUseCase(repo).execute({ product: { ...p.values, businessId } });
    }
  }
}

export async function importarProductos(form: FormData): Promise<ImportResult> {
  try {
    const session = await requireMember('admin');
    const businessId = session.business_id as BusinessId;
    const plan = await withTenant(businessId, async (tx) => {
      const planned = await planFromFile(tx, fileOf(form));
      await apply(tx, businessId, planned);
      return planned;
    });
    revalidatePath('/productos');
    const count = (k: PlannedRow['kind']) => plan.filter((p) => p.kind === k).length;
    return {
      ok: true,
      nuevos: count('nuevo'),
      actualizados: count('actualizar'),
      sinCambios: count('sin-cambios'),
      omitidos: count('error'),
    };
  } catch (error) {
    return failure(error, 'importarProductos');
  }
}
