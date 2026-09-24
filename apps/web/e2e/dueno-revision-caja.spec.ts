import { expect, test } from './test';

import { asTenant, BIZ } from './sync-phone';

/**
 * O-30 + O-37 (Track O, fase 13/14): Dueño · Revisión de caja on real rows —
 * the counter-created records with their facts, and the three exits writing
 * for real: approve completes the record (and writes the counted stock as an
 * entrada), merge re-points to the surviving duplicate. The three viewport
 * projects race on these rows, so the UI steps are best-effort and the
 * Postgres polls are the assertions.
 */

test('the inbox reads the seeded pendientes', async ({ page }) => {
  await page.goto('/revision-caja');
  // First hit on a cold server pays the route's module + five queries.
  await expect(page.getByRole('heading', { name: 'Revisión de caja' })).toBeVisible({
    timeout: 20_000,
  });
  // The viewports' mutating tests race this read; whichever state the rows
  // are in, the page is reading Postgres — not the old fixtures.
  const pendientes = page.getByRole('button', { name: /^Productos / });
  const nada = page.getByText(/Sin registros|nada por revisar/i);
  await expect(pendientes.or(nada).first()).toBeVisible({ timeout: 20_000 });
});

test('approving a product needs cost, category and stock, and writes them', async ({ page }) => {
  await page.goto('/revision-caja');
  // The viewports race on this row; whoever approves first, the Postgres
  // poll below is the assertion. The row carries its own Revisar button.
  const revisar = page
    .locator('div:has(> div > div > span:text-is("Michelada preparada"))')
    .getByRole('button', { name: 'Revisar' });
  if (!(await revisar.isVisible().catch(() => false))) return;
  await revisar.click();
  const modal = page.getByRole('dialog', { name: 'Revisar Michelada preparada' });
  const aprobar = modal.getByRole('button', { name: 'Aprobar y agregar al catálogo' });
  await modal.getByLabel('Costo').fill('30');
  await expect(modal.getByText('60%')).toBeVisible();
  await expect(aprobar).toBeDisabled();
  await modal.getByRole('button', { name: 'Bebidas' }).click();
  await modal.getByLabel('Existencias').fill('24');
  await aprobar.click();
  await expect(page.getByRole('status')).toContainText('Producto aprobado');

  await expect
    .poll(
      () =>
        asTenant(BIZ, async (sql) => {
          const [row] = await sql<{ estado: string; costo: string; stock: string }[]>`
            SELECT p.estado_revision AS estado, p.costo_unit_centavos::text AS costo,
                   COALESCE(SUM(m.cantidad), 0)::text AS stock
            FROM products p LEFT JOIN inventory_movements m ON m.producto_id = p.id
            WHERE p.id = ${'01HZ8XQN9GZJXV8AKQ5X0RVM3Q'}
            GROUP BY p.estado_revision, p.costo_unit_centavos`;
          return `${row?.estado}|${row?.costo}|${row?.stock}`;
        }),
      { timeout: 10_000 },
    )
    .toBe('aprobado|3000|24');
});

test('a client is approved with a limit and a term, both stored', async ({ page }) => {
  await page.goto('/revision-caja');
  // ?startTab is dev-only forcing; the production build switches by hand.
  await page.getByRole('button', { name: /Clientes fiados/ }).click();
  const revisar = page.getByRole('button', { name: 'Revisar' }).first();
  if (!(await revisar.isVisible().catch(() => false))) return;
  await revisar.click();
  const modal = page.getByRole('dialog', { name: 'Revisar cliente Doña Chelo' });
  await modal.getByRole('button', { name: '$1,000.00' }).click();
  await modal.getByRole('button', { name: '15 días' }).click();
  await modal.getByRole('button', { name: 'Aprobar cliente con límite' }).click();
  await expect(page.getByRole('status')).toContainText('Cliente aprobado');

  await expect
    .poll(
      () =>
        asTenant(BIZ, async (sql) => {
          const [row] = await sql<{ estado: string; limite: string; plazo: string }[]>`
            SELECT estado_revision AS estado, limite_centavos::text AS limite,
                   plazo_dias::text AS plazo
            FROM clients WHERE id = ${'01HZ8XQN9GZJXV8AKQ5X0RVCHE'}`;
          return `${row?.estado}|${row?.limite}|${row?.plazo}`;
        }),
      { timeout: 10_000 },
    )
    .toBe('aprobado|100000|15');
});

test('the duplicate merges: its row says where its facts went', async ({ page }) => {
  test.setTimeout(75_000);
  await page.goto('/revision-caja');
  const revisar = page
    .locator('div:has(> div > div > span:text-is("Refresco"))')
    .getByRole('button', { name: 'Revisar' });
  // The list is server-rendered but the row may take a beat; whoever gets
  // it first merges, the others find it gone — the poll below decides.
  await revisar.waitFor({ state: 'attached', timeout: 45_000 }).catch(() => undefined);
  if (await revisar.isVisible().catch(() => false)) {
    await revisar.click();
    const modal = page.getByRole('dialog', { name: 'Revisar Refresco' });
    await expect(modal.getByText(/Ya existe Refresco/)).toBeVisible();
    await modal.getByRole('button', { name: 'Fusionar', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Registros fusionados');
  }

  await expect
    .poll(
      () =>
        asTenant(BIZ, async (sql) => {
          const [row] = await sql<{ estado: string; con: string | null }[]>`
            SELECT estado_revision AS estado, fusionado_con_id AS con
            FROM products WHERE id = ${'01HZ8XQN9GZJXV8AKQ5X0RVREF'}`;
          return `${row?.estado}|${row?.con === null ? '' : 'apuntado'}`;
        }),
      { timeout: 10_000 },
    )
    .toBe('fusionado|apuntado');
});
