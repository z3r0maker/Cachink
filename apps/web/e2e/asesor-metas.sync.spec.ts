import { expect, test, type Page } from './test';
import { newUlid } from '@xangarro/domain';

import { asTenant } from './sync-phone';
import { addMember, mintTenant, signIn, type Tenant } from './tenant';
import { addProduct, addSale } from './tenant-rows';

/**
 * P-27/P-33 on a tenant of its own (the `sync` project: it writes rows). April
 * has ventas to anchor a base; a May-loaded goal for April closes lazily on
 * the Metas tab — achieved, so the takeover appears **once** (ADR-087's
 * marker), the month-end dialog answers in its lograda variant, and the next
 * wizard run anchors to April's real ventas.
 */
test.use({ storageState: { cookies: [], origins: [] } });

let t: Tenant;
let lectura: Pick<Tenant, 'email' | 'password'>;

test.beforeAll(async () => {
  t = await mintTenant({ label: 'Metas' });
  lectura = await addMember(t, { role: 'viewer' });
  const producto = await addProduct(t, { nombre: 'Torta', costo: 100, precio: 500 });
  // Three April sales of $1,000.00 each: the base the wizard anchors to.
  for (const [i, fecha] of ['2026-04-05', '2026-04-18', '2026-04-27'].entries()) {
    await addSale(t, {
      fecha,
      monto: 100_000,
      concepto: 'Torta',
      folio: i + 1,
      productoId: producto,
      cantidad: 2,
    });
  }
  await asTenant(t.biz, async (sql) => {
    // A goal for April that April's $3,000.00 beats: lograda on the lazy close.
    await sql`
      INSERT INTO metas (id, objetivo, motivo, nivel, objetivo_centavos, periodo, business_id,
                         created_at, updated_at)
      VALUES (${newUlid()}, 'vender', 'comprar', 'reto', 280_000, '2026-04', ${t.biz}, now(), now())`;
  });
});

const abrirMetas = async (page: Page) => {
  await page.goto('/asesor');
  await page.getByRole('button', { name: 'Metas' }).click();
};

test('an achieved goal celebrates once, then the month-end dialog answers in its lograda variant', async ({
  page,
}) => {
  await signIn(page, t);
  await abrirMetas(page);

  // The takeover, once (P-33)… and its share carries the goal's own numbers (P-32).
  const takeover = page.getByRole('dialog');
  await expect(takeover.getByRole('heading', { name: '¡Lograste tu meta!' })).toBeVisible();
  await takeover.getByRole('button', { name: 'Compartir logro' }).click();
  const compartir = page.getByRole('dialog', { name: 'Compartir por WhatsApp' });
  const caja = compartir.getByRole('textbox', { name: 'Mensaje' });
  await expect(caja).toHaveText(
    new RegExp(
      `En abril 2026 vendimos \\$3,000\\.00 en ${t.nombre} y llegamos a nuestra meta del mes`,
    ),
  );
  await expect(compartir.getByText('Meta-2026-04.png')).toBeVisible();
  await expect(compartir.getByRole('link', { name: 'Abrir WhatsApp' })).toHaveAttribute(
    'href',
    /wa\.me\/\?text=/,
  );
  await compartir.getByRole('button', { name: 'Cerrar' }).click();
  await expect(compartir).toBeHidden();
  await takeover.getByRole('button', { name: 'Seguir' }).click();
  await expect(takeover).toBeHidden();

  // …and never again: the marker was written the moment it rendered.
  await abrirMetas(page);
  await expect(page.getByText('¡Lograste tu meta!')).toHaveCount(0);

  // The wizard anchors to April's real 300,000 (×1.2 = 360,000 for «un reto»).
  await expect(page.getByText('¿Qué quieres lograr?')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText('$3,600.00 al mes · $120.00 al día')).toBeVisible();
  await page.getByRole('button', { name: 'Empezar mi meta' }).click();
  await expect(page.getByText('Tu meta de 2026-05')).toBeVisible();
  // Exact: the screen also says «Te faltan $3,600.00 para llegar.»
  await expect(page.getByText('$3,600.00', { exact: true })).toBeVisible();
});

test('a viewer never sees the wizard', async ({ page }) => {
  await signIn(page, lectura);
  await abrirMetas(page);
  await expect(page.getByText('¿Qué quieres lograr?')).toHaveCount(0);
  await expect(page.getByText('Solo lectura')).toBeVisible();
});
