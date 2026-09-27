import { BIZ, asTenant } from './sync-phone';
import { expect, test, type Page } from './test';

/**
 * Estados' «Personalizado» range (DB3-EST-01, DS-09, R3-14). A multi-year
 * range used to read the whole history into memory; it is now capped at 13
 * months, server-side, and the picker says so. A day that does not exist is
 * not a range at all. Read-only on the seeded tenant.
 */
const main = (page: Page) => page.locator('main');
const etiqueta = (page: Page) => page.getByRole('status').filter({ hasText: '–' });

/** «$1,234.56» as centavos. */
const centavos = (text: string) => Number(text.replace(/[^\d]/g, ''));

test('a range past 13 months is refused, with the inline error, and nothing is computed', async ({
  page,
}) => {
  await page.goto('/estados?p=personalizado&desde=2000-01-01&hasta=2099-12-31');
  await expect(main(page).getByText('Periodo demasiado largo')).toBeVisible();
  await expect(main(page).getByText('Elige un periodo de hasta 13 meses.').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Aplicar' })).toBeDisabled();
  await expect(page.getByTestId('periodo-exportar')).toHaveAttribute('href', '/movimientos');
  // No statement was rendered for the refused window.
  await expect(main(page).getByText('Utilidad neta', { exact: true })).toHaveCount(0);
});

test('the picker refuses a 14th month before it reaches the server, and allows 13', async ({
  page,
}) => {
  await page.goto('/estados?p=personalizado&desde=2026-05-01&hasta=2026-05-31');
  await page.getByTestId('periodo-desde').fill('2025-05-01');
  await page.getByTestId('periodo-hasta').fill('2026-06-01');
  await expect(page.getByText('Elige un periodo de hasta 13 meses.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Aplicar' })).toBeDisabled();
  await page.getByTestId('periodo-hasta').fill('2026-05-31');
  await expect(page.getByText('Elige un periodo de hasta 13 meses.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Aplicar' })).toBeEnabled();
});

test('13 months computes, and its ingresos are the database’s own sum for the range', async ({
  page,
}) => {
  await page.goto('/estados?p=personalizado&desde=2025-05-01&hasta=2026-05-31');
  const fila = main(page).getByText('Ingresos', { exact: true }).locator('xpath=ancestor::div[1]');
  const ingresos = centavos(await fila.locator('span').last().innerText());
  const [{ total }] = await asTenant(
    BIZ,
    (sql) => sql<[{ total: string }]>`
      SELECT coalesce(sum(s.monto_centavos), 0)::text AS total
        FROM sales s
       WHERE s.deleted_at IS NULL AND s.fecha >= '2025-05-01' AND s.fecha < '2026-06-01'
         AND NOT EXISTS (SELECT 1 FROM tickets t WHERE t.id = s.ticket_id AND t.cancelled_at IS NOT NULL)`,
  );
  expect(Number(total), 'the seed has sales in the range').toBeGreaterThan(0);
  expect(ingresos).toBe(Number(total));
});

test('a day that does not exist is not a range: the month is shown instead', async ({ page }) => {
  await page.goto('/estados');
  const mes = await etiqueta(page).innerText();
  await page.goto('/estados?p=personalizado&desde=2026-02-30&hasta=2026-03-31');
  await expect(etiqueta(page)).toHaveText(mes);
});
