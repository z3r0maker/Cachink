import { newUlid } from '@xangarro/domain';

import { expect, test, type Page } from './test';

import { puertaOperador } from './puerta-operador';
import { asTenant, BIZ } from './sync-phone';

test.beforeEach(() => test.setTimeout(120_000));

/** The amber row chips only (the KPI label and a row's detail say it too). */
const sinChips = (page: Page) => page.locator('span').filter({ hasText: /^Sin comprobante$/ });

/** Register one gasto through the modal; the three fields gate the save. */
async function registrar(
  page: Page,
  monto: string,
  concepto: string,
  categoria: string,
): Promise<void> {
  await page.getByRole('button', { name: 'Registrar gasto' }).first().click();
  const modal = page.getByRole('dialog', { name: 'Registrar gasto' });
  const save = modal.getByRole('button', { name: /^Registrar gasto de / });
  await modal.getByLabel('¿Cuánto?').fill(monto);
  await modal.getByLabel('¿Qué compraste?').fill(concepto);
  await modal.getByRole('button', { name: categoria, exact: true }).click();
  await save.click();
}

/**
 * O-23 (Track O, fase 12; real door O-38): Operador · Gastos. The register
 * starts empty — every figure here is one this test registered.
 */
test('an empty turno takes its first gasto, and the figures follow', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/gastos');
  await expect(page.getByText('Sin gastos en este turno')).toBeVisible();

  await registrar(page, '150', 'Gas para la parrilla', 'Insumos');
  await expect(page.getByRole('status')).toContainText(
    '−$150.00 · Gas para la parrilla · Insumos · sin comprobante.',
  );
  await expect(page.getByText('$150.00').first()).toBeVisible();
  await expect(sinChips(page).first()).toBeVisible();
});

test('registering needs amount, concept and category before the save', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/gastos');
  await page.getByRole('button', { name: 'Registrar gasto' }).first().click();
  const modal = page.getByRole('dialog', { name: 'Registrar gasto' });
  const save = modal.getByRole('button', { name: 'Registrar gasto de $120.00' });
  await modal.getByLabel('¿Cuánto?').fill('120');
  await modal.getByLabel('¿Qué compraste?').fill('Hielo');
  await expect(save).toBeDisabled();
  await modal.getByRole('button', { name: 'Insumos' }).click();
  await save.click();

  await expect(page.getByRole('status')).toContainText(
    '−$120.00 · Hielo · Insumos · sin comprobante.',
  );
  await expect(page.getByText('Hielo', { exact: true }).first()).toBeVisible();
});

test('a receipt photo is attached, and a tap removes it', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/gastos');
  await page.getByRole('button', { name: 'Registrar gasto' }).first().click();
  await page.getByLabel('Foto del comprobante').setInputFiles({
    name: 'ticket-14-52.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('jpg'),
  });
  const card = page.getByRole('button', { name: /Comprobante adjunto/ });
  await expect(card).toContainText('ticket-14-52.jpg · toca para quitarlo');
  await card.click();
  await expect(page.getByRole('button', { name: /Tomar foto del ticket/ })).toBeVisible();
});

test('search and category filters narrow the list', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/gastos');
  await registrar(page, '150', 'Gas para la parrilla', 'Insumos');
  await registrar(page, '80', 'Taxi por insumos', 'Transporte');

  await page.getByRole('button', { name: 'Transporte', exact: true }).click();
  await expect(page.getByText('Taxi por insumos').first()).toBeVisible();
  await expect(page.getByText('Gas para la parrilla', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Todos', exact: true }).click();
  await page.getByLabel('Buscar gasto').fill('taxi');
  await expect(page.getByText('Taxi por insumos').first()).toBeVisible();
  await page.getByLabel('Buscar gasto').fill('nada así');
  await expect(page.getByText('Sin resultados')).toBeVisible();
});

/** The device's local day, as the caja's `hoyLocal()` says it (same machine). */
function hoy(): { fecha: string; dia: number } {
  const d = new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  return {
    fecha: `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`,
    dia: d.getDate(),
  };
}

/**
 * A monthly recurring gasto due today, planted before the door so the
 * bootstrap carries it down; soft-deleted after the test so no other caja
 * lists it. Paying it once moves it a month on: off every list today.
 */
async function sembrarRecurrente(concepto: string): Promise<string> {
  const id = newUlid();
  const { fecha, dia } = hoy();
  await asTenant(BIZ, async (sql) => {
    await sql`
      INSERT INTO recurring_expenses (id, concepto, categoria, monto_centavos, proveedor,
                                      frecuencia, dia_del_mes, proximo_disparo, activo,
                                      business_id, device_id, created_at, updated_at)
      VALUES (${id}, ${concepto}, 'Servicios', 35000, 'Gas Express', 'mensual', ${dia},
              ${fecha}, true, ${BIZ}, '01HZ8XQN9GZJXV8AKQ5X0C7DEV', now(), now())`;
  });
  return id;
}

async function retirarRecurrente(id: string): Promise<void> {
  await asTenant(BIZ, async (sql) => {
    await sql`UPDATE recurring_expenses SET deleted_at = now(), updated_at = now() WHERE id = ${id}`;
  });
}

test('paying a due recurring gasto from Mi turno clears it from Pendientes and Para hoy', async ({
  page,
}) => {
  const concepto = `Gas del local ${Date.now().toString(36)}`;
  const id = await sembrarRecurrente(concepto);
  try {
    await puertaOperador(page);
    await page.goto('/operador/turno');
    await expect(page.getByText('Pendientes de registrar')).toBeVisible();
    await expect(page.getByText(concepto, { exact: true })).toBeVisible();
    await page.goto('/operador');
    await expect(
      page.getByText(`Registrar ${concepto.toLowerCase()}`, { exact: true }),
    ).toBeVisible();

    // «Registrar» opens Gastos' drawer filled from the template.
    await page.goto('/operador/turno');
    await page.locator(`a[href="/operador/gastos?recurrente=${id}"]`).click();
    const modal = page.getByRole('dialog', { name: 'Registrar gasto' });
    await expect(modal.getByLabel('¿Qué compraste?')).toHaveValue(concepto);
    await expect(modal.getByLabel('¿Cuánto?')).toHaveValue('350.00');
    await expect(modal.getByLabel('¿A quién le pagaste?')).toHaveValue('Gas Express');
    await expect(modal.getByRole('button', { name: 'Servicios', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // What was actually paid this time.
    await modal.getByLabel('¿Cuánto?').fill('365');
    await modal.getByRole('button', { name: 'Registrar gasto de $365.00' }).click();
    await expect(page.getByRole('status')).toContainText(`−$365.00 · ${concepto} · Servicios`);

    await page.reload();
    await expect(page.getByText(concepto, { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Registrar gasto' })).toHaveCount(0);

    await page.goto('/operador/turno');
    await expect(page.getByRole('heading', { level: 1, name: 'Mi turno' })).toBeVisible();
    await expect(page.locator(`a[href="/operador/gastos?recurrente=${id}"]`)).toHaveCount(0);
    await page.goto('/operador');
    await expect(page.getByText('Turno abierto desde las')).toBeVisible();
    await expect(
      page.getByText(`Registrar ${concepto.toLowerCase()}`, { exact: true }),
    ).toHaveCount(0);
  } finally {
    await retirarRecurrente(id);
  }
});
