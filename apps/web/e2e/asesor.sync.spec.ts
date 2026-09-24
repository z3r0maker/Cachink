import { expect, test } from './test';
import { newUlid } from '@xangarro/domain';

import { asOwner, asTenant } from './sync-phone';

/**
 * P-26 on the seeded tenant: the deterministic layer materialises on read
 * (ADR-088), so visiting /asesor writes insights derived from May's rows —
 * this spec is in the `sync` project because it mutates the seeded tenant's
 * `notices` (upserts only; the rows it asserts are computed from seed data).
 *
 * The seed has one entrada per product and no baseline months, so the honest
 * feed carries few insights; the capacidades panel is where the seeded young
 * business shows real progress.
 */
test('visiting Para ti materialises insights and real capacidades', async ({ page }) => {
  await page.goto('/asesor');
  const main = page.locator('main');

  // The seeded asesor notice (nt-4) is part of the feed.
  await expect(main.getByText('El queso te cuesta 18% más que en junio')).toBeVisible();

  // Capacidades read the seed's real counts (capped at each objective).
  await expect(main.getByText('Lo que tu Asesor ya puede ver')).toBeVisible();
  await expect(main.getByText(/de 60 días · \d+ de 2 compras/)).toBeVisible();

  // The provenance line never claims AI authorship for computed output.
  await expect(main.getByText('Calculado a partir de tus registros.')).toBeVisible();
});

test('a member can dismiss an Asesor insight, and it stays dismissed', async ({ page }) => {
  // The feed is materialised-on-read, which also CLOSES any open asesor row
  // no detector currently backs — so seeding a notice is reaped on the first
  // load. Arm a real detector instead: three ventas bunched in one quincena
  // (the same dates asesor-metas uses) makes the quincena insight materialise,
  // open and dismissable. The afterAll deletes the notices; the rows go too.
  const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
  const TACO = '01HZ8XQN9GZJXV8AKQ5X0PTAC1';
  const seeded: string[] = [];
  await asTenant(BIZ, async (sql) => {
    let folio = 100;
    for (const f of ['2026-04-05', '2026-04-18', '2026-04-27']) {
      folio += 1;
      const saleId = newUlid();
      seeded.push(saleId);
      await sql`
        INSERT INTO tickets (id, folio, fecha, concepto, metodo, estado_pago,
                             business_id, device_id, created_at, updated_at)
        VALUES (${saleId}, ${folio}, ${f}, 'Venta para el Asesor', 'Efectivo', 'pagado',
                ${BIZ}, 'e2e-asesor', ${`${f}T12:00:00Z`}, ${`${f}T12:00:00Z`})
        ON CONFLICT DO NOTHING`;
      await sql`
        INSERT INTO sales (id, ticket_id, fecha, concepto, categoria, monto_centavos,
                           producto_id, cantidad, business_id, device_id, created_at, updated_at)
        VALUES (${saleId}, ${saleId}, ${f}, 'Venta para el Asesor', 'Producto', 10_000,
                ${TACO}, 2, ${BIZ}, 'e2e-asesor', ${`${f}T12:00:00Z`}, ${`${f}T12:00:00Z`})
        ON CONFLICT DO NOTHING`;
    }
  });
  await page.goto('/asesor');
  const row = page.getByTestId('asesor-feed-row').first();
  const texto = (await row.textContent()) ?? '';
  await row.getByRole('button', { name: 'Descartar' }).click();
  const fuera = page.getByTestId('asesor-feed-row').filter({ hasText: texto.slice(0, 20) });
  await expect(fuera).toHaveCount(0);
  await page.reload();
  await expect(fuera).toHaveCount(0);
  // And it appears under Anteriores as dismissed.
  await expect(page.locator('main').getByText('Anteriores')).toBeVisible();
  // Leave the tenant as the seed had it (as the owner: the app role cannot DELETE, 0036).
  await asOwner(async (sql) => {
    await sql`DELETE FROM sales WHERE id = ANY(${seeded})`;
    await sql`DELETE FROM tickets WHERE id = ANY(${seeded})`;
    await sql`DELETE FROM notices WHERE source = 'asesor' AND id LIKE ${`${BIZ}:%`}`;
  });
});

test.afterAll(async () => {
  // Leave the seeded tenant's feed as the seed had it (nt-4 open, no computed rows).
  await asOwner(
    (sql) => sql`
    DELETE FROM notices WHERE source = 'asesor' AND id LIKE '01HZ8XQN9GZJXV8AKQ5X0C7BJZ:%'`,
  );
});

/** P-32: the diagnóstico share carries the month's real figures. */
test('«Compartir diagnóstico» opens with the real month figures', async ({ page }) => {
  // What the message quotes is `resultados.ingresos` (`resumenParaCompartir`) —
  // the same total Estados prints for the month. So read it there instead of
  // writing it down: this test said $645.00, the seed grew a real ledger
  // anchored to the run date, and the number moved for a change that broke
  // nothing. The claim is that the share never invents a figure.
  await page.goto('/estados');
  const frase = await page
    .locator('main')
    .getByText(/^Vendiste \$[\d,]+\.\d\d,/)
    .first()
    .innerText();
  const vendido = /^Vendiste (\$[\d,]+\.\d\d),/.exec(frase)?.[1];
  expect(vendido, `unreadable Estados summary: ${frase}`).toBeDefined();

  await page.goto('/asesor');
  await page.getByRole('button', { name: 'Diagnóstico' }).click();
  await page.getByRole('button', { name: 'Compartir diagnóstico' }).click();
  const compartir = page.getByRole('dialog', { name: 'Compartir por WhatsApp' });
  await expect(compartir).toBeVisible();
  const caja = compartir.getByRole('textbox', { name: 'Mensaje' });
  await expect(caja).toContainText(`vendimos ${vendido as string}`);
  await expect(compartir.getByText('Diagnóstico-2026-05.pdf')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(compartir).toBeHidden();
});
