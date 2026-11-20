import { randomBytes, randomUUID } from 'node:crypto';

import { expect, type Page } from '@playwright/test';
import {
  RegistrarMovimientoUseCase,
  type RegistrarMovimientoInput,
} from '@xangarro/application/corp';
import { createCorpDb, createCorpLedgerRepository, saldoDeBancos } from '@xangarro/data-corp';
import { ultimoDia, type Movement } from '@xangarro/domain/corp';
import postgres from 'postgres';

/**
 * E-14's steps for empresa.spec.ts. Cierre del mes closes months in order, so
 * the test closes one long before anything else in the database (1991–2009,
 * before the SAT registration: no declaration is owed) and never a month the
 * other tests write into. Everything it leaves is removed by
 * `clearLedgerFixture`, which knows months before 2010 are this test's.
 */
export const MES_CIERRE = (() => {
  const n = randomBytes(2).readUInt16BE(0) % 228;
  return `${1991 + Math.floor(n / 12)}-${String((n % 12) + 1).padStart(2, '0')}`;
})();

const db = () => createCorpDb(process.env.CORP_DATABASE_URL ?? '', 1);

const mov = (fecha: string, movement: Movement, deducible: boolean): RegistrarMovimientoInput => ({
  fecha,
  projectId: 'xangarro',
  concepto: `E2E cierre ${movement.kind} ${randomUUID().slice(0, 8)}`,
  contraparte: null,
  founderId: 'e2e-cierre',
  source: 'manual',
  sourceRef: null,
  usd: null,
  deducible,
  movement,
});

/** A $11,600 cobro into the bank and a $1,160 expense marked non-deductible. */
export async function sembrarMesCierre(mes: string): Promise<bigint> {
  const conn = db();
  const registrar = new RegistrarMovimientoUseCase(createCorpLedgerRepository(conn));
  await registrar.execute(
    mov(
      `${mes}-05`,
      { kind: 'cobro', subtotal: 10_000_00n, iva: 1_600_00n, destino: 'bancos' },
      true,
    ),
  );
  await registrar.execute(
    mov(
      `${mes}-10`,
      {
        kind: 'gasto',
        categoria: 'administracion',
        subtotal: 1_000_00n,
        iva: 160_00n,
        tratamientoIva: 'acreditable',
        retencionIsr: 0n,
        retencionIva: 0n,
        pagado: true,
      },
      false,
    ),
  );
  const saldo = await saldoDeBancos(conn, ultimoDia(mes));
  await conn.$client.end({ timeout: 5 });
  return saldo;
}

const superSql = () =>
  postgres(process.env.DATABASE_SUPER_URL ?? '', { max: 1, onnotice: () => undefined });

export const OTRO_SOCIO = 'Socio Dos E2E';
export const OTRO_ID = `f-e2e-dos-${randomBytes(4).toString('hex')}`;

/** Fundador 2, with no console login: the test answers for them in the database. */
export async function agregarOtroSocio(): Promise<void> {
  const sql = superSql();
  await sql`INSERT INTO corp.founders (id, staff_member_id, numero, nombre, created_at)
            VALUES (${OTRO_ID}, ${`e2e-sin-login-${OTRO_ID}`}, 2, ${OTRO_SOCIO}, now())`;
  await sql.end({ timeout: 5 });
}

export async function quitarOtroSocio(): Promise<void> {
  const sql = superSql();
  await sql`DELETE FROM corp.founders WHERE id = ${OTRO_ID}`;
  await sql.end({ timeout: 5 });
}

/** Fundador 2 rejects the pending request, then asks to reopen the month themselves. */
export async function otroSocioRechazaYPide(mes: string, motivo: string): Promise<void> {
  const sql = superSql();
  await sql`INSERT INTO corp.period_events (period, kind, founder_id, at)
            VALUES (${mes}, 'reapertura_rechazada', ${OTRO_ID}, now())`;
  await sql`INSERT INTO corp.period_events (period, kind, founder_id, motivo, at)
            VALUES (${mes}, 'reapertura_pedida', ${OTRO_ID}, ${motivo}, now())`;
  await sql.end({ timeout: 5 });
}

const paso = (page: Page, id: string) =>
  page.locator(`[data-testid="paso-cierre"][data-paso="${id}"]`);

export async function esperarPaso(page: Page, id: string, estado: string): Promise<void> {
  await expect(paso(page, id)).toHaveAttribute('data-estado', estado);
}

const pesos = (centavos: bigint) => (Number(centavos) / 100).toFixed(2);

/** The bank panel refuses a balance that differs, and confirms the one that matches. */
export async function confirmarSaldo(page: Page, saldo: bigint): Promise<void> {
  await paso(page, 'banco').getByRole('link', { name: 'Confirmar saldo' }).click();
  const cajon = page.getByRole('dialog', { name: 'Saldo del banco' });
  await cajon.getByLabel(/^Saldo del estado de cuenta al/).fill(pesos(saldo - 17_40n));
  await expect(cajon.getByText('El banco tiene $17.40 menos que la consola')).toBeVisible();
  await expect(cajon.getByRole('button', { name: 'Confirmar el saldo' })).toBeDisabled();
  await cajon.getByLabel(/^Saldo del estado de cuenta al/).fill(pesos(saldo));
  await expect(cajon.getByTestId('saldo-diferencia')).toHaveText('✓ $0.00');
  await cajon.getByRole('button', { name: 'Confirmar el saldo' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await esperarPaso(page, 'banco', 'hecho');
}

export async function subirEstados(page: Page): Promise<void> {
  const fila = paso(page, 'estados');
  await fila.getByLabel('Archivo').setInputFiles({
    name: 'balanza-e2e.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n% balanza de prueba\n%%EOF\n'),
  });
  await fila.getByRole('button', { name: 'Subir' }).click();
  await esperarPaso(page, 'estados', 'hecho');
  await expect(paso(page, 'estados')).toContainText('balanza-e2e.pdf');
}

/** Registrar refuses an expense dated in the closed month, and points at its close. */
export async function registrarEnMesCerrado(page: Page, mes: string, nombre: string) {
  await page.goto('/empresa/movimientos/registrar');
  await page.getByRole('textbox', { name: 'Concepto', exact: true }).fill('E2E cierre tarde');
  await page.getByLabel('Fecha de pago', { exact: true }).fill(`${mes}-20`);
  await page.getByRole('textbox', { name: 'Monto pagado', exact: true }).fill('17.40');
  await page.getByText('Administración', { exact: true }).click();
  await page.getByRole('button', { name: /^Registrar gasto/ }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: `${nombre} está cerrado.` }),
  ).toBeVisible();
  await page.getByRole('link', { name: `Ir al cierre de ${nombre.toLowerCase()}` }).click();
  await expect(page).toHaveURL(new RegExp(`/empresa/cierre\\?mes=${mes}$`));
}
