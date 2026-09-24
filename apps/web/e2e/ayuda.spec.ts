import { expect, test } from './test';

/**
 * «Ayuda» (N-08's wiring): the form files a `kind=ayuda` inbox item through
 * the console's ingest endpoint, tagged with the member's business. The
 * outbox-style fallback logs when ADMIN_INGEST_* is unset, so this spec
 * asserts the user-facing contract (send → confirmation, validation, viewer
 * access); the ingest side is covered by the backoffice suite.
 */
test('any member can send a help request and see the confirmation', async ({ page }) => {
  await page.goto('/ayuda');
  await expect(page.getByRole('heading', { name: 'Ayuda', level: 1 })).toBeVisible();

  await page.getByPlaceholder('No entiendo el corte del día').fill('No veo el corte de ayer');
  await page
    .getByPlaceholder('Paso a paso, qué esperabas y qué pasó…')
    .fill('Ayer cerré el corte pero hoy no aparece en el historial.');
  await page.getByLabel('Es urgente').check();
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Listo. El equipo de Xangarro recibió tu mensaje.')).toBeVisible();

  // The form clears; a second send starts empty.
  await expect(page.getByPlaceholder('No entiendo el corte del día')).toHaveValue('');
});

test('an empty message is refused with the reason, nothing sent', async ({ page }) => {
  await page.goto('/ayuda');
  await page.getByPlaceholder('No entiendo el corte del día').fill('Solo asunto');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Escribe tu mensaje (hasta 4000 caracteres).')).toBeVisible();
});

test('the sidebar footer links to Ayuda from anywhere', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('aside').getByRole('link', { name: 'Ayuda' })).toHaveAttribute(
    'href',
    '/ayuda',
  );
});
