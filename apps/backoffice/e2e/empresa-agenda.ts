import { expect, type Page } from '@playwright/test';

/**
 * E-04's steps for empresa.spec.ts: the SAT registration, filing an obligation
 * with its acuse, closing it «sin pago», and a dated one-off.
 */
const hoy = (): string =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

/** The first day of the month two months back: its ISR is already late. */
export function inscripcionPasada(): { readonly fecha: string; readonly mes: string } {
  const [y, m] = hoy().split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 3, 1));
  const fecha = d.toISOString().slice(0, 10);
  const mes = new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
  return { fecha, mes };
}

export async function fijarInscripcion(page: Page, fecha: string): Promise<void> {
  await expect(
    page.getByRole('heading', { name: '¿Cuándo se inscribió MEXIA al RFC?' }),
  ).toBeVisible();
  await page.getByLabel('Fecha de inscripción al RFC').fill(fecha);
  await page.getByRole('button', { name: 'Calcular la agenda' }).click();
  await expect(page.getByRole('heading', { name: 'Vencidas' })).toBeVisible();
}

const PDF = Buffer.from('%PDF-1.4\n% acuse de prueba\n%%EOF\n');

export async function presentarConAcuse(page: Page): Promise<void> {
  const presentar = page.getByRole('button', { name: 'Marcar presentada' });
  await expect(presentar).toBeDisabled();
  await expect(page.getByText('Para marcarla presentada, adjunta el acuse.')).toBeVisible();

  await page.getByText('Acuse', { exact: true }).click();
  await page
    .getByLabel('Archivo')
    .setInputFiles({ name: 'acuse-e2e.pdf', mimeType: 'application/pdf', buffer: PDF });
  await page.getByRole('button', { name: 'Subir documento' }).click();
  const doc = page.getByTestId('documento').filter({ hasText: 'acuse-e2e.pdf' });
  await expect(doc).toContainText('Acuse');

  // «Ver» serves the very bytes that were kept.
  const href = await doc.getByRole('link', { name: 'Ver' }).getAttribute('href');
  const res = await page.request.get(href ?? '');
  expect(res.status()).toBe(200);
  expect((await res.body()).toString('utf8')).toContain('acuse de prueba');

  await presentar.click();
  await expect(page.getByTestId('estado')).toHaveText('Presentada');
  await expect(page.getByRole('button', { name: 'Marcar pagada' })).toBeDisabled();
  await page.getByRole('button', { name: 'No hubo pago' }).click();
  await expect(page.getByTestId('estado')).toHaveText('Sin pago');
}

export async function agregarCsd(page: Page): Promise<void> {
  const d = new Date(`${hoy()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 40);
  await page.getByText('CSD', { exact: true }).click();
  await page.getByLabel('Fecha', { exact: true }).fill(d.toISOString().slice(0, 10));
  await page.getByRole('button', { name: 'Agregar a la agenda' }).click();
  await expect(
    page.getByTestId('obligacion').filter({ hasText: 'Renovación del CSD' }),
  ).toBeVisible();
}
