import { expect, test, type Page } from './test';

import { cobrarCon } from './cobrar';
import { clickUntil } from './interact';
import { puertaOperador } from './puerta-operador';
import { asTenant, BIZ } from './sync-phone';

test.beforeEach(() => test.setTimeout(120_000));

/** Below 1240 px the ticket is a sheet opened from the yellow «Cobrar» bar. */
async function ticket(page: Page) {
  const panel = page.getByRole('complementary', { name: 'Ticket' });
  if ((page.viewportSize()?.width ?? 1440) < 1240) {
    await page.getByRole('button', { name: 'Cobrar, ver el ticket' }).click();
  }
  return panel;
}

/**
 * O-20 (Track O, fase 11; real door O-38) — the compuerta: a cash sale with
 * change and a fiado with client, captured complete against the register's
 * own catalogue; the total and COBRAR never get lost however long the ticket.
 * The register starts empty — every line here was tapped by this test.
 */
test('a cash sale shows the change and starts a new ticket', async ({ page }) => {
  await puertaOperador(page, [{ nombre: 'Suadero del día', precioCentavos: 2500, sku: 'OPCAJA1' }]);
  await page.goto('/operador/caja');
  const suadero = page.getByRole('button', { name: /Suadero del día/ }).first();
  await suadero.click();
  await suadero.click();
  const panel = await ticket(page);
  await expect(panel.getByText('$50.00').first()).toBeVisible();

  const cobro = await cobrarCon(page, 'Efectivo');
  await cobro.getByLabel('Con cuánto paga').fill('60');
  await cobro.getByText('$10.00').first().isVisible();
  await cobro.getByRole('button', { name: 'Registrar venta' }).click();

  const card = page.getByRole('status');
  await expect(card).toContainText('Venta registrada · $50.00');
  await expect(page.locator('aside[aria-label=Ticket]').getByText('Ticket vacío')).toBeAttached();
});

test('short cash keeps «Registrar venta» disabled and says what is missing', async ({ page }) => {
  await puertaOperador(page, [{ nombre: 'Suadero del día', precioCentavos: 2500, sku: 'OPCAJA1' }]);
  await page.goto('/operador/caja');
  await page
    .getByRole('button', { name: /Quesadilla/ })
    .first()
    .click();
  const cobro = await cobrarCon(page, 'Efectivo');
  await cobro.getByLabel('Con cuánto paga').fill('20');
  await expect(cobro.getByText('Falta')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Registrar venta' })).toBeDisabled();
});

test('a credit sale needs a client, then adds to their balance', async ({ page }) => {
  await puertaOperador(page, [{ nombre: 'Suadero del día', precioCentavos: 6000, sku: 'OPCAJA1' }]);
  await page.goto('/operador/caja');
  // Its own seeded line, like every other test here. Tapping the shared
  // «Gringa» broke the moment `chaos-2` renamed GRI-001 to its SQL payload —
  // and the file's own rule is that every line was tapped by this test.
  await page
    .getByRole('button', { name: /Suadero del día/ })
    .first()
    .click();
  const cobro = await cobrarCon(page, 'Fiado');
  await expect(cobro.getByRole('button', { name: 'Elige a quién se lo anotas' })).toBeDisabled();
  await cobro
    .getByRole('radio', { name: /Raúl Contreras/ })
    .first()
    .click();
  await expect(cobro.getByText(/^Quedaría debiendo \$/)).toBeVisible();
  await cobro.getByRole('button', { name: /^Anotar \$[\d,.]+ a Raúl Contreras$/ }).click();
  await expect(page.getByRole('status')).toContainText('Se sumó al saldo de Raúl Contreras.');
});

test('a long ticket never pushes the total or COBRAR out of view', async ({ page }) => {
  await puertaOperador(page, [{ nombre: 'Suadero del día', precioCentavos: 2500, sku: 'OPCAJA1' }]);
  await page.goto('/operador/caja');
  const suadero = page.getByRole('button', { name: /Suadero del día/ }).first();
  for (let i = 0; i < 12; i += 1) {
    await suadero.click();
  }
  const panel = await ticket(page);
  await expect(panel.getByRole('button', { name: 'Cobrar', exact: true })).toBeInViewport();
  await expect(panel.getByText('Total', { exact: true })).toBeInViewport();
});

test('«Deshacer» brings the sold lines back', async ({ page }) => {
  await puertaOperador(page, [{ nombre: 'Suadero del día', precioCentavos: 6000, sku: 'OPCAJA1' }]);
  await page.goto('/operador/caja');
  await page
    .getByRole('button', { name: /Suadero del día/ })
    .first()
    .click();
  await cobrarCon(page, 'Tarjeta');
  await page.getByRole('status').getByRole('button', { name: 'Deshacer' }).click();
  await expect(
    page.locator('aside[aria-label=Ticket]').getByText('Suadero del día'),
  ).toBeAttached();
});

/**
 * J5-04: a Transferencia sale registers at once, like Tarjeta, and reaches the
 * owner's ledger with its method — the push, the server's accept, the
 * Movimientos row and its drawer, not just the register's toast.
 */
test('a Transferencia sale reaches the owner’s Movimientos as Transferencia', async ({ page }) => {
  const nombre = 'Agua de jamaica transferida';
  await puertaOperador(page, [{ nombre, precioCentavos: 3700, sku: 'OPCAJA2' }]);
  await page.goto('/operador/caja');
  await page
    .getByRole('button', { name: new RegExp(nombre) })
    .first()
    .click();
  const antes = await ticketsCon(nombre);
  await cobrarCon(page, 'Transferencia');
  await expect(page.getByRole('status')).toContainText('Venta registrada · $37.00');

  // The outbox flushes on its own: the ticket is in Postgres, as Transferencia.
  await expect
    .poll(async () => (await ticketsCon(nombre)).length, { timeout: 20_000 })
    .toBe(antes.length + 1);
  const nuevo = (await ticketsCon(nombre)).find((t) => !antes.some((a) => a.id === t.id));
  expect(nuevo?.metodo).toBe('Transferencia');

  // The register dates the sale by the device's own clock, not the portal's
  // pinned day, so the owner looks it up by name over the whole history.
  await page.goto(`/movimientos?rango=personalizado&q=${encodeURIComponent(nombre)}`);
  const fila = page.locator('main tbody tr').filter({ hasText: nombre }).first();
  await expect(fila).toContainText('Transferencia');
  await expect(fila).toContainText('+$37.00');
  const cajon = page.getByRole('dialog');
  await clickUntil(fila, cajon);
  await expect(cajon.getByText('Cómo pagaron')).toBeVisible();
  await expect(cajon.getByText('Transferencia').first()).toBeVisible();
});

/** The tickets whose line names `concepto`, with their method. */
function ticketsCon(concepto: string): Promise<{ id: string; metodo: string }[]> {
  return asTenant(BIZ, async (sql) => {
    const rows = await sql<{ id: string; metodo: string }[]>`
      SELECT t.id, t.metodo FROM tickets t
      WHERE EXISTS (SELECT 1 FROM sales s WHERE s.ticket_id = t.id
                    AND s.concepto LIKE ${`%${concepto}%`})`;
    return [...rows];
  });
}
