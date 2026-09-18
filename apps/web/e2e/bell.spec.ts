import { expect, test, type Page } from '@playwright/test';
import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import { randomUUID } from 'node:crypto';

import { asTenant } from './sync-phone';

/**
 * P-31's bell on a throwaway tenant: it counts and lists open avisos **but
 * never the Asesor's** (ADR-060); «Listo» closes one and the badge follows;
 * an aviso's CTA goes where it points and marks it read on the way.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const stamp = Date.now();
const email = `bell-${stamp}@test.mx`;
const biz = newUlid();
const cerrar = newUlid();
const ir = newUlid();

test.beforeAll(async () => {
  const userId = randomUUID();
  const hash = await hashPassword('bell-1234');
  await asTenant(biz, async (sql) => {
    await sql`INSERT INTO auth.users (id, email, encrypted_password) VALUES (${userId}::uuid, ${email}, ${hash})`;
    await sql`
      INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
      VALUES (${biz}, ${`Bell ${stamp}`}, 'RESICO', 125, ${biz}, ${newUlid()}, now(), now())`;
    await sql`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${newUlid()}, ${userId}, 'owner', ${biz}, now(), now())`;
    const aviso = (id: string, source: string, title: string, href: string | null) => sql`
      INSERT INTO notices (id, source, severity, title, body, cta_label, cta_href, state, business_id, created_at, updated_at)
      VALUES (${id}, ${source}, 'warning', ${title}, 'Detalle', ${href ? 'Ver productos' : null}, ${href}, 'nuevo', ${biz}, now(), now())`;
    await aviso(cerrar, 'operacion', 'Discrepancia en la caja 1', null);
    await aviso(ir, 'sistema', 'Stock bajo: Pan', '/productos');
    await aviso(newUlid(), 'asesor', 'El pan te cuesta más', null);
  });
});

async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('bell-1234');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
}

const state = async (id: string) => {
  const [r] = await asTenant(biz, (sql) => sql`SELECT state FROM notices WHERE id = ${id}`);
  return r?.state;
};

test('the bell lists open avisos without the Asesor, and acts on them', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: 'Avisos · 2 sin leer' }).click();
  const panel = page.getByRole('dialog', { name: 'Avisos' });
  await expect(panel.getByText('Discrepancia en la caja 1')).toBeVisible();
  await expect(panel.getByText('Stock bajo: Pan')).toBeVisible();
  await expect(panel.getByText('El pan te cuesta más')).toHaveCount(0);

  const row = panel.locator('div', { hasText: 'Discrepancia en la caja 1' }).last();
  await row.getByRole('button', { name: 'Listo' }).click();
  await expect(panel.getByText('Discrepancia en la caja 1')).toHaveCount(0);
  expect(await state(cerrar)).toBe('listo');

  await panel.getByRole('link', { name: 'Ver productos →' }).click();
  await expect(page).toHaveURL(/\/productos$/);
  await expect.poll(() => state(ir)).toBe('leido');
  // One closed, one read: the badge (behind the modal until now) has caught up.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Avisos · 0 sin leer' })).toBeVisible();
});
