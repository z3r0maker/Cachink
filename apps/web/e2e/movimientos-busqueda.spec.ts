import { expect, test, type Page } from './test';
import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import { randomUUID } from 'node:crypto';

import { asTenant } from './sync-phone';

/**
 * Ventas y gastos searches the folio and the operador, not only the concepto
 * (owner decision 2026-09-27, DS-01). The seed puts no ticket on a shift, so
 * this builds its own tenant: folio 7, folio 17 (which a substring search on
 * the folio would also match), and a concepto containing «7» captured on
 * Lupita's shift.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const stamp = Date.now();
const email = `busqueda-${stamp}@test.mx`;
const biz = newUlid();

const counter = (page: Page) => page.locator('main').getByRole('status');
const conceptos = (page: Page) => page.locator('main tbody tr').allInnerTexts();

test.beforeAll(async () => {
  const userId = randomUUID();
  const hash = await hashPassword('busqueda-1');
  const [dev, producto, lupita, turno] = [newUlid(), newUlid(), newUlid(), newUlid()];
  await asTenant(biz, async (sql) => {
    await sql`INSERT INTO auth.users (id, email, encrypted_password) VALUES (${userId}::uuid, ${email}, ${hash})`;
    await sql`
      INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
      VALUES (${biz}, ${`Panadería ${stamp}`}, 'RESICO', 125, ${biz}, ${dev}, now(), now())`;
    await sql`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${newUlid()}, ${userId}, 'viewer', ${biz}, now(), now())`;
    await sql`
      INSERT INTO products (id, nombre, categoria, costo_unit_centavos, unidad, business_id, device_id,
                            created_at, updated_at)
      VALUES (${producto}, 'Pan', 'Producto Terminado', 500, 'pza', ${biz}, ${dev}, now(), now())`;
    await sql`
      INSERT INTO users (id, nombre, pin_hash, active, business_id, device_id, created_at, updated_at)
      VALUES (${lupita}, 'Lupita Díaz', 'x', true, ${biz}, ${dev}, now(), now())`;
    await sql`
      INSERT INTO caja_turnos (id, user_id, fecha, apertura_at, monto_apertura_centavos,
                               efectivo_adicional_centavos, business_id, device_id, created_at, updated_at)
      VALUES (${turno}, ${lupita}, '2026-05-10', now(), 0, 0, ${biz}, ${dev}, now(), now())`;
    for (const [folio, concepto, enTurno] of [
      [7, 'Concha', null],
      [17, 'Bolillo', null],
      [3, 'Pan de 7 granos', turno],
    ] as const) {
      const id = newUlid();
      await sql`
        INSERT INTO tickets (id, folio, fecha, concepto, metodo, estado_pago, caja_turno_id,
                             business_id, device_id, created_at, updated_at)
        VALUES (${id}, ${folio}, '2026-05-10', ${concepto}, 'Efectivo', 'pagado', ${enTurno},
                ${biz}, ${dev}, now(), now())`;
      await sql`
        INSERT INTO sales (id, ticket_id, fecha, concepto, categoria, monto_centavos,
                           producto_id, cantidad, business_id, device_id, created_at, updated_at)
        VALUES (${id}, ${id}, '2026-05-10', ${concepto}, 'Producto', 1000,
                ${producto}, 1, ${biz}, ${dev}, now(), now())`;
    }
  });
});

test('a folio, a number and an operator each find their ventas', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('busqueda-1');
  await page.getByRole('button', { name: 'Abrir mi changarro' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  await page.goto('/movimientos');
  await expect(counter(page)).toHaveText('Mostrando 1–3 de 3 movimientos');
  const buscar = page.getByRole('textbox', { name: 'Buscar movimientos' });

  await buscar.fill('#7');
  await expect(counter(page)).toHaveText('Mostrando 1–1 de 1 movimientos');
  expect((await conceptos(page)).join(' ')).toContain('Concha');

  // Folio 7 exactly, plus the concepto with a 7 in it; folio 17 is not «7».
  await buscar.fill('7');
  await expect(counter(page)).toHaveText('Mostrando 1–2 de 2 movimientos');
  const dos = (await conceptos(page)).join(' ');
  expect(dos).toContain('Concha');
  expect(dos).toContain('Pan de 7 granos');
  expect(dos).not.toContain('Bolillo');

  await buscar.fill('lupita');
  await expect(counter(page)).toHaveText('Mostrando 1–1 de 1 movimientos');
  expect((await conceptos(page)).join(' ')).toContain('Pan de 7 granos');
  await expect(page).toHaveURL(/q=lupita/);
});
