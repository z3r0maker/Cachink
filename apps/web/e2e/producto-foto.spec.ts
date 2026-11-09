import type { Page } from '@playwright/test';

import { expect, test } from './test';
import { mintTenant, signIn, type Tenant } from './tenant';
import { addProduct, addProductPhoto } from './tenant-rows';

/**
 * The product photo in the portal (P-42, ADR-134) on a tenant of its own, so
 * it writes freely in every viewport. What is asserted is that the photo the
 * phone synced reached the page: the image route answers the WebP, the
 * catalogue tile shows it decoded, the drawer says when and on which register
 * it was taken, and «Quitar foto» makes the route answer 404 and brings the
 * icon back. A product with no photo never asks the route at all.
 */
test.use({ storageState: { cookies: [], origins: [] } });

let t: Tenant;
let conFoto: string;
let sinFoto: string;

test.beforeAll(async () => {
  t = await mintTenant({ label: 'Fotos' });
  conFoto = await addProduct(t, { nombre: 'Agua de horchata', sku: 'BEB-001' });
  sinFoto = await addProduct(t, { nombre: 'Gringa', sku: 'GRI-001' });
  await addProductPhoto(t, conFoto);
});

const fila = (page: Page, sku: string) => page.locator('main').locator('tr', { hasText: sku });

test('the catalogue shows the synced photo, decoded, and leaves the icon where there is none', async ({
  page,
}) => {
  await signIn(page, t);
  const res = await page.request.get(`/api/productos/${conFoto}/imagen`);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toBe('image/webp');

  await page.goto('/productos');
  const foto = fila(page, 'BEB-001').getByTestId(`producto-foto-${conFoto}`);
  await expect(foto).toBeVisible();
  await expect
    .poll(() => foto.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
    .toBe(8);
  await expect(fila(page, 'GRI-001').getByTestId(`producto-foto-${sinFoto}`)).toHaveCount(0);
});

test('«Quitar foto» asks first, then removes it everywhere and brings the icon back', async ({
  page,
}) => {
  await signIn(page, t);
  await page.goto('/productos');
  await fila(page, 'BEB-001').getByRole('button', { name: 'Editar' }).click();
  const drawer = page.getByRole('dialog', { name: /Editar Agua de horchata/ });
  await expect(drawer.getByText(/^Tomada el \d+ de \w+ de \d{4} en Caja única$/)).toBeVisible();

  await drawer.getByRole('button', { name: 'Quitar foto' }).click();
  const confirmar = page.getByRole('dialog', { name: '¿Quitar la foto de Agua de horchata?' });
  await confirmar.getByRole('button', { name: 'Mejor no' }).click();
  await expect(drawer.getByText(/^Tomada el/)).toBeVisible();

  await drawer.getByRole('button', { name: 'Quitar foto' }).click();
  await confirmar.getByRole('button', { name: 'Quitar foto' }).click();
  await expect(drawer.getByTestId('producto-sin-foto')).toBeVisible();

  const res = await page.request.get(`/api/productos/${conFoto}/imagen`);
  expect(res.status()).toBe(404);
  await page.keyboard.press('Escape');
  await expect(fila(page, 'BEB-001').getByTestId(`producto-foto-${conFoto}`)).toHaveCount(0);
});
