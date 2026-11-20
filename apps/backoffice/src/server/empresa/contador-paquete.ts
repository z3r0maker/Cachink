import 'server-only';

import type { DocumentoMeta, FuentesDelPaquete, Paquete } from '@xangarro/application/corp';
import {
  createCierreRepository,
  createCodigosRepository,
  createPgBlobStore,
  listarDocumentos,
  sumasPorTramo,
  xmlsDelPaquete,
  type CorpDb,
} from '@xangarro/data-corp';
import { ingresosDelPeriodo } from '@xangarro/data-pg';
import { comprobantesDelMes } from '@xangarro/domain/corp';
import { strToU8, zipSync, type Zippable } from 'fflate';

import { azureBlobs } from '../blobs';
import { db } from '../db/client';
import { requireCorpDb } from '../db/corp';
import { emitidasDelPaquete } from './contador-emitidas';

/**
 * Where the contador's package comes from (E-43): the corp ledger, the codes,
 * the month's issued CFDIs from the ADR-070 tables, the received XMLs and the
 * Expediente's files, read from the store each row names. Zipped in memory:
 * one month of a small company is a few megabytes.
 */
function leerDe(corp: CorpDb, d: DocumentoMeta): () => Promise<Uint8Array | null> {
  if (d.almacen === 'pg') return () => createPgBlobStore(corp).leer(d.blobKey);
  return async () => (await azureBlobs()?.store.leer(d.blobKey)) ?? null;
}

export function fuentesDelPaquete(): FuentesDelPaquete {
  const corp = requireCorpDb();
  return {
    codigos: createCodigosRepository(corp),
    sumas: (mes) => sumasPorTramo(corp, mes),
    cerrado: async (mes) => (await createCierreRepository(corp).cerrados()).has(mes),
    emitidas: async (mes) => emitidasDelPaquete(await ingresosDelPeriodo(db(), mes)).cfdis,
    recibidas: (mes) => xmlsDelPaquete(corp, mes),
    comprobantes: async (mes) =>
      comprobantesDelMes(await listarDocumentos(corp), mes).map((d) => ({
        nombre: d.nombre,
        leer: leerDe(corp, d),
      })),
  };
}

/** The package as one .zip; a CSV is written as UTF-8. */
export function zipDelPaquete(p: Paquete, mtime: Date): Uint8Array {
  const archivos: Zippable = {};
  for (const a of p.archivos)
    archivos[a.ruta] = [typeof a.contenido === 'string' ? strToU8(a.contenido) : a.contenido, {}];
  return zipSync(archivos, { level: 6, mtime });
}
