import 'server-only';

import { buildInformeMensualPdf, construirInforme } from '@xangarro/application';
import { getBusiness, periodLedger } from '@xangarro/data-pg';
import type { BusinessId, Expense, Sale } from '@xangarro/domain';

import { withTenant } from '../db';

/**
 * «Informe mensual» (P-34): the month's ledger through the same
 * `construirInforme` the phone's use case runs, rendered by the same PDF
 * layout — one document, two clients. Money keys are mapped exactly as
 * `server/estados` maps them (`monto_centavos` as `monto`).
 */
export async function informeMensualPdf(
  businessId: string,
  yearMonth: string,
): Promise<{ readonly bytes: Uint8Array<ArrayBuffer>; readonly filename: string }> {
  const from = `${yearMonth}-01`;
  const to = lastDayOf(yearMonth);
  const { rows, business } = await withTenant(businessId, async (tx) => ({
    rows: await periodLedger(tx, from, to),
    business: await getBusiness(tx),
  }));

  const ventas = rows.ventas.map((r) => ({ ...r, monto: r.monto ?? 0n }) as unknown as Sale);
  const egresos = rows.egresos.map((r) => ({ ...r, monto: r.monto ?? 0n }) as unknown as Expense);
  const informe = construirInforme({
    businessId: businessId as BusinessId,
    yearMonth,
    ventas,
    egresos,
    isrTasa: business?.isrTasa ?? 0,
  });
  const name = (business?.nombre ?? 'negocio').replace(/[^\p{L}\p{N}]+/gu, '-');
  const blob = await buildInformeMensualPdf(informe, business?.nombre ?? 'Tu negocio');
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return { bytes, filename: `informe-${name}-${yearMonth}.pdf` };
}

/** `2026-02` → `2026-02-28`, without a Date round-trip that could drift by timezone. */
function lastDayOf(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number) as [number, number];
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${yearMonth}-${String(last).padStart(2, '0')}`;
}
