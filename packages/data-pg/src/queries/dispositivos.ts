import { and, desc, eq, isNull } from 'drizzle-orm';

import { dayCloses } from '../schema/caja.js';
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
