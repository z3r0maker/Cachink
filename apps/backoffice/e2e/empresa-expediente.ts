import { expect, type Page } from '@playwright/test';

import { E2E_CONCEPTO } from './founder-fixture';

/**
 * E-05's steps for empresa.spec.ts: file a paper no obligation asked for,
 * supersede it with a new version and keep both, and attach a proof to a
 * movement that then shows in «Comprobantes».
 */
const pdf = (texto: string) => ({
  name: `${texto}.pdf`,
  mimeType: 'application/pdf',
  buffer: Buffer.from(`%PDF-1.4\n% ${texto}\n%%EOF\n`),
});

export async function subirActa(page: Page): Promise<void> {
  await page.getByRole('link', { name: '+ Subir documentos' }).click();
  await page.getByRole('combobox', { name: 'Carpeta' }).selectOption('constitucion');
  await page
    .getByRole('textbox', { name: 'Nombre del documento', exact: true })
    .fill('E2E Acta constitutiva');
  await page.getByRole('textbox', { name: 'Periodo', exact: true }).fill('2026');
  await page.getByLabel('Archivo').setInputFiles(pdf('acta-v1'));
  await page.getByRole('button', { name: 'Subir documento' }).click();

  await expect(page).toHaveURL(/carpeta=constitucion&doc=/);
  const fila = page
    .getByTestId('documento-expediente')
    .filter({ hasText: 'E2E Acta constitutiva' });
  await expect(fila).toContainText('PDF · v1');
  const historial = page.getByTestId('historial');
  await expect(historial).toContainText('v1 · subida el');
  await expect(historial).toContainText('por Fundador 1 · vigente');

  await historial.getByLabel('Archivo').setInputFiles(pdf('acta-v2'));
  await historial.getByRole('button', { name: 'Subir nueva versión' }).click();
  await expect(historial).toContainText('reemplazada por v2');
  await expect(historial).toContainText('v2 · subida el');
  await expect(fila).toContainText('PDF · v2');
  // Two versions, one document: the folder counts it once.
  await expect(page.getByRole('link', { name: /Constitución/ })).toContainText('1');
}

export async function adjuntarComprobante(page: Page): Promise<void> {
  await page.goto('/empresa/movimientos');
  await page
    .getByTestId('movimiento')
    .filter({ hasText: E2E_CONCEPTO })
    .last()
    .getByRole('link')
    .click();
  await page.getByLabel('Archivo').setInputFiles(pdf('factura-vercel'));
  await page.getByRole('button', { name: 'Adjuntar comprobante' }).click();
  await expect(
    page.getByTestId('documento').filter({ hasText: 'factura-vercel.pdf' }),
  ).toBeVisible();

  await page.goto('/empresa/expediente?carpeta=comprobantes');
  await expect(
    page.getByTestId('documento-expediente').filter({ hasText: `Comprobante · ${E2E_CONCEPTO}` }),
  ).toContainText(`Movimiento · ${E2E_CONCEPTO}`);
}
