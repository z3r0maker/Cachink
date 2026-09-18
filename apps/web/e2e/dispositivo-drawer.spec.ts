import { expect, test } from '@playwright/test';
import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import { randomUUID } from 'node:crypto';

import { asTenant } from './sync-phone';

/**
 * P-06 on a throwaway free-plan tenant (one device slot): full, the pairing
 * panel warns that a new code waits for a revoke; the drawer shows the device's
 * cortes; «Desvincular» frees the slot.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const stamp = Date.now();
const email = `disp-${stamp}@test.mx`;
const biz = newUlid();
const dev = newUlid();

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

test('a full plan says so, the drawer shows cortes, and Desvincular frees the slot', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('disp-1234');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
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
