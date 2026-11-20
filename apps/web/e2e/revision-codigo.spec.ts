import { expect, test, type Page } from './test';
import { newUlid } from '@xangarro/domain';

import { asTenant } from './sync-phone';
import { mintTenant, signIn, stamp, type Tenant } from './tenant';

/**
 * P-45 (ADR-150 §4; board EcRevision) on a tenant of its own. A phone gave a
 * product the barcode the catalogue's «Refresco 600 ml» has, as EAN-13 and
 * under another name. Revisión de caja says «Mismo código que …» and holds
 * «Aprobar» until the owner merges or says «Son distintos», which takes the
 * code off the caja's product (logged, so the phones get it) and lets it be
 * approved; the catalogue product keeps its code.
 */
test.use({ storageState: { cookies: [], origins: [] } });

let t: Tenant;
let catalogo = '';
/** A UPC-A, as Android reads it. */
const UPC_A = '012000001772';
const CATALOGO = `Refresco 600 ml ${stamp()}`;

/** A product the phone created at the counter, waiting in Revisión de caja. */
async function deCaja(nombre: string, sku: string): Promise<string> {
  const id = newUlid();
  await asTenant(
    t.biz,
    (sql) => sql`
    INSERT INTO products (id, nombre, sku, categoria, costo_unit_centavos, unidad,
                          umbral_stock_bajo, tipo, seguir_stock, precio_venta_centavos,
                          estado_revision, business_id, device_id, created_at, updated_at)
    VALUES (${id}, ${nombre}, ${sku}, 'Producto Terminado', 0, 'pza', 3, 'producto', false, 2500,
            'pendiente', ${t.biz}, ${t.deviceId}, now(), now())`,
  );
  return id;
}

const fila = (r: {
  estado_revision: string;
  sku: string | null;
  fusionado_con_id: string | null;
}) => `${r.estado_revision}|${r.sku ?? '-'}|${r.fusionado_con_id ?? '-'}`;

const leer = (id: string) =>
  asTenant(t.biz, async (sql) => {
    const [r] = await sql<
      { estado_revision: string; sku: string | null; fusionado_con_id: string | null }[]
    >`
      SELECT estado_revision, sku, fusionado_con_id FROM products WHERE id = ${id}`;
    return r ? fila(r) : 'none';
  });

test.beforeAll(async () => {
  t = await mintTenant({ label: 'Revision codigo' });
  catalogo = newUlid();
  await asTenant(
    t.biz,
    (sql) => sql`
    INSERT INTO products (id, nombre, sku, categoria, costo_unit_centavos, unidad,
                          umbral_stock_bajo, tipo, seguir_stock, precio_venta_centavos,
                          business_id, device_id, created_at, updated_at)
    VALUES (${catalogo}, ${CATALOGO}, ${UPC_A}, 'Producto Terminado', 1200, 'pza', 3,
            'producto', false, 2500, ${t.biz}, ${t.deviceId}, now(), now())`,
  );
});

/** Revisión de caja, the review open on `nombre`. */
async function revisar(page: Page, nombre: string) {
  await signIn(page, t);
  await page.goto('/revision-caja');
  const renglon = page.locator(`div:has(> div > div > span:text-is("${nombre}"))`);
  await expect(renglon.getByTestId('revision-mismo-codigo')).toHaveText(
    `Mismo código que ${CATALOGO}`,
  );
  await renglon.getByRole('button', { name: 'Revisar' }).click();
  return page.getByRole('dialog', { name: `Revisar ${nombre}` });
}

test('«Son distintos» takes the code off the caja’s product, and then it can be approved', async ({
  page,
}) => {
  const nombre = `Refresco de cola ${stamp()}`;
  const id = await deCaja(nombre, `0${UPC_A}`);
  const modal = await revisar(page, nombre);
  const aprobar = modal.getByRole('button', { name: 'Aprobar y agregar al catálogo' });
  await expect(modal.getByTestId('revision-codigo-duplicado')).toContainText(
    `Tiene el mismo código que ${CATALOGO}, de tu catálogo.`,
  );
  await expect(modal).toContainText(`Código de barras 0${UPC_A}.`);
  // Everything the approval asks for, and still it waits for the code.
  await modal.getByLabel('Costo').fill('12');
  await modal.getByRole('button', { name: 'Bebidas' }).click();
  await modal.getByLabel('Existencias').fill('6');
  await expect(aprobar).toBeDisabled();

  await modal.getByRole('button', { name: 'Son distintos' }).click();
  await expect.poll(() => leer(id), { timeout: 10_000 }).toBe('pendiente|-|-');
  await expect(modal.getByTestId('revision-codigo-duplicado')).toHaveCount(0);
  await expect(aprobar).toBeEnabled();
  await aprobar.click();
  await expect.poll(() => leer(id), { timeout: 10_000 }).toBe('aprobado|-|-');
  // The catalogue product keeps its code.
  expect(await leer(catalogo)).toBe(`aprobado|${UPC_A}|-`);
});

test('«Fusionar con …» merges the caja’s product into the one with its code', async ({ page }) => {
  const nombre = `Cola de caja ${stamp()}`;
  const id = await deCaja(nombre, UPC_A);
  const modal = await revisar(page, nombre);
  await modal.getByRole('button', { name: `Fusionar con ${CATALOGO}` }).click();
  await expect.poll(() => leer(id), { timeout: 10_000 }).toBe(`fusionado|${UPC_A}|${catalogo}`);
});
