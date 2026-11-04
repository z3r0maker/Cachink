import { expect, type Page } from '@playwright/test';
import { RegistrarMovimientoUseCase } from '@xangarro/application/corp';
import { createCorpDb, createCorpLedgerRepository } from '@xangarro/data-corp';

/**
 * E-12's steps for empresa.spec.ts. Income has no capture screen until E-10,
 * so the month's cobros go in through the same use case the console runs;
 * the expense goes in through Registrar, as a founder does. A month of its
 * own in the past keeps the figures this suite's alone; every concept starts
 * with «E2E», so `clearLedgerFixture` takes them away.
 */
export const MES = '2024-03';
export const MES_PREVIO = '2024-02';

export async function sembrarCobros(): Promise<void> {
  const db = createCorpDb(process.env.CORP_DATABASE_URL ?? '', 1);
  const registrar = new RegistrarMovimientoUseCase(createCorpLedgerRepository(db));
  for (const [fecha, subtotal] of [
    [`${MES_PREVIO}-05`, 8_000_00n],
    [`${MES}-05`, 10_000_00n],
  ] as const) {
    await registrar.execute({
      fecha,
      projectId: 'xangarro',
      concepto: `E2E Cobro ${fecha}`,
      contraparte: null,
      founderId: 'e2e-resultados',
      source: 'manual',
      sourceRef: `e2e-resultados-${fecha}`,
      usd: null,
      deducible: null,
      movement: { kind: 'cobro', subtotal, iva: (subtotal * 16n) / 100n, destino: 'bancos' },
    });
  }
}

/** Registrar: the contador's fee of the month, $3,000 with no IVA, Administración. */
export async function registrarHonorarios(page: Page): Promise<void> {
  await page.goto('/empresa/movimientos/registrar');
  await expect(page.getByRole('heading', { name: 'Registrar', level: 1 })).toBeVisible();
  await page.getByRole('textbox', { name: 'Concepto', exact: true }).fill('E2E Contador de marzo');
  await page.getByRole('textbox', { name: 'Proveedor', exact: true }).fill('Contadora E2E');
  await page.getByRole('textbox', { name: 'Monto pagado', exact: true }).fill('3000');
  await page.getByLabel('Fecha de pago').fill(`${MES}-20`);
  await page.getByText('Administración', { exact: true }).click();
  await page.getByRole('button', { name: 'Registrar gasto' }).click();
  await expect(page).toHaveURL(new RegExp(`/empresa/movimientos\\?mes=${MES}$`));
}

export const renglon = (page: Page, id: string) => page.getByTestId(`estado-${id}`);
