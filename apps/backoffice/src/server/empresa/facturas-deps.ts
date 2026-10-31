import { createHash } from 'node:crypto';

import type { ArchivoXml } from '@xangarro/application/corp';
import {
  createCorpLedgerRepository,
  createDocumentRepository,
  createReceivedInvoiceRepository,
} from '@xangarro/data-corp';

import { requireCorpDb } from '../db/corp';
import { rfcDeMexia } from './facturas-lectura';
import { consultaSat } from './sat-consulta';

/** What every received-invoice write needs (E-11): the corp repositories, the SAT, MEXIA's RFC. */
export const facturasDeps = () => {
  const db = requireCorpDb();
  return {
    facturas: createReceivedInvoiceRepository(db),
    ledger: createCorpLedgerRepository(db),
    documentos: createDocumentRepository(db),
    sat: consultaSat(),
    rfcMexia: () => rfcDeMexia(db),
    sha256: async (b: Uint8Array) => createHash('sha256').update(b).digest('hex'),
  };
};

/** The form's `xml` files: their bytes, kept as evidence, and the same bytes as text. */
export async function archivosDe(form: FormData): Promise<ArchivoXml[]> {
  const files = form.getAll('xml').filter((f): f is File => f instanceof File && f.size > 0);
  return Promise.all(
    files.map(async (f) => {
      const contenido = new Uint8Array(await f.arrayBuffer());
      return { nombre: f.name, contenido, texto: new TextDecoder().decode(contenido) };
    }),
  );
}
