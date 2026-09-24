import { expect, test } from './test';

import { puertaOperador } from './puerta-operador';

/**
 * O-16 (Track O, fase 10): Operador · Avisos — the owner's messages, the
 * register's own notices, and the corte answered in place.
 */
test.beforeEach(() => test.setTimeout(120_000));

test('the corte is answered in place with a suggested phrase', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/avisos');
  const corte = page.locator('article', { hasText: 'Aclara el corte del 13 de mayo' });
  const enviar = corte.getByRole('button', { name: 'Enviar respuesta' });
  await expect(enviar).toBeDisabled();

  await corte.getByRole('button', { name: 'Cobré y no capturé' }).click();
  await enviar.click();

  await expect(page.getByRole('status')).toContainText(
    'Pedro ya tiene tu respuesta sobre el corte del 13 de mayo.',
  );
  await expect(corte.getByText('«Cobré y no capturé»')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('status')).toBeHidden();
});

test('tabs split the owner from the register, and «Marcar todo» clears the counts', async ({
  page,
}) => {
  await puertaOperador(page);
  await page.goto('/operador/avisos');
  const caja = page.getByRole('tab', { name: /De tu caja/ });
  await caja.click();
  await expect(caja).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('3 registros siguen sin enviarse')).toBeVisible();

  await page.getByRole('button', { name: 'Marcar todo como leído' }).click();
  await expect(page.getByText('Sin leer')).toHaveCount(0);
});

test('Avisos trades the business pill for a way back to Inicio', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/avisos');
  await page.locator('header').getByRole('link', { name: 'Inicio' }).click();
  await expect(page).toHaveURL(/\/operador$/);
});
