import {
  gastoDeCfdi,
  periodOf,
  refFactura,
  retenerHasta,
  type CategoriaGasto,
} from '@xangarro/domain/corp';

import type { DocumentRepository } from '../agenda/ports.js';
import type { CorpLedgerRepository, LedgerEntry } from '../ports.js';
import { RegistrarMovimientoUseCase } from '../registrar-movimiento.js';
import { FacturaDesconocidaError, FacturaNoPendienteError } from './errors.js';
import type { FacturaRecibida, ReceivedInvoiceRepository } from './ports.js';

/**
 * Registering received invoices (E-11, owner decision 9): each posts its
 * expense, paid when PUE and owed when PPD, and files its XML in the
 * Expediente next to the movement.
 *
 * Every entry is `source = 'cfdi'` keyed by the UUID, so a retry posts
 * nothing twice.
 */
export interface FacturasDeps {
  readonly facturas: ReceivedInvoiceRepository;
  readonly ledger: CorpLedgerRepository;
}

export interface RegistrarFacturasDeps extends FacturasDeps {
  readonly documentos: DocumentRepository;
  readonly sha256: (bytes: Uint8Array) => Promise<string>;
}

export interface Seleccion {
  readonly uuid: string;
  readonly categoria: CategoriaGasto;
  readonly projectId: string | null;
  /** The founder's wording (board CD-06d); blank keeps the XML's. */
  readonly concepto?: string;
  /** The day a paid (PUE) invoice left the bank; one on credit keeps its own date. */
  readonly fecha?: string;
}

export async function factura(deps: FacturasDeps, uuid: string): Promise<FacturaRecibida> {
  const f = await deps.facturas.porUuid(uuid);
  if (f === null) throw new FacturaDesconocidaError(uuid);
  return f;
}

export const proveedor = (f: FacturaRecibida) => f.cfdi.emisor.nombre.trim() || f.cfdi.emisor.rfc;

async function archivar(
  deps: RegistrarFacturasDeps,
  f: FacturaRecibida,
  entryId: string,
  hoy: string,
  founderId: string,
) {
  const contenido = await deps.facturas.xmlDe(f.cfdi.uuid);
  if (contenido === null) return;
  await deps.documentos.guardar({
    tipo: 'otro',
    carpeta: 'comprobantes',
    titulo: `Factura ${f.cfdi.folio ?? f.cfdi.uuid.slice(0, 8)} · ${proveedor(f)}`,
    periodo: periodOf(f.cfdi.fecha),
    nombre: f.archivo,
    mime: 'application/xml',
    contenido,
    sha256: await deps.sha256(contenido),
    obligacionId: null,
    entryId,
    reemplazaA: null,
    retenerHasta: retenerHasta(hoy),
    subidoPor: founderId,
  });
}

/** The movement's date and concept: the founder's, where the invoice allows it. */
function conceptoYFecha(f: FacturaRecibida, s: Seleccion) {
  const concepto = s.concepto?.trim() || f.cfdi.concepto || `Factura de ${proveedor(f)}`;
  const fecha = f.cfdi.metodoPago === 'PUE' && s.fecha ? s.fecha : f.cfdi.fecha;
  return { concepto, fecha };
}

async function registrarUna(
  deps: RegistrarFacturasDeps,
  s: Seleccion,
  ctx: { readonly founderId: string; readonly hoy: string },
): Promise<LedgerEntry> {
  const f = await factura(deps, s.uuid);
  if (f.estado === 'registrada' && f.entryId !== null) {
    const ya = await deps.ledger.findById(f.entryId);
    if (ya !== null) return ya;
  }
  if (f.estado !== 'por_revisar') throw new FacturaNoPendienteError(s.uuid);
  const entry = await new RegistrarMovimientoUseCase(deps.ledger).execute({
    ...conceptoYFecha(f, s),
    projectId: s.projectId,
    contraparte: proveedor(f),
    founderId: ctx.founderId,
    source: 'cfdi',
    sourceRef: refFactura(f.cfdi.uuid),
    usd: f.cfdi.usd,
    deducible: true,
    movement: gastoDeCfdi(f.cfdi, s.categoria),
  });
  await deps.facturas.marcarRegistrada(f.cfdi.uuid, {
    categoria: s.categoria,
    projectId: s.projectId,
    entryId: entry.id,
  });
  await archivar(deps, f, entry.id, ctx.hoy, ctx.founderId);
  return entry;
}

/** Registers the reviewed invoices, in order; one that fails stops the rest. */
export async function registrarFacturas(
  deps: RegistrarFacturasDeps,
  input: {
    readonly selecciones: readonly Seleccion[];
    readonly founderId: string;
    readonly hoy: string;
  },
): Promise<readonly LedgerEntry[]> {
  const entries: LedgerEntry[] = [];
  for (const s of input.selecciones) entries.push(await registrarUna(deps, s, input));
  return entries;
}
