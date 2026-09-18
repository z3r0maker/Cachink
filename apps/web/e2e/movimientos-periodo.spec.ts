import { expect, test, type Page } from '@playwright/test';
import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import { randomUUID } from 'node:crypto';

import { asTenant } from './sync-phone';

/**
 * P-09's range chips and pagination. The chips are relative to the business's
 * today, which the suite pins to the seed's day (2026-05-12, a Tuesday):
 * Hoy has 3 of the seeded ventas, the week (11–17) 5, «Mayo 2026» all 6.
 */
const counter = (page: Page) => page.locator('main').getByRole('status');

test('each range chip filters the rows and the counter follows', async ({ page }) => {
  await page.goto('/movimientos');
  await expect(counter(page)).toHaveText('Mostrando 1–6 de 6 movimientos');
  await page.getByRole('button', { name: 'Hoy', exact: true }).click();
  await expect(counter(page)).toHaveText('Mostrando 1–3 de 3 movimientos');
  await page.getByRole('button', { name: 'Semana', exact: true }).click();
  await expect(counter(page)).toHaveText('Mostrando 1–5 de 5 movimientos');
  await page.getByRole('button', { name: 'Personalizado', exact: true }).click();
  await page.getByTestId('rango-desde').fill('2026-05-11');
  await page.getByTestId('rango-hasta').fill('2026-05-11');
  await expect(counter(page)).toHaveText('Mostrando 1–2 de 2 movimientos');
  await expect(page.locator('main').getByText('Quesadilla ×2')).toBeVisible();
});

test.describe('pagination', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  const stamp = Date.now();
  const email = `paginas-${stamp}@test.mx`;
  const biz = newUlid();

  test.beforeAll(async () => {
    const userId = randomUUID();
    const hash = await hashPassword('paginas-1');
    const dev = newUlid();
    const producto = newUlid();
    await asTenant(biz, async (sql) => {
      await sql`INSERT INTO auth.users (id, email, encrypted_password) VALUES (${userId}::uuid, ${email}, ${hash})`;
      await sql`
        INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
        VALUES (${biz}, ${`Muchas ventas ${stamp}`}, 'RESICO', 125, ${biz}, ${dev}, now(), now())`;
      await sql`
        INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
        VALUES (${newUlid()}, ${userId}, 'viewer', ${biz}, now(), now())`;
      await sql`
        INSERT INTO products (id, nombre, categoria, costo_unit_centavos, unidad, umbral_stock_bajo,
                              tipo, seguir_stock, precio_venta_centavos, business_id, device_id,
                              created_at, updated_at)
        VALUES (${producto}, 'Pan', 'Producto Terminado', 500, 'pza', 3, 'producto', false, 1000,
                ${biz}, ${dev}, now(), now())`;
      for (let i = 1; i <= 23; i += 1) {
        await sql`
          INSERT INTO sales (id, fecha, concepto, categoria, monto_centavos, metodo, estado_pago,
                             producto_id, cantidad, business_id, device_id, created_at, updated_at)
          VALUES (${newUlid()}, '2026-05-10', ${`Venta ${i}`}, 'Producto', 1000, 'Efectivo', 'pagado',
                  ${producto}, 1, ${biz}, ${dev}, now(), now())`;
      }
    });
  });

  test('23 ventas are 10 per page, and a filter goes back to page 1', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill('paginas-1');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL((u) => !u.pathname.startsWith('/login'));
    await page.goto('/movimientos');

    await expect(counter(page)).toHaveText('Mostrando 1–10 de 23 movimientos');
    await expect(page.locator('main tbody tr')).toHaveCount(10);
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect(counter(page)).toHaveText('Mostrando 21–23 de 23 movimientos');
    await expect(page.getByRole('button', { name: 'Siguiente' })).toBeDisabled();

    await page.getByRole('textbox', { name: 'Buscar movimientos' }).fill('Venta 1');
    await expect(counter(page)).toHaveText('Mostrando 1–10 de 11 movimientos');
  });
});
