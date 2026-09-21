import { expect, test as setup } from '@playwright/test';

import { OWNER_STORAGE } from './auth-state';

/**
 * Sign in once and reuse the cookie for every spec.
 *
 * A login per test would be slower and would test the login form 100 times
 * instead of once. `auth.spec.ts` is what actually exercises the form and the
 * gate; this only produces the state the rest of the suite runs as.
 */
setup('authenticate as the owner', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByTestId('login-email').fill('pedro@taqueria.mx');
  await page.getByTestId('login-password').fill('donpedro123');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByRole('heading', { name: 'Hola, Pedro', level: 1 })).toBeVisible();
  // Fixture-era register bypass (O-12's gate): the operator screens still
  // render the design fixtures, so every spec's context carries the demo flag
  // and skips Acceso. acceso.spec.ts uses a fresh context and walks the real
  // door. Removed when the screens read the runtime (O-14+).
  await page.evaluate(() => localStorage.setItem('xangarro.caja.demo', '1'));
  await page.context().storageState({ path: OWNER_STORAGE });
});
