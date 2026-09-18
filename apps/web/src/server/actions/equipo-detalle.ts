'use server';

import { cortesDeDispositivo, turnosDeOperador } from '@xangarro/data-pg';

import { withTenant } from '../db';
import { reportError } from '../observability/report';
import { readSession } from '../session';

/**
 * The Equipo drawers' history, read when a drawer opens: a device's last five
 * cortes (P-06) and an operator's last five shifts (P-05). Any member may
 * look — Solo lectura included; acting stays with admins elsewhere.
 */
type Result<T> = { ok: true; rows: T } | { ok: false; message: string };

async function leer<T>(
  endpoint: string,
  fallo: string,
  fn: (tx: Parameters<Parameters<typeof withTenant>[1]>[0]) => Promise<T>,
): Promise<Result<T>> {
  try {
    const session = await readSession();
    if (session === null) return { ok: false, message: 'Inicia sesión para continuar.' };
    return { ok: true, rows: await withTenant(session.business_id, fn) };
  } catch (error) {
    reportError(error, { endpoint });
    return { ok: false, message: fallo };
  }
}

export type CortesResult = Result<Awaited<ReturnType<typeof cortesDeDispositivo>>>;
export type TurnosResult = Result<Awaited<ReturnType<typeof turnosDeOperador>>>;

export async function cortesDelDispositivo(deviceId: string): Promise<CortesResult> {
  return leer('cortesDelDispositivo', 'No pudimos cargar sus cortes.', (tx) =>
    cortesDeDispositivo(tx, deviceId),
  );
}

export async function turnosDelOperador(userId: string): Promise<TurnosResult> {
  return leer('turnosDelOperador', 'No pudimos cargar sus turnos.', (tx) =>
    turnosDeOperador(tx, userId),
  );
}
