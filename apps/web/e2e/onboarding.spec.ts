import { expect, test, type Page } from '@playwright/test';

/**
 * Signup → "Platícanos de ti" → "Tu plan ideal" → "¿Cómo empiezo?" → re-run
 * (P-03, P-04, N-12 … N-15), as a brand-new visitor: a **fresh context**, no
 * cookie from `auth.setup.ts`. Each run and each viewport signs up its own
 * address, so reruns never collide on `auth.users.email`.
 */
test.use({ storageState: { cookies: [], origins: [] } });

async function next(page: Page, label = 'Siguiente') {
  await page.getByRole('button', { name: label, exact: true }).click();
}

async function answerWizard(page: Page) {
  await expect(page.getByText('Paso 1 de 8')).toBeVisible();
  await expect(page.getByTestId('wizard-nombre')).toHaveValue('Tortas Lupita');
  await page.getByRole('radio', { name: /Servicios/ }).click();
  await next(page);
  await expect(page.getByText('Paso 2 de 8')).toBeVisible();
  await page.getByRole('button', { name: /^Efectivo/ }).click();
  await page.getByRole('button', { name: /^Crédito/ }).click();
  await next(page);
  await page.getByRole('radio', { name: /Sí, llevo inventario/ }).click();
  await next(page);
  await next(page, 'Omitir');
  await page.getByRole('radio', { name: /Sí, vendo a crédito/ }).click();
  await next(page);
  await next(page, 'Omitir');
  await next(page, 'Omitir');
  await expect(page.getByText('Paso 8 de 8')).toBeVisible();
  await page.getByRole('radio', { name: /Dos personas/ }).click();
  await next(page, 'Terminar');
}

test('signup refuses to proceed until the aviso is accepted', async ({ page }) => {
  await page.goto('/signup');
  await expect(page.getByTestId('signup-aviso')).toContainText('Aviso de privacidad simplificado');
  await expect(page.getByTestId('signup-acepto')).not.toBeChecked();
  await expect(page.getByTestId('signup-novedades')).toBeChecked();
  await page.getByTestId('signup-nombre').fill('Tortas Lupita');
  await page.getByTestId('signup-email').fill(`aviso+${Date.now()}@ejemplo.mx`);
  await page.getByTestId('signup-password').fill('tortas-2026');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByText(/acepta el aviso de privacidad/)).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
});

test('a new owner signs up, answers the wizard, stays free and lands on the checklist', async ({
  page,
}, info) => {
  const email = `lupita+${Date.now()}-${info.project.name}@ejemplo.mx`;
  await page.goto('/signup?plan=xangarro');
  await page.getByTestId('signup-nombre').fill('Tortas Lupita');
  await page.getByTestId('signup-email').fill(email);
  await page.getByTestId('signup-password').fill('tortas-2026');
  await page.getByTestId('signup-acepto').check();
  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  await expect(page.getByRole('heading', { name: 'Platícanos de ti' })).toBeVisible();
  await answerWizard(page);

  await expect(
    page.getByRole('heading', {
      name: 'Tu plan ideal: Xangarro — porque manejas inventario, vendes a crédito y cobran varias personas',
    }),
  ).toBeVisible();
  await expect(page.getByTestId('plan-price')).toHaveText('$199 al mes + IVA');
  await page.getByRole('switch', { name: 'Pago anual' }).click();
  await expect(page.getByTestId('plan-price')).toHaveText('$1,990 al año + IVA');
  await expect(page.getByText('Incluido en Xangarro').first()).toBeVisible();

  await page.getByRole('button', { name: 'Probar 14 días' }).click();
  await expect(page.getByText('Pronto podrás activar tu prueba')).toBeVisible();

  await page.getByRole('button', { name: 'Seguir gratis' }).click();
  await expect(page.getByRole('heading', { name: '¿Cómo empiezo?' })).toBeVisible();
  await expect(page.getByText('0 de 6 listos')).toBeVisible();

  // N-15: re-running with the same answers changes nothing.
  await page.getByRole('link', { name: 'Volver a configurar mi negocio' }).click();
  await expect(page.getByText('Paso 1 de 8')).toBeVisible();
  for (let i = 0; i < 7; i += 1) await next(page);
  await next(page, 'Terminar');
  await expect(page.getByRole('heading', { name: 'No hay cambios' })).toBeVisible();
});

test('signup refuses a short password without creating anything', async ({ page }) => {
  await page.goto('/signup');
  await page.getByTestId('signup-nombre').fill('Tortas Lupita');
  await page.getByTestId('signup-email').fill(`corta+${Date.now()}@ejemplo.mx`);
  await page.getByTestId('signup-password').fill('corta');
  await page.getByTestId('signup-acepto').check();
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByText(/mínimo 8 caracteres/)).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
});
