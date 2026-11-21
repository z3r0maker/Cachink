import { expect, test, type Page } from './test';

import { itemsFiledFor } from './ingest';
import { clickUntil, filled, filledAll } from './interact';
import { SHARED_BIZ } from './shared-tenant';
import { stamp } from './tenant';

/**
 * «Ayuda» (N-08's wiring; P-48): «Escríbele al equipo» is a page that asks
 * first what the person needs. This file is the question path, «Tengo una
 * duda»: it files a `kind=ayuda` inbox item through the console's ingest
 * endpoint, tagged with the member's business, and the spec reads that item
 * back from the ingest stand-in (`./ingest.ts`). The report path, «Algo no
 * funciona», is `ayuda-falla.spec.ts`.
 */
async function abrirDuda(page: Page): Promise<void> {
  await page.goto('/ayuda');
  await expect(
    page.getByRole('heading', { name: '¿En qué te echo la mano?', level: 1 }),
  ).toBeVisible();
  // The form is a page of its own, for when the answers didn't help.
  await page.getByRole('link', { name: 'Escribirle al equipo' }).click();
  await expect(page.getByRole('heading', { name: 'Escríbele al equipo', level: 1 })).toBeVisible();
  // It asks first; nothing is chosen, so there is nothing to send yet.
  await expect(page.getByRole('button', { name: 'Enviar' })).toHaveCount(0);
  await clickUntil(
    page.getByRole('radio', { name: /Tengo una duda/ }),
    page.getByPlaceholder('No entiendo el corte del día'),
  );
}

test('any member can send a question, sees «Enviado», and the item reaches the inbox', async ({
  page,
}) => {
  // Unique among every worker's sends: the item is found by it.
  const asunto = `No veo el corte de ayer ${stamp()}`;
  await abrirDuda(page);
  await filledAll([
    [page.getByPlaceholder('No entiendo el corte del día'), asunto],
    [
      page.getByPlaceholder('Cuéntanos tu duda'),
      'Ayer cerré el corte pero hoy no aparece en el historial.',
    ],
  ]);
  await page.getByLabel('Es urgente').check();
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByRole('heading', { name: 'Gracias, Pedro. Ya nos llegó.' })).toBeVisible();
  await expect(page.getByText(/^Te contestamos por correo a \S+@\S+\. Mientras,/)).toBeVisible();

  const item = (await itemsFiledFor(SHARED_BIZ)).find((i) => i.title === asunto);
  expect(item).toMatchObject({
    kind: 'ayuda',
    urgent: true,
    body: 'Ayer cerré el corte pero hoy no aparece en el historial.',
    source: 'portal-ayuda',
  });

  // «Volver a Ayuda» is the way back.
  await page.getByRole('link', { name: 'Volver a Ayuda' }).click();
  await expect(
    page.getByRole('heading', { name: '¿En qué te echo la mano?', level: 1 }),
  ).toBeVisible();
});

test('an empty message is refused with the reason, nothing sent', async ({ page }) => {
  await abrirDuda(page);
  // Filled the careful way: a fill lost to hydration would make the screen
  // complain about the asunto instead, and the test would read as a pass on the
  // wrong claim.
  await filled(page.getByPlaceholder('No entiendo el corte del día'), 'Solo asunto');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Escribe tu mensaje (hasta 4000 caracteres).')).toBeVisible();
  // The form is still there, with what was typed.
  await expect(page.getByPlaceholder('No entiendo el corte del día')).toHaveValue('Solo asunto');
});

test('«Cancelar» goes back to Ayuda without sending', async ({ page }) => {
  await abrirDuda(page);
  await page.getByRole('link', { name: 'Cancelar' }).click();
  await expect(
    page.getByRole('heading', { name: '¿En qué te echo la mano?', level: 1 }),
  ).toBeVisible();
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

test('the most asked come first; a topic shows all of its answers', async ({ page }) => {
  await page.goto('/ayuda');
  await expect(page.getByRole('heading', { name: 'Lo más preguntado' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Ver las \d+ preguntas$/ })).toBeVisible();
  await page
    .getByRole('group', { name: 'Temas' })
    .getByRole('button', { name: 'Tu plan y pagos' })
    .click();
  await expect(page.getByRole('heading', { name: 'Tu plan y pagos' })).toBeVisible();
  await expect(page.getByRole('button', { name: '¿Cómo cambio de plan?' })).toBeVisible();
  await expect(page.getByRole('button', { name: '¿Qué es el corte del turno?' })).toHaveCount(0);
});
