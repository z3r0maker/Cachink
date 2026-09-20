import { expect, test } from '@playwright/test';

import { mintCode, pasarAcceso } from './acceso-flow';
import { asTenant, BIZ } from './sync-phone';

/**
 * O-35 — Operador · Gastos on the register's own data: the open turno starts
 * empty, a gasto recorded through the real use case (scoped to the turno, the
 * operator's category word mapped to the domain's) lands on top with the
 * figures re-derived, and the row reaches Postgres tied to the open turno.
 */

test.use({ storageState: { cookies: [], origins: [] } });

// The real door is heavy: WASM boot, the bootstrap apply, bcrypt verifies.
test.setTimeout(90_000);

test("a gasto of the open turno is the register's own, end to end", async ({ page }) => {
  const code = 'GSTA9CA2';
  await mintCode(code);
  await page.goto('/operador/caja');
  await pasarAcceso(page, code);

  await page.getByRole('link', { name: 'Gastos' }).click();
  await expect(page.getByRole('heading', { name: 'Gastos' })).toBeVisible();
  await expect(page.getByText('Sin gastos en este turno')).toBeVisible();

  // Register one: gas for the grill, $150, Insumos.
  await page
    .getByRole('button', { name: /Registrar gasto/ })
    .first()
    .click();
  const modal = page.getByRole('dialog');
  await modal.getByLabel('Monto').fill('150');
  await modal.getByLabel('Concepto').fill('Gas para la parrilla');
  await modal.getByRole('button', { name: 'Insumos', exact: true }).click();
  await modal.getByRole('button', { name: 'Registrar gasto', exact: true }).click();

  await expect(page.getByRole('status')).toContainText(
    '−$150.00 · Gas para la parrilla · Insumos · sin comprobante.',
  );
  await expect(page.getByText('Gas para la parrilla').first()).toBeVisible();
  await expect(page.getByText('$150.00').first()).toBeVisible();

  // The queue carries it up: tied to the open turno, stored in the domain's words.
  await expect
    .poll(
      async () =>
        asTenant(BIZ, async (sql) => {
          const [row] = await sql<{ concepto: string; categoria: string; turno: string }[]>`
            SELECT e.concepto, e.categoria, ct.id::text AS turno FROM expenses e
            JOIN caja_turnos ct ON ct.id = e.caja_turno_id
            WHERE e.business_id = ${BIZ} AND ct.cierre_at IS NULL
            ORDER BY e.created_at DESC LIMIT 1`;
          return `${row?.concepto ?? ''}|${row?.categoria ?? ''}|${row?.turno ? 'abierto' : ''}`;
        }),
      { timeout: 15_000 },
    )
    .toBe('Gas para la parrilla|Materia Prima|abierto');
});
