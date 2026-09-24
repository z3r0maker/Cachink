import { expect, test } from './test';

import { asTenant, BIZ } from './sync-phone';

/**
 * O-31 + O-37 (Track O, fase 13/14): Dueño · Cortes de turno on real rows —
 * the seeded cortes' figures, the panel's explanation, and both owner exits
 * writing for real: the aclarado stamp on the corte and the message the
 * operator pulls into Avisos (ADR-075). The three viewport projects race on
 * these rows, so the Postgres polls are the assertions.
 */

test('the month: −$60.00 net and the seeded cortes listed', async ({ page }) => {
  await page.goto('/cortes');
  await expect(page.getByRole('heading', { name: 'Cortes de turno' })).toBeVisible();
  await expect(page.getByText('−$60.00').first()).toBeVisible();
  await expect(
    // The sidebar's entry, not the breadcrumb's link of the same name.
    page.getByRole('navigation').getByRole('link', { name: 'Tu equipo', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('row', { name: /Ana Robledo.*13 may/ })).toHaveCount(1);
  await expect(page.getByRole('row', { name: /Luis Ortega.*12 may/ })).toHaveCount(1);
});

test('the panel explains a shortfall and marks it clarified for real', async ({ page }) => {
  await page.goto('/cortes');
  await page.getByRole('row', { name: /Ana Robledo.*13 may/ }).click();
  const panel = page.getByRole('dialog', { name: 'Ana Robledo' });
  await expect(panel.getByText('Faltó')).toBeVisible();
  await expect(panel.getByText('«Se me fue un cambio de más con un cliente»')).toBeVisible();
  await expect(panel.getByText('×2')).toBeVisible();
  // Whoever clicks first stamps it; the others find «Ya está aclarado».
  const aclarar = panel.getByRole('button', { name: /como aclarado|Ya está aclarado/ });
  if (await aclarar.isEnabled()) {
    await aclarar.click();
    await expect(page.getByRole('status')).toContainText(
      'El corte de Ana Robledo del 13 may queda cerrado.',
    );
  }

  await expect
    .poll(
      () =>
        asTenant(BIZ, async (sql) => {
          const [row] = await sql<{ n: string }[]>`
            SELECT count(*)::text AS n FROM caja_turnos
            WHERE business_id = ${BIZ} AND aclarado_at IS NOT NULL`;
          return row?.n ?? '0';
        }),
      { timeout: 10_000 },
    )
    .toBe('2');
});

test('asking for a clarification files the operator’s message', async ({ page }) => {
  await page.goto('/cortes');
  await page.getByRole('row', { name: /Ana Robledo.*13 may/ }).click();
  await page.getByRole('button', { name: 'Pedir aclaración' }).click();
  await expect(page.getByRole('status')).toContainText(
    'A Ana le llega el detalle del corte en sus Avisos.',
  );

  await expect
    .poll(
      () =>
        asTenant(BIZ, async (sql) => {
          const [row] = await sql<{ n: number }[]>`
            SELECT count(*)::int AS n FROM mensajes_operador
            WHERE business_id = ${BIZ} AND severidad = 'aclaracion'
              AND operador_id = ${'01HZ8XQN9GZJXV8AKQ5X0ANA01'}`;
          return Number(row?.n ?? 0);
        }),
      { timeout: 10_000 },
    )
    .toBeGreaterThanOrEqual(1);
});

test('tabs and chips narrow the list; nothing left offers every corte', async ({ page }) => {
  // Read-only on stable rows only: the viewports race on Ana's state.
  await page.goto('/cortes');
  await page.getByRole('button', { name: /^Por aclarar/ }).click();
  await expect(page.getByRole('row', { name: /Luis Ortega/ })).toHaveCount(0);
  await page.getByRole('button', { name: /^Todos/ }).click();
  await expect(page.getByRole('row', { name: /Luis Ortega.*12 may/ })).toHaveCount(1);
  await page.getByLabel('Buscar corte').fill('nadie');
  await expect(page.getByText('Sin cortes que mostrar')).toBeVisible();
  await page.getByRole('button', { name: 'Ver todos los cortes' }).click();
  await expect(page.getByRole('row', { name: /Luis Ortega.*12 may/ })).toHaveCount(1);
});
