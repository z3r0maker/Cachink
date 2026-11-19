import { randomUUID } from 'node:crypto';

import { createCorpDb, importesDeResultados } from '@xangarro/data-corp';
import {
  gastadoPorCategoria,
  ingresoPromedio,
  limiteDeGasto,
  mesesDelLimite,
  totalMensual,
  trimestreDe,
} from '@xangarro/domain/corp';
import postgres from 'postgres';

import { OTRO_ID } from './empresa-cierre';

/**
 * E-22's steps for empresa.spec.ts. The figures the page shows are worked
 * out the page's own way from what the ledger holds when the test reads
 * them; the other founder (no console login) answers and asks in the
 * database. `clearLedgerFixture` removes every budget and request the suite
 * and that founder leave.
 */
export const hoyMx = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date());

export const trimestreMx = () => trimestreDe(hoyMx());

/** This month's spending so far, and the Límite. */
export async function esperadoDePresupuesto(
  hoy: string,
): Promise<{ readonly gastado: bigint; readonly limite: bigint }> {
  const mes = hoy.slice(0, 7);
  const meses = mesesDelLimite(mes);
  const conn = createCorpDb(process.env.CORP_DATABASE_URL ?? '', 1);
  const importes = await importesDeResultados(conn, `${meses[0] ?? mes}-01`, hoy);
  await conn.$client.end({ timeout: 5 });
  return {
    gastado: totalMensual(gastadoPorCategoria(importes, `${mes}-01`, hoy)),
    limite: limiteDeGasto(ingresoPromedio(importes, meses)),
  };
}

const superSql = () =>
  postgres(process.env.DATABASE_SUPER_URL ?? '', { max: 1, onnotice: () => undefined });

/** The other founder rejects the budget waiting, and sends their own: $7,000.00 a month. */
export async function otroSocioRechazaYPrepara(trimestre: string): Promise<void> {
  const sql = superSql();
  const id = `e2e-presupuesto-${randomUUID()}`;
  await sql.begin(async (tx) => {
    await tx`INSERT INTO corp.budget_answers (budget_id, kind, founder_id, at)
             SELECT b.id, 'rechazado', ${OTRO_ID}, now() FROM corp.budgets b
              WHERE b.quarter = ${trimestre}
                AND NOT EXISTS (SELECT 1 FROM corp.budget_answers a WHERE a.budget_id = b.id)`;
    await tx`INSERT INTO corp.budgets (id, quarter, prepared_by, prepared_at)
             VALUES (${id}, ${trimestre}, ${OTRO_ID}, now())`;
    for (const [categoria, monto] of [
      ['costo_servicio', 300_000],
      ['ventas_marketing', 200_000],
      ['desarrollo', 100_000],
      ['administracion', 100_000],
    ] as const) {
      await tx`INSERT INTO corp.budget_lines (budget_id, categoria, monto)
               VALUES (${id}, ${categoria}, ${monto})`;
    }
  });
  await sql.end({ timeout: 5 });
}

export const E2E_CAMPANA = `E2E campaña ${randomUUID().slice(0, 6)}`;

/** The other founder asks for $6,000.00 above their Límite. */
export async function otroSocioPide(hoy: string): Promise<void> {
  const sql = superSql();
  await sql`INSERT INTO corp.spend_requests
              (id, period, founder_id, concepto, categoria, monto, automatica, at)
            VALUES (${`e2e-${randomUUID()}`}, ${hoy.slice(0, 7)}, ${OTRO_ID}, ${E2E_CAMPANA},
                    'ventas_marketing', 600000, false, now())`;
  await sql.end({ timeout: 5 });
}
