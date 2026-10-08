import { expect, type Page } from '@playwright/test';

/**
 * E-06's steps for empresa.spec.ts: a share subscription and its
 * beneficial-owner notice on the Agenda, the trademark registry with its
 * proof, and a CSD kept as serial and expiry.
 */
const hoy = (): string =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

function enDias(n: number): string {
  const d = new Date(`${hoy()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function suscribirAcciones(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'Registrar acciones' }).click();
  const forma = page.getByRole('region', { name: 'Registrar acciones' });
  await forma.getByText('Fundador 1', { exact: true }).click();
  await forma.getByRole('textbox', { name: 'Acciones', exact: true }).fill('6000');
  await forma.getByRole('button', { name: 'Registrar acciones' }).click();
  await expect(forma.getByRole('status')).toContainText('El aviso de beneficiario controlador');
  await expect(page.getByTestId('evento-acciones').first()).toContainText(
    'Suscripción: 6,000 acciones para el Fundador 1',
  );
  await page.getByRole('link', { name: 'Volver al libro' }).click();
  await expect(page.getByTestId('tenencia-1')).toContainText('6,000 acciones · 100 %');
  await expect(page.getByTestId('socios-acciones')).toContainText('Aviso pendiente · vence el');
}

export async function actualizarMarca(page: Page): Promise<void> {
  const fila = page.getByTestId('registro').filter({ hasText: 'Marca Xangarro' });
  await fila.getByRole('link', { name: 'Actualizar' }).click();
  await page.getByRole('textbox', { name: 'Estado', exact: true }).fill('En examen');
  await page
    .getByRole('textbox', { name: 'Número de trámite o registro', exact: true })
    .fill('3141592');
  await page.getByLabel('Documento').setInputFiles({
    name: 'solicitud-marca.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n% solicitud\n%%EOF\n'),
  });
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Registro actualizado.')).toBeVisible();
  await page.getByRole('link', { name: 'Volver al libro' }).click();
  await expect(fila).toContainText('En examen');
  await expect(fila).toContainText('IMPI · 3141592');
  await expect(fila.getByRole('link', { name: 'Ver' })).toBeVisible();
}

export async function guardarCsd(page: Page): Promise<void> {
  const firmas = page.getByRole('region', { name: 'Firmas y certificados' });
  await firmas
    .getByRole('textbox', { name: 'Número de serie', exact: true })
    .fill('00001000000512344821');
  await firmas.getByLabel('Vence').fill(enDias(41));
  await firmas.getByRole('button', { name: 'Guardar vigencia' }).click();
  await expect(firmas.getByTestId('certificado')).toContainText('CSD de MEXIA · serie 0000…4821');
  await expect(firmas.getByTestId('certificado')).toContainText('Vence en 41 días');
}
