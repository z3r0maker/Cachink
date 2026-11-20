import { expect, test, type Page } from './test';

import { filled } from './interact';
import { asTenant } from './sync-phone';
import { mintTenant, signIn, stamp, type Tenant } from './tenant';
import { addProduct } from './tenant-rows';

/**
 * P-44 (ADR-150; board EcPortalCodigo) on a tenant of its own: «Código de
 * barras» in «Nuevo producto». A product saves with its code and Postgres
 * holds it; a second product with the same code written as EAN-13 is held at
 * «Siguiente» and the notice names the first; a reader's Enter in the field
 * says «Leímos el código» and saves nothing.
 */
test.use({ storageState: { cookies: [], origins: [] } });

let t: Tenant;
const REFRESCO = `Refresco de cola ${stamp()}`;
/** A UPC-A, as Android reads it; the EAN-13 below is the same code. */
const UPC_A = '012000001772';

test.beforeAll(async () => {
  t = await mintTenant({ label: 'Codigo' });
  await addProduct(t, { nombre: REFRESCO, sku: UPC_A });
});

const productos = (nombre: string) =>
  asTenant(t.biz, (sql) => sql`SELECT sku FROM products WHERE nombre = ${nombre}`);

/** Step one with a name, «Más opciones» open and a code typed. */
async function pasoUno(page: Page, nombre: string, codigo: string): Promise<void> {
  await page.goto('/productos/nuevo');
  await filled(page.getByTestId('producto-nombre'), nombre);
  await page.getByText('Más opciones: código de barras o si es un servicio').click();
  await filled(page.getByTestId('producto-sku'), codigo);
}

test('a product saves with its barcode, and Postgres holds it', async ({ page }) => {
  await signIn(page, t);
  const nombre = `Agua natural ${stamp()}`;
  await pasoUno(page, nombre, '7501055300075');
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByTestId('producto-costo').fill('6');
  await page.getByTestId('producto-precio').fill('15');
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Crear producto' }).click();
  await expect(page).toHaveURL(/\/productos$/);
  await expect(page.locator('main').getByText(nombre)).toBeVisible();
  expect(await productos(nombre)).toEqual([{ sku: '7501055300075' }]);
});

test('the same code as EAN-13 is held at «Siguiente», naming the product that has it', async ({
  page,
}) => {
  await signIn(page, t);
  const nombre = `Cola ${stamp()}`;
  await pasoUno(page, nombre, `0${UPC_A}`);
  await page.getByRole('button', { name: 'Siguiente' }).click();
  const aviso = page.getByTestId('producto-codigo-repetido');
  await expect(aviso).toContainText(`Ese código ya lo tiene «${REFRESCO}».`);
  await expect(page.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  await expect(aviso.getByRole('link', { name: 'Ver ese producto' })).toHaveAttribute(
    'href',
    /\/productos\?editar=/,
  );
  // «Quitar el código» lets the step go on without it.
  await aviso.getByRole('button', { name: 'Quitar el código' }).click();
  await expect(page.getByTestId('producto-sku')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Siguiente' })).toBeEnabled();
  expect(await productos(nombre)).toEqual([]);
});

test('a reader’s Enter in the field says it read the code and saves nothing', async ({ page }) => {
  await signIn(page, t);
  const nombre = `Leído ${stamp()}`;
  await pasoUno(page, nombre, '7501234500018');
  await page.getByTestId('producto-sku').press('Enter');
  await expect(page.getByTestId('producto-codigo-leido')).toHaveText(
    'Leímos el código. El Enter del lector no guarda: revisa y sigue cuando quieras.',
  );
  await expect(page).toHaveURL(/\/productos\/nuevo$/);
  expect(await productos(nombre)).toEqual([]);
});

test('«Ver ese producto» opens that product’s drawer', async ({ page }) => {
  await signIn(page, t);
  const [fila] = await asTenant(
    t.biz,
    (sql) => sql`SELECT id FROM products WHERE nombre = ${REFRESCO}`,
  );
  await page.goto(`/productos?editar=${String(fila?.id)}`);
  await expect(page.getByRole('dialog', { name: `Editar ${REFRESCO}` })).toBeVisible();
  await expect(page.getByTestId('producto-sku')).toHaveValue(UPC_A);
});
