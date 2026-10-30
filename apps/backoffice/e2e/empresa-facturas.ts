import { expect, type Page } from '@playwright/test';
import { cfdiXml, RFC_MEXIA_PRUEBA, uuidDePrueba, type CfdiDePrueba } from '@xangarro/testing/corp';
import postgres from 'postgres';

/**
 * E-11's steps for empresa.spec.ts: MEXIA's RFC recorded, five XML uploaded
 * at once (two refused), three registered, one on credit paid and another
 * cancelled. The console's SAT query is simulated (`CORP_SAT_CONSULTA`): a
 * UUID starting `00000000` comes back cancelled.
 */
export const DESPACHO = { rfc: 'DJU010101AB1', nombre: 'Despacho jurídico E2E, S.C.' };
export const IMPRENTA = { rfc: 'IMP010101AB1', nombre: 'Imprenta E2E, S.A. de C.V.' };
export const AGENCIA = { rfc: 'AGE010101AB1', nombre: 'Agencia E2E, S.A. de C.V.' };
export const HONORARIOS = 'ANA LÓPEZ MARTÍNEZ';

/** The suite's received invoices are dated this month, so Facturas opens on them. */
const fechaDelMes = (): string =>
  `${new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }).slice(0, 7)}-01`;

/** The «RFC de MEXIA» registry, as a founder fills it in Corporativo; `devolverEmpresa` restores it. */
export async function fijarRfcMexia(): Promise<void> {
  const sql = postgres(process.env.DATABASE_SUPER_URL ?? '', { max: 1, onnotice: () => {} });
  try {
    await sql`UPDATE corp.registries SET referencia = ${RFC_MEXIA_PRUEBA} WHERE id = 'rfc'`;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

const archivo = (name: string, o: CfdiDePrueba) => ({
  name,
  mimeType: 'application/xml',
  buffer: Buffer.from(cfdiXml({ fecha: fechaDelMes(), ...o })),
});

const SIN_RETENCIONES = { isr: '0.00', ivaRetenido: '0.00' } as const;

/** Uploads five XML; returns the paid invoice's file, to upload it again later. */
export async function subirCinco(page: Page) {
  const honorarios = archivo('contador.xml', { uuid: uuidDePrueba() });
  await page.getByLabel('Elegir archivos').setInputFiles([
    honorarios,
    archivo('despacho.xml', {
      emisor: DESPACHO,
      metodoPago: 'PPD',
      subtotal: '4000.00',
      iva: '640.00',
      ...SIN_RETENCIONES,
    }),
    archivo('imprenta.xml', { emisor: IMPRENTA, metodoPago: 'PPD', ...SIN_RETENCIONES }),
    archivo('cancelada.xml', { uuid: `00000000${uuidDePrueba().slice(8)}`, emisor: AGENCIA }),
    archivo('papeleria.xml', { receptor: 'OTR010101AA1' }),
  ]);
  await expect(page).toHaveURL(/\/empresa\/facturas\/revisar\?subidas=1$/);
  return honorarios;
}

/** Picks «Administración» on each card and registers the three. */
export async function registrarTres(page: Page) {
  for (const proveedor of [HONORARIOS, DESPACHO.nombre, IMPRENTA.nombre]) {
    const card = page.getByRole('article', { name: proveedor });
    await card.getByText('Administración', { exact: true }).click();
  }
  await page.getByRole('button', { name: 'Registrar 3 facturas' }).click();
  await expect(page).toHaveURL(/\/empresa\/facturas$/);
}

export const fila = (page: Page, proveedor: string) =>
  page.getByTestId('factura-recibida').filter({ hasText: proveedor });

/** Board CD-06d's supplier: honorarios with both withholdings, new to the suite. */
export const CONTADORA = { rfc: 'COCO800101AB3', nombre: 'Contadora E2E' };

export const hoyMx = (): string =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

/** Attaches one XML on Registrar gasto. */
export async function adjuntar(page: Page, name: string, o: CfdiDePrueba = {}) {
  await page.getByLabel('Elegir el XML de la factura').setInputFiles(archivo(name, o));
}
