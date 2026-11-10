import { expect, type Page } from '@playwright/test';

import type { ConsolaTenant } from './consola-fixture';
import { loQueVeElNegocio } from './consola-rows';
import { TAQUERIA } from './consola-tenants';

/**
 * J9-07 · Flags. «Merma» (off by default in code) goes to «Lista beta» with
 * only the minted business on the list. The proof that the tenant sees it is
 * the portal's own read, not the console's: the rules through
 * `xangarro.tenant_platform_flags()` as the app role inside the tenant's
 * transaction, resolved by the domain. A device would get the same answer in
 * its next signed entitlement; driving a phone is out of this suite's reach.
 */
export const motivo = (t: ConsolaTenant): string => `Beta de merma E2E ${t.sello}`;

export async function ponerEnListaBeta(page: Page, t: ConsolaTenant): Promise<void> {
  await page.goto(`/flags?editar=merma&q=${encodeURIComponent(t.sello)}`);
  const editor = page.getByRole('dialog', { name: 'Editar: Merma' });
  await expect(editor).toContainText('Predeterminado en código: apagado.');
  await editor.getByRole('checkbox', { name: new RegExp(t.nombre) }).check();
  await editor.getByRole('radio', { name: /Lista beta/ }).check();
  await editor.getByRole('textbox', { name: 'Motivo (obligatorio)' }).fill(motivo(t));
  await editor.getByRole('button', { name: 'Guardar cambio…' }).click();

  const confirma = page.getByRole('dialog', { name: '¿Confirmas?' });
  await expect(confirma).toContainText('Merma solo quedará para 1 negocios de la lista');
  await confirma.getByRole('button', { name: 'Confirmar' }).click();
  await expect(
    page.getByText(
      'Listo: Merma quedó en «Lista beta». Llega a cada dispositivo en su próxima sincronización.',
    ),
  ).toBeVisible();
}

export async function verFlagCambiado(page: Page, t: ConsolaTenant): Promise<void> {
  await page.goto('/flags');
  const merma = page.getByRole('row').filter({ hasText: 'Registro de pérdidas.' });
  await expect(merma.getByRole('cell').nth(1)).toHaveText('Lista beta1 negocios en la lista');
  await expect(merma.getByRole('cell').nth(3)).toContainText(`Consola E2E«${motivo(t)}»`);

  await page.goto('/flags?historial=merma');
  const historial = page.getByRole('complementary', { name: 'Historial: Merma' });
  await expect(historial.getByRole('listitem')).toHaveCount(1);
  await expect(historial.getByRole('listitem')).toContainText(motivo(t));
  await expect(historial.getByRole('listitem')).toContainText(t.biz);
}

/** The tenant on the list gets merma; the seed's Taquería does not, nor learns who does. */
export async function verLoQueVeElNegocio(t: ConsolaTenant): Promise<void> {
  const dentro = await loQueVeElNegocio(t.biz);
  expect(dentro.platform.merma).toBe(true);
  expect(dentro.rules.find((r) => r.key === 'merma')).toMatchObject({
    mode: 'allowlist',
    allowlistBusinessIds: [t.biz],
  });

  const fuera = await loQueVeElNegocio(TAQUERIA.id);
  expect(fuera.platform.merma).toBe(false);
  expect(fuera.rules.find((r) => r.key === 'merma')).toMatchObject({
    mode: 'allowlist',
    allowlistBusinessIds: [],
  });
}
