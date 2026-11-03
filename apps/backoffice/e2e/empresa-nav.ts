import { expect, type Page } from '@playwright/test';

/**
 * «Empresa»'s grouped navigation (E-07, plan §2): the rail's entries and the
 * tabs under an entry's title.
 */
export const rail = (page: Page) =>
  page.getByRole('navigation', { name: 'Navegación de la consola' });

export const secciones = (page: Page, entrada: string) =>
  page.getByRole('navigation', { name: `Secciones de ${entrada}` });

/** Opens an entry from the rail and checks it stays lit on its first tab. */
export async function abrirEntrada(page: Page, entrada: string): Promise<void> {
  const link = rail(page).getByRole('link', { name: entrada, exact: true });
  await link.click();
  await expect(link).toHaveAttribute('aria-current', 'page');
}

/** Opens one of an entry's tabs and checks the rail and the bar agree. */
export async function abrirPestana(
  page: Page,
  pestana: string,
  ruta: RegExp,
  entrada = 'Cumplimiento',
): Promise<void> {
  const tab = secciones(page, entrada).getByRole('link', { name: pestana, exact: true });
  await tab.click();
  await expect(page).toHaveURL(ruta);
  await expect(tab).toHaveAttribute('aria-current', 'page');
  await expect(rail(page).getByRole('link', { name: entrada, exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
}

/**
 * Every screen the area had before the regrouping, with its title now: the
 * routes did not change, so each one still opens.
 */
export const RUTAS: readonly (readonly [string, string])[] = [
  ['/empresa', 'Resumen'],
  ['/empresa/movimientos', 'Dinero'],
  ['/empresa/facturas', 'Dinero'],
  ['/empresa/resultados', 'Resultados'],
  ['/empresa/movimientos/registrar', 'Registrar'],
  ['/empresa/socios', 'Cuentas de socios'],
  ['/empresa/agenda', 'Cumplimiento'],
  ['/empresa/agenda/evidencias', 'Cumplimiento'],
  ['/empresa/expediente', 'Cumplimiento'],
  ['/empresa/expediente/subir', 'Subir documento'],
  ['/empresa/corporativo', 'Cumplimiento'],
  ['/empresa/corporativo/acciones', 'Acciones'],
];
