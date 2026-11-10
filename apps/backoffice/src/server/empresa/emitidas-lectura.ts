import { cobrosDePagos } from '@xangarro/data-corp';
import { ingresosDelPeriodo } from '@xangarro/data-pg';

import { db } from '../db/client';
import { requireCorpDb } from '../db/corp';
import { facturasEnBandeja } from '../inbox/facturas-en-bandeja';
import { emitidasDelMes, type Emitidas } from './emitidas-view';

/**
 * What Facturas › Emitidas reads for a month (E-10, board CD-06i): the
 * payments and their CFDIs from the ADR-070 tables (backoffice role), each
 * one's cobro in the corp ledger, and the inbox items still waiting to issue.
 */
export async function leerEmitidas(mes: string): Promise<Emitidas> {
  const ingresos = await ingresosDelPeriodo(db(), mes);
  const ids = ingresos.map((i) => i.paymentId);
  const [cobros, bandeja] = await Promise.all([
    cobrosDePagos(requireCorpDb(), ids),
    facturasEnBandeja(db(), [...ids, `cfdi-global:${mes}`]),
  ]);
  return emitidasDelMes(ingresos, { mes, cobros, bandeja });
}
