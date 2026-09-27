import { newUlid } from '@xangarro/domain';
import { PORTAL_DEVICE_ID } from '@xangarro/domain/usage';

import { expect, test, type Page } from './test';

import { puertaOperador } from './puerta-operador';
import { asTenant, BIZ } from './sync-phone';

/**
 * O-16 (Track O, fase 10; live C-19/O-06): Operador · Avisos on a linked
 * caja. The owner's message is filed in Postgres as the portal's «Preguntarle
 * a Ana» does (`pedirAclaracion`), reaches the caja with its bootstrap, is
 * answered in place, and the reply lands in `respuestas_operador`. Read marks
 * persist on the device. Never the design's «Aclara el corte del 13 de mayo».
 */
test.beforeEach(() => test.setTimeout(120_000));

/** The seed's Ana Robledo: the operator the door logs in. */
const ANA = '01HZ8XQN9GZJXV8AKQ5X0ANA01';

/** An owner → Ana aclaración, exactly the row `pedirAclaracion` writes. */
async function mensajeParaAna(): Promise<{ id: string; cuerpo: string }> {
  const id = newUlid();
  const cuerpo = `Faltaron $60.00 al cerrar. Dime qué recuerdas (${id.slice(-6)}).`;
  await asTenant(BIZ, async (sql) => {
    await sql`
      INSERT INTO mensajes_operador (id, operador_id, caja_turno_id, severidad, cuerpo,
                                     business_id, device_id, created_by_user_id,
                                     created_at, updated_at)
      VALUES (${id}, ${ANA}, NULL, 'aclaracion', ${cuerpo}, ${BIZ}, ${PORTAL_DEVICE_ID}, NULL,
              now(), now())`;
  });
  return { id, cuerpo };
}

async function sinFixture(page: Page): Promise<void> {
  await expect(page.getByText('Aclara el corte del 13 de mayo')).toHaveCount(0);
  await expect(page.getByText('La gringa sube a $65.00 desde mañana')).toHaveCount(0);
  await expect(page.getByText('3 registros siguen sin enviarse')).toHaveCount(0);
}

test('the owner’s message is answered in place and the reply reaches the owner', async ({
  page,
}) => {
  const m = await mensajeParaAna();
  await puertaOperador(page);
  await page.goto('/operador/avisos');
  const card = page.locator('article', { hasText: m.cuerpo });
  await expect(card).toBeVisible({ timeout: 20_000 });
  await sinFixture(page);
  await expect(page.getByRole('tab', { name: /^Del dueño/ })).toBeVisible();
  await expect(card).toContainText('Sin leer');

  const enviar = card.getByRole('button', { name: 'Enviar respuesta' });
  await expect(enviar).toBeDisabled();
  await card.getByRole('button', { name: 'Cobré y no capturé' }).click();
  await enviar.click();
  await expect(page.getByRole('status')).toContainText(
    'El dueño ya tiene tu respuesta sobre el corte.',
  );
  await expect(card.getByText('“Cobré una venta y no la capturé en la caja.”')).toBeVisible();

  await expect
    .poll(
      () =>
        asTenant(BIZ, async (sql) => {
          const rows = await sql<{ texto: string }[]>`
            SELECT texto FROM respuestas_operador WHERE mensaje_id = ${m.id}`;
          return rows.map((r) => r.texto);
        }),
      { timeout: 15_000 },
    )
    .toEqual(['Cobré una venta y no la capturé en la caja.']);

  // The reply is the caja's own row: a reload still shows it, read.
  await page.reload();
  const otra = page.locator('article', { hasText: m.cuerpo });
  await expect(otra.getByText('“Cobré una venta y no la capturé en la caja.”')).toBeVisible({
    timeout: 20_000,
  });
  await expect(otra).toContainText('Leído');
});

test('«Marcar todo como leído» persists across a reload', async ({ page }) => {
  const m = await mensajeParaAna();
  await puertaOperador(page);
  await page.goto('/operador/avisos');
  const card = page.locator('article', { hasText: m.cuerpo });
  await expect(card).toContainText('Sin leer', { timeout: 20_000 });

  await page.getByRole('button', { name: 'Marcar todo como leído' }).click();
  await expect(card).toContainText('Leído');
  await expect(card).not.toContainText('Sin leer');

  await page.reload();
  const otra = page.locator('article', { hasText: m.cuerpo });
  await expect(otra).toContainText('Leído', { timeout: 20_000 });
  await expect(otra).not.toContainText('Sin leer');
});

test('«De tu caja» holds the caja’s own notices, never the design’s', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/avisos');
  const caja = page.getByRole('tab', { name: /De tu caja/ });
  await caja.click();
  await expect(caja).toHaveAttribute('aria-selected', 'true');
  await sinFixture(page);
  await expect(page.getByText('Pedro aprobó «Orden de tripa»')).toHaveCount(0);
  await expect(page.getByText('El Taller de Chuy lleva 16 días sin abonar')).toHaveCount(0);
});

test('Avisos trades the business pill for a way back to Inicio', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/avisos');
  await page.locator('header').getByRole('link', { name: 'Inicio' }).click();
  await expect(page).toHaveURL(/\/operador$/);
});
