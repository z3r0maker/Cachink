'use server';

import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cajaTurnos, mensajesOperador } from '@xangarro/data-pg';
import { newEntityId, type CajaTurnoId } from '@xangarro/domain';

import { failure, refusal } from '../action-errors';
import { requireMember } from '../auth';
import { withTenant, type Tx } from '../db';
import { PORTAL_DEVICE_ID } from '../repositories/portal-device';
import { recordChange } from '../repositories/sync-log';

/**
 * Cortes de turno's two owner exits (O-37), writing for real:
 * «Marcar como aclarado» stamps the corte (migration 0029); «Pedir
 * aclaración» files the owner→operator message (ADR-075) against the
 * operator who closed, which every device pulls into Avisos. The message
 * and its `sync_log` entry commit together (ADR-075): without the entry, a
 * caja already linked never saw the question, only a freshly activated one.
 */

export type CorteAccionResult = { ok: true } | { ok: false; message: string };

export async function marcarAclarado(turnoId: string): Promise<CorteAccionResult> {
  try {
    const session = await requireMember();
    await withTenant(session.business_id, async (tx) => {
      await tx
        .update(cajaTurnos)
        .set({ aclaradoAt: new Date().toISOString(), aclaradoPor: 'portal' })
        .where(and(eq(cajaTurnos.id, turnoId as CajaTurnoId), isNull(cajaTurnos.aclaradoAt)));
    });
    revalidatePath('/cortes');
    return { ok: true };
  } catch (error) {
    return failure(error, 'marcarAclarado', {
      retry: 'No se pudo marcar el corte. Intenta de nuevo.',
    });
  }
}

/** The message to the operator who closed `turnoId`, and the entry every phone pulls. */
async function archivarAclaracion(tx: Tx, businessId: string, turnoId: string, cuerpo: string) {
  const [turno] = await tx
    .select({ userId: cajaTurnos.userId })
    .from(cajaTurnos)
    .where(eq(cajaTurnos.id, turnoId as CajaTurnoId));
  if (turno === undefined) throw refusal('TURNO_NO_EXISTE', 'Ese turno ya no existe.');
  const now = new Date().toISOString();
  const id = newEntityId();
  await tx.insert(mensajesOperador).values({
    id,
    operadorId: turno.userId,
    cajaTurnoId: turnoId,
    severidad: 'aclaracion',
    cuerpo,
    businessId,
    deviceId: PORTAL_DEVICE_ID,
    createdByUserId: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });
  await recordChange(tx, businessId, 'mensajes_operador', id, 'insert');
}

export async function pedirAclaracion(turnoId: string, cuerpo: string): Promise<CorteAccionResult> {
  try {
    const session = await requireMember();
    const texto = cuerpo.trim();
    if (texto === '' || texto.length > 500) {
      return {
        ok: false,
        message: 'Escribe la aclaración que quieres pedir (hasta 500 caracteres).',
      };
    }
    await withTenant(session.business_id, (tx) =>
      archivarAclaracion(tx, session.business_id, turnoId, texto),
    );
    revalidatePath('/cortes');
    return { ok: true };
  } catch (error) {
    return failure(error, 'pedirAclaracion', {
      retry: 'No se pudo pedir la aclaración. Intenta de nuevo.',
    });
  }
}
