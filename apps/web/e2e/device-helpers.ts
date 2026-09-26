import { expect, type Page } from '@playwright/test';
import { deviceHeaders } from '@xangarro/contracts';

/**
 * Mint a code through the portal and return it — the NEW one.
 *
 * Reading the panel straight after the click returned the *previous* code
 * whenever one was already live: the element exists before the click, so
 * `getAttribute` answers immediately, before React re-renders. And that previous
 * code is exactly the one the click just expired, so activating it came back
 * 410 CODE_EXPIRED. Waiting for the label to change is what makes this return
 * the code the click produced.
 */
export async function freshCode(page: Page): Promise<string> {
  await page.goto('/equipo');
  await page
    .getByRole('group', { name: 'Equipo y nómina' })
    .getByRole('button', { name: /Cajas/ })
    .click();
  const panel = page.getByTestId('activation-code');
  const before = (await panel.count()) > 0 ? await panel.getAttribute('aria-label') : null;

  await page.getByRole('button', { name: /Generar (código|otro)/ }).click();
  if (before === null) await expect(panel).toBeVisible();
  else await expect(panel).not.toHaveAttribute('aria-label', before);

  const label = await panel.getAttribute('aria-label');
  return (label ?? '').replace('Código ', '');
}

export async function activate(page: Page, code: string, email = 'pedro@taqueria.mx') {
  return page.request.post('/api/v1/activate', {
    headers: deviceHeaders(),
    data: {
      email,
      code,
      device: { name: 'Teléfono nuevo', platform: 'android', appVersion: '0.1.0', osVersion: '15' },
    },
  });
}
