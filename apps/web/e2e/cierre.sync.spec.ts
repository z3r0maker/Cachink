import { expect, test } from './test';
import { venderEfectivo, venderFiado } from './cobrar';

import { mintCode, pasarAcceso } from './acceso-flow';
import { asTenant, BIZ } from './sync-phone';

/**
 * O-36 — Operador · Cierre de turno on the register's own data: the expected
 * cash is the O-03 calculator over the turno's real rows — fondo + cash sales
 * + cash abonos − gastos — the screen's figures agree with it, and closing
 * goes through the use case: counted, expected, difference zero, the closed
 * turno reaching Postgres.
 */

test.use({ storageState: { cookies: [], origins: [] } });

// The real door is heavy: WASM boot, the bootstrap apply, bcrypt verifies.
test.setTimeout(120_000);

test("the close counts against the turno's real expected cash", async ({ page }) => {
  const code = 'CERRAR9A';
  await mintCode(code);
  await page.goto('/operador/caja');
  await pasarAcceso(page, code);

  // The turno's real activity: $50 cash sale, $25 fiado, $150 gasto, $20 abono.
  const taco = page.getByRole('button', { name: /Taco al pastor/ }).first();
  await taco.click();
  await taco.click();
  await venderEfectivo(page, '60');
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);

  await taco.click();
  await venderFiado(page, 'Doña Mari de la tienda');
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);

  await page.getByRole('link', { name: 'Gastos' }).click();
  await page
    .getByRole('button', { name: /Registrar gasto/ })
    .first()
    .click();
  const gasto = page.getByRole('dialog', { name: 'Registrar gasto' });
  await gasto.getByLabel('¿Cuánto?').fill('150');
  await gasto.getByLabel('¿Qué compraste?').fill('Gas para la parrilla');
  await gasto.getByRole('button', { name: 'Insumos', exact: true }).click();
  await gasto.getByRole('button', { name: 'Registrar gasto de $150.00' }).click();
  await expect(page.getByText('Gas para la parrilla').first()).toBeVisible();

  await page.getByRole('link', { name: 'Fiado y abonos' }).click();
  await expect(page.getByText('1 venta abierta').first()).toBeVisible();
  await page.getByRole('button', { name: 'Recibir abono' }).click();
  const abono = page.getByRole('dialog');
  await abono.getByLabel('Cuánto abona').fill('20');
  await abono.getByRole('button', { name: 'Recibir abono de $20.00' }).click();
  await expect(page.getByRole('status')).toContainText('$20.00 de Doña Mari');

  // The close: the calculator's answer over the turno's own rows.
  await page.getByRole('link', { name: 'Cerrar mi turno' }).click();
  await expect(page.getByRole('heading', { name: 'Cierre de turno' })).toBeVisible();
  await expect(page.getByText('Efectivo esperado')).toBeVisible();
  await expect(page.getByText('$420.00').first()).toBeVisible();
  await expect(page.getByText('Fondo de caja')).toBeVisible();
  await expect(page.getByText('$500.00').first()).toBeVisible();
  await expect(page.getByText('Ventas en efectivo')).toBeVisible();
  await expect(page.getByText('$50.00').first()).toBeVisible();
  await expect(page.getByText('Abonos en efectivo')).toBeVisible();
  await expect(page.getByText('Gastos de caja chica')).toBeVisible();
  const resumen = page.getByRole('region', { name: 'Resumen del turno' });
  await expect(resumen).toContainText('Fiado $25.00');

  // Count exactly the expected: two $200 bills and one $20 coin.
  await page.getByLabel('Cuántos billetes de $200').fill('2');
  await page.getByLabel('Cuántas monedas de $20', { exact: true }).fill('1');
  const cerrar = page.getByRole('button', { name: 'Cerrar turno', exact: true });
  await expect(cerrar).toBeEnabled();
  await cerrar.click();
  await expect(page.getByText('¡Turno cerrado!')).toBeVisible();
  const corte = page.getByRole('region', { name: 'Corte de caja' });
  await expect(corte).toContainText('Cobrado');
  await expect(corte).toContainText('$75.00');

  // The closed turno reaches Postgres, figures and all.
  await expect
    .poll(
      async () =>
        asTenant(BIZ, async (sql) => {
          const [row] = await sql<
            {
              esperado: string;
              cierre: string;
              dif: string;
            }[]
          >`
            SELECT efectivo_esperado_centavos::text AS esperado,
                   monto_cierre_centavos::text AS cierre,
                   diferencia_centavos::text AS dif
            FROM caja_turnos WHERE business_id = ${BIZ} AND cierre_at IS NOT NULL
            ORDER BY cierre_at DESC LIMIT 1`;
          return `${row?.esperado ?? ''}|${row?.cierre ?? ''}|${row?.dif ?? ''}`;
        }),
      { timeout: 15_000 },
    )
    .toBe('42000|42000|0');
});

/**
 * ADR-123 (DB3-CAJA-02, DS-06 option (a)): records still to send never block
 * the close. With the server out of reach the sale waits in the outbox; the
 * close shows how many are waiting, stays enabled, closes, and the sale and
 * the closed turno reach Postgres once the connection comes back.
 */
test('the close goes ahead with records still to send, and they go up later', async ({
  page,
  context,
}) => {
  const code = 'CERRAR7B';
  await mintCode(code);
  await page.goto('/operador/caja');
  await pasarAcceso(page, code);
  const antes = await ticketsDelNegocio();

  // The server is unreachable (the pages still load): the sale stays queued.
  await context.route('**/api/v1/sync/**', (route) => route.abort('internetdisconnected'));
  const taco = page.getByRole('button', { name: /Taco al pastor/ }).first();
  await taco.click();
  await taco.click();
  await venderEfectivo(page, '50');
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);

  await page.getByRole('link', { name: 'Cerrar mi turno' }).click();
  const banda = page.getByTestId('cierre-por-enviar');
  await expect(banda).toContainText(/Tienes \d+ registros? por enviar/);
  await expect(banda).toContainText('Puedes cerrar; se enviarán cuando vuelva la conexión.');
  // DS-06 (EsCajaCierre): the summary counts them «por enviar»; a retry that
  // finds no server says it keeps trying, and the close stays open.
  await expect(page.getByLabel('Resumen del turno')).toContainText(/\d+ por enviar/);
  await banda.getByRole('button', { name: 'Reintentar envío' }).click();
  await expect(banda.getByRole('status')).toHaveText(
    'Todavía no se pudo. Lo volvemos a intentar solos en un momento.',
    { timeout: 15_000 },
  );
  // No server at all: the pill says so, with the count.
  await expect(page.locator('[data-estado="sin-conexion"]')).toHaveAttribute(
    'aria-label',
    /^Estado del envío: Sin conexión · \d+ sin enviar$/,
  );

  // $500 fondo + $50 in cash: one $500 bill and one $50 bill. Not blocked.
  await page.getByLabel('Cuántos billetes de $500', { exact: true }).fill('1');
  await page.getByLabel('Cuántos billetes de $50', { exact: true }).fill('1');
  const cerrar = page.getByRole('button', { name: 'Cerrar turno', exact: true });
  await expect(cerrar).toBeEnabled();
  await cerrar.click();
  await expect(page.getByText('¡Turno cerrado!')).toBeVisible();
  // Its own line on the closed screen (EsCajaCierre).
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Pedro lo verá en su portal cuando se envíen los registros.' }),
  ).toBeVisible();
  expect(await ticketsDelNegocio()).toBe(antes);

  // The connection comes back: the queue goes up by itself.
  await context.unroute('**/api/v1/sync/**');
  await context.setOffline(true);
  await context.setOffline(false);
  await expect.poll(ticketsDelNegocio, { timeout: 30_000 }).toBe(antes + 1);
  await expect
    .poll(
      async () =>
        asTenant(BIZ, async (sql) => {
          const [row] = await sql<{ n: number }[]>`
            SELECT count(*)::int AS n FROM caja_turnos t
            JOIN devices d ON d.id = t.device_id AND d.revoked_at IS NULL
            WHERE t.business_id = ${BIZ} AND t.cierre_at IS NOT NULL
              AND t.monto_cierre_centavos = 55000 AND t.diferencia_centavos = 0`;
          return row?.n ?? 0;
        }),
      { timeout: 30_000 },
    )
    .toBeGreaterThan(0);
});

async function ticketsDelNegocio(): Promise<number> {
  return asTenant(BIZ, async (sql) => {
    const [row] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM tickets`;
    return row?.n ?? 0;
  });
}
