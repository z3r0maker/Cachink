import { expect, test, type BrowserContext, type Page } from './test';
import { venderEfectivo } from './cobrar';

import { puertaOperador } from './puerta-operador';
import { asTenant, BIZ } from './sync-phone';

/**
 * O-27 (Track O, fase 12; live O-06): Operador · Registros por enviar on a
 * linked caja. The list is the register's own outbox, never the design's
 * V-0412: opened online, it sends what waits and reads «Todo enviado»; a sale
 * the server can't take waits in the list until «Reintentar ahora» sends it.
 */
test.beforeEach(() => test.setTimeout(120_000));

const PRODUCTOS = [{ nombre: 'Orden por enviar', precioCentavos: 4000, sku: 'OPPEN1' }] as const;

const DEVICE_KEY = 'xangarro.device';

/** The server refuses the push while the stored device token is wrong. */
async function romperToken(page: Page): Promise<string> {
  return page.evaluate((key) => {
    const original = localStorage.getItem(key) ?? '';
    const d = JSON.parse(original) as Record<string, unknown>;
    localStorage.setItem(key, JSON.stringify({ ...d, deviceToken: 'token-roto' }));
    return original;
  }, DEVICE_KEY);
}

async function restaurarToken(page: Page, original: string): Promise<void> {
  await page.evaluate(([key, v]) => localStorage.setItem(key, v), [DEVICE_KEY, original] as const);
}

function idsDeTickets(): Promise<string[]> {
  return asTenant(BIZ, async (sql) =>
    (await sql<{ id: string }[]>`SELECT id FROM tickets`).map((r) => r.id),
  );
}

/** The fixture's own records. Not its count: a real queue can hold three too. */
async function sinFixture(page: Page): Promise<void> {
  await expect(page.getByText('Venta V-0412')).toHaveCount(0);
  await expect(page.getByText('Gasto · Gas')).toHaveCount(0);
  await expect(page.getByText('Venta V-0410')).toHaveCount(0);
}

test('opened online, the queue sends what waits and reads «Todo enviado»', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/pendientes');
  await expect(page.getByRole('heading', { name: 'Todo enviado' })).toBeVisible({
    timeout: 20_000,
  });
  await sinFixture(page);
  await expect(page.getByText('Nada pendiente')).toBeVisible();
  // The seed's owner, by the name the bootstrap sent (data-pg 0044).
  await expect(page.getByText('Tu caja está al día con el portal de Pedro')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ir al cierre de turno' })).toHaveAttribute(
    'href',
    '/operador/cierre',
  );
});

test('a sale the server refused waits in the list; «Reintentar ahora» sends it', async ({
  page,
}) => {
  await puertaOperador(page, PRODUCTOS);
  const antes = await idsDeTickets();
  const original = await romperToken(page);

  await page
    .getByRole('button', { name: /Orden por enviar/ })
    .first()
    .click();
  await venderEfectivo(page, '40');
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);

  await page.goto('/operador/pendientes');
  await expect(page.getByText(/^Venta V-\d{4}$/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/esperan? conexión$/)).toBeVisible();
  await expect(page.getByText('Suman $40.00 de ventas.', { exact: false })).toBeVisible();
  await sinFixture(page);
  expect((await idsDeTickets()).length).toBe(antes.length);

  // A reload keeps the queue: it lives in the caja's database.
  await page.reload();
  await expect(page.getByText(/^Venta V-\d{4}$/)).toBeVisible({ timeout: 20_000 });

  await restaurarToken(page, original);
  await page.getByRole('button', { name: 'Reintentar ahora' }).click();
  await expect(page.getByRole('heading', { name: 'Todo enviado' })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText('Nada pendiente')).toBeVisible();
  await expect
    .poll(
      () =>
        asTenant(BIZ, async (sql) => {
          const rows = await sql<{ n: number }[]>`
            SELECT count(*)::int AS n FROM sales s JOIN tickets t ON t.id = s.ticket_id
            WHERE t.id <> ALL(${antes}) AND s.concepto LIKE ${'%Orden por enviar%'}`;
          return Number(rows[0]?.n ?? 0);
        }),
      { timeout: 15_000 },
    )
    .toBe(1);
});

test('after sending, the queue stays empty across screens', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/pendientes');
  await expect(page.getByText('Nada pendiente')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('link', { name: 'Volver a la caja' }).click();
  await page.getByTitle('Ver registros pendientes').click();
  await expect(page.getByText('Nada pendiente')).toBeVisible({ timeout: 20_000 });
  await sinFixture(page);
});

/** The server answers every push busy (DS-05): 503, or 429 with Retry-After. */
async function servidorOcupado(context: BrowserContext, retryAfter?: string): Promise<void> {
  await context.route('**/api/v1/sync/push', (route) =>
    route.fulfill({
      status: retryAfter ? 429 : 503,
      contentType: 'application/json',
      headers: retryAfter ? { 'Retry-After': retryAfter } : {},
      body: JSON.stringify({ error: { code: 'SERVER_BUSY', message: 'Ocupado' } }),
    }),
  );
}

async function venderYAbrirPendientes(page: Page): Promise<void> {
  await page
    .getByRole('button', { name: /Orden por enviar/ })
    .first()
    .click();
  await venderEfectivo(page, '40');
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);
  await page.getByTitle('Ver registros pendientes').click();
}

test('a busy server: the pill counts down, the rows say their last and next attempt (DS-05, DS-07)', async ({
  page,
  context,
}) => {
  await puertaOperador(page, PRODUCTOS);
  const antes = await idsDeTickets();
  await servidorOcupado(context);
  await venderYAbrirPendientes(page);

  // The hero: «Reintentando», the cause, and the manual override.
  await expect(page.getByText('El servidor está ocupado; reintentamos solos.')).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole('heading', { name: '1 registro por enviar' })).toBeVisible();
  await expect(page.getByText('Suman $40.00 de ventas. Puedes seguir cobrando.')).toBeVisible();
  // The pill counts down to the engine's retryAt, in the warning state.
  await expect(page.locator('[data-estado="reintentando"]')).toHaveAttribute(
    'aria-label',
    /^Estado del envío: Reintentando en \d+ min$/,
  );
  // The sale's own row: tried, and when it goes again.
  await expect(page.getByText('En reintento')).toBeVisible();
  await expect(
    page.getByText(/^Último intento: hace un momento · Próximo: en \d+ min$/),
  ).toBeVisible();
  // Don no longer says the turno waits for the queue (DS-06).
  await expect(
    page.getByText('Puedes cerrar el turno; se envían cuando vuelva la conexión.', {
      exact: false,
    }),
  ).toBeVisible();

  // «Reintentar envío» still skips our wait: the server is back, the sale goes up.
  await context.unroute('**/api/v1/sync/push');
  await page.getByRole('button', { name: 'Reintentar envío' }).click();
  await expect(page.getByRole('heading', { name: 'Todo enviado' })).toBeVisible({
    timeout: 20_000,
  });
  await expect
    .poll(async () => (await idsDeTickets()).length, { timeout: 15_000 })
    .toBe(antes.length + 1);
});

test('a server that says when: the pill and the helper name the hour (DS-05)', async ({
  page,
  context,
}) => {
  await puertaOperador(page, PRODUCTOS);
  await servidorOcupado(context, '120');
  await venderYAbrirPendientes(page);

  await expect(
    page.getByText(/^El servidor pidió esperar hasta las \d{1,2}:\d{2} [ap]\. m\.$/),
  ).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.locator('[data-estado="reintentando"]')).toHaveAttribute(
    'aria-label',
    /^Estado del envío: Reintentando a las \d{1,2}:\d{2} [ap]\. m\.$/,
  );
  await expect(page.getByText(/· Próximo: a las \d{1,2}:\d{2} [ap]\. m\.$/)).toBeVisible();

  // The manual retry never skips the server's wait: it says when it goes.
  await page.getByRole('button', { name: 'Reintentar envío' }).click();
  await expect(
    page.getByText(/^Lo enviamos a las \d{1,2}:\d{2} [ap]\. m\., como pidió el servidor\.$/),
  ).toBeVisible({ timeout: 20_000 });
  await context.unroute('**/api/v1/sync/push');
});
