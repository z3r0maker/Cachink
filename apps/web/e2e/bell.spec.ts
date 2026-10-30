import { expect, test } from './test';
import { newUlid } from '@xangarro/domain';

import { asTenant } from './sync-phone';
import { mintTenant, signIn, type Tenant } from './tenant';

/**
 * P-31's bell on a tenant of its own: it counts and lists open avisos **but
 * never the Asesor's** (ADR-060); «Listo» closes one and the badge follows;
 * an aviso's CTA goes where it points and marks it read on the way.
 */
test.use({ storageState: { cookies: [], origins: [] } });

let t: Tenant;
const cerrar = newUlid();
const ir = newUlid();

test.beforeAll(async () => {
  t = await mintTenant({ label: 'Bell' });
  await asTenant(t.biz, async (sql) => {
    const aviso = (id: string, source: string, title: string, href: string | null) => sql`
      INSERT INTO notices (id, source, severity, title, body, cta_label, cta_href, state,
                           business_id, created_at, updated_at)
      VALUES (${id}, ${source}, 'warning', ${title}, 'Detalle', ${href ? 'Ver productos' : null},
              ${href}, 'nuevo', ${t.biz}, now(), now())`;
    await aviso(cerrar, 'operacion', 'Discrepancia en la caja 1', null);
    await aviso(ir, 'sistema', 'Stock bajo: Pan', '/productos');
    await aviso(newUlid(), 'asesor', 'El pan te cuesta más', null);
  });
});

const state = async (id: string) => {
  const [r] = await asTenant(t.biz, (sql) => sql`SELECT state FROM notices WHERE id = ${id}`);
  return r?.state;
};

test('the bell lists open avisos without the Asesor, and acts on them', async ({ page }) => {
  await signIn(page, t);
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
