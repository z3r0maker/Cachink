import { expect, test } from './test';

import { addMember, mintTenant, signIn, type Tenant } from './tenant';

/**
 * «Privacidad y mis datos» (ADR-137; PvPagina, PvMenu) on minted tenants. A
 * minted account has no acceptance on record, which is the «aviso nuevo»
 * state: the strip across the portal, the menu's chip, and the card. Accepting
 * writes the ledger and everything goes quiet; the novedades switch survives
 * a reload because it reads the ledger back.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('the owner', () => {
  // One account, in order: accepting the aviso is what the later tests read.
  test.describe.configure({ mode: 'serial' });
  let t: Tenant;

  test.beforeAll(async () => {
    t = await mintTenant({ label: 'Privada', plan: 'free' });
  });

  test('a new aviso shows across the portal until it is accepted', async ({ page }) => {
    await signIn(page, t);
    await page.goto('/');
    await expect(page.getByTestId('aviso-nuevo-franja')).toBeVisible();
    await page.getByRole('button', { name: 'Menú de usuario' }).click();
    const item = page.getByTestId('menu-privacidad');
    await expect(item).toContainText('Aviso nuevo');
    await item.click();
    await expect(page).toHaveURL(/\/privacidad$/);
    await expect(page.getByTestId('aviso-nuevo-franja')).toHaveCount(0);

    const card = page.getByTestId('pv-aviso-nuevo');
    await expect(card).toContainText('Versión 0.3');
    await expect(page.getByTestId('pv-aceptado')).toHaveText(
      'Todavía no tenemos registrado que aceptaste el aviso.',
    );
    await card.getByRole('button', { name: 'Leer el aviso nuevo' }).click();
    await expect(page.getByTestId('aviso-texto')).toContainText(
      'Privacidad y mis datos, en el menú de tu cuenta',
    );
    await page.keyboard.press('Escape');

    await card.getByRole('button', { name: 'Acepto el aviso nuevo' }).click();
    await expect(page.getByTestId('pv-aviso-nuevo')).toHaveCount(0);
    await expect(page.getByTestId('pv-aceptado')).toHaveText(
      /^Aceptaste la versión 0\.3 el \d{1,2} de \w+ de \d{4}\.$/,
    );
    await page.goto('/');
    await expect(page.getByTestId('aviso-nuevo-franja')).toHaveCount(0);
  });

  test('the accepted text opens with its fingerprint', async ({ page }) => {
    await signIn(page, t);
    await page.goto('/privacidad');
    await page.getByRole('button', { name: 'Ver el texto que aceptaste' }).click();
    await expect(page.getByTestId('aviso-texto')).toContainText('MEXIA, S.A.S.');
    await expect(page.getByTestId('aviso-texto')).toContainText(/Huella del texto: [0-9a-f]{4} /);
  });

  test('the novedades switch saves at once and is still there after a reload', async ({ page }) => {
    await signIn(page, t);
    await page.goto('/privacidad');
    const sw = page.getByRole('switch', { name: 'Correos de novedades' });
    const antes = await sw.getAttribute('aria-checked');
    await sw.click();
    await expect(page.getByText(/^Listo, (te|ya no te) mandaremos novedades\.$/)).toBeVisible();
    const despues = antes === 'true' ? 'false' : 'true';
    await page.reload();
    await expect(page.getByRole('switch', { name: 'Correos de novedades' })).toHaveAttribute(
      'aria-checked',
      despues,
    );
  });

  test('the owner can download, delete, or ask; withdrawing leads to deletion', async ({
    page,
  }) => {
    await signIn(page, t);
    await page.goto('/privacidad');
    await expect(page.getByTestId('descargar-todo')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Hacer una solicitud' })).toHaveAttribute(
      'href',
      '/privacidad/solicitud',
    );
    await expect(page.getByTestId('pv-retirar')).toHaveAttribute('href', '/negocio/eliminar');
  });
});

test.describe('a member who is not the owner', () => {
  let viewer: Pick<Tenant, 'email' | 'password'>;

  test.beforeAll(async () => {
    const t = await mintTenant({ label: 'Lectora', plan: 'free' });
    viewer = await addMember(t, { role: 'viewer', label: 'lectora' });
  });

  test('has the page too, without download or deletion; withdrawing is a request', async ({
    page,
  }) => {
    await signIn(page, viewer);
    await page.goto('/privacidad');
    await expect(page.getByRole('heading', { name: 'Privacidad y mis datos' })).toBeVisible();
    await expect(page.getByTestId('descargar-todo')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Eliminar mi cuenta' })).toHaveCount(0);
    await expect(page.getByTestId('pv-retirar')).toHaveAttribute('href', '/privacidad/solicitud');
  });
});
