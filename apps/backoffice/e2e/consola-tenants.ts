import { expect, type Locator, type Page } from '@playwright/test';

import type { ConsolaTenant } from './consola-fixture';
import { loQueVeElNegocio } from './consola-rows';

/**
 * J9-05 · Tenants. The list, the side panel and the full page, held to the
 * minted business's own rows (owner, two devices, Xangarrote subscription)
 * and to the seed's Taquería, whose devices last synced on 12 May 2026.
 */
export const TAQUERIA = {
  id: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
  nombre: 'Taquería Don Pedro',
  ultimaSync: '2026-05-12T15:00:00.000Z',
} as const;

const DIA = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeZone: 'America/Mexico_City',
});

/** A day as the console prints it: a CDMX calendar day, «15 mar 2030». */
export const dia = (at: string | number): string => DIA.format(new Date(at));

const HOUR = 3_600_000;

/** The `<dd>` a `<dt>` labels, inside `scope`. */
export const dato = (scope: Page | Locator, label: string): Locator =>
  scope.locator('dt', { hasText: label }).locator('xpath=following-sibling::dd[1]');

const fila = (page: Page, text: string): Locator => page.getByRole('row').filter({ hasText: text });

export async function verLista(page: Page, t: ConsolaTenant): Promise<void> {
  await page.goto('/tenants');
  await expect(page.getByRole('heading', { name: 'Tenants', level: 1 })).toBeVisible();
  const mia = fila(page, t.nombre);
  await expect(mia).toContainText(t.ownerEmail);
  await expect(mia.getByRole('cell').nth(2)).toHaveText('Xangarrote');
  await expect(mia.getByRole('cell').nth(3)).toHaveText('Activa');
  await expect(mia.getByRole('cell').nth(4)).toHaveText('1 activos2 en total');
  await expect(mia.getByRole('cell').nth(5)).toHaveText(dia(Date.now() - HOUR));

  // Sync health: the seed's devices went quiet in May; the minted one synced an hour ago.
  const taqueria = fila(page, TAQUERIA.nombre);
  await expect(taqueria.getByRole('cell').nth(5)).toHaveText(dia(TAQUERIA.ultimaSync));
  await page.goto('/tenants?sin_sync=1');
  await expect(fila(page, TAQUERIA.nombre)).toHaveCount(1);
  await expect(fila(page, t.nombre)).toHaveCount(0);

  await page.goto(`/tenants?q=${encodeURIComponent(t.sello)}`);
  await expect(page.getByRole('row')).toHaveCount(2);
  await expect(fila(page, t.nombre)).toHaveCount(1);
}

export async function verFicha(page: Page, t: ConsolaTenant): Promise<void> {
  await page.getByRole('link', { name: t.nombre }).click();
  await expect(page).toHaveURL(new RegExp(`ficha=${t.biz}`));
  const ficha = page.getByRole('complementary', { name: t.nombre });
  await expect(ficha).toContainText('Ficha 360°');
  await expect(ficha).toContainText('Xangarrote');
  await expect(ficha).toContainText('1 / 2');
  await expect(ficha.getByRole('listitem').filter({ hasText: t.cajaActiva })).toContainText(
    `visto ${dia(Date.now() - HOUR)}`,
  );
  await expect(ficha.getByRole('listitem').filter({ hasText: t.cajaRevocada })).toContainText(
    `revocado ${dia(Date.now() - 2 * 24 * HOUR)}`,
  );
  await ficha.getByRole('link', { name: 'Ficha completa y ajustes' }).click();
  await expect(page).toHaveURL(new RegExp(`/tenants/${t.biz}$`));
}

export async function verDetalle(page: Page, t: ConsolaTenant): Promise<void> {
  await expect(page.getByRole('heading', { name: t.nombre, level: 1 })).toBeVisible();
  await expect(page.getByText(t.biz, { exact: true })).toBeVisible();
  await expect(dato(page, 'Suscripción')).toHaveText('Activa');
  await expect(dato(page, 'Próximo cargo')).toHaveText(dia(t.periodEnd));
  await expect(page.getByRole('link', { name: 'Abrir en Stripe' })).toHaveAttribute(
    'href',
    `https://dashboard.stripe.com/customers/${t.customerId}`,
  );
  await expect(dato(page, 'Plan en Stripe')).toHaveText('Xangarrote');
  await expect(dato(page, 'Dueño')).toHaveText(t.ownerEmail);
  await expect(fila(page, t.cajaActiva)).toContainText('Activo');
  await expect(fila(page, t.cajaRevocada)).toContainText(
    `Revocado ${dia(Date.now() - 2 * 24 * HOUR)}`,
  );
  await expect(dato(page, 'Prueba extendida')).toHaveText('No');
}

/** An audited override from the full page, and the tenant's own read of it. */
export async function extenderPrueba(page: Page, t: ConsolaTenant): Promise<void> {
  await page.getByRole('spinbutton', { name: 'Días extra de prueba' }).fill('9');
  await page.getByRole('button', { name: 'Extender prueba…' }).click();
  const confirma = page.getByRole('dialog', { name: '¿Confirmas?' });
  await expect(confirma).toContainText(`${t.nombre} tendrá 9 días más de prueba.`);
  await confirma.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByText('Listo: la prueba se extendió.')).toBeVisible();

  await page.reload();
  await expect(dato(page, 'Prueba extendida')).toHaveText('+9 días');
  await expect(page.getByRole('listitem').filter({ hasText: 'Extender prueba' })).toContainText(
    '+9 días',
  );
  const visto = await loQueVeElNegocio(t.biz);
  expect(visto.overrides.map((o) => (o.kind === 'extend_trial' ? o.days : null))).toEqual([9]);
}
