import { PROVEEDOR } from '@xangarro/domain';

import { expect, test, type Page } from './test';

import { codigoDe, conSegundoPaso } from './segundo-factor';
import { clientIp, mintTenant, submitSignIn, type Tenant } from './tenant';
import { addOperator } from './tenant-rows';

/**
 * Sign-in step 2 of 2 (N-83, ADR-142; board SgDesafio).
 *
 * Every test mints its own owner with the second factor already on, so no seed
 * is shared and no code is asked of the same seed by two tests. The proof that
 * the step guards anything is an operator's name: it is on `/equipo`, and only
 * a finished sign-in may read it.
 */
test.use({
  storageState: { cookies: [], origins: [] },
  extraHTTPHeaders: { 'x-forwarded-for': clientIp() },
});

const NO_COINCIDE = 'Ese código no coincide. Escribe el que tu app muestra ahora.';

async function duenoConOperador(label: string): Promise<{ t: Tenant; operador: string }> {
  const t = await mintTenant({ label });
  const operador = `Chela ${t.nombre}`;
  await addOperator(t, { nombre: operador });
  return { t, operador };
}

/** The password, then the wait on step two. */
async function hastaElSegundoPaso(page: Page, t: Tenant): Promise<void> {
  await submitSignIn(page, t);
  await expect(page).toHaveURL(/\/login\/verificar$/);
}

async function entrarCon(page: Page, codigo: string, boton: string): Promise<void> {
  await page.getByTestId('segundo-paso-codigo').fill(codigo);
  await page.getByRole('button', { name: boton }).click();
}

test('a password alone never reaches /equipo; the code from the app does', async ({ page }) => {
  const { t, operador } = await duenoConOperador('Candado');
  const factor = await conSegundoPaso(t);

  await hastaElSegundoPaso(page, t);
  await expect(page.getByText('Paso 2 de 2')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Escribe tu código' })).toBeVisible();

  // The right password opened no session: the portal still sends this browser to the door.
  await page.goto('/equipo');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText(operador)).toHaveCount(0);

  // The challenge is still the browser's, for ten minutes. A wrong code stays on the field.
  await page.goto('/login/verificar');
  await entrarCon(page, '000000', 'Verificar y entrar');
  await expect(page.getByRole('alert').filter({ hasText: NO_COINCIDE })).toBeVisible();
  await expect(page).toHaveURL(/\/login\/verificar$/);

  await entrarCon(page, await codigoDe(factor.secret), 'Verificar y entrar');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  await page.goto('/equipo');
  await expect(page.locator('main').getByText(operador, { exact: true })).toBeVisible();
});

test('a recovery code opens the session once, and the portal says one is gone', async ({
  page,
}) => {
  const { t } = await duenoConOperador('Respaldo');
  const factor = await conSegundoPaso(t);
  const codigo = factor.codigos[0] as string;

  await hastaElSegundoPaso(page, t);
  await page.getByTestId('segundo-paso-cambiar').click();
  await expect(page.getByRole('heading', { name: 'Usa un código de recuperación' })).toBeVisible();
  await entrarCon(page, codigo, 'Entrar con este código');

  await expect(page).toHaveURL(/\/\?aviso=recuperacion$/);
  const franja = page.getByTestId('seguridad-recuperacion');
  await expect(franja).toContainText('te quedan 9 de 10');
  await franja.getByRole('link', { name: 'Ver Seguridad' }).click();
  await expect(page.getByTestId('seguridad-codigos')).toHaveText(
    'Te quedan 9 de 10. Cada uno sirve una sola vez.',
  );

  // Spent: the same code does not open a second session.
  await page.context().clearCookies();
  await hastaElSegundoPaso(page, t);
  await page.getByTestId('segundo-paso-cambiar').click();
  await entrarCon(page, codigo, 'Entrar con este código');
  await expect(
    page.getByRole('alert').filter({ hasText: 'Ese código no es válido o ya se usó.' }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login\/verificar$/);
});

test('five wrong codes close the field for a while', async ({ page }) => {
  const { t } = await duenoConOperador('Terco');
  const factor = await conSegundoPaso(t);

  await hastaElSegundoPaso(page, t);
  for (let intento = 1; intento <= 4; intento += 1) {
    await entrarCon(page, `00000${intento}`, 'Verificar y entrar');
    await expect(page.getByRole('alert').filter({ hasText: NO_COINCIDE })).toBeVisible();
    await page.getByTestId('segundo-paso-codigo').fill('');
  }
  await entrarCon(page, '000005', 'Verificar y entrar');
  await expect(
    page.getByText(/Demasiados intentos\. Vuelve a intentar en \d+ min\./),
  ).toBeVisible();
  await expect(page.getByTestId('segundo-paso-codigo')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Verificar y entrar' })).toBeDisabled();

  // The lock is the account's, not the page's: the right code does not get in either.
  await page.reload();
  await entrarCon(page, await codigoDe(factor.secret), 'Verificar y entrar');
  await expect(page.getByText(/Demasiados intentos/)).toBeVisible();
  await expect(page).toHaveURL(/\/login\/verificar$/);
});

test('without phone or codes, the step says how to ask for help', async ({ page }) => {
  const { t } = await duenoConOperador('Perdido');
  await conSegundoPaso(t);

  await hastaElSegundoPaso(page, t);
  await page.getByRole('button', { name: 'Pedir ayuda' }).click();
  await expect(page.getByRole('heading', { name: 'Te ayudamos a entrar' })).toBeVisible();
  await expect(page.getByText('Mientras tanto tus cajas siguen cobrando.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Escribir a soporte' })).toHaveAttribute(
    'href',
    `mailto:${PROVEEDOR.correo}`,
  );
  await page.getByRole('button', { name: 'Volver al código' }).click();
  await expect(page.getByRole('heading', { name: 'Escribe tu código' })).toBeVisible();
});

test('step two without a password first goes back to the door', async ({ page }) => {
  await page.goto('/login/verificar');
  await expect(page).toHaveURL(/\/login(?!\/verificar)/);
});
