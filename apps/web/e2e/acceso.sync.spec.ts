import { expect, test } from '@playwright/test';
import postgres from 'postgres';

import { mintCode } from './acceso-flow';

/**
 * O-12 — Operador · Acceso, the real door: an unlinked browser sees only the
 * gate, links with the owner's correo + the panel's code, picks the operator,
 * mistypes the NIP once (the attempts line), opens the turno with a fondo, and
 * lands on the register. Runs in a fresh context — no fixture demo flag.
 */

const EMAIL = 'pedro@taqueria.mx';
const CODE = 'AC2SWX9K';

test.describe('Operador · Acceso (O-12)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  // The real door is heavy: WASM boot, the bootstrap apply, bcrypt verifies.
  test.setTimeout(90_000);

  test('an unlinked browser is gated, links, NIPs, opens the turno with a fondo', async ({
    page,
  }) => {
    await mintCode(CODE);
    await page.goto('/operador/caja');

    // The gate: Acceso, never the register.
    const card = page.getByTestId('acceso-card');
    await expect(card).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Vincula esta caja' })).toBeVisible();

    // Paso 1 · correo + código (the code ignores case, spaces and hyphens).
    await page.getByTestId('vincular-correo').fill(EMAIL);
    await page.getByTestId('vincular-codigo').fill(` ${CODE.slice(0, 4)}-${CODE.slice(4)}`);
    // N-34: the aviso at linking is shown before the request goes.
    await expect(page.getByTestId('vincular-aviso')).toContainText('derechos ARCO');
    await page.getByTestId('vincular-continuar').click();

    // Paso 2 · the operator picker came from the activation bootstrap.
    await expect(page.getByRole('heading', { name: '¿Quién abre turno?' })).toBeVisible();
    await expectAvisoOnNewestDevice();
    await page.getByTestId('acceso-operador').filter({ hasText: 'Ana Robledo' }).click();

    // One wrong NIP shows the attempts line (three return to the picker).
    for (const k of '9999') await page.getByTestId(`nip-tecla-${k}`).click();
    await page.getByTestId('nip-tecla-→').click();
    await expect(page.getByTestId('nip-error')).toContainText('Te quedan 2 intentos');

    // The seeded operators' NIP is 2580 (seed.ts documents it).
    for (const k of '2580') await page.getByTestId(`nip-tecla-${k}`).click();
    await page.getByTestId('nip-tecla-→').click();

    // Paso 3 · the fondo opens the turno — and the register appears.
    await expect(page.getByRole('heading', { name: '¿Con cuánto abres la caja?' })).toBeVisible();
    await page.getByTestId('fondo-input').fill('500');
    await page.getByTestId('fondo-abrir').click();
    await expect(page.getByRole('heading', { name: 'Caja', exact: true })).toBeVisible();

    // The link survives a reload, and an open turno walks straight in.
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Caja', exact: true })).toBeVisible();
  });

  test('a wrong code does not link, and the register stays gated', async ({ page }) => {
    await page.goto('/operador');
    await expect(page.getByTestId('acceso-card')).toBeVisible();
    await page.getByTestId('vincular-correo').fill(EMAIL);
    await page.getByTestId('vincular-codigo').fill('ZZZZZZZZ');
    await page.getByTestId('vincular-continuar').click();
    await expect(page.getByTestId('vincular-error')).toContainText(/código|correo/i);
    await expect(page.getByTestId('acceso-card')).toBeVisible();
  });
});

/** N-34: the device row keeps the aviso version the browser showed, and its hash. */
async function expectAvisoOnNewestDevice(): Promise<void> {
  const sql = postgres(process.env.DATABASE_URL as string, { max: 1, onnotice: () => undefined });
  try {
    await sql`SELECT set_config('xangarro.business_id', '01HZ8XQN9GZJXV8AKQ5X0C7BJZ', false)`;
    const [row] = await sql<{ aviso_version: string | null; aviso_sha256: string | null }[]>`
      SELECT aviso_version, aviso_sha256 FROM devices
      WHERE plataforma = 'web' ORDER BY created_at DESC LIMIT 1`;
    expect(row?.aviso_version).toBe('0.1-borrador');
    expect(row?.aviso_sha256).toMatch(/^[0-9a-f]{64}$/);
  } finally {
    await sql.end({ timeout: 5 });
  }
}
