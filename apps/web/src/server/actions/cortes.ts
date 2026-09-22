'use server';

import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cajaTurnos, mensajesOperador } from '@xangarro/data-pg';
import { newEntityId, type CajaTurnoId } from '@xangarro/domain';

import { requireMember } from '../auth';
import { withTenant } from '../db';
import { PORTAL_DEVICE_ID } from '../repositories/portal-device';
import { reportError } from '../observability/report';

/**
 * Cortes de turno's two owner exits (O-37), writing for real:
 * «Marcar como aclarado» stamps the corte (migration 0029); «Pedir
 * aclaración» files the owner→operator message (ADR-075) against the
 * operator who closed, which every device pulls into Avisos.
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
    reportError(error, { endpoint: 'marcarAclarado' });
    return { ok: false, message: 'No se pudo marcar el corte. Intenta de nuevo.' };
  }
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
    await withTenant(session.business_id, async (tx) => {
      const [turno] = await tx
        .select({ userId: cajaTurnos.userId })
        .from(cajaTurnos)
        .where(eq(cajaTurnos.id, turnoId as CajaTurnoId));
      if (turno === undefined) throw new Error('turno no encontrado');
      const now = new Date().toISOString();
      await tx.insert(mensajesOperador).values({
        id: newEntityId(),
        operadorId: turno.userId,
        cajaTurnoId: turnoId,
        severidad: 'aclaracion',
        cuerpo: texto,
        businessId: session.business_id,
        deviceId: PORTAL_DEVICE_ID,
        createdByUserId: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
    });
    revalidatePath('/cortes');
    return { ok: true };
  } catch (error) {
    reportError(error, { endpoint: 'pedirAclaracion' });
    return { ok: false, message: 'No se pudo pedir la aclaración. Intenta de nuevo.' };
  }
}
