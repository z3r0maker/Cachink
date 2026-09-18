import { expect, test } from '@playwright/test';

import { asTenant, BIZ } from './sync-phone';

/**
 * P-12's roster end to end: create with the period cards, edit, dar de baja —
 * each stored in centavos and logged for the phones. In the `sync` project: it
 * writes the shared tenant, with its own uniquely named employee.
 */
const nombre = `Lupita ${Date.now()}`;

const row = async () => {
  const [r] = await asTenant(
    BIZ,
    (sql) => sql`
      SELECT salario_centavos::text AS salario, periodo, deleted_at IS NOT NULL AS baja,
             (SELECT count(*)::int FROM sync_log l WHERE l.table_name = 'employees' AND l.row_id = e.id) AS logged
        FROM employees e WHERE nombre = ${nombre}`,
  );
  return r;
};

test('an employee is created, edited and dado de baja, each change logged', async ({ page }) => {
  await page.goto('/empleados');
  await page.getByRole('button', { name: 'Nuevo empleado' }).click();
  await page.getByTestId('empleado-nombre').fill(nombre);
  await page.getByTestId('empleado-puesto').fill('Mesera');
  await page.getByTestId('empleado-salario').fill('4500');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('main').getByText(nombre)).toBeVisible();
  expect(await row()).toMatchObject({
    salario: '450000',
    periodo: 'quincenal',
    baja: false,
    logged: 1,
  });

  await page.getByRole('button', { name: `Editar a ${nombre}` }).click();
  await expect(page.getByTestId('empleado-salario')).toHaveValue('4500.00');
  await page.getByTestId('empleado-salario').fill('9800.50');
  await page.getByRole('radio', { name: /Mensual/ }).click();
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('main').getByText('$9,800.50')).toBeVisible();
  expect(await row()).toMatchObject({ salario: '980050', periodo: 'mensual', logged: 2 });

  await page.getByRole('button', { name: `Editar a ${nombre}` }).click();
  await page.getByRole('button', { name: 'Dar de baja' }).click();
  await expect(page.locator('main').getByText(nombre)).toHaveCount(0);
  expect(await row()).toMatchObject({ baja: true, logged: 3 });
});
