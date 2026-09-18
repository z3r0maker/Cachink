import { and, desc, eq, isNull } from 'drizzle-orm';

import { cajaTurnos, dayCloses } from '../schema/caja.js';
import type { Db } from '../client.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * A device's recent cortes (P-06's drawer): what it expected, what was
 * counted, and the difference — newest first. Money stays bigint centavos.
 */
export interface CorteDeDispositivo {
  readonly id: string;
  readonly fecha: string;
  readonly esperado: bigint;
  readonly contado: bigint;
  readonly diferencia: bigint;
}

export async function cortesDeDispositivo(
  tx: Tx,
  deviceId: string,
  limit = 5,
): Promise<readonly CorteDeDispositivo[]> {
  const rows = await tx
    .select({
      id: dayCloses.id,
      fecha: dayCloses.fecha,
      esperado: dayCloses.efectivoEsperadoCentavos,
      contado: dayCloses.efectivoContadoCentavos,
      diferencia: dayCloses.diferenciaCentavos,
    })
    .from(dayCloses)
    .where(and(eq(dayCloses.deviceId, deviceId), isNull(dayCloses.deletedAt)))
    .orderBy(desc(dayCloses.fecha))
    .limit(limit);
  return rows;
}

/**
 * An operator's recent shifts (P-05's drawer): when each opened and closed,
 * and how the count came out — newest first. An open shift has no close yet.
 */
export interface TurnoDeOperador {
  readonly id: string;
  readonly fecha: string;
  readonly aperturaAt: string;
  readonly cierreAt: string | null;
  readonly diferencia: bigint | null;
}

export async function turnosDeOperador(
  tx: Tx,
  userId: string,
  limit = 5,
): Promise<readonly TurnoDeOperador[]> {
  return tx
    .select({
      id: cajaTurnos.id,
      fecha: cajaTurnos.fecha,
      aperturaAt: cajaTurnos.aperturaAt,
      cierreAt: cajaTurnos.cierreAt,
      diferencia: cajaTurnos.diferenciaCentavos,
    })
    .from(cajaTurnos)
    .where(and(eq(cajaTurnos.userId, userId), isNull(cajaTurnos.deletedAt)))
    .orderBy(desc(cajaTurnos.aperturaAt))
    .limit(limit);
}
