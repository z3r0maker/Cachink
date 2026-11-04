import { expect, type Page } from '@playwright/test';
import { uuidDePrueba } from '@xangarro/testing/corp';
import postgres from 'postgres';

import { archivo } from './empresa-facturas';

/**
 * E-11's «Consultar al SAT» steps for empresa.spec.ts (board CD-06g). The
 * simulated SAT gives no answer for a UUID starting `EEEEEEEE`, so that
 * invoice is registered unverified. The SAT's later word on the other two is
 * set in the database, as if it had answered since: the move itself is the
 * application's and data-corp's tests'.
 */
export const MENSAJERIA = { rfc: 'MEN010101AB1', nombre: 'Mensajería E2E, S.A. de C.V.' };
export const HOSTING = { rfc: 'HOS010101AB1', nombre: 'Hosting E2E, S.A. de C.V.' };
export const DISENADOR = { rfc: 'DIS010101AB1', nombre: 'Diseño E2E, S.A. de C.V.' };

const SIN_RETENCIONES = { isr: '0.00', ivaRetenido: '0.00' } as const;

/** Uploads and registers the three; returns their UUIDs. */
export async function registrarParaConsultar(page: Page) {
  const uuids = {
    mensajeria: `EEEEEEEE${uuidDePrueba().slice(8)}`,
    hosting: uuidDePrueba(),
    disenador: uuidDePrueba(),
  };
  await page.getByLabel('Elegir archivos').setInputFiles([
    archivo('mensajeria.xml', { uuid: uuids.mensajeria, emisor: MENSAJERIA, ...SIN_RETENCIONES }),
    archivo('hosting.xml', { uuid: uuids.hosting, emisor: HOSTING, ...SIN_RETENCIONES }),
    archivo('diseno.xml', {
      uuid: uuids.disenador,
      emisor: DISENADOR,
      metodoPago: 'PPD',
      subtotal: '1000.00',
      iva: '160.00',
      ...SIN_RETENCIONES,
    }),
  ]);
  await expect(page).toHaveURL(/\/empresa\/facturas\/revisar\?subidas=1$/);
  await expect(page.getByRole('article', { name: MENSAJERIA.nombre })).toContainText(
    'Sin verificar en el SAT',
  );
  for (const p of [MENSAJERIA, HOSTING, DISENADOR]) {
    await page
      .getByRole('article', { name: p.nombre })
      .getByText('Administración', { exact: true })
      .click();
  }
  await page.getByRole('button', { name: 'Registrar 3 facturas' }).click();
  await expect(page).toHaveURL(/\/empresa\/facturas$/);
  return uuids;
}

/** What the SAT said of an invoice, as if it had answered since it was registered. */
export async function fijarEstadoSat(uuid: string, estado: 'sin_verificar' | 'cancelado') {
  const sql = postgres(process.env.DATABASE_SUPER_URL ?? '', { max: 1, onnotice: () => {} });
  try {
    await sql`UPDATE corp.received_invoices SET estado_sat = ${estado} WHERE uuid = ${uuid}`;
  } finally {
    await sql.end({ timeout: 5 });
  }
}
