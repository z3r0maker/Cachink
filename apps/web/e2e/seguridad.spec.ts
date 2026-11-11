import { expect, test, type Page } from './test';

import {
  codigoDe,
  conSegundoPaso,
  entrarConSegundoPaso,
  pasaronQuinceMinutos,
} from './segundo-factor';
import { addMember, clientIp, mintTenant, signIn, submitSignIn } from './tenant';

/**
 * «Seguridad» (N-83, ADR-142; boards SgMenu, SgSeguridad and SgActivar): the
 * account menu's entry, the page, the enrolment panel, fresh recovery codes
 * and turning it off.
 *
 * Every test mints its own owner. What the page shows is that account's own
 * row: since when the second factor is on and how many codes are left are read
 * from the database, never kept in the browser.
 */
test.use({
  storageState: { cookies: [], origins: [] },
  extraHTTPHeaders: { 'x-forwarded-for': clientIp() },
});

const DIEZ = 'Te quedan 10 de 10. Cada uno sirve una sola vez.';

async function abrirSeguridad(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Menú de usuario' }).click();
  await page.getByTestId('menu-seguridad').click();
  await expect(page).toHaveURL(/\/seguridad$/);
  await expect(page.getByRole('heading', { name: 'Seguridad', level: 1 })).toBeVisible();
}

/** The ten codes a panel is showing, as text. */
async function codigosEnPantalla(page: Page): Promise<string[]> {
  const filas = page.getByTestId('codigos-de-recuperacion').getByRole('listitem');
  await expect(filas).toHaveCount(10);
  return filas.allInnerTexts();
}

test('an owner turns it on from the account menu, and the next sign-in asks for the code', async ({
  page,
}) => {
  const t = await mintTenant({ label: 'Segura' });
  await signIn(page, t);
  // The invitation, once per person, above every page but this one.
  await expect(page.getByTestId('seguridad-invitacion')).toBeVisible();
  await abrirSeguridad(page);
  await expect(page.getByTestId('seguridad-invitacion')).toHaveCount(0);
  const main = page.locator('main');
  await expect(main.getByText('Apagada', { exact: true })).toBeVisible();

  await page.getByTestId('seguridad-activar').click();
  const panel = page.getByRole('dialog', { name: 'Activar la verificación en dos pasos' });
  await expect(panel.getByText('Paso 1 de 3')).toBeVisible();
  await page.getByTestId('activar-password').fill('no-es-la-clave');
  await page.getByTestId('activar-seguir').click();
  await expect(panel.getByText('Esa contraseña no es correcta. Intenta otra vez.')).toBeVisible();
  await page.getByTestId('activar-password').fill(t.password);
  await page.getByTestId('activar-seguir').click();

  await expect(panel.getByText('Paso 2 de 3')).toBeVisible();
  await expect(panel.getByRole('img', { name: /Código QR/ })).toBeVisible();
  const secret = (await page.getByTestId('activar-clave').innerText()).replaceAll(' ', '');
  expect(secret).toMatch(/^[A-Z2-7]{32}$/);
  await page.getByTestId('activar-codigo').fill('000000');
  await page.getByTestId('activar-seguir').click();
  await expect(panel.getByText(/Ese código no coincide/)).toBeVisible();
  await page.getByTestId('activar-codigo').fill(await codigoDe(secret));
  await page.getByTestId('activar-seguir').click();

  await expect(panel.getByText('Paso 3 de 3')).toBeVisible();
  await expect(panel.getByText('Listo, tu cuenta ya tiene segundo paso.')).toBeVisible();
  await codigosEnPantalla(page);
  // The codes are shown once: the panel does not close until they are kept.
  await expect(page.getByTestId('activar-terminar')).toBeDisabled();
  await page.getByTestId('codigos-guardados').check();
  await page.getByTestId('activar-terminar').click();

  await expect(main.getByText('Encendida', { exact: true })).toBeVisible();
  await expect(page.getByTestId('seguridad-desde')).toContainText(
    /^Desde el \d{1,2} de \w+ de \d{4}/,
  );
  await expect(page.getByTestId('seguridad-codigos')).toHaveText(DIEZ);

  // From now on the password alone opens nothing.
  await page.context().clearCookies();
  await submitSignIn(page, t);
  await expect(page).toHaveURL(/\/login\/verificar$/);
  await page.getByTestId('segundo-paso-codigo').fill(await codigoDe(secret));
  await page.getByRole('button', { name: 'Verificar y entrar' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  await expect(page.getByTestId('seguridad-invitacion')).toHaveCount(0);
});

test('new recovery codes replace the old ones', async ({ page }) => {
  const t = await mintTenant({ label: 'Renueva' });
  const factor = await conSegundoPaso(t);
  await entrarConSegundoPaso(page, t, factor);
  await page.goto('/seguridad');
  await expect(page.getByTestId('seguridad-codigos')).toHaveText(DIEZ);

  await page.getByRole('button', { name: 'Generar códigos nuevos' }).click();
  const panel = page.getByRole('dialog', { name: 'Códigos de recuperación nuevos' });
  await expect(panel.getByText('Los códigos anteriores ya no sirven')).toBeVisible();
  const nuevos = await codigosEnPantalla(page);
  expect(nuevos.filter((c) => factor.codigos.includes(c))).toEqual([]);
  await expect(page.getByTestId('codigos-terminar')).toBeDisabled();
  await page.getByTestId('codigos-guardados').check();
  await page.getByTestId('codigos-terminar').click();
  await expect(page.getByTestId('seguridad-codigos')).toHaveText(DIEZ);

  // An old code no longer opens the door; a new one does, and is counted.
  await page.context().clearCookies();
  await submitSignIn(page, t);
  await page.getByTestId('segundo-paso-cambiar').click();
  await page.getByTestId('segundo-paso-codigo').fill(factor.codigos[0] as string);
  await page.getByRole('button', { name: 'Entrar con este código' }).click();
  await expect(page.getByText('Ese código no es válido o ya se usó.')).toBeVisible();
  await page.getByTestId('segundo-paso-codigo').fill(nuevos[0] as string);
  await page.getByRole('button', { name: 'Entrar con este código' }).click();
  await expect(page.getByTestId('seguridad-recuperacion')).toContainText('te quedan 9 de 10');
});

test('turning it off asks for a code first, and the password is enough again', async ({ page }) => {
  const t = await mintTenant({ label: 'Apaga' });
  const factor = await conSegundoPaso(t);
  await entrarConSegundoPaso(page, t, factor);
  await pasaronQuinceMinutos(t);
  await page.goto('/seguridad');
  const main = page.locator('main');
  await expect(main.getByText('Encendida', { exact: true })).toBeVisible();

  await main.getByRole('button', { name: 'Desactivar', exact: true }).click();
  await page
    .getByRole('dialog', { name: '¿Desactivar la verificación en dos pasos?' })
    .getByRole('button', { name: 'Sí, desactivar' })
    .click();

  // The proof is older than 15 minutes: the server refused, and the screen asks.
  const pregunta = page.getByRole('dialog', { name: 'Confirma que eres tú' });
  await expect(pregunta).toBeVisible();
  await page.getByTestId('reconfirmar-codigo').fill(await codigoDe(factor.secret));
  await pregunta.getByRole('button', { name: 'Confirmar' }).click();

  await expect(
    main.getByText('Listo, la verificación en dos pasos quedó apagada.', { exact: false }),
  ).toBeVisible();
  await expect(main.getByText('Apagada', { exact: true })).toBeVisible();

  await page.context().clearCookies();
  await signIn(page, t);
  await expect(page).not.toHaveURL(/\/login/);
});

test('«Ahora no» retires the invitation for good', async ({ page }) => {
  const t = await mintTenant({ label: 'Luego' });
  await signIn(page, t);
  const franja = page.getByTestId('seguridad-invitacion');
  await expect(franja).toContainText('Ponle un segundo paso a tu cuenta');
  await franja.getByRole('button', { name: 'Ahora no' }).click();
  await expect(franja).toHaveCount(0);

  // Remembered on the server, so it does not come back in another browser.
  await page.context().clearCookies();
  await signIn(page, t);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(franja).toHaveCount(0);
});

test('a viewer has no «Seguridad»: not in the menu, not as a page, no invitation', async ({
  page,
}) => {
  const t = await mintTenant({ label: 'Lectura' });
  const lector = await addMember(t, { role: 'viewer' });
  await signIn(page, lector);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByTestId('seguridad-invitacion')).toHaveCount(0);
  await page.getByRole('button', { name: 'Menú de usuario' }).click();
  await expect(page.getByTestId('menu-privacidad')).toBeVisible();
  await expect(page.getByTestId('menu-seguridad')).toHaveCount(0);
  await page.keyboard.press('Escape');

  // Typed by hand, the address leads back to Inicio.
  await page.goto('/seguridad');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Seguridad', level: 1 })).toHaveCount(0);
});
