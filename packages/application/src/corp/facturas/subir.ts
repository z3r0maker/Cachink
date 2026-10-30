import {
  CfdiInvalidoError,
  leerCfdi,
  revisarAntesDelSat,
  revisarConSat,
  type CfdiRecibido,
  type MotivoCfdiInvalido,
  type Revision,
} from '@xangarro/domain/corp';

import { RfcMexiaPendienteError, SinArchivosError } from './errors.js';
import type { ConsultaSat, FacturaRecibida, ReceivedInvoiceRepository } from './ports.js';

/**
 * Uploading received invoices' XML (E-11, boards CD-06b and CD-06c): each
 * file is read, checked against MEXIA's RFC, the invoices already kept and
 * the SAT, and is either ready to register or set aside with its reason.
 */
export const MAX_ARCHIVOS = 25;
/** A CFDI is a few kilobytes; anything near a megabyte is not one. */
export const MAX_BYTES_XML = 1_048_576;

export type MotivoRechazo =
  | MotivoCfdiInvalido
  | 'muy_grande'
  | 'repetida'
  | 'otro_rfc'
  | 'ya_registrada'
  | 'no_encontrada'
  | 'cancelada';

export interface Rechazo {
  readonly archivo: string;
  readonly motivo: MotivoRechazo;
  /** Supplier and issue date, when the XML could be read. */
  readonly proveedor: string | null;
  readonly fecha: string | null;
  /** The movement it already posted («Ya registrada»). */
  readonly entryId: string | null;
}

export interface ResultadoSubida {
  /** UUIDs ready to register, in upload order. */
  readonly listas: readonly string[];
  readonly rechazos: readonly Rechazo[];
}

/** An uploaded file: its bytes, kept as evidence, and the same bytes read as UTF-8 text. */
export interface ArchivoXml {
  readonly nombre: string;
  readonly contenido: Uint8Array;
  readonly texto: string;
}

export interface SubirFacturasDeps {
  readonly facturas: ReceivedInvoiceRepository;
  readonly sat: ConsultaSat;
  /** MEXIA's RFC as recorded in Corporativo, or null while it is not. */
  readonly rfcMexia: () => Promise<string | null>;
}

type Paso =
  | { readonly tipo: 'lista'; readonly uuid: string }
  | { readonly tipo: 'rechazo'; readonly rechazo: Rechazo };

interface Contexto {
  readonly rfc: string;
  readonly founderId: string;
  readonly vistos: Set<string>;
}

type Leido = { readonly cfdi: CfdiRecibido; readonly xml: Uint8Array } | MotivoRechazo;

function leer(archivo: ArchivoXml): Leido {
  if (archivo.contenido.byteLength > MAX_BYTES_XML) return 'muy_grande';
  try {
    return { cfdi: leerCfdi(archivo.texto), xml: archivo.contenido };
  } catch (e) {
    if (e instanceof CfdiInvalidoError) return e.motivo;
    throw e;
  }
}

const rechazo = (
  archivo: ArchivoXml,
  motivo: MotivoRechazo,
  cfdi: CfdiRecibido | null = null,
  entryId: string | null = null,
): Paso => ({
  tipo: 'rechazo',
  rechazo: {
    archivo: archivo.nombre,
    motivo,
    proveedor: cfdi?.emisor.nombre ?? null,
    fecha: cfdi?.fecha ?? null,
    entryId,
  },
});

/** An upload of a UUID already kept: still waiting is fine, a cancelled one stays aside. */
const porLoGuardado = (archivo: ArchivoXml, cfdi: CfdiRecibido, guardada: FacturaRecibida): Paso =>
  guardada.estado === 'por_revisar'
    ? { tipo: 'lista', uuid: cfdi.uuid }
    : rechazo(archivo, 'cancelada', cfdi);

async function guardarSegunSat(
  deps: SubirFacturasDeps,
  ctx: Contexto,
  archivo: ArchivoXml,
  leido: { readonly cfdi: CfdiRecibido; readonly xml: Uint8Array },
  revision: Exclude<Revision, { tipo: 'rechazada' }>,
): Promise<Paso> {
  const cancelada = revision.tipo === 'cancelada';
  await deps.facturas.guardar({
    ...leido,
    archivo: archivo.nombre,
    estado: cancelada ? 'cancelada' : 'por_revisar',
    estadoSat: cancelada ? 'cancelado' : revision.verificada ? 'vigente' : 'sin_verificar',
    creadaPor: ctx.founderId,
  });
  return cancelada
    ? rechazo(archivo, 'cancelada', leido.cfdi)
    : { tipo: 'lista', uuid: leido.cfdi.uuid };
}

async function revisarArchivo(
  deps: SubirFacturasDeps,
  ctx: Contexto,
  archivo: ArchivoXml,
): Promise<Paso> {
  const leido = leer(archivo);
  if (typeof leido === 'string') return rechazo(archivo, leido);
  const { cfdi } = leido;
  if (ctx.vistos.has(cfdi.uuid)) return rechazo(archivo, 'repetida', cfdi);
  ctx.vistos.add(cfdi.uuid);
  const guardada = await deps.facturas.porUuid(cfdi.uuid);
  const yaRegistrada = guardada?.estado === 'registrada';
  const antes = revisarAntesDelSat(cfdi, { rfcMexia: ctx.rfc, yaRegistrada });
  if (antes?.tipo === 'rechazada') {
    return rechazo(archivo, antes.motivo, cfdi, yaRegistrada ? (guardada?.entryId ?? null) : null);
  }
  if (guardada !== null && guardada.estado !== 'descartada') {
    return porLoGuardado(archivo, cfdi, guardada);
  }
  const revision = revisarConSat(await deps.sat.estado(cfdi));
  if (revision.tipo === 'rechazada') return rechazo(archivo, revision.motivo, cfdi);
  return guardarSegunSat(deps, ctx, archivo, leido, revision);
}

export async function subirFacturas(
  deps: SubirFacturasDeps,
  input: { readonly archivos: readonly ArchivoXml[]; readonly founderId: string },
): Promise<ResultadoSubida> {
  if (input.archivos.length === 0 || input.archivos.length > MAX_ARCHIVOS) {
    throw new SinArchivosError(MAX_ARCHIVOS);
  }
  const rfc = (await deps.rfcMexia())?.trim() ?? '';
  if (rfc === '') throw new RfcMexiaPendienteError();
  const ctx: Contexto = { rfc, founderId: input.founderId, vistos: new Set() };
  const listas: string[] = [];
  const rechazos: Rechazo[] = [];
  for (const archivo of input.archivos) {
    const paso = await revisarArchivo(deps, ctx, archivo);
    if (paso.tipo === 'lista') listas.push(paso.uuid);
    else rechazos.push(paso.rechazo);
  }
  return { listas, rechazos };
}

/** «Cancelar» on the review: what was waiting is set aside, and can be uploaded again. */
export async function descartarRevision(facturas: ReceivedInvoiceRepository): Promise<number> {
  const pendientes = await facturas.porRevisar();
  for (const f of pendientes) await facturas.descartar(f.cfdi.uuid);
  return pendientes.length;
}
