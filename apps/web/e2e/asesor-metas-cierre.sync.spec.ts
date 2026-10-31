import { expect, test, type Page } from './test';
import { newUlid } from '@xangarro/domain';

import { asTenant } from './sync-phone';
import { mintTenant, signIn, type Tenant } from './tenant';
import { addProduct, addSale } from './tenant-rows';

/**
 * P-27's month-end dialog in its missed variant, on tenants of its own (the
 * `sync` project: it writes rows). April sold $3,000.00 against a $5,000.00
 * goal; the first load of Metas in May closes it lazily and asks what next.
 * A goal closes once, so each choice gets a tenant of its own: «Bajar un
 * nivel» fixes May's goal at the empujón (+10%) over April's real ventas, and
 * «Cambiar» opens the wizard instead.
 */
test.use({ storageState: { cookies: [], origins: [] } });

let BAJAR: Tenant;
let CAMBIAR: Tenant;

/** April sells $1,500.00 twice — a real base of $3,000.00 — against a goal it misses. */
async function sembrar(label: string): Promise<Tenant> {
  // Asesor is a paid-plan screen, which `mintTenant` pays for by default.
  const t = await mintTenant({ label: `Jugos ${label}` });
  const producto = await addProduct(t, { nombre: 'Jugo', costo: 100, precio: 500 });
  for (const [i, fecha] of ['2026-04-09', '2026-04-23'].entries()) {
    await addSale(t, {
      fecha,
      monto: 150_000,
      concepto: 'Jugo',
      folio: i + 1,
      productoId: producto,
      cantidad: 3,
    });
  }
  await asTenant(t.biz, async (sql) => {
    await sql`
      INSERT INTO metas (id, objetivo, motivo, nivel, objetivo_centavos, periodo, business_id,
                         created_at, updated_at)
      VALUES (${newUlid()}, 'vender', 'comprar', 'reto', 500_000, '2026-04', ${t.biz}, now(), now())`;
  });
  return t;
}

test.beforeAll(async () => {
  BAJAR = await sembrar('bajar');
  CAMBIAR = await sembrar('cambiar');
});

async function abrirCierre(page: Page, t: Tenant): Promise<void> {
  await signIn(page, t);
  await page.goto('/asesor');
  await page.getByRole('button', { name: 'Metas' }).click();
  await expect(page.getByText('Se cerró tu meta de 2026-04')).toBeVisible();
  await expect(page.getByText('Quedaste en $3,000.00 de $5,000.00')).toBeVisible();
  // No takeover for a missed goal.
  await expect(page.getByText('¡Lograste tu meta!')).toHaveCount(0);
}

test('a missed goal asks what next, and «Bajar un nivel» sets the empujón over April', async ({
  page,
}) => {
  await abrirCierre(page, BAJAR);
  await expect(page.getByRole('button', { name: 'Repetir · +20%' })).toBeVisible();
  await page.getByRole('button', { name: 'Bajar un nivel · +10%' }).click();

  // The dialog reloads the page (back on «Para ti»); Metas holds May's goal:
  // $3,000.00 × 1.10.
  await expect(page.getByRole('button', { name: 'Para ti' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Metas' }).click();
  await expect(page.getByText('Tu meta de 2026-05')).toBeVisible();
  await expect(page.getByText('$3,300.00', { exact: true })).toBeVisible();
  const [meta] = await asTenant(
    BAJAR.biz,
    (sql) =>
      sql<{ nivel: string; objetivo_centavos: string; motivo: string }[]>`
        SELECT nivel, objetivo_centavos::text, motivo FROM metas
        WHERE business_id = ${BAJAR.biz} AND periodo = '2026-05'`,
  );
  expect(meta).toEqual({ nivel: 'empujon', objetivo_centavos: '330000', motivo: 'comprar' });

  // April is a trophy now, and it says it was missed.
  await expect(page.getByText('Metas anteriores')).toBeVisible();
  await expect(page.getByText('No lograda')).toBeVisible();
});

test('«Cambiar» in the month-end dialog opens the wizard, and fixes nothing by itself', async ({
  page,
}) => {
  await abrirCierre(page, CAMBIAR);
  await page.getByRole('button', { name: 'Cambiar', exact: true }).click();
  await expect(page.getByText('¿Qué quieres lograr?')).toBeVisible();
  await expect(page.getByText('Se cerró tu meta de 2026-04')).toHaveCount(0);
  const metas = await asTenant(
    CAMBIAR.biz,
    (sql) => sql`SELECT id FROM metas WHERE business_id = ${CAMBIAR.biz} AND periodo = '2026-05'`,
  );
  expect(metas).toHaveLength(0);
});
