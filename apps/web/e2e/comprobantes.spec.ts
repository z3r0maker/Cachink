import { expect, test } from '@playwright/test';
import sharp from 'sharp';

/**
 * Negocio → Comprobantes (N-19): the owner uploads a logo (a solid brand-red
 * PNG), the brand colour is extracted into the picker, the fields save, and
 * the sidebar brand block swaps the wordmark for the logo. A viewer sees the
 * fields with no controls. Desktop only — the surface is Director-side.
 */

test('the owner brands the business: logo, colour, fields, sidebar', async ({ page }) => {
  await page.goto('/negocio/comprobantes');

  await page.setInputFiles('input[type="file"]', {
    name: 'logo.png',
    mimeType: 'image/png',
    buffer: await sharp({
      create: {
        width: 96,
        height: 48,
        channels: 4,
        background: { r: 212, g: 40, b: 60, alpha: 1 },
      },
    })
      .png()
      .toBuffer(),
  });
  await expect(page.getByText('Logo guardado.')).toBeVisible();
  await expect(page.getByTestId('comprobantes-logo')).toBeVisible();

  // The extraction lands in the colour picker (saturated red beats nothing).
  await expect(page.locator('input[type="color"]')).toHaveValue(/^#d42/, { timeout: 8000 });

  await page.getByPlaceholder('¡Gracias por tu compra!').fill('¡Gracias por tu compra!');
  await page.getByRole('button', { name: 'Guardar comprobantes' }).click();
  await expect(page.getByText('Guardado.')).toBeVisible();

  // The sidebar brand block now renders the logo, not the wordmark.
  await page.goto('/');
  await expect(page.locator('aside img')).toBeVisible();
  await expect(page.getByText('XANGARRO!', { exact: true })).toHaveCount(0);

  // The logo route serves the bytes publicly, with the content type.
  const src = await page.locator('aside img').getAttribute('src');
  expect(src).not.toBeNull();
  const res = await page.request.get((src as string).split('?')[0] as string);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/');
});

test('a viewer reads the fields without controls', async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto('/login');
  await page.getByTestId('login-email').fill('contador@taqueria.mx');
  await page.getByTestId('login-password').fill('contador123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  await page.goto('/negocio/comprobantes');
  await expect(page.getByText('Plantilla')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar comprobantes' })).toHaveCount(0);
  await expect(page.getByText('Subir logo')).toHaveCount(0);
  await context.close();
});
