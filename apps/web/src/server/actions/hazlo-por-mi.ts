'use server';

import type { BusinessId, PlanId } from '@xangarro/domain';
import { SolicitarImportacionAsistidaUseCase } from '@xangarro/application';
import {
  assistedFilesOf,
  claimForApproval,
  createAssistedImport,
  hasActiveAssistedImport,
  latestAssistedImport,
  rejectAssistedImport,
} from '@xangarro/data-pg';
import { revalidatePath } from 'next/cache';

import { requireMember } from '../auth';
import { withTenant } from '../db';
import { supportInboxFromEnv } from '../support-inbox';
import { tenantEntitlement } from '../billing/plan';
import { failure, refusal, type FailurePolicy } from '../action-errors';
import { TEMPLATES } from '../import/templates';

/**
 * «Hazlo por mí» (N-18), the tenant side. The request is stored with its
 * files (private, in the tenant DB) and lands in the staff inbox as
 * `kind=migracion`. The approval is the data layer's claim — staff cannot
 * apply anything — and the commit runs the same template registry the
 * self-service import uses, over the staff-mapped file, in one transaction.
 */

/** The use case's and the data layer's refusals; anything else is an incident. */
const REFUSALS: FailurePolicy = {
  shown: ['IMPORTACION_*'],
  retry: 'No pudimos enviar tu solicitud. Intenta de nuevo.',
};

export type HazloPorMiResult = { ok: true } | { ok: false; message: string };

export async function solicitarHazloPorMi(form: FormData): Promise<HazloPorMiResult> {
  try {
    const session = await requireMember('admin');
    const businessId = session.business_id as BusinessId;
    const paid = await withTenant(session.business_id, (tx) =>
      tenantEntitlement(tx, session.business_id, new Date()),
    ).then((e) => e.plan !== 'xangarrito');

    const files = await archivosDe(form);
    const sistemaActual = String(form.get('sistema_actual') ?? '');
    const notas = String(form.get('notas') ?? '');

    const created = await withTenant(businessId, (tx) =>
      new SolicitarImportacionAsistidaUseCase({
        hasActive: (id) => hasActiveAssistedImport(tx, id),
        create: (input) => createAssistedImport(tx, input),
      }).execute({
        businessId,
        paid,
        sistemaActual,
        notas,
        requestedBy: session.sub ?? null,
        files,
      }),
    );

    await avisarAlEquipo({ id: created.id, businessId, sistemaActual, notas, files });
    revalidatePath('/importar');
    return { ok: true };
  } catch (error) {
    return failure(error, 'solicitarHazloPorMi', REFUSALS);
  }
}

export type ResolverAsistidaResult = { ok: true } | { ok: false; message: string };

export async function resolverImportacionAsistida(
  decision: 'aprobar' | 'rechazar',
): Promise<ResolverAsistidaResult> {
  try {
    const session = await requireMember('admin');
    const businessId = session.business_id as BusinessId;
    if (decision === 'rechazar') {
      const done = await withTenant(businessId, (tx) => rejectAssistedImport(tx, businessId));
      if (!done) return { ok: false, message: 'No hay una migración esperando tu decisión.' };
      revalidatePath('/importar');
      return { ok: true };
    }

    // Approve: claim + dry-run + apply + counts, one transaction — a failed
    // apply rolls the claim back with it, so nothing is ever "aplicada" with
    // half-written rows.
    const summary = await withTenant(businessId, (tx) => aplicarPendiente(tx, businessId));
    if (summary.outcome === 'not_pending') {
      return { ok: false, message: 'No hay una migración esperando tu decisión.' };
    }
    revalidatePath('/importar');
    revalidatePath(`/${summary.plantilla}`);
    return { ok: true };
  } catch (error) {
    return failure(error, 'resolverImportacionAsistida', REFUSALS);
  }
}

/** The inbox item staff triage from (N-08's `kind = migracion` source). */
async function avisarAlEquipo(input: {
  readonly id: string;
  readonly businessId: string;
  readonly sistemaActual: string;
  readonly notas: string;
  readonly files: readonly { readonly filename: string }[];
}): Promise<void> {
  await supportInboxFromEnv().file({
    kind: 'migracion',
    urgent: false,
    businessId: input.businessId,
    title: 'Migración asistida: nueva solicitud',
    body: [
      `Sistema actual: ${input.sistemaActual.trim()}`,
      input.notas.trim(),
      `${input.files.length} archivo(s): ${input.files.map((f) => f.filename).join(', ')}`,
    ]
      .filter((l) => l !== '')
      .join('\n'),
    source: 'portal-hazlo-por-mi',
    sourceRef: `hazlo-por-mi:${input.id}`,
    paymentRef: null,
  });
}

/** The uploaded files as the use case wants them; empty ones skipped. */
async function archivosDe(
  form: FormData,
): Promise<{ filename: string; mime: string; bytes: Buffer }[]> {
  const files: { filename: string; mime: string; bytes: Buffer }[] = [];
  for (const f of form.getAll('archivos')) {
    if (f instanceof File && f.size > 0) {
      files.push({ filename: f.name, mime: f.type, bytes: Buffer.from(await f.arrayBuffer()) });
    }
  }
  return files;
}

/** The approve step's transaction body: claim, apply, count — or nothing. */
async function aplicarPendiente(
  tx: Parameters<Parameters<typeof withTenant>[1]>[0],
  businessId: BusinessId,
): Promise<
  | { readonly outcome: 'not_pending' }
  | { readonly outcome: 'aplicada'; readonly plantilla: 'productos' | 'clientes' }
> {
  const claim = await claimForApproval(tx, businessId);
  if (claim === null) return { outcome: 'not_pending' };
  const template = TEMPLATES[claim.plantilla];
  const file = new File([new Uint8Array(claim.file.bytes)], claim.file.filename, {
    type: 'text/csv',
  });
  const planned = await template.plan(tx, file);
  const count = (kind: string) => planned.filter((r) => r.kind === kind).length;
  const utiles = count('nuevo') + count('actualizar');
  // A refusal, so the owner hears this reason — they can reject the mapping —
  // rather than «No pudimos enviar tu solicitud», which named the wrong action
  // and promised a retry could help.
  if (utiles === 0) {
    throw refusal('IMPORTACION_SIN_FILAS', 'El archivo mapeado no trae filas válidas.');
  }
  await template.apply(tx, businessId, planned as readonly unknown[]);
  return { outcome: 'aplicada', plantilla: claim.plantilla };
}

/** Read side for the /importar card. */
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
