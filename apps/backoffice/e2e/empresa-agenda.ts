import { expect, type Page } from '@playwright/test';

/**
 * E-04's steps for empresa.spec.ts: the SAT registration and a dated one-off.
 * The monthly declaration is filed from Impuestos (`empresa-impuestos.ts`).
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
