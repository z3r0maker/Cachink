import {
  assertArchivo,
  assertTransicion,
  esRecurrente,
  ObligacionDesconocidaError,
  retenerHasta,
  type Paso,
  type TipoEvidencia,
} from '@xangarro/domain/corp';

import { ConceptoRequeridoError } from '../errors.js';
import { InscripcionFuturaError } from './errors.js';
import { assertFecha, instanciaDe, plantillaVigente } from './obligacion.js';
import type {
  AgendaRepository,
  DocumentoMeta,
  DocumentRepository,
  ObligacionGuardada,
} from './ports.js';

/**
 * The Agenda's four writes (E-04): set the SAT registration, add a dated
 * one-off, attach evidence, move a step. Each is a small function over the
 * ports; the rules are the domain's.
 */
export async function guardarInscripcion(
  agenda: AgendaRepository,
  input: { readonly fecha: string; readonly hoy: string; readonly founderId: string },
): Promise<void> {
  assertFecha(input.fecha);
  if (input.fecha > input.hoy) throw new InscripcionFuturaError(input.fecha);
  await agenda.guardarInscripcion(input.fecha, input.founderId);
}

export interface AgregarVencimientoInput {
  readonly plantillaId: string;
  /** The event's date, or the certificate's expiry. */
  readonly fecha: string;
  /** Required for a generic «trámite». */
  readonly titulo: string;
  readonly founderId: string;
}

export async function agregarVencimiento(
  agenda: AgendaRepository,
  input: AgregarVencimientoInput,
): Promise<ObligacionGuardada> {
  const p = plantillaVigente(input.plantillaId);
  if (esRecurrente(p)) throw new ObligacionDesconocidaError(p.id);
  assertFecha(input.fecha);
  const titulo = input.titulo.trim();
  if (p.id === 'tramite' && titulo === '') throw new ConceptoRequeridoError();
  return agenda.asegurar(p.id, input.fecha, titulo === '' ? null : titulo, input.founderId);
}

export interface SubirEvidenciaInput {
  readonly plantillaId: string;
  readonly periodo: string;
  readonly tipo: TipoEvidencia;
  readonly nombre: string;
  readonly mime: string;
  readonly contenido: Uint8Array;
  readonly hoy: string;
  readonly founderId: string;
}

export async function subirEvidencia(
  deps: {
    readonly agenda: AgendaRepository;
    readonly documentos: DocumentRepository;
    readonly sha256: (bytes: Uint8Array) => Promise<string>;
  },
  input: SubirEvidenciaInput,
): Promise<DocumentoMeta> {
  assertArchivo(input.nombre, input.mime, input.contenido.byteLength);
  const p = plantillaVigente(input.plantillaId);
  const instancia = await instanciaDe(deps.agenda, p, input.periodo, input.founderId);
  return deps.documentos.guardar({
    tipo: input.tipo,
    nombre: input.nombre.trim(),
    mime: input.mime,
    contenido: input.contenido,
    sha256: await deps.sha256(input.contenido),
    obligacionId: instancia.id,
    retenerHasta: retenerHasta(input.hoy),
    subidoPor: input.founderId,
  });
}

export interface MarcarInput {
  readonly plantillaId: string;
  readonly periodo: string;
  readonly nuevo: Paso;
  readonly sinPago: boolean;
  readonly founderId: string;
}

export async function marcarObligacion(
  deps: { readonly agenda: AgendaRepository; readonly documentos: DocumentRepository },
  input: MarcarInput,
): Promise<ObligacionGuardada> {
  const p = plantillaVigente(input.plantillaId);
  const instancia = await instanciaDe(deps.agenda, p, input.periodo, input.founderId);
  const docs = await deps.documentos.porObligacion(instancia.id);
  const sinPago = input.nuevo === 'pagada' && input.sinPago;
  assertTransicion(p, {
    actual: instancia.estado,
    nuevo: input.nuevo,
    evidencias: new Set(docs.map((d) => d.tipo)),
    sinPago,
  });
  return deps.agenda.cambiarEstado(instancia.id, input.nuevo, sinPago, input.founderId);
}
