import { randomBytes } from 'node:crypto';

import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { ACCOUNTS, CUENTAS_DEL_CATALOGO, type AccountKey } from '@xangarro/domain/corp';
import { strFromU8, unzipSync } from 'fflate';

/**
 * E-43's steps for empresa.spec.ts: the contador's package of a month long
 * before anything else writes (1971–1990; Cierre's test takes 1991–2009),
 * seeded as Cierre's is, and the códigos agrupadores typed in and validated.
 * `clearLedgerFixture` removes the month's entries and the suite's lists.
 */
export const MES_CONTADOR = (() => {
  const n = randomBytes(2).readUInt16BE(0) % 240;
  return `${1971 + Math.floor(n / 12)}-${String((n % 12) + 1).padStart(2, '0')}`;
})();

/** Illustrative codes, one per account, in the chart's order: Bancos is 100.01. */
export const codigoDe = (cuenta: AccountKey): string =>
  `${100 + CUENTAS_DEL_CATALOGO.indexOf(cuenta)}.01`;

/** Types each account's code, leaving out `salvo`, and saves them. */
export async function capturarCodigos(page: Page, salvo: AccountKey | null): Promise<void> {
  const form = page.getByTestId('codigos-form');
  for (const c of CUENTAS_DEL_CATALOGO) {
    await form
      .getByLabel(`Código agrupador de ${ACCOUNTS[c].nombre}`, { exact: true })
      .fill(c === salvo ? '' : codigoDe(c));
  }
  await form.getByRole('button', { name: 'Guardar los códigos' }).click();
}

/** The package as the route serves it, unzipped: path → text. */
export async function bajarPaquete(
  request: APIRequestContext,
  href: string,
): Promise<{ readonly tipo: string; readonly archivos: Readonly<Record<string, string>> }> {
  const r = await request.get(href);
  expect(r.status()).toBe(200);
  const tipo = r.headers()['content-type'] ?? '';
  const archivos = unzipSync(new Uint8Array(await r.body()));
  return {
    tipo,
    archivos: Object.fromEntries(Object.entries(archivos).map(([k, v]) => [k, strFromU8(v)])),
  };
}
