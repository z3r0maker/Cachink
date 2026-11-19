import { expect, test, type Page } from './test';

import { clickUntil } from './interact';
import { mintTenant, signIn, type Tenant } from './tenant';
import { addExpense, addExpenseReceipt } from './tenant-rows';

/**
 * The gasto's receipt photo in the Movimientos drawer (ADR-149, M-18, board
 * CgPortal) on a tenant of its own. What is asserted is that the photo the
 * phone pushed reached the page: the image decoded in the drawer, «Ver
 * completa» shows it full size and «Cerrar» puts it away; and a gasto with
 * no receipt says «Sin comprobante», naming who wrote it down.
 */
test.use({ storageState: { cookies: [], origins: [] } });

let t: Tenant;
let conFoto: string;

test.beforeAll(async () => {
  t = await mintTenant({ label: 'Comprobantes' });
  conFoto = await addExpense(t, { fecha: '2026-05-10', concepto: 'Tortillas', monto: 18000 });
  await addExpenseReceipt(t, conFoto);
  await addExpense(t, { fecha: '2026-05-10', concepto: 'Cilindro de gas', operador: 'Toni' });
});

async function abrir(page: Page, concepto: string) {
  await signIn(page, t);
  await page.goto('/movimientos?tab=gastos');
  const cajon = page.getByRole('dialog', { name: concepto, exact: true });
  await clickUntil(page.locator('main tbody tr', { hasText: concepto }), cajon);
  return cajon;
}

const decoded = (img: HTMLImageElement) => img.complete && img.naturalWidth;

test('a gasto with a receipt shows the photo, and «Ver completa» opens it full size', async ({
  page,
}) => {
  const res = await page.request.get(`/api/gastos/${conFoto}/comprobante`);
  expect(res.status()).toBe(401);

  const cajon = await abrir(page, 'Tortillas');
  const foto = cajon.getByRole('img', { name: 'Comprobante de Tortillas' });
  await expect(foto).toBeVisible();
  await expect.poll(() => foto.evaluate(decoded)).toBe(8);
  await expect(cajon.getByText(/^Foto tomada en .+, a las \d\d:\d\d\.$/)).toBeVisible();
  const servida = await page.request.get(`/api/gastos/${conFoto}/comprobante`);
  expect(servida.status()).toBe(200);
  expect(servida.headers()['content-type']).toBe('image/webp');

  await cajon.getByRole('button', { name: 'Ver completa' }).click();
  const completa = page.getByTestId('comprobante-completo');
  await expect(completa.getByText('Tortillas · −$180.00')).toBeVisible();
  const grande = completa.getByRole('img', { name: 'Comprobante de Tortillas' });
  await expect.poll(() => grande.evaluate(decoded)).toBe(8);

  await completa.getByRole('button', { name: 'Cerrar' }).click();
  await expect(completa).toBeHidden();
  await expect(cajon).toBeVisible();
});

test('a gasto with none says «Sin comprobante», naming who wrote it down', async ({ page }) => {
  const cajon = await abrir(page, 'Cilindro de gas');
  const aviso = cajon.getByTestId('sin-comprobante');
  await expect(aviso).toContainText('Sin comprobante');
  await expect(aviso).toContainText('Toni no le tomó foto. Si llega después, aparece aquí sola.');
  await expect(cajon.getByRole('img', { name: /Comprobante de/ })).toHaveCount(0);
});
