import { randomBytes } from 'node:crypto';

import { expect, test, type Page } from './test';

import {
  confirmarCorreo,
  confirmarYSeguir,
  crearCuenta,
  enlaceDeConfirmacion,
  vencerEnlaces,
  type Alta,
} from './confirmacion';
import { linkIn } from './outbox';
import { clientIp, stamp, submitSignIn } from './tenant';

/**
 * Signup email confirmation (N-83, ADR-142; boards SgRevisaCorreo and
 * SgConfirmar), as a brand-new visitor each time.
 *
 * Every test signs up an account of its own, so nothing here is shared and
 * nothing touches the seeded tenant. What each page shows comes from the
 * database: the address and the business behind a 256-bit link or the signup
 * browser's pass, never from the address bar. An address of its own per worker
 * keeps the per-IP signup and email throttles from carrying between them.
 */
test.use({
  storageState: { cookies: [], origins: [] },
  extraHTTPHeaders: { 'x-forwarded-for': clientIp() },
});

function nueva(label: string): Alta {
  const sello = stamp();
  return {
    negocio: `${label} ${sello}`,
    email: `${label.toLowerCase()}-${sello}@ejemplo.mx`,
    password: 'tortas-2026',
  };
}

const REENVIADO = 'Listo, te mandamos otro enlace. El anterior ya no sirve.';
const VENCIDO = 'Este enlace ya venció';

/** No session: the portal sends this browser to the sign-in door. */
async function expectPortalCerrado(page: Page): Promise<void> {
  await page.goto('/equipo');
  await expect(page).toHaveURL(/\/login/);
}

test('signing up opens no session, and «Mandar otro enlace» retires the first one', async ({
  page,
}) => {
  const alta = nueva('Fonda');
  await crearCuenta(page, alta);
  await expect(page).toHaveURL(/\/signup\/revisa$/);
  await expect(page.locator('main').getByText(alta.email)).toBeVisible();
  const primero = await enlaceDeConfirmacion(alta.email);

  await expectPortalCerrado(page);

  // The pass is the browser's: «Revisa tu correo» is still there to come back to.
  await page.goto('/signup/revisa');
  await page.getByTestId('revisa-reenviar').click();
  await expect(page.getByText(REENVIADO)).toBeVisible();
  await expect(page.getByTestId('revisa-reenviar')).toBeDisabled();
  await expect(page.getByTestId('revisa-reenviar')).toHaveText('Pide otro en 1 min');

  const segundo = await enlaceDeConfirmacion(alta.email);
  expect(segundo).not.toBe(primero);
  await page.goto(primero);
  await expect(page.getByRole('heading', { name: VENCIDO })).toBeVisible();
});

test('the emailed link says whose it is, confirms with one tap, and works once', async ({
  page,
}) => {
  const alta = nueva('Tortas');
  await crearCuenta(page, alta);
  const enlace = await enlaceDeConfirmacion(alta.email);

  await page.goto(enlace);
  const main = page.locator('main');
  await expect(main.getByRole('heading', { name: 'Confirma tu correo' })).toBeVisible();
  await expect(main.getByText(alta.email)).toBeVisible();
  await expect(main.getByText(alta.negocio)).toBeVisible();

  // Opening the page confirmed nothing: a mail filter that follows links opens no portal.
  const otra = await page.context().newPage();
  await expectPortalCerrado(otra);
  await otra.close();

  await page.getByTestId('confirmar-correo').click();
  await expect(main.getByRole('heading', { name: 'Correo confirmado' })).toBeVisible();
  await page.getByTestId('confirmado-seguir').click();
  await expect(page.getByRole('heading', { name: 'Platícanos de ti' })).toBeVisible();

  await page.goto(enlace);
  await expect(page.getByRole('heading', { name: 'Este enlace ya se usó' })).toBeVisible();
});

test('a password alone does not open an unconfirmed account: it gets a fresh link', async ({
  page,
}) => {
  const alta = nueva('Cocina');
  await crearCuenta(page, alta);
  const primero = await enlaceDeConfirmacion(alta.email);

  // Another browser: no pass, so «Revisa tu correo» is not its page to see.
  await page.context().clearCookies();
  await page.goto('/signup/revisa');
  await expect(page).toHaveURL(/\/login/);

  await submitSignIn(page, alta);
  await expect(page.getByRole('heading', { name: 'Falta confirmar tu correo' })).toBeVisible();
  await expect(page).toHaveURL(/\/signup\/revisa\?desde=entrar$/);
  await expect(page.locator('main').getByText(alta.email)).toBeVisible();
  await expectPortalCerrado(page);

  const fresco = await enlaceDeConfirmacion(alta.email);
  expect(fresco).not.toBe(primero);
  await confirmarCorreo(page, alta.email);
  await page.goto('/');
  await expect(page).not.toHaveURL(/\/login/);
});

test('«Corregir mi correo» moves the account to the right address', async ({ page }) => {
  const alta = nueva('Errata');
  const bueno = `bueno-${stamp()}@ejemplo.mx`;
  await crearCuenta(page, alta);
  const alMalo = await enlaceDeConfirmacion(alta.email);

  await page.getByTestId('revisa-corregir').click();
  await page.getByTestId('revisa-correo-nuevo').fill('no-es-un-correo');
  await expect(page.getByTestId('revisa-guardar')).toBeDisabled();
  // An address that is already someone's account is refused without saying whose.
  await page.getByTestId('revisa-correo-nuevo').fill('pedro@taqueria.mx');
  await page.getByTestId('revisa-guardar').click();
  await expect(page.getByText(/No pudimos usar ese correo/)).toBeVisible();

  await page.getByTestId('revisa-correo-nuevo').fill(bueno);
  await page.getByTestId('revisa-guardar').click();
  await expect(page.getByText(REENVIADO)).toBeVisible();
  await expect(page.locator('main').getByText(bueno)).toBeVisible();

  // What went to the mistyped address opens nothing.
  await page.goto(alMalo);
  await expect(page.getByRole('heading', { name: VENCIDO })).toBeVisible();

  await confirmarYSeguir(page, bueno);
  await expect(page.getByRole('heading', { name: 'Platícanos de ti' })).toBeVisible();
});

test('an expired link sends another to the same account, the address masked', async ({ page }) => {
  const alta = nueva('Tardes');
  await crearCuenta(page, alta);
  const enlace = await enlaceDeConfirmacion(alta.email);
  await vencerEnlaces(alta.email);
  await page.context().clearCookies();

  await page.goto(enlace);
  const main = page.locator('main');
  await expect(main.getByRole('heading', { name: VENCIDO })).toBeVisible();
  // Whoever holds an old link may not be the owner: `t***@ejemplo.mx`, never the address.
  await expect(main.getByText('t***@ejemplo.mx')).toBeVisible();
  await expect(main.getByText(alta.email)).toHaveCount(0);

  await page.getByTestId('confirmar-pedir-otro').click();
  await expect(
    page.getByText('Listo, revisa tu correo. El enlace nuevo dura 24 horas.'),
  ).toBeVisible();
  await expect(page.getByTestId('confirmar-pedir-otro')).toBeDisabled();

  expect(await enlaceDeConfirmacion(alta.email)).not.toBe(enlace);
  await confirmarYSeguir(page, alta.email);
  await expect(page.getByRole('heading', { name: 'Platícanos de ti' })).toBeVisible();
});

test('a link nobody issued, or no link at all, says so and offers the door', async ({ page }) => {
  await page.goto(`/signup/confirmar?t=${randomBytes(32).toString('base64url')}`);
  await expect(page.getByRole('heading', { name: 'Este enlace no sirve' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible();

  await page.goto('/signup/confirmar');
  await expect(page.getByRole('heading', { name: 'Este enlace no sirve' })).toBeVisible();
});

test('a sign-in link claims an unconfirmed account and asks for a new password', async ({
  page,
}) => {
  const alta = nueva('Reclamo');
  await crearCuenta(page, alta);
  await page.context().clearCookies();

  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByRole('link', { name: 'Entrar con un enlace por correo' }).click();
  await page.getByTestId('link-email').fill(alta.email);
  await page.getByRole('button', { name: 'Mandar enlace' }).click();
  await expect(page.getByTestId('link-sent')).toBeVisible();
  const enlace = await linkIn(alta.email, '/login/entrar');
  expect(enlace).not.toBeNull();

  // The inbox is proven, so the address is confirmed; the password was typed by
  // whoever signed up, who may not be the inbox's owner, so it does not survive.
  await page.goto(enlace as string);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/login\/restablecer\?t=.+&confirmado=1$/);
  await expect(page.getByText(/Entraste con un enlace a tu correo/)).toBeVisible();
  await page.getByTestId('reset-password').fill('nueva-clave-1');
  await page.getByTestId('reset-password-2').fill('nueva-clave-1');
  await page.getByRole('button', { name: 'Guardar y entrar' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));

  await page.context().clearCookies();
  await submitSignIn(page, alta);
  await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible();
});
