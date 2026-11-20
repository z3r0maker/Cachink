import { randomUUID } from 'node:crypto';

import {
  createCorpDb,
  createRecurringTemplateRepository,
  movimientosDeCaja,
} from '@xangarro/data-corp';
import { autonomia, mesesHasta, type Autonomia } from '@xangarro/domain/corp';

/**
 * E-23's steps for empresa.spec.ts. Other tests post in this month and the
 * last ones, so the expected cash and spending are worked out the page's own
 * way from what the ledger holds when the test reads them; and a recurring
 * charge due in the next days, named «E2E …» so `clearLedgerFixture` removes it.
 */
const db = () => createCorpDb(process.env.CORP_DATABASE_URL ?? '', 1);

export const hoyMx = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date());

const sumar = (fecha: string, dias: number) =>
  new Date(Date.parse(`${fecha}T12:00:00Z`) + dias * 86_400_000).toISOString().slice(0, 10);

/** Caja's averages: the three whole months before today, as the Resumen reads them. */
export async function esperadoDeCaja(hoy: string): Promise<Autonomia> {
  const conn = db();
  const movs = await movimientosDeCaja(conn, hoy);
  await conn.$client.end({ timeout: 5 });
  const meses = mesesHasta(hoy.slice(0, 7), 4).slice(0, 3);
  const a = autonomia(movs, hoy, meses);
  return a.mesesConDatos === 0 ? autonomia(movs, hoy, [hoy.slice(0, 7)]) : a;
}

export const E2E_HOSTING = `E2E caja hosting ${randomUUID().slice(0, 6)}`;

/** A $1,234.50 monthly charge on a day three days ahead, starting this month. */
export async function sembrarCargoProximo(hoy: string): Promise<string> {
  const dia = sumar(hoy, 3);
  const conn = db();
  await createRecurringTemplateRepository(conn).ensure({
    id: `e2e-caja-${randomUUID()}`,
    nombre: E2E_HOSTING,
    contraparte: null,
    rfc: null,
    categoria: 'costo_servicio',
    moneda: 'MXN',
    montoEstimado: 1_234_50n,
    diaCargo: Number(dia.slice(8, 10)),
    projectId: 'xangarro',
    deducible: true,
    desde: hoy.slice(0, 7),
    createdBy: 'e2e-caja',
  });
  await conn.$client.end({ timeout: 5 });
  return dia;
}
