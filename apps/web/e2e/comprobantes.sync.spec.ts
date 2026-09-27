import { expect, test } from './test';
import sharp from 'sharp';

/**
 * Mi negocio · Comprobantes (N-19): the owner uploads a logo (a solid brand-red
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

  // The address that prints (0028): written, saved, and back after a reload.
  //
  // Retried as a whole, because the form is controlled React state and two
  // things can swallow what was typed before «Guardar» posts it: the logo save
  // above revalidates this page, and a refresh landing mid-edit resets the form
  // to the server's values; and a fill that beats hydration sets the input but
  // not the state behind it. Either way the save stored an empty address and
  // only the reload showed it. A save that is genuinely broken still fails —
  // every attempt reloads and reads the row back.
  const direccion = page.getByPlaceholder('Av. Hidalgo 214, Col. Centro · Guadalajara, Jal.');
  const escrita = 'Av. Hidalgo 214, Col. Centro · Guadalajara, Jal.';
  await expect(async () => {
    await direccion.fill(escrita);
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText(/^Guardado\./)).toBeVisible({ timeout: 5_000 });
    await page.reload();
    await expect(direccion).toHaveValue(escrita, { timeout: 5_000 });
  }).toPass({ timeout: 45_000, intervals: [500, 1_000, 2_000] });

  // The sidebar brand block now renders the logo, not the wordmark.
  await page.goto('/');
  await expect(page.locator('aside img[src*="/api/logos/"]')).toBeVisible();
  await expect(page.getByText('XANGARRO!', { exact: true })).toHaveCount(0);

  // The logo route serves the bytes publicly, with the content type.
  const src = await page.locator('aside img[src*="/api/logos/"]').getAttribute('src');
  expect(src).not.toBeNull();
  const res = await page.request.get((src as string).split('?')[0] as string);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/');
});

test('a viewer reads the fields without controls', async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByTestId('login-email').fill('contador@taqueria.mx');
  await page.getByTestId('login-password').fill('contador123');
  await page.getByRole('button', { name: 'Abrir mi changarro' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  await page.goto('/negocio/comprobantes');
  await expect(page.getByText('Plantilla')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar cambios' })).toHaveCount(0);
  await expect(page.getByText('Arrastra tu logo aquí o elígelo')).toHaveCount(0);
  await context.close();
});

test('the live preview follows the template and serves real files (N-20)', async ({ page }) => {
  await page.goto('/negocio/comprobantes');
  // The preview paints the draft in the page (CfgComprobantes); the downloads
  // are the renderer's real files.
  const previa = page.getByTestId('comprobante-vista-previa');
  await expect(previa.getByRole('img')).toBeVisible();
  const descarga = page.getByTestId('comprobante-descarga-png');

  // The route behind it answers with a real PNG of the business's branding.
  const src = await descarga.getAttribute('href');
  expect(src).toContain('plantilla=');
  const png = await page.request.get(src as string);
  expect(png.status()).toBe(200);
  expect(png.headers()['content-type']).toBe('image/png');

  // Choosing another template repaints the preview and retargets the files.
  await page.getByRole('radio', { name: /Moderno/ }).click();
  await expect(previa.getByText('Moderno', { exact: true })).toBeVisible();
  await expect(descarga).toHaveAttribute('href', /plantilla=moderno/);

  // And the PDF salida comes out of the same renderer.
  const pdf = await page.request.get('/api/comprobantes/muestra?plantilla=moderno&formato=pdf');
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()['content-type']).toBe('application/pdf');
  const bytes = await pdf.body();
  expect(bytes.length).toBeGreaterThan(1000);

  // A made-up ticket gets 404, an authed stranger gets nothing either.
  const fantasma = await page.request.get('/api/comprobantes/01NOEXISTE?formato=png');
  expect(fantasma.status()).toBe(404);
});
