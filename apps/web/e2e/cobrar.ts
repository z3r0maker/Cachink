import type { Locator, Page } from '@playwright/test';

export type MetodoCobro = 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Fiado';

/**
 * The caja's cobro contract (El Mostrador): the method is picked in the
 * ticket, where the total is, then «Cobrar». Efectivo and Fiado open the
 * ticket's own second step (region «Cobro»); Tarjeta and Transferencia
 * register the sale right away. Below 1240 px the ticket is a sheet opened
 * from the yellow bar first.
 */
export async function cobrarCon(page: Page, metodo: MetodoCobro): Promise<Locator> {
  if ((page.viewportSize()?.width ?? 1440) < 1240) {
    const bar = page.getByRole('button', { name: 'Cobrar, ver el ticket' });
    if (await bar.isVisible()) await bar.click();
  }
  const ticket = page.getByRole('complementary', { name: 'Ticket' });
  await ticket.getByRole('radio', { name: metodo, exact: true }).click();
  await ticket.getByRole('button', { name: 'Cobrar', exact: true }).click();
  return page.getByRole('region', { name: 'Cobro' });
}

/** A cash sale paid with `recibido` pesos. */
export async function venderEfectivo(page: Page, recibido: string): Promise<void> {
  const cobro = await cobrarCon(page, 'Efectivo');
  await cobro.getByLabel('Con cuánto paga').fill(recibido);
  await cobro.getByRole('button', { name: 'Registrar venta' }).click();
}

/** A fiado sale on `cliente`'s account. */
export async function venderFiado(page: Page, cliente: string | RegExp): Promise<void> {
  const cobro = await cobrarCon(page, 'Fiado');
  await cobro.getByRole('radio', { name: cliente }).first().click();
  await cobro.getByRole('button', { name: /^Anotar \$/ }).click();
}
