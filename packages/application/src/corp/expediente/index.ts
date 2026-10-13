import {
  assertArchivo,
  isCarpeta,
  periodoValido,
  retenerHasta,
  type TipoEvidencia,
} from '@xangarro/domain/corp';

import type { DocumentoMeta, DocumentRepository } from '../agenda/ports.js';
import { MovimientoDesconocidoError } from '../errors.js';
import type { CorpLedgerRepository } from '../ports.js';

/**
 * The Expediente's writes (E-05): file a document that no obligation asked
 * for (an acta, a contract, a movement's factura), and upload a new version
 * of one. Nothing is deleted; a new version names the one it supersedes.
 */
export class DocumentoInvalidoError extends Error {
  readonly code = 'DOCUMENTO_INVALIDO' as const;
  constructor(message: string) {
    super(message);
    this.name = 'DocumentoInvalidoError';
  }
}

export class DocumentoDesconocidoError extends Error {
  readonly code = 'DOCUMENTO_DESCONOCIDO' as const;
  constructor(readonly documentoId: string) {
    super('Ese documento no existe.');
    this.name = 'DocumentoDesconocidoError';
  }
}

export class YaReemplazadoError extends Error {
  readonly code = 'YA_REEMPLAZADO' as const;
  constructor(readonly documentoId: string) {
    super('Esa versión ya se reemplazó: sube la nueva sobre la vigente.');
    this.name = 'YaReemplazadoError';
  }
}

export interface Archivo {
  readonly nombre: string;
  readonly mime: string;
  readonly contenido: Uint8Array;
}

export interface ExpedienteDeps {
  readonly documentos: DocumentRepository;
  readonly ledger: CorpLedgerRepository;
  readonly sha256: (bytes: Uint8Array) => Promise<string>;
}

export interface SubirDocumentoInput {
  readonly carpeta: string;
  readonly titulo: string;
  /** `YYYY-MM`, `YYYY`, or empty. */
  readonly periodo: string;
  /** The ledger entry the document proves, if any. */
  readonly entryId: string | null;
  readonly tipo: TipoEvidencia;
  readonly archivo: Archivo;
  readonly hoy: string;
  readonly founderId: string;
}

export async function subirDocumento(
  deps: ExpedienteDeps,
  input: SubirDocumentoInput,
): Promise<DocumentoMeta> {
  const { archivo } = input;
  assertArchivo(archivo.nombre, archivo.mime, archivo.contenido.byteLength);
  if (!isCarpeta(input.carpeta)) throw new DocumentoInvalidoError('Elige la carpeta.');
  const titulo = input.titulo.trim();
  if (titulo === '') throw new DocumentoInvalidoError('Escribe el nombre del documento.');
  if (!periodoValido(input.periodo)) {
    throw new DocumentoInvalidoError('El periodo es un mes (2026-09) o un año (2026).');
  }
  if (input.entryId !== null && (await deps.ledger.findById(input.entryId)) === null) {
    throw new MovimientoDesconocidoError(input.entryId);
  }
  return deps.documentos.guardar({
    tipo: input.tipo,
    carpeta: input.carpeta,
    titulo,
    periodo: input.periodo === '' ? null : input.periodo,
    nombre: archivo.nombre.trim(),
    mime: archivo.mime,
    contenido: archivo.contenido,
    sha256: await deps.sha256(archivo.contenido),
    obligacionId: null,
    entryId: input.entryId,
    reemplazaA: null,
    retenerHasta: retenerHasta(input.hoy),
    subidoPor: input.founderId,
  });
}

/** A new version keeps everything but the file; the old one stays, superseded. */
export async function subirVersion(
  deps: Omit<ExpedienteDeps, 'ledger'>,
  input: {
    readonly documentoId: string;
    readonly archivo: Archivo;
    readonly hoy: string;
    readonly founderId: string;
  },
): Promise<DocumentoMeta> {
  const { archivo } = input;
  assertArchivo(archivo.nombre, archivo.mime, archivo.contenido.byteLength);
  const anterior = await deps.documentos.porId(input.documentoId);
  if (anterior === null) throw new DocumentoDesconocidoError(input.documentoId);
  if ((await deps.documentos.reemplazadoPor(anterior.id)) !== null) {
    throw new YaReemplazadoError(anterior.id);
  }
  return deps.documentos.guardar({
    tipo: anterior.tipo,
    carpeta: anterior.carpeta,
    titulo: anterior.titulo,
    periodo: anterior.periodo,
    nombre: archivo.nombre.trim(),
    mime: archivo.mime,
    contenido: archivo.contenido,
    sha256: await deps.sha256(archivo.contenido),
    obligacionId: anterior.obligacionId,
    entryId: anterior.entryId,
    reemplazaA: anterior.id,
    retenerHasta: retenerHasta(input.hoy),
    subidoPor: input.founderId,
  });
}
