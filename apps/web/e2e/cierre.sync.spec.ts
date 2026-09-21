import { expect, test } from '@playwright/test';

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
  await page.getByRole('button', { name: 'Cobrar', exact: true }).first().click();
  let cobro = page.getByRole('dialog');
  await cobro.getByRole('button', { name: 'Efectivo', exact: true }).click();
  await cobro.getByLabel('Con cuánto paga').fill('60');
  await cobro.getByRole('button', { name: 'Registrar venta' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);

  await taco.click();
  await page.getByRole('button', { name: 'Cobrar', exact: true }).first().click();
  cobro = page.getByRole('dialog');
  await cobro.getByRole('button', { name: 'Fiado', exact: true }).click();
  await cobro.getByRole('button', { name: 'Doña Mari de la tienda' }).click();
  await cobro.getByRole('button', { name: 'Registrar fiado' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);

  await page.getByRole('link', { name: 'Gastos' }).click();
  await page
    .getByRole('button', { name: /Registrar gasto/ })
    .first()
    .click();
  const gasto = page.getByRole('dialog');
  await gasto.getByLabel('Monto').fill('150');
  await gasto.getByLabel('Concepto').fill('Gas para la parrilla');
  await gasto.getByRole('button', { name: 'Insumos', exact: true }).click();
  await gasto.getByRole('button', { name: 'Registrar gasto', exact: true }).click();
  await expect(page.getByText('Gas para la parrilla').first()).toBeVisible();

  await page.getByRole('link', { name: 'Cobranza' }).click();
  await expect(page.getByText('1 ventas abiertas').first()).toBeVisible();
  await page.getByRole('button', { name: 'Recibir abono' }).click();
  const abono = page.getByRole('dialog');
  await abono.getByLabel('Cuánto abona').fill('20');
  await abono.getByRole('button', { name: 'Registrar abono' }).click();
  await expect(page.getByRole('status')).toContainText('$20.00 de Doña Mari');

  // The close: the calculator's answer over the turno's own rows.
  await page.getByRole('link', { name: 'Cerrar turno' }).click();
  await expect(page.getByRole('heading', { name: 'Cierre de turno' })).toBeVisible();
  await expect(page.getByText('Efectivo esperado')).toBeVisible();
  await expect(page.getByText('$420.00').first()).toBeVisible();
  await expect(page.getByText('Fondo de caja')).toBeVisible();
  await expect(page.getByText('$500.00').first()).toBeVisible();
  await expect(page.getByText('Ventas en efectivo')).toBeVisible();
  await expect(page.getByText('$50.00').first()).toBeVisible();
  await expect(page.getByText('Abonos en efectivo')).toBeVisible();
  await expect(page.getByText('Gastos de caja chica')).toBeVisible();
  await expect(page.getByText('Cobrado (todos los métodos)')).toBeVisible();
  await expect(page.getByText('$75.00').first()).toBeVisible();
  await expect(page.getByText('Ventas fiadas')).toBeVisible();
  await expect(page.getByText('$25.00').first()).toBeVisible();

  // Count exactly the expected: two $200 and one $20.
  await page.getByLabel('Cantidad de $200').fill('2');
  await page.getByLabel('Cantidad de $20', { exact: true }).fill('1');
  const cerrar = page.getByRole('button', { name: 'Cerrar turno', exact: true });
  await expect(cerrar).toBeEnabled();
  await cerrar.click();
  await expect(page.getByText('Turno cerrado')).toBeVisible();

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
