import { expect, test } from './test';

import { addProduct, addSale } from './tenant-rows';
import { mintTenant, signIn, type Tenant } from './tenant';

/**
 * P-34's «Informe mensual PDF»: on a **Xangarrote** tenant of its own the button
 * downloads a real PDF (magic %PDF) for the chosen month; the seeded **Xangarro**
 * tenant shows the button (ADR-090 moved the informe down from Xangarrote); on a
 * **free-plan** tenant the button is hidden and a direct fetch of the route is
 * refused server-side — the capability is checked twice, once per side.
 */
let pagado: Tenant;
let gratis: Tenant;

test.beforeAll(async () => {
  pagado = await mintTenant({ label: 'Informe', plan: 'xangarrote' });
  // April's sale is what the informe reports: one ticket line of $500.00.
  const producto = await addProduct(pagado, { nombre: 'Despensa', costo: 100, precio: 500 });
  await addSale(pagado, {
    fecha: '2026-04-10',
    monto: 50_000,
    concepto: 'Despensa',
    productoId: producto,
  });
  // The free plan is the absence of billing (B-10), which is what `free` means.
  gratis = await mintTenant({ label: 'Gratuito', plan: 'free' });
});

test.describe('Xangarrote (throwaway tenant)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('the button downloads the contador PDF for the chosen month', async ({ page }) => {
    await signIn(page, pagado);
    await page.goto('/estados?p=mensual');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: 'Informe mensual' }).click(),
    ]);
    // Named after the business, whatever this run called it.
    const slug = pagado.nombre.replace(/ /g, '-');
    expect(download.suggestedFilename()).toMatch(
      new RegExp(`^informe-${slug}-\\d{4}-\\d{2}\\.pdf$`),
    );
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const bytes = Buffer.concat(chunks);
    expect(bytes.subarray(0, 4).toString('ascii')).toBe('%PDF');
    expect(bytes.byteLength).toBeGreaterThan(1_000);
  });

  test('the route accepts a named month', async ({ page }) => {
    await signIn(page, pagado);
    const response = await page.request.get('/api/export/informe-mensual?mes=2026-04');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/pdf');
  });
});

test.describe('Xangarro (the seeded tenant)', () => {
  test('shows the informe button since ADR-090', async ({ page }) => {
    await page.goto('/estados');
    await expect(page.getByRole('link', { name: 'Informe mensual' })).toBeVisible();
  });
});

test.describe('Free plan (throwaway tenant)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('no button on Estados, and the route refuses the capability', async ({ page }) => {
    await signIn(page, gratis);
    await page.goto('/estados');
    await expect(page.getByRole('link', { name: 'Informe mensual' })).toHaveCount(0);
    const response = await page.request.get('/api/export/informe-mensual?mes=2026-05');
    expect(response.status()).toBe(403);
  });
});
