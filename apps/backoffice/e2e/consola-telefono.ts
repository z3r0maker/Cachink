import { expect, type Page } from '@playwright/test';

import { rail } from './empresa-nav';

/**
 * The console at phone width (canvas CD-19, CD-19b): under 760 px the rail
 * folds into the top bar's «Menú» and the page gets the whole width.
 */
export const TELEFONO = { width: 390, height: 844 } as const;

/** No sideways page scroll, and `main` spans the viewport with its 16 px gutters. */
export async function sinScrollLateral(page: Page): Promise<void> {
  const medidas = await page.evaluate(() => {
    const main = document.querySelector('main');
    const caja = main?.getBoundingClientRect();
    const estilo = main === null ? null : getComputedStyle(main);
    return {
      scroll: document.documentElement.scrollWidth,
      ancho: document.documentElement.clientWidth,
      main: caja?.width ?? 0,
      margen: [estilo?.paddingLeft, estilo?.paddingRight],
    };
  });
  expect(medidas.scroll, 'la página no se desplaza a los lados').toBeLessThanOrEqual(medidas.ancho);
  expect(medidas.main).toBe(TELEFONO.width);
  expect(medidas.margen).toEqual(['16px', '16px']);
}

export const menu = (page: Page) => page.getByRole('dialog', { name: 'Menú de la consola' });

/** Opens «Menú»: the rail comes back, in the drawer, with the founders' group. */
export async function abrirMenu(page: Page): Promise<void> {
  await expect(rail(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Menú', exact: true }).click();
  await expect(menu(page)).toBeVisible();
  await expect(rail(page)).toHaveCount(1);
  await expect(menu(page).getByText('Empresa', { exact: true })).toBeVisible();
}
