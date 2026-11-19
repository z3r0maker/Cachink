import { randomUUID } from 'node:crypto';

import { expect, type Page } from '@playwright/test';
import {
  RegistrarMovimientoUseCase,
  type RegistrarMovimientoInput,
} from '@xangarro/application/corp';
import {
  createAgendaRepository,
  createCorpDb,
  createCorpLedgerRepository,
  createDeclaracionRepository,
  fuentesFiscales,
} from '@xangarro/data-corp';
import {
  estimadosDeImpuestos,
  mesesFiscales,
  type EstimadoDelMes,
  type Movement,
} from '@xangarro/domain/corp';

/**
 * E-13's steps for empresa.spec.ts: a cobro and a fee with withholdings in a
 * month, the estimate the page should show for it (worked out the page's own
 * way, since other tests post in the same month), the drawer, and a paper.
 */
const db = () => createCorpDb(process.env.CORP_DATABASE_URL ?? '', 1);

const mov = (fecha: string, movement: Movement): RegistrarMovimientoInput => ({
  fecha,
  projectId: 'xangarro',
  concepto: `E2E impuestos ${movement.kind} ${randomUUID().slice(0, 8)}`,
  contraparte: null,
  founderId: 'e2e-impuestos',
  source: 'manual',
  sourceRef: null,
  usd: null,
  deducible: true,
  movement,
});

/** A $10,000 cobro and the contador's $3,500 fee with its withholdings, on the 5th. */
export async function sembrarMesFiscal(mes: string): Promise<void> {
  const conn = db();
  const registrar = new RegistrarMovimientoUseCase(createCorpLedgerRepository(conn));
  await registrar.execute(
    mov(`${mes}-05`, { kind: 'cobro', subtotal: 10_000_00n, iva: 1_600_00n, destino: 'bancos' }),
  );
  await registrar.execute(
    mov(`${mes}-05`, {
      kind: 'gasto',
      categoria: 'administracion',
      subtotal: 3_500_00n,
      iva: 560_00n,
      tratamientoIva: 'acreditable',
      retencionIsr: 350_00n,
      retencionIva: 373_33n,
      pagado: true,
    }),
  );
  await conn.$client.end({ timeout: 5 });
}

/** The month's estimate from what the ledger holds now, as Impuestos reads it. */
export async function esperadoDe(mes: string): Promise<EstimadoDelMes> {
  const conn = db();
  const inscripcion = await createAgendaRepository(conn).inscripcionRfc();
  const desde = (inscripcion ?? `${mes.slice(0, 4)}-01-01`).slice(0, 7);
  const [fuentes, declaradas] = await Promise.all([
    fuentesFiscales(conn, desde, mes),
    createDeclaracionRepository(conn).lista(desde, mes),
  ]);
  await conn.$client.end({ timeout: 5 });
  const e = estimadosDeImpuestos(
    mesesFiscales(fuentes),
    new Map(declaradas.map((d) => [d.periodo, d])),
  ).find((x) => x.mes === mes);
  if (e === undefined) throw new Error(`no estimate for ${mes}`);
  return e;
}

const pesos = (centavos: bigint) => (Number(centavos) / 100).toFixed(2);

export interface Cifras {
  readonly isr: bigint;
  readonly iva: bigint;
  readonly retencionIsr: bigint;
  readonly retencionIva: bigint;
}

/** Opens the drawer, types the contador's four figures and saves them. */
export async function capturarDeclaracion(page: Page, c: Cifras, revisar: boolean): Promise<void> {
  await page
    .getByRole('link', { name: /^(Capturar|Editar) la declaración$/ })
    .first()
    .click();
  const cajon = page.getByRole('dialog', { name: 'Lo que declaró el contador' });
  await cajon.getByLabel('ISR provisional a pagar').fill(pesos(c.isr));
  await cajon.getByLabel('IVA a pagar').fill(pesos(c.iva));
  await cajon.getByLabel('ISR retenido').fill(pesos(c.retencionIsr));
  await cajon.getByLabel('IVA retenido').fill(pesos(c.retencionIva));
  if (revisar) await expect(cajon.getByText(/Revisa con el contador\./)).toBeVisible();
  await cajon.getByRole('button', { name: 'Guardar la declaración' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

const PDF = (que: string) => Buffer.from(`%PDF-1.4\n% ${que} de prueba\n%%EOF\n`);

/** Uploads one of the month's three papers from its own row. */
export async function subirPapel(page: Page, nombre: string, archivo: string): Promise<void> {
  const fila = page.getByTestId('papel').filter({ hasText: nombre });
  await fila
    .getByLabel(/^(Archivo|Otra versión)$/)
    .setInputFiles({ name: archivo, mimeType: 'application/pdf', buffer: PDF(nombre) });
  await fila.getByRole('button', { name: 'Subir' }).click();
  await expect(page.getByTestId('papel').filter({ hasText: nombre })).toHaveAttribute(
    'data-listo',
    'si',
  );
}
