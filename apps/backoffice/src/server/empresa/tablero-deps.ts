import 'server-only';

import { createHash } from 'node:crypto';

import {
  subirDocumento,
  type Adjunto,
  type Archivo,
  type TableroDeps,
} from '@xangarro/application/corp';
import {
  createCorpLedgerRepository,
  createDocumentRepository,
  createTableroRepository,
} from '@xangarro/data-corp';

import { almacenParaNuevos } from '../blobs';
import { requireCorpDb } from '../db/corp';
import { archivoDelForm } from './archivo';

/**
 * The Tablero's wiring (E-20): its repository, and the Expediente filing its
 * evidence, quotes, the mediator's rulings and the notices go through. They
 * all go to «Acuerdo de socios», where the agreement they enforce lives.
 */
export const tableroDeps = (): TableroDeps => ({
  tablero: createTableroRepository(requireCorpDb()),
});

export async function archivarEnExpediente(
  archivo: Archivo,
  titulo: string,
  hoy: string,
  founderId: string,
): Promise<string> {
  const db = requireCorpDb();
  const doc = await subirDocumento(
    {
      documentos: createDocumentRepository(db, almacenParaNuevos(db)),
      ledger: createCorpLedgerRepository(db),
      sha256: async (b) => createHash('sha256').update(b).digest('hex'),
    },
    {
      carpeta: 'acuerdo_socios',
      titulo,
      periodo: hoy.slice(0, 4),
      entryId: null,
      tipo: 'otro',
      archivo,
      hoy,
      founderId,
    },
  );
  return doc.id;
}

/** The form's file as an `Adjunto`, filed only when the use case calls it; null without one. */
export async function adjuntoDelForm(
  form: FormData,
  titulo: string,
  hoy: string,
  founderId: string,
): Promise<Adjunto | null> {
  const archivo = await archivoDelForm(form);
  return archivo === null ? null : () => archivarEnExpediente(archivo, titulo, hoy, founderId);
}
