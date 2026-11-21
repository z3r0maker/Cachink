import AxeBuilder from '@axe-core/playwright';

import { expect, test, type Page } from './test';

import { itemsFiledFor, type FiledItem } from './ingest';
import { clickUntil, filled } from './interact';
import { mintTenant, signIn, type Tenant } from './tenant';

/**
 * «Algo no funciona» in Ayuda (P-48, ADR-162 §8, board `RpAyuda`), on a tenant
 * of its own. From a portal screen, two taps and no typing file a `bug` item
 * that names that screen. What is asserted is that the report left the portal:
 * the spec reads it back from the console's ingest stand-in (`./ingest.ts`)
 * with the screen's name, the browser and the account, none of which the form
 * sent.
 */
test.use({ storageState: { cookies: [], origins: [] } });

let t: Tenant;

test.beforeAll(async () => {
  t = await mintTenant({ label: 'Reportes' });
});

/** Signs in, walks to Ventas y gastos through the menu, and from there into the form. */
async function abrirDesdeVentas(page: Page): Promise<void> {
  await signIn(page, t);
  await page.locator('aside').first().getByRole('link', { name: 'Ventas y gastos' }).click();
  await expect(page).toHaveURL(/\/movimientos/);
  await page.locator('header').getByRole('link', { name: 'Ayuda' }).click();
  await page.getByRole('link', { name: 'Escribirle al equipo' }).click();
  await expect(page.getByRole('heading', { name: 'Escríbele al equipo', level: 1 })).toBeVisible();
  await clickUntil(
    page.getByRole('radio', { name: /Algo no funciona/ }),
    page.getByText('¿En qué pantalla?'),
  );
}

/** The report this business filed whose body starts with `starts`; waits for it to arrive. */
async function filed(starts: string): Promise<FiledItem> {
  let item: FiledItem | undefined;
  await expect
    .poll(async () => {
      item = (await itemsFiledFor(t.biz)).find((i) => i.body.startsWith(starts));
      return item?.kind;
    })
    .toBe('bug');
  return item as FiledItem;
}

test('two taps and no typing file a report that names the screen the person came from', async ({
  page,
}) => {
  await abrirDesdeVentas(page);
  // Already filled, by itself, with where the person was.
  await expect(page.getByTestId('ayuda-pantalla')).toHaveText('Ventas y gastos');
  await expect(page.getByText('Es donde estabas cuando abriste Ayuda.')).toBeVisible();
  await expect(
    page.getByText('Va con la pantalla, tu navegador y el último error que vimos en tu sesión.', {
      exact: false,
    }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByRole('heading', { name: /Ya nos llegó\.$/ })).toBeVisible();
  await expect(
    page.getByText(`Te contestamos por correo a ${t.email}.`, { exact: false }),
  ).toBeVisible();

  // No sentence was typed, so the report opens with the screen.
  const item = await filed('Pantalla: Ventas y gastos (/movimientos)');
  expect(item).toMatchObject({
    title: 'Algo no funciona: Ventas y gastos',
    urgent: false,
    businessId: t.biz,
    source: 'portal-ayuda',
  });
  expect(item.sourceRef).toMatch(new RegExp(`^falla:${t.ownerId}:[0-9a-f-]{36}$`));
  const lines = item.body.split('\n');
  expect(lines[0]).toBe('Pantalla: Ventas y gastos (/movimientos)');
  // The browser is the request's own, read on the server: the form never sent it.
  expect(lines[1]).toBe(`Navegador: ${await page.evaluate(() => navigator.userAgent)}`);
  expect(lines[2]).toBe(`Cuenta: ${t.email}`);
  // This server has no Sentry key, so the session saw no error to name.
  expect(item.eventId).toBeUndefined();
});

test('«Fue en otra» names another screen, and the sentence and the urgency travel with it', async ({
  page,
}) => {
  await abrirDesdeVentas(page);
  await clickUntil(
    page.getByRole('button', { name: 'Fue en otra' }),
    page.getByRole('group', { name: 'Pantallas del portal' }),
  );
  await page.getByRole('button', { name: 'Productos', exact: true }).click();
  await expect(page.getByTestId('ayuda-pantalla')).toHaveText('Productos');
  await expect(page.getByText('Es donde estabas cuando abriste Ayuda.')).toHaveCount(0);

  await filled(page.getByLabel('¿Qué pasó?'), 'El precio de un producto no se guardó');
  await page.getByLabel('Es urgente').check();
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByRole('heading', { name: /Ya nos llegó\.$/ })).toBeVisible();

  const item = await filed('El precio de un producto no se guardó');
  expect(item).toMatchObject({ title: 'Algo no funciona: Productos', urgent: true });
  expect(item.body.split('\n').slice(0, 2)).toEqual([
    'El precio de un producto no se guardó',
    'Pantalla: Productos (/productos)',
  ]);
});

/** As `a11y.spec.ts` scans every route: no serious or critical violation. */
async function expectAccessible(page: Page): Promise<void> {
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(
    blocking,
    blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`).join('\n'),
  ).toEqual([]);
}

test('the form, the screens to pick from and «Enviado» have no blocking accessibility violations', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await abrirDesdeVentas(page);
  await clickUntil(
    page.getByRole('button', { name: 'Fue en otra' }),
    page.getByRole('group', { name: 'Pantallas del portal' }),
  );
  await expectAccessible(page);
  await page.getByRole('button', { name: 'Equipo y nómina', exact: true }).click();
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByRole('heading', { name: /Ya nos llegó\.$/ })).toBeVisible();
  await expectAccessible(page);
});

const esExcel = (item: FiledItem): boolean => item.body.startsWith('No bajó el Excel de ventas');

test('a send that never arrives is said, keeps what was typed, and the retry files it once', async ({
  page,
}) => {
  await abrirDesdeVentas(page);
  await filled(page.getByLabel('¿Qué pasó?'), 'No bajó el Excel de ventas');
  // The request is dropped on its way out. (The console's ingest being down is
  // the action's own test, `tests/actions/ayuda.test.ts`: the stand-in cannot
  // be taken down under the specs running beside this one.)
  await page.route('**/ayuda/escribir', (route) =>
    route.request().method() === 'POST' ? route.abort('failed') : route.fallback(),
  );
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('No pudimos enviarlo. Intenta de nuevo.')).toBeVisible();
  await expect(page.getByLabel('¿Qué pasó?')).toHaveValue('No bajó el Excel de ventas');
  expect(await itemsFiledFor(t.biz).then((all) => all.filter(esExcel))).toHaveLength(0);

  await page.unroute('**/ayuda/escribir');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByRole('heading', { name: /Ya nos llegó\.$/ })).toBeVisible();
  await filed('No bajó el Excel de ventas');
  expect(await itemsFiledFor(t.biz).then((all) => all.filter(esExcel))).toHaveLength(1);
});
