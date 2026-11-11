import { randomBytes, randomInt } from 'node:crypto';

import { expect, type APIRequestContext } from '@playwright/test';
import postgres from 'postgres';

import { hoyMx } from './empresa-facturas';

/**
 * E-10's steps for empresa.spec.ts (board CD-06i): this month's Stripe
 * payments of Xangarro, written into the ADR-070 tables as the billing
 * webhook would, with the inbox items of the one still to issue and of the
 * month's global; then the daily import, called as Vercel's cron does.
 */
export const TAQUERIA = 'Taquería emitida E2E';
export const PAPELERIA = 'Papelería emitida E2E';
export const ABARROTES = 'Abarrotes emitidos E2E';
const NEGOCIO = 'e2e-emitidas';
const run = randomBytes(4).toString('hex');
export const pagoId = (tag: string) => `in_e2e_${run}_${tag}`;
/**
 * A ULID the inbox accepts: Crockford's alphabet, no I, L, O or U. Each
 * character from `randomInt`, which is uniform by construction (CodeQL
 * js/biased-cryptographic-random flags a modulo over random bytes).
 */
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const itemId = () =>
  `01${Array.from({ length: 24 }, () => CROCKFORD[randomInt(CROCKFORD.length)]).join('')}`;
export const ITEM_MANUAL = itemId();
export const ITEM_GLOBAL = itemId();

const conSql = async <T>(fn: (sql: postgres.Sql) => Promise<T>): Promise<T> => {
  const sql = postgres(process.env.DATABASE_SUPER_URL ?? '', { max: 1, onnotice: () => {} });
  try {
    return await fn(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
};

const receptor = (rfc: string, nombre: string) => ({
  rfc,
  nombre,
  regimenFiscal: '626',
  usoCfdi: 'G03',
  codigoPostal: '06600',
});

/** Four payments of this month and the inbox items of the two still to issue. */
export async function sembrarPagos(): Promise<void> {
  const mes = hoyMx().slice(0, 7);
  const dia = `${mes}-01T18:00:00Z`;
  await conSql(async (sql) => {
    const pago = (tag: string, route: string, status: string, total: number, extra: object) =>
      sql`INSERT INTO cfdi_payments ${sql({
        external_payment_id: pagoId(tag),
        business_id: NEGOCIO,
        route,
        status,
        total_centavos: total,
        paid_at: dia,
        period: mes,
        forma_pago: route === 'individual_ppd' ? '03' : '04',
        description: 'Plan Negocio',
        ...extra,
      })}`;
    await pago('taq', 'individual_pue', 'stamped', 49_900, {
      receptor: sql.json(receptor('TAQ010101AB1', TAQUERIA)),
      invoice_uuid: '6F9619FF-8B86-D011-B42D-00C04FC964FF',
    });
    await pago('pap', 'individual_ppd', 'stamped', 49_900, {
      receptor: sql.json(receptor('PAP010101AB1', PAPELERIA)),
      invoice_uuid: '7A0F1E22-1B2C-4D3E-8F90-112233445566',
      complement_uuid: '8B1F2E33-2C3D-4E4F-9A01-223344556677',
    });
    await pago('pub', 'global', 'pending_global', 23_000, {});
    await pago('aba', 'individual_pue', 'manual', 49_900, {
      receptor: sql.json(receptor('ABA010101AB1', ABARROTES)),
    });
    const item = (id: string, ref: string, title: string) =>
      // No business: the inbox reads business ids as ULIDs, and this one is not a tenant.
      sql`INSERT INTO support_items (id, kind, status, urgent, title, source, source_ref,
                                     payment_ref, created_at, updated_at)
          VALUES (${id}, 'factura', 'nuevo', false, ${title}, 'e2e-emitidas', ${id},
                  ${ref}, now(), now())`;
    await item(ITEM_MANUAL, pagoId('aba'), 'E2E: pago sin CFDI');
    await item(ITEM_GLOBAL, `cfdi-global:${mes}`, 'E2E: factura global del mes');
  });
}

/** The taquería is refunded in full after its cobro was posted. */
export async function reembolsarTaqueria(): Promise<void> {
  await conSql(
    (sql) => sql`UPDATE cfdi_payments SET status = 'cancelled',
                   credit_notes = ${sql.json([{ refundId: 're_e2e', providerId: 'p', uuid: null, totalCentavos: '49900' }])}
                 WHERE external_payment_id = ${pagoId('taq')}`,
  );
}

/** What this file wrote: the payments, their inbox items and the import's cobros. */
export async function limpiarPagos(): Promise<void> {
  await conSql((sql) =>
    sql.begin(async (tx) => {
      await tx`DELETE FROM support_items WHERE source = 'e2e-emitidas'`;
      await tx`DELETE FROM cfdi_payments WHERE business_id = ${NEGOCIO}`;
      const mine = tx`SELECT id FROM corp.entries WHERE created_by = 'sistema:cobros'`;
      await tx`DELETE FROM corp.entry_lines WHERE entry_id IN (${mine})`;
      await tx`DELETE FROM corp.entries WHERE id IN (${mine})`;
    }),
  );
}

/** Vercel's daily call; returns what it answered. */
export async function importarCobros(request: APIRequestContext) {
  const res = await request.get('/api/cron/empresa-cobros', {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? 'e2e-cron-secret'}` },
  });
  expect(res.status()).toBe(200);
  return (await res.json()) as { registrados: number; revertidos: number; omitidos: number };
}
