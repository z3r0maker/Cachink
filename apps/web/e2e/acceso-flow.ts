import { expect, type Page } from '@playwright/test';

import { asTenant, BIZ } from './sync-phone';

/**
 * The real Acceso walk (O-12), shared by the acceso spec and O-06's capture
 * acceptance: mint the panel's code, link this browser, NIP 2580 (the seed's
 * documented PIN), count the fondo, land on the register.
 */

const EMAIL = 'pedro@taqueria.mx';

export async function mintCode(code: string): Promise<string> {
  await asTenant(BIZ, async (sql) => {
    // The sync project's contract: this file's activation owns Taquería's
    // slots — revoke the previous file's phones before minting.
    await sql`UPDATE devices SET revoked_at = now() WHERE revoked_at IS NULL`;
    await sql`
      INSERT INTO activation_codes (code, email, expires_at, business_id, created_at, updated_at)
      VALUES (${code}, ${EMAIL}, now() + interval '1 hour', ${BIZ}, now(), now())
      ON CONFLICT (code) DO UPDATE SET email = EXCLUDED.email, expires_at = EXCLUDED.expires_at,
        business_id = EXCLUDED.business_id, redeemed_at = NULL, redeemed_by_device_id = NULL,
        updated_at = now()`;
  });
  return code;
}

export async function pasarAcceso(
  page: Page,
  code: string,
  operador = 'Ana Robledo',
): Promise<void> {
  await page.getByTestId('vincular-correo').fill(EMAIL);
  await page.getByTestId('vincular-codigo').fill(code);
  await page.getByTestId('vincular-continuar').click();
  await page.getByTestId('acceso-operador').filter({ hasText: operador }).click();
  // A cold build can drop a keypad tap to hydration; the dots say how many
  // digits actually landed: tap again only while this one is missing.
  const puntos = page.getByTestId('nip-cajas');
  for (const [i, k] of [...'2580'].entries()) {
    await expect
      .poll(
        async () => {
          const antes = Number(await puntos.getAttribute('data-llenos'));
          if (antes <= i) await page.getByTestId(`nip-tecla-${k}`).click();
          return Number(await puntos.getAttribute('data-llenos'));
        },
        { timeout: 3000 },
      )
      .toBe(i + 1);
  }
  await page.getByTestId('nip-tecla-→').click();
  await page.getByTestId('fondo-input').fill('500');
  await page.getByTestId('fondo-abrir').click();
  await page.getByRole('heading', { name: 'Cobrar', exact: true }).waitFor();
}
