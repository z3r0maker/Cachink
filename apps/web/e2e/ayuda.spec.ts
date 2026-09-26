import { expect, test } from './test';

import { filled, filledAll } from './interact';

/**
 * «Ayuda» (N-08's wiring): the form files a `kind=ayuda` inbox item through
 * the console's ingest endpoint, tagged with the member's business. The
 * outbox-style fallback logs when ADMIN_INGEST_* is unset, so this spec
 * asserts the user-facing contract (send → confirmation, validation, viewer
 * access); the ingest side is covered by the backoffice suite.
 */
test('any member can send a help request and see the confirmation', async ({ page }) => {
  await page.goto('/ayuda');
  await expect(
    page.getByRole('heading', { name: '¿En qué te echo la mano?', level: 1 }),
  ).toBeVisible();

  await filledAll([
    [page.getByPlaceholder('No entiendo el corte del día'), 'No veo el corte de ayer'],
    [
      page.getByPlaceholder('Paso a paso, qué esperabas y qué pasó…'),
      'Ayer cerré el corte pero hoy no aparece en el historial.',
    ],
  ]);
  await page.getByLabel('Es urgente').check();
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Listo. El equipo de Xangarro recibió tu mensaje.')).toBeVisible();

  // The form clears; a second send starts empty.
  await expect(page.getByPlaceholder('No entiendo el corte del día')).toHaveValue('');
});

test('an empty message is refused with the reason, nothing sent', async ({ page }) => {
  await page.goto('/ayuda');
  // Filled the same careful way: a fill lost to hydration would make the screen
  // complain about the asunto instead, and the test would read as a pass on the
  // wrong claim.
  await filled(page.getByPlaceholder('No entiendo el corte del día'), 'Solo asunto');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Escribe tu mensaje (hasta 4000 caracteres).')).toBeVisible();
});

test('the sidebar footer links to Ayuda from anywhere', async ({ page }) => {
  await page.goto('/');
  // ADR-107: the footer is Don Cuentas's «¿Atorado? Te echo la mano» card.
  await expect(
    page
      .locator('aside')
      .first()
      .getByRole('link', { name: /¿Atorado\?/ }),
  ).toHaveAttribute('href', '/ayuda');
  // And the header's help button reaches the same page from every screen.
  await expect(page.locator('header').getByRole('link', { name: 'Ayuda' })).toHaveAttribute(
    'href',
    '/ayuda',
  );
});

test('the search narrows answers, and a guide walks through its steps', async ({ page }) => {
  await page.goto('/ayuda');
  await filled(page.getByRole('searchbox', { name: 'Busca tu duda' }), 'vincular');
  const pregunta = page.getByRole('button', { name: '¿Cómo conecto la caja de quien cobra?' });
  await expect(pregunta).toBeVisible();
  await expect(page.getByRole('button', { name: '¿Cómo cambio de plan?' })).toHaveCount(0);
  await pregunta.click();
  await expect(page.getByRole('link', { name: /Ir a Cajas/ })).toHaveAttribute(
    'href',
    '/equipo?tab=cajas',
  );

  // The guides answer to their own words; an empty search lists them all.
  await filled(page.getByRole('searchbox', { name: 'Busca tu duda' }), '');
  await page.getByRole('button', { name: /Conecta la caja de quien cobra/ }).click();
  const guia = page.getByRole('dialog', { name: 'Conecta la caja de quien cobra' });
  await expect(guia.getByText('Paso 1 de 4')).toBeVisible();
  for (let i = 0; i < 3; i += 1) await guia.getByRole('button', { name: 'Siguiente' }).click();
  await expect(guia.getByRole('link', { name: 'Ir a Cajas' })).toHaveAttribute(
    'href',
    '/equipo?tab=cajas',
  );
});
