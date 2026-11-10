import { expect, test } from './test';
import { plazosArco } from '@xangarro/domain';

import { latestMailTo } from './outbox';
import { stamp } from './tenant';

/**
 * N-34: the public ARCO form. No account needed; a valid request gets a folio
 * and the legal deadline (20 días hábiles), and an invalid one says which
 * field is wrong. The titular also gets the acuse by email (Reglamento
 * art. 95). The item it files is checked in the console's own tests; here the
 * inbox is the log fallback.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test('anyone can file an ARCO request and is told the folio and the deadline, on screen and by email', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'one public form, one run');
  await page.goto('/privacidad/solicitud');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('solicitud ARCO');

  await page.getByLabel('Nombre completo').fill('Ana López');
  await page.getByLabel('Correo para la respuesta').fill('ana');
  await page.getByRole('radio', { name: /Cancelación/ }).click();
  await page
    .getByLabel('Qué datos y qué necesitas')
    .fill('Quiero que borren mi cuenta y mis datos.');
  await page.getByRole('button', { name: 'Enviar solicitud' }).click();
  await expect(page.getByText('Escribe un correo válido')).toBeVisible();

  const correo = `ana-${stamp()}@example.mx`;
  await page.getByLabel('Correo para la respuesta').fill(correo);
  await page.getByRole('button', { name: 'Enviar solicitud' }).click();
  await expect(page.getByTestId('arco-recibida')).toBeVisible();
  await expect(page.getByTestId('arco-folio')).toHaveText(/^ARCO-[0-9A-Z]{26}$/);

  const { responderA } = plazosArco(new Date());
  const dia = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${responderA}T12:00:00Z`),
  );
  await expect(page.getByTestId('arco-plazo')).toHaveText(dia);

  const folio = (await page.getByTestId('arco-folio').textContent()) ?? '——';
  await expect.poll(() => latestMailTo(correo)).toContain(folio);
  const acuse = await latestMailTo(correo);
  expect(acuse).toContain('Hola, Ana López');
  expect(acuse).toContain('Cancelación de tus datos');
  expect(acuse).toContain(dia);
  expect(acuse).toContain('https://xangarro.mx/privacidad/');
});
