import { expect, test, type Page } from './test';
import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import { randomUUID } from 'node:crypto';

import { clickUntil } from './interact';
import { asTenant } from './sync-phone';

/**
 * «Ir a fecha» (DS-01): `?ir=YYYY-MM-DD` opens the page holding that day and
 * redirects to a plain `?pagina=N`, so the pager counts on from there. Its own
 * tenant: one venta a day, 1–25 May, ten to a page — the 3rd sits on page 3
 * (22 newer rows).
 */
test.use({ storageState: { cookies: [], origins: [] } });

const stamp = Date.now();
const email = `ir-fecha-${stamp}@test.mx`;
const biz = newUlid();
const counter = (page: Page) => page.locator('main').getByRole('status');

test.beforeAll(async () => {
  const userId = randomUUID();
  const hash = await hashPassword('ir-fecha-1');
  const [dev, producto] = [newUlid(), newUlid()];
  await asTenant(biz, async (sql) => {
    await sql`INSERT INTO auth.users (id, email, encrypted_password) VALUES (${userId}::uuid, ${email}, ${hash})`;
    await sql`
      INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
      VALUES (${biz}, ${`Un día a la vez ${stamp}`}, 'RESICO', 125, ${biz}, ${dev}, now(), now())`;
    await sql`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${newUlid()}, ${userId}, 'viewer', ${biz}, now(), now())`;
    await sql`
      INSERT INTO products (id, nombre, categoria, costo_unit_centavos, unidad, business_id, device_id,
                            created_at, updated_at)
      VALUES (${producto}, 'Pan', 'Producto Terminado', 500, 'pza', ${biz}, ${dev}, now(), now())`;
    for (let dia = 1; dia <= 25; dia += 1) {
      const id = newUlid();
      const fecha = `2026-05-${String(dia).padStart(2, '0')}`;
      await sql`
        INSERT INTO tickets (id, folio, fecha, concepto, metodo, estado_pago, business_id, device_id,
                             created_at, updated_at)
        VALUES (${id}, ${dia}, ${fecha}, ${`Venta del ${dia}`}, 'Efectivo', 'pagado', ${biz}, ${dev},
                now(), now())`;
      await sql`
        INSERT INTO sales (id, ticket_id, fecha, concepto, categoria, monto_centavos,
                           producto_id, cantidad, business_id, device_id, created_at, updated_at)
        VALUES (${id}, ${id}, ${fecha}, ${`Venta del ${dia}`}, 'Producto', 1000,
                ${producto}, 1, ${biz}, ${dev}, now(), now())`;
    }
  });
});

async function entrar(page: Page) {
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('ir-fecha-1');
  await page.getByRole('button', { name: 'Abrir mi changarro' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
}

test('«Ir a fecha» opens the day’s page, and the pager goes on from it', async ({ page }) => {
  await entrar(page);

  await page.goto('/movimientos?ir=2026-05-03');
  await expect(page).toHaveURL(/\/movimientos\?pagina=3$/);
  await expect(counter(page)).toHaveText('Mostrando 21–25 de 25 movimientos');
  await expect(page.locator('main tbody')).toContainText('Venta del 3');

  // The pager counts from the page served, not from page 1.
  await page.getByRole('button', { name: 'Anterior' }).click();
  await expect(counter(page)).toHaveText('Mostrando 11–20 de 25 movimientos');
  await expect(page.locator('main tbody')).toContainText('Venta del 13');
});

test('the pager’s «Ir a fecha» field lands on the day, and the period is named', async ({
  page,
}) => {
  await entrar(page);
  // The suite's today is 12 May 2026: the month chip is May, all 25 ventas.
  await page.goto('/movimientos');
  await expect(counter(page)).toHaveText('Mostrando 1–10 de 25 movimientos');
  await expect(page.getByTestId('periodo-caption')).toHaveText('Periodo: 1–31 may');
  await expect(page.locator('main').getByText('en este periodo', { exact: true })).toBeVisible();
  const campo = page.getByLabel('Ir a fecha');
  await expect(campo).toHaveAttribute('min', '2026-05-01');
  await expect(campo).toHaveAttribute('max', '2026-05-31');

  await campo.fill('2026-05-03');
  await expect(page).toHaveURL(/\/movimientos\?pagina=3$/);
  await expect(counter(page)).toHaveText('Mostrando 21–25 de 25 movimientos');
  await expect(page.locator('main tbody')).toContainText('Venta del 3');
});

test('the drawer lists the whole ticket, and says it is the whole ticket', async ({ page }) => {
  await entrar(page);
  await page.goto('/movimientos?pagina=3');
  await expect(counter(page)).toHaveText('Mostrando 21–25 de 25 movimientos');
  await clickUntil(
    page.locator('main tbody tr', { hasText: 'Venta del 3' }),
    page.getByRole('dialog'),
  );
  const cajon = page.getByRole('dialog');
  await expect(cajon.getByText('Lo que llevó')).toBeVisible();
  // The seeded line itself: concepto and its $10.00, read from the database.
  await expect(cajon.getByText('Venta del 3').last()).toBeVisible();
  await expect(cajon.getByText('$10.00').last()).toBeVisible();
  await expect(
    cajon.getByText('Es el ticket completo: incluye las líneas que tu búsqueda dejó fuera.'),
  ).toBeVisible();
});
