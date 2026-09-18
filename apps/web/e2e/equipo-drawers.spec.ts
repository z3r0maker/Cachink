import { expect, test, type Page } from '@playwright/test';
import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import { randomUUID } from 'node:crypto';

import { asTenant } from './sync-phone';

/**
 * The Equipo drawers on a throwaway free-plan tenant. P-05: an operator's
 * shifts, the open one first. P-06 (one device slot): full, the pairing
 * panel warns that a new code waits for a revoke; the drawer shows the device's
 * cortes; «Desvincular» frees the slot.
 */
test.use({ storageState: { cookies: [], origins: [] } });
// One tenant for both tests; the second revokes the device the first reads.
test.describe.configure({ mode: 'serial' });

const stamp = Date.now();
const email = `disp-${randomUUID()}@test.mx`;
const biz = newUlid();
const dev = newUlid();
const op = newUlid();

test.beforeAll(async () => {
  const userId = randomUUID();
  const hash = await hashPassword('disp-1234');
  await asTenant(biz, async (sql) => {
    await sql`INSERT INTO auth.users (id, email, encrypted_password) VALUES (${userId}::uuid, ${email}, ${hash})`;
    await sql`
      INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
      VALUES (${biz}, ${`Disp ${stamp}`}, 'RESICO', 125, ${biz}, ${dev}, now(), now())`;
    await sql`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${newUlid()}, ${userId}, 'owner', ${biz}, now(), now())`;
    await sql`
      INSERT INTO devices (id, nombre, plataforma, modelo, business_id, created_at, updated_at)
      VALUES (${dev}, 'Caja única', 'android', 'Moto G', ${biz}, now(), now())`;
    await sql`
      INSERT INTO users (id, nombre, pin_hash, recovery_password_hash, must_change_pin, avatar_color,
                         permissions, role, business_id, device_id, created_at, updated_at)
      VALUES (${op}, 'Rosa Turnos', 'x', 'x', false, 'blue', '{}', 'operativo', ${biz}, ${dev}, now(), now())`;
    await sql`
      INSERT INTO caja_turnos (id, user_id, fecha, apertura_at, cierre_at, monto_apertura_centavos,
                               efectivo_adicional_centavos, diferencia_centavos, business_id, device_id,
                               created_at, updated_at)
      VALUES (${newUlid()}, ${op}, '2026-05-11', '2026-05-11T15:00:00Z', '2026-05-12T03:00:00Z', 50000, 0,
              -2000, ${biz}, ${dev}, now(), now()),
             (${newUlid()}, ${op}, '2026-05-12', '2026-05-12T15:00:00Z', NULL, 50000, 0, NULL, ${biz},
              ${dev}, now(), now())`;
    for (const [fecha, contado] of [
      ['2026-05-11', 150000],
      ['2026-05-12', 148000],
    ] as const) {
      await sql`
        INSERT INTO day_closes (id, fecha, efectivo_esperado_centavos, efectivo_contado_centavos,
                                diferencia_centavos, cerrado_por, business_id, device_id, created_at, updated_at)
        VALUES (${newUlid()}, ${fecha}, 150000, ${contado}, ${contado - 150000}, 'Operativo', ${biz}, ${dev}, now(), now())`;
    }
  });
});

async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('disp-1234');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
}

test('the operator drawer lists their shifts, the open one first', async ({ page }) => {
  await signIn(page);
  await page.goto('/equipo');
  await page.locator('main').getByRole('button', { name: 'Ver detalle de Rosa Turnos' }).click();
  const turnos = page
    .getByRole('dialog', { name: 'Rosa Turnos' })
    .getByRole('list', { name: 'Turnos recientes' })
    .getByRole('listitem');
  await expect(turnos).toHaveCount(2);
  await expect(turnos.first()).toContainText('12 may 2026, 09:00 · Turno abierto');
  await expect(turnos.last()).toContainText('cerró 11 may 2026, 21:00, faltó $20.00');
});

test('a full plan says so, the drawer shows cortes, and Desvincular frees the slot', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/equipo?tab=dispositivos');

  const main = page.locator('main');
  await expect(page.locator('header').getByText('Plan Xangarrito')).toBeVisible();
  await expect(main.getByText('1 de 1 dispositivos')).toBeVisible();
  await expect(
    main.getByText(/todos están vinculados\. Un código nuevo solo funcionará/),
  ).toBeVisible();

  await main.getByRole('button', { name: 'Ver detalle de Caja única' }).click();
  const drawer = page.getByRole('dialog', { name: 'Caja única' });
  const cortes = drawer.getByRole('list', { name: 'Cortes recientes' });
  await expect(cortes.getByRole('listitem')).toHaveCount(2);
  await expect(cortes.getByRole('listitem').first()).toContainText('2026-05-12');
  await expect(cortes.getByRole('listitem').first()).toContainText('−$20.00');
  await expect(cortes.getByRole('listitem').last()).toContainText('Cuadró');

  await drawer.getByRole('button', { name: 'Desvincular' }).click();
  await page
    .getByRole('dialog', { name: 'Revocar Caja única' })
    .getByRole('button', { name: 'Revocar' })
    .click();
  // The drawer stays open and now says so; close it to see the freed slot.
  await expect(drawer.getByText(/^Revocado el /)).toBeVisible();
  await drawer.getByRole('button', { name: 'Cerrar' }).click();
  await expect(main.getByText('0 de 1 dispositivos')).toBeVisible();
  await expect(main.getByText(/todos están vinculados/)).toHaveCount(0);
});
