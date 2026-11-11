import {
  base32Decode,
  generateRecoveryCodes,
  generateTotpSecret,
  hotp,
  parseSecretKey,
  sealSecret,
  TOTP_STEP_SECONDS,
  totpStep,
} from '@xangarro/auth-core';

import { asOwner, asTenant } from './sync-phone';
import { submitSignIn, type Tenant } from './tenant';
import type { Page } from './test';
import { E2E_TOTP_KEY } from './totp-key';

/**
 * An account's second factor, for the specs about what it guards (N-83).
 *
 * `conSegundoPaso` writes what the enrolment panel would have left: a sealed
 * seed and ten hashed recovery codes, through the same definer functions the
 * portal calls. The panel itself is `seguridad.spec.ts`'s subject; every other
 * spec starts from an account that already has it on.
 */
export interface Factor {
  /** The seed the owner's authenticator app holds. */
  readonly secret: string;
  /** The ten recovery codes, as the panel showed them once. */
  readonly codigos: readonly string[];
}

export async function conSegundoPaso(t: Pick<Tenant, 'biz' | 'ownerId'>): Promise<Factor> {
  const secret = generateTotpSecret();
  const set = generateRecoveryCodes();
  const sealed = sealSecret(parseSecretKey(E2E_TOTP_KEY), secret, t.ownerId);
  await asTenant(t.biz, async (sql) => {
    await sql`SELECT xangarro.second_factor_save_pending(${t.ownerId}::uuid, NULL, ${sealed})`;
    // Step 0: no code has been used yet, so the first one any test types is fresh.
    await sql`SELECT xangarro.second_factor_complete(${t.ownerId}::uuid, 0,
                                                     ${sql.array([...set.hashes])}::text[])`;
  });
  return { secret, codigos: set.codes };
}

/** «Ahora no» on the invitation, already tapped: the strip is not what the spec is about. */
export async function sinInvitacion(t: Pick<Tenant, 'biz' | 'ownerId'>): Promise<void> {
  await asTenant(t.biz, async (sql) => {
    await sql`SELECT xangarro.second_factor_dismiss_invite(${t.ownerId}::uuid)`;
  });
}

const usados = new Map<string, number>();

const espera = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The code the app shows for `secret`, never the same one twice.
 *
 * A step that already signed in is refused (a code read over a shoulder cannot
 * be replayed), so a second code inside the same thirty seconds is the next
 * step's, which the server's one step of tolerance accepts. A third has to
 * wait for the clock; a spec that needs that many uses a recovery code instead.
 */
export async function codigoDe(secret: string): Promise<string> {
  const paso = Math.max(totpStep(new Date()), (usados.get(secret) ?? 0) + 1);
  const abre = (paso - 1) * TOTP_STEP_SECONDS * 1000;
  if (abre > Date.now()) await espera(abre - Date.now() + 250);
  usados.set(secret, paso);
  return hotp(base32Decode(secret), paso);
}

/** The password, then the app's code: a finished sign-in for an owner with the factor on. */
export async function entrarConSegundoPaso(
  page: Page,
  t: Pick<Tenant, 'email' | 'password'>,
  factor: Factor,
): Promise<void> {
  await submitSignIn(page, t);
  await page.getByTestId('segundo-paso-codigo').fill(await codigoDe(factor.secret));
  await page.getByRole('button', { name: 'Verificar y entrar' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
}

/**
 * Sixteen minutes later: the proof every session of this account carries has
 * gone stale, so the next change to operators, cajas or billing asks again.
 */
export async function pasaronQuinceMinutos(t: Pick<Tenant, 'ownerId'>): Promise<void> {
  await asOwner(async (sql) => {
    await sql`
      UPDATE xangarro.portal_sessions SET stepped_up_at = now() - interval '16 minutes'
       WHERE user_id = ${t.ownerId}::uuid`;
  });
}
