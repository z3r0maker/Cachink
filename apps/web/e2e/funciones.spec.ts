import { expect, test } from './test';
import postgres from 'postgres';

import { SERIAL_TAG, SHARED_BIZ } from './shared-tenant';

/**
 * «Mi negocio · Funciones» (P-15, CfgFunciones), end to end. The screen had no
 * spec at all: the rows must render the tenant's real flags, a leaf switch
 * saves through `cambiarFuncion` and the row follows, and turning a parent off
 * asks first when it would take dependents with it — the domain's cascade,
 * surfaced as one dialog, never a restated list.
 *
 * Every test rewrites the seeded tenant's `feature_flags`, so every test is
 * `@serial` and the file puts the original JSON back in an `afterAll` that
 * runs on failure too (ADR-103).
 */

/** Stock and barcode on (the released pair), merma stored on for the cascade. */
const FLAGS_PRUEBA = '{"stock":true,"barcode":true,"merma":true}';

let original: string | null = null;

type Sql = ReturnType<typeof postgres>;

async function conSql<T>(work: (sql: Sql) => Promise<T>): Promise<T> {
  const sql = postgres(process.env.DATABASE_URL as string, { max: 1, onnotice: () => undefined });
  try {
    await sql`SELECT set_config('xangarro.business_id', ${SHARED_BIZ}, false)`;
    return await work(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function fijarFlags(json: string): Promise<void> {
  await conSql(async (sql) => {
    await sql`UPDATE businesses SET feature_flags = ${json}, updated_at = now()
              WHERE business_id = ${SHARED_BIZ}`;
  });
}

async function flagsGuardadas(): Promise<string | null> {
  return conSql(async (sql) => {
    const [row] = await sql<{ feature_flags: string | null }[]>`
      SELECT feature_flags FROM businesses WHERE business_id = ${SHARED_BIZ}`;
    return row?.feature_flags ?? null;
  });
}

test.beforeAll(async () => {
  original = await flagsGuardadas();
});

test.afterAll(async () => {
  // On failure too: the seeded tenant's flags are not this file's to keep.
  if (original === null)
    await conSql(
      (sql) => sql`UPDATE businesses SET feature_flags = NULL WHERE business_id = ${SHARED_BIZ}`,
    );
  else await fijarFlags(original);
});

test.beforeEach(async () => {
  await fijarFlags(FLAGS_PRUEBA);
});

test('the rows are the tenant’s real flags, counted', { tag: SERIAL_TAG }, async ({ page }) => {
  await page.goto('/negocio/funciones');
  await expect(page.getByRole('heading', { name: 'Funciones de tu negocio' })).toBeVisible();

  // Stock and barcode are released and in the plan: prendidas, with switches.
  await expect(page.getByText('2 de 7')).toBeVisible();
  await expect(page.getByText('Prendida', { exact: true })).toHaveCount(2);
  await expect(page.getByText('Apagada', { exact: true })).toHaveCount(5);
  await expect(page.getByRole('switch')).toHaveCount(2);

  // The five unreleased funciones say so — no switch, whatever the plan says.
  await expect(page.getByText('Todavía no llega a tus cajas.')).toHaveCount(5);
  await expect(page.getByRole('switch', { name: 'Inventario y stock' })).toBeChecked();
});

test(
  'a leaf switch saves, and the row and the count follow',
  { tag: SERIAL_TAG },
  async ({ page }) => {
    await page.goto('/negocio/funciones');
    const lector = page.getByRole('switch', { name: 'Lector de código de barras' });
    await lector.click();
    await expect(page.getByText('1 de 7')).toBeVisible();
    await expect(lector).not.toBeChecked();
    // The write reached Postgres, not just the screen.
    expect(await flagsGuardadas()).toContain('"barcode":false');

    await lector.click();
    await expect(page.getByText('2 de 7')).toBeVisible();
    expect(await flagsGuardadas()).toContain('"barcode":true');
  },
);

test(
  'turning a parent off asks first, and the cascade takes its dependents',
  {
    tag: SERIAL_TAG,
  },
  async ({ page }) => {
    await page.goto('/negocio/funciones');
    const inventario = page.getByRole('switch', { name: 'Inventario y stock' });

    // Merma is stored on, so the dialog names it before anything is saved.
    await inventario.click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByText('¿Apagar Inventario y stock?')).toBeVisible();
    await expect(
      dialogo.getByText(/También se apaga Se echó a perder o se dañó \(merma\)/),
    ).toBeVisible();

    // «Mejor no» leaves everything as it was.
    await dialogo.getByRole('button', { name: 'Mejor no' }).click();
    await expect(dialogo).not.toBeVisible();
    await expect(inventario).toBeChecked();

    // Confirmed, the parent goes off and the dependent goes with it.
    await inventario.click();
    await dialogo.getByRole('button', { name: 'Apagar las dos' }).click();
    await expect(inventario).not.toBeChecked();
    await expect(page.getByText('1 de 7')).toBeVisible();
    const guardadas = await flagsGuardadas();
    expect(guardadas).toContain('"stock":false');
    expect(guardadas).toContain('"merma":false');
  },
);
