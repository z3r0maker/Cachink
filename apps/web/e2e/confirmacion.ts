import { expect, type Page } from '@playwright/test';

import { linkIn } from './outbox';
import { asOwner } from './sync-phone';

/**
 * The step between «Crear mi cuenta» and the wizard (N-83): signing up opens
 * no session, the emailed link does. Every spec that begins with a signup
 * walks it through here, so the walk has one description.
 */
const RUTA = '/signup/confirmar';

export interface Alta {
  readonly negocio: string;
  readonly email: string;
  readonly password: string;
  /** `/signup?plan=…`, as the landing's buttons send it. */
  readonly plan?: string;
}

/** Fills the signup form and presses it; lands on «Revisa tu correo». */
export async function crearCuenta(page: Page, alta: Alta): Promise<void> {
  await page.goto(alta.plan === undefined ? '/signup' : `/signup?plan=${alta.plan}`);
  await page.getByTestId('signup-nombre').fill(alta.negocio);
  await page.getByTestId('signup-email').fill(alta.email);
  await page.getByTestId('signup-password').fill(alta.password);
  await page.getByTestId('signup-acepto').check();
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
  await expect(page.getByRole('heading', { name: 'Revisa tu correo' })).toBeVisible();
}

/** The confirmation link in the newest email to `email`; waits for the email to be written. */
export async function enlaceDeConfirmacion(email: string): Promise<string> {
  await expect
    .poll(() => linkIn(email, RUTA), { message: `no confirmation email reached ${email}` })
    .not.toBeNull();
  return (await linkIn(email, RUTA)) as string;
}

/** Opens the emailed link and taps it: «Correo confirmado», with a session behind it. */
export async function confirmarCorreo(page: Page, email: string): Promise<void> {
  await page.goto(await enlaceDeConfirmacion(email));
  await page.getByTestId('confirmar-correo').click();
  await expect(page.getByRole('heading', { name: 'Correo confirmado' })).toBeVisible();
}

/** From «Revisa tu correo» to the wizard's first screen. */
export async function confirmarYSeguir(page: Page, email: string): Promise<void> {
  await confirmarCorreo(page, email);
  await page.getByTestId('confirmado-seguir').click();
}

/** Twenty-five hours later: every live confirmation link of the account is past its day. */
export async function vencerEnlaces(email: string): Promise<void> {
  await asOwner(async (sql) => {
    await sql`
      UPDATE xangarro.auth_links l SET expires_at = now() - interval '1 hour'
        FROM auth.users u
       WHERE u.id = l.user_id AND u.email = ${email} AND l.kind = 'confirm'`;
  });
}
