import { expect, test, type Page } from './test';

import {
  codigoDe,
  conSegundoPaso,
  entrarConSegundoPaso,
  pasaronQuinceMinutos,
  type Factor,
} from './segundo-factor';
import { asTenant } from './sync-phone';
import { clientIp, mintTenant, type Tenant } from './tenant';

/**
 * The re-ask (N-83, ADR-142 §8; board SgReconfirmar): with the second factor
 * on, a change to operators, cajas or billing needs a code typed in the last
 * 15 minutes.
 *
 * Each test mints its own owner, signs in through both steps, and then lets
 * sixteen minutes pass on the session's proof. The claim that matters is the
 * server's: while the dialog is open, and after it is closed without a code,
 * the row the change would have written is read back and is not there.
 */
test.use({
  storageState: { cookies: [], origins: [] },
  extraHTTPHeaders: { 'x-forwarded-for': clientIp() },
});

const pregunta = (page: Page) => page.getByRole('dialog', { name: 'Confirma que eres tú' });

async function duenoConPruebaVencida(
  page: Page,
  label: string,
): Promise<{ t: Tenant; factor: Factor }> {
  const t = await mintTenant({ label });
  const factor = await conSegundoPaso(t);
  await entrarConSegundoPaso(page, t, factor);
  await pasaronQuinceMinutos(t);
  return { t, factor };
}

const operadoresDe = (t: Tenant) =>
  asTenant(t.biz, async (sql) => {
    const rows = await sql<{ nombre: string }[]>`SELECT nombre FROM users ORDER BY nombre`;
    return rows.map((r) => r.nombre);
  });

const cajasVinculadas = (t: Tenant) =>
  asTenant(t.biz, async (sql) => {
    const [row] = await sql<{ n: string }[]>`
      SELECT count(*)::text AS n FROM devices WHERE revoked_at IS NULL`;
    return Number(row?.n ?? 0);
  });

async function llenarOperador(page: Page, nombre: string): Promise<void> {
  await page.getByRole('button', { name: 'Nuevo operador' }).click();
  await page.getByTestId('operador-nombre').fill(nombre);
  await page.getByTestId('operador-pin').fill('1357');
  await page.getByTestId('operador-pin-confirmar').fill('1357');
}

const guardarOperador = (page: Page) =>
  page.getByRole('dialog', { name: 'Nuevo operador' }).getByRole('button', { name: 'Guardar' });

/** Switches the dialog to a recovery code and confirms with it. */
async function confirmarConRecuperacion(page: Page, codigo: string): Promise<void> {
  await pregunta(page).getByRole('button', { name: 'Usar un código de recuperación' }).click();
  await page.getByTestId('reconfirmar-codigo').fill(codigo);
  await pregunta(page).getByRole('button', { name: 'Confirmar' }).click();
}

test('a new operator waits for the code: closing the dialog saves nothing, one code covers the next change', async ({
  page,
}) => {
  const { t, factor } = await duenoConPruebaVencida(page, 'Pregunta');
  const primero = `Chelo ${t.nombre}`;
  const segundo = `Lupe ${t.nombre}`;
  await page.goto('/equipo');
  const main = page.locator('main');

  await llenarOperador(page, primero);
  await guardarOperador(page).click();
  await expect(pregunta(page)).toBeVisible();
  await expect(pregunta(page).getByText(/^Vas a cambiar tus operadores\./)).toBeVisible();
  await expect(
    pregunta(page).getByText('No te lo volvemos a pedir durante 15 minutos.'),
  ).toBeVisible();

  // Closed without a code: the server had refused, so there is no operator.
  await pregunta(page).getByRole('button', { name: 'Cancelar' }).click();
  await expect(pregunta(page)).toHaveCount(0);
  expect(await operadoresDe(t)).toEqual([]);

  // The form kept what was typed. A wrong code stays on the field and saves nothing.
  await guardarOperador(page).click();
  await page.getByTestId('reconfirmar-codigo').fill('000000');
  await pregunta(page).getByRole('button', { name: 'Confirmar' }).click();
  await expect(pregunta(page).getByRole('alert')).toContainText('Ese código no coincide.');
  expect(await operadoresDe(t)).toEqual([]);

  await page.getByTestId('reconfirmar-codigo').fill(await codigoDe(factor.secret));
  await pregunta(page).getByRole('button', { name: 'Confirmar' }).click();
  await expect(pregunta(page)).toHaveCount(0);
  await expect(main.getByText(primero, { exact: true })).toBeVisible();

  // Inside the 15 minutes the next change is not asked.
  await llenarOperador(page, segundo);
  await guardarOperador(page).click();
  await expect(main.getByText(segundo, { exact: true })).toBeVisible();
  await expect(pregunta(page)).toHaveCount(0);
  expect(await operadoresDe(t)).toEqual([primero, segundo]);
});

test('unlinking a caja waits for the code, and a recovery code is enough', async ({ page }) => {
  const { t, factor } = await duenoConPruebaVencida(page, 'Caja');
  await page.goto('/equipo?tab=dispositivos');
  const main = page.locator('main');
  await expect(main.getByText(/^1 de \d+ dispositivos$/)).toBeVisible();

  await main.getByRole('button', { name: 'Revocar', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Revocar Caja única' })
    .getByRole('button', { name: 'Revocar' })
    .click();
  await expect(pregunta(page).getByText(/^Vas a desvincular Caja única\./)).toBeVisible();
  expect(await cajasVinculadas(t)).toBe(1);

  await confirmarConRecuperacion(page, factor.codigos[0] as string);
  await expect(pregunta(page)).toHaveCount(0);
  await expect(main.getByText(/^0 de \d+ dispositivos$/)).toBeVisible();
  expect(await cajasVinculadas(t)).toBe(0);
});

test('a billing change waits for the code before anything reaches Stripe', async ({ page }) => {
  const { factor } = await duenoConPruebaVencida(page, 'Cobro');
  await page.goto('/suscripcion');
  const main = page.locator('main');
  await expect(main.getByTestId('suscripcion-estado')).toHaveText(/^Siguiente cobro: /);

  await main.getByRole('button', { name: 'Administrar pago' }).first().click();
  await expect(pregunta(page).getByText(/^Vas a cambiar tu plan\./)).toBeVisible();
  // Nothing ran yet: the e2e server has no Stripe key, and its failure has not been shown.
  await expect(main.getByRole('alert')).toHaveCount(0);

  await confirmarConRecuperacion(page, factor.codigos[0] as string);
  await expect(pregunta(page)).toHaveCount(0);
  // With the code accepted the action ran, and reached the missing Stripe.
  await expect(main.getByRole('alert').first()).toContainText('No pudimos abrir el pago');
});
