'use server';

import { devices } from '@xangarro/data-pg';
import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { failure } from '../action-errors';
import { requireMember } from '../auth';
import { withTenant } from '../db';

/**
 * Revoke a device (B-12).
 *
 * Frees its slot immediately, so a replacement phone can activate. What it does
 * **not** do is reach into the phone: a revoked device finds out on its next API
 * call, which answers `401 DEVICE_REVOKED` (contract, B-05). Rows it pushed are
 * already here and stay; rows it had not synced are lost with it unless it is
 * re-activated. The confirmation copy says exactly that, because it is the one
 * thing the shopkeeper cannot undo.
 *
 * Revoke, never delete: the row is the record that the phone existed, which
 * code it joined with, and what it synced — and `sync_rejections` names devices
 * by id.
 *
 * No `sync_log`: `devices` exists only in the cloud.
 */
export type RevokeResult = { ok: true } | { ok: false; message: string };

export async function revocarDispositivo(deviceId: string): Promise<RevokeResult> {
  try {
    const session = await requireMember('admin');

    const revoked = await withTenant(session.business_id, async (tx) => {
      const now = new Date().toISOString();
      return (
        tx
          .update(devices)
          .set({ revokedAt: now, updatedAt: now })
          // `revoked_at IS NULL` makes it idempotent: revoking twice keeps the
          // original timestamp, which is the one the audit trail needs.
          .where(and(eq(devices.id, deviceId), isNull(devices.revokedAt)))
          .returning({ id: devices.id })
      );
    });

    if (revoked.length === 0) {
      return { ok: false, message: 'Ese dispositivo ya estaba revocado o no existe.' };
    }
    revalidatePath('/equipo');
    return { ok: true };
  } catch (error) {
    // Once any Error's own text — a database failure's words on the owner's screen.
    return failure(error, 'revocarDispositivo', {
      retry: 'No pudimos revocar el dispositivo. Intenta de nuevo.',
    });
  }
}
