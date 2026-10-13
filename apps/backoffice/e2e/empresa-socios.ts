import { expect, type Page } from '@playwright/test';

/**
 * E-03's steps for empresa.spec.ts: funding by halves, partner money through
 * Registrar, and the last quarter's money close. Kept apart so the spec reads
 * as the story and stays under the size budget.
 */
const hoy = (): string =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

function enDias(n: number): string {
  const d = new Date(`${hoy()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** The middle of the quarter before today's, and its name («3T 2026»). */
export function trimestrePasado(): { readonly fecha: string; readonly nombre: string } {
  const [y, mes] = hoy().split('-').map(Number) as [number, number];
  const q = Math.ceil(mes / 3);
  const [year, prev] = q === 1 ? [y - 1, 4] : [y, q - 1];
  const month = String(prev * 3 - 1).padStart(2, '0');
  return { fecha: `${year}-${month}-15`, nombre: `${prev}T ${year}` };
}

export async function pedirYPagarFondeo(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Sin fondeo pendiente' })).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Para qué es', exact: true })
    .fill('E2E Fondeo de octubre');
  await page.getByRole('textbox', { name: 'Monto total', exact: true }).fill('20000');
  await page.getByLabel('Fecha límite').fill(enDias(7));
  await page.getByRole('button', { name: 'Pedir fondeo por mitades' }).click();

  await expect(
    page.getByRole('heading', { name: 'E2E Fondeo de octubre: $20,000.00' }),
  ).toBeVisible();
  await expect(page.getByTestId('mitad-1')).toContainText('faltan 7 días');
  await page.getByRole('button', { name: 'Registrar mitad de F1' }).click();
  await expect(page.getByTestId('mitad-1')).toContainText('Pagado');
  await expect(page.getByTestId('mitad-2')).toContainText('Pendiente');
  await expect(page.getByTestId('cuenta-1')).toContainText('Fondeo por mitades$10,000.00');
}

export async function registrarDineroDeSocio(
  page: Page,
  dinero: {
    readonly concepto: string;
    readonly clase: string;
    readonly monto: string;
    readonly fecha: string;
  },
): Promise<void> {
  await page.getByRole('link', { name: '+ Movimiento de socios' }).click();
  await page.getByRole('textbox', { name: 'Concepto', exact: true }).fill(dinero.concepto);
  await page.getByLabel('Fecha de pago').fill(dinero.fecha);
  await page.getByText('Fundador 1', { exact: true }).click();
  await page.getByText(dinero.clase, { exact: true }).click();
  await page.getByRole('textbox', { name: 'Monto', exact: true }).fill(dinero.monto);
  await page.getByRole('button', { name: 'Registrar dinero de socio' }).click();
}

export async function cerrarElTrimestre(page: Page, nombre: string): Promise<void> {
  await page
    .getByRole('textbox', { name: 'Valor de sus entregables terminados', exact: true })
    .fill('20000');
  await expect(page.getByTestId('vista-reparto')).toContainText(
    'De $30,000.00, $20,000.00 cuentan para la bolsa y $10,000.00 quedan como préstamo.',
  );
  await page.getByRole('button', { name: `Cerrar el dinero del ${nombre}` }).click();
  await expect(page.getByTestId('cerrado-1')).toContainText(
    '$20,000.00 cuentan para la bolsa y $10,000.00 quedaron como préstamo',
  );
}
