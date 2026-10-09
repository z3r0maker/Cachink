import { expect, test, type Page } from './test';
import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import { randomUUID } from 'node:crypto';

import { asTenant } from './sync-phone';

/**
 * P-09's range chips and pagination. The suite pins the business's today to
 * 2026-05-12, a Tuesday, so «Semana» is 11–17 May and «Mayo 2026» is the month.
 *
 * This used to assert a census — Hoy 3, Semana 5, the month 6 — read off the
 * seed of the day. The seed then grew a real ledger anchored to the run date,
 * the counts became 6 and 8, and the test failed for a change that broke
 * nothing. A census is a fact about the fixture, not about the feature.
 *
 * What the chip promises is in `periodo.ts`: each chip **is** a range, and
 * «a chip that only highlights is a bug». So that is what this asserts — every
 * row shown falls inside the chosen range, and the counter agrees with the
 * rows. No number here has to move when the seed does.
 */
const counter = (page: Page) => page.locator('main').getByRole('status');

/** The first cell of each row is the ISO date (`COLUMNS[0]`, `FechaCell`). */
async function fechasMostradas(page: Page): Promise<readonly string[]> {
  const celdas = await page.locator('main tbody tr td:first-child').allInnerTexts();
  // The cell stacks date over time; the date is its first line.
  return celdas.map((t) => (t.split('\n')[0] ?? '').trim());
}

async function totalDelContador(page: Page): Promise<number> {
  const texto = (await counter(page).innerText()).trim();
  const hit = /^Mostrando 1–(\d+) de (\d+) movimientos$/.exec(texto);
  expect(hit, `unreadable counter: ${texto}`).not.toBeNull();
  return Number(hit?.[2]);
}

async function enRango(page: Page, desde: string, hasta: string): Promise<number> {
  // A chip re-renders the table from the server, so for a moment after the
  // click the rows on screen are still the previous range's. Reading them the
  // instant after it was this test's own flake — «2026-05-11 is outside
  // 2026-05-12…2026-05-12» on a screen that was about to be right. Poll until
  // the table is this range's, then assert about it.
  await expect
    .poll(async () =>
      (await fechasMostradas(page)).filter((f) => f < desde || f > hasta).join(', '),
    )
    .toBe('');

  const fechas = await fechasMostradas(page);
  // An empty table would satisfy "every row is in range" vacuously.
  expect(fechas.length, 'the range shows no rows at all').toBeGreaterThan(0);
  for (const fecha of fechas) {
    expect(fecha >= desde && fecha <= hasta, `${fecha} is outside ${desde}…${hasta}`).toBe(true);
  }
  const total = await totalDelContador(page);
  // One page holds this seed; if that stops being true the counter still has
  // to be at least what is on screen.
  expect(total).toBeGreaterThanOrEqual(fechas.length);
  return total;
}

test('each range chip filters the rows and the counter follows', async ({ page }) => {
  await page.goto('/movimientos');
  await expect(counter(page)).toHaveText(/^Mostrando 1–\d+ de \d+ movimientos$/);
  // The screen opens on the month chip (`use-movimientos.ts`), so the first
  // view is already filtered — which is why the strict narrowing below is
  // measured against the month, not against this.
  const alAbrir = await enRango(page, '2026-05-01', '2026-05-31');

  // A chip is a navigation now (DB2-QRY-02): the server answers for the
  // range. Until the URL names it, the rows on screen can still be the last
  // range's — and a page of ten that all happen to fall on today would pass
  // the in-range poll below while the counter still counts the month.
  await page.getByRole('button', { name: 'Hoy', exact: true }).click();
  await expect(page).toHaveURL(/rango=hoy/);
  const hoy = await enRango(page, '2026-05-12', '2026-05-12');

  await page.getByRole('button', { name: 'Semana', exact: true }).click();
  await expect(page).toHaveURL(/rango=semana/);
  const semana = await enRango(page, '2026-05-11', '2026-05-17');

  await page.getByRole('button', { name: 'Mayo 2026', exact: true }).click();
  await expect(page).toHaveURL(/\/movimientos$/);
  const mes = await enRango(page, '2026-05-01', '2026-05-31');

  // Nested ranges. The month holds days other than the 12th, so Hoy must be a
  // *strict* subset of it — that is what catches a chip which highlights
  // without filtering, the bug `periodo.ts` names.
  expect(hoy).toBeLessThanOrEqual(semana);
  expect(semana).toBeLessThanOrEqual(mes);
  expect(hoy).toBeLessThan(mes);
  expect(mes).toBe(alAbrir);

  await page.getByRole('button', { name: 'Personalizado', exact: true }).click();
  await page.getByTestId('rango-desde').fill('2026-05-11');
  await page.getByTestId('rango-hasta').fill('2026-05-11');
  await expect(page).toHaveURL(/desde=2026-05-11&hasta=2026-05-11/);
  await enRango(page, '2026-05-11', '2026-05-11');
});

/**
 * DS-01: a filter is a round trip now, so while it is out the chip is lit,
 * the old rows stay — dimmed, under a bar — and a screen reader hears it. The
 * server's answer is held by the test to see that moment, then let through.
 */
test('between filters the old rows stay, dimmed, until the answer arrives', async ({ page }) => {
  await page.goto('/movimientos');
  await expect(counter(page)).toHaveText(/^Mostrando 1–\d+ de \d+ movimientos$/);
  const filas = await page.locator('main tbody tr').count();
  expect(filas).toBeGreaterThan(0);

  let soltar: () => void = () => undefined;
  const retenida = new Promise<void>((r) => {
    soltar = r;
  });
  const esRsc = (u: URL) => u.pathname === '/movimientos' && u.searchParams.has('_rsc');
  await page.route(esRsc, async (route) => {
    await retenida;
    await route.continue();
  });
  const cuerpo = page.locator('main tbody');
  await page.getByRole('button', { name: 'Hoy', exact: true }).click();
  await expect(cuerpo).toHaveAttribute('data-busy', 'true');
  await expect(page.locator('main tbody tr')).toHaveCount(filas);
  await expect(page.getByText('Cargando movimientos…')).toBeAttached();

  soltar();
  await expect(page).toHaveURL(/rango=hoy/);
  await expect(cuerpo).toHaveAttribute('data-busy', 'false');
  await expect(page.getByText('Cargando movimientos…')).toHaveCount(0);
  await expect(page.getByTestId('periodo-caption')).toHaveText('Periodo: Hoy');
  await page.unroute(esRsc);
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
      // C-17 (ADR-073): every sale is a line of a ticket — listVentas joins
      // the header, so seeding lines without one would show nothing.
      for (let i = 1; i <= 23; i += 1) {
        const saleId = newUlid();
        await sql`
          INSERT INTO tickets (id, folio, fecha, concepto, metodo, estado_pago,
                               business_id, device_id, created_at, updated_at)
          VALUES (${saleId}, ${i}, '2026-05-10', ${`Venta ${i}`}, 'Efectivo', 'pagado',
                  ${biz}, ${dev}, now(), now())`;
        await sql`
          INSERT INTO sales (id, ticket_id, fecha, concepto, categoria, monto_centavos,
                             producto_id, cantidad, business_id, device_id, created_at, updated_at)
          VALUES (${saleId}, ${saleId}, '2026-05-10', ${`Venta ${i}`}, 'Producto', 1000,
                  ${producto}, 1, ${biz}, ${dev}, now(), now())`;
      }
    });
  });

  test('23 ventas are 10 per page, and a filter goes back to page 1', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-door-owner').click();
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill('paginas-1');
    await page.getByRole('button', { name: 'Abrir mi changarro' }).click();
    await page.waitForURL((u) => !u.pathname.startsWith('/login'));
    await page.goto('/movimientos');

    await expect(counter(page)).toHaveText('Mostrando 1–10 de 23 movimientos');
    await expect(page.locator('main tbody tr')).toHaveCount(10);
    // The page is ten rows cut by the server (DB2-QRY-02); the KPIs are the
    // period's, summed in SQL — all 23 ventas of $10, not the ten on screen.
    const kpi = page.locator('main').getByText('Ventas del periodo', { exact: true }).locator('..');
    await expect(kpi).toContainText('$230.00');
    const tabs = page.getByRole('group', { name: 'Movimientos' });
    await expect(tabs.getByRole('button', { name: /^Ventas/ })).toHaveText('Ventas23');
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect(counter(page)).toHaveText('Mostrando 21–23 de 23 movimientos');
    await expect(page.getByRole('button', { name: 'Siguiente' })).toBeDisabled();

    await page.getByRole('textbox', { name: 'Buscar movimientos' }).fill('Venta 1');
    await expect(counter(page)).toHaveText('Mostrando 1–10 de 11 movimientos');
    // The search reached the server: the KPI follows it (Venta 1, 10–19).
    await expect(kpi).toContainText('$110.00');
    // And it is in the URL, so a reload keeps the filter.
    await expect(page).toHaveURL(/q=Venta\+1/);
  });
});
