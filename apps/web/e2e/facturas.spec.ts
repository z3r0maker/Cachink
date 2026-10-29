import { expect, test } from './test';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';

import { billingDatabaseUrl } from './db-url';
import { mintTenant, signIn, type Tenant } from './tenant';

/**
 * P-10's «Facturas» (N-33) on an owner of its own, without fiscal data: a
 * payment in the monthly global CFDI points to Negocio, a pending one says it
 * arrives by email, and one invoiced by hand shows its UUID.
 */
test.use({ storageState: { cookies: [], origins: [] } });

let t: Tenant;

test.beforeAll(async () => {
  t = await mintTenant({ label: 'Facturas' });
  const billing = postgres(billingDatabaseUrl(), { max: 1, onnotice: () => undefined });
  try {
    const pago = (status: string, route: string, dia: string, uuid: string | null) => billing`
      INSERT INTO cfdi_payments (external_payment_id, business_id, route, status, total_centavos,
                                 paid_at, period, forma_pago, description, invoice_uuid)
      VALUES (${`in_e2e_${randomUUID()}`}, ${t.biz}, ${route}, ${status}, 34800, ${dia}, '2026-05',
              '04', 'Plan Xangarro', ${uuid})`;
    await pago('in_global', 'global', '2026-05-01T18:00:00Z', null);
    await pago('manual', 'individual', '2026-04-01T18:00:00Z', null);
    await pago(
      'stamped',
      'individual',
      '2026-03-01T18:00:00Z',
      'AAAAAAAA-1111-2222-3333-444444444444',
    );
  } finally {
    await billing.end({ timeout: 5 });
  }
});

test('each payment shows the state of its factura', async ({ page }) => {
  await signIn(page, t);
  await page.goto('/suscripcion');

  const lista = page.getByRole('list', { name: 'Facturas' }).getByRole('listitem');
  await expect(lista).toHaveCount(3);
  await expect(lista.nth(0)).toContainText('En la factura global del mes');
  await expect(
    lista
      .nth(0)
      .getByRole('link', { name: 'Completa tus datos fiscales para facturar a tu nombre' }),
  ).toBeVisible();
  await expect(lista.nth(1)).toContainText('Tu factura se enviará a tu correo');
  await expect(lista.nth(2)).toContainText('Emitida · UUID AAAAAAAA-1111-2222-3333-444444444444');
  await expect(lista.nth(0)).toContainText('$348.00');
});
