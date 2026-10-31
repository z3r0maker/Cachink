import type { Carpeta, Estado, TipoEvidencia } from '@xangarro/domain/corp';

/**
 * The Agenda's storage ports (E-04, ADR-124). `@xangarro/data-corp`
 * implements them over the corp schema; tests fake them in memory.
 */
export interface ObligacionGuardada {
  readonly id: string;
  readonly plantillaId: string;
  /** `YYYY-MM`, `YYYY`, or the event / expiry date `YYYY-MM-DD`. */
  readonly periodo: string;
  /** A one-off's own title («Cesión de la marca a MEXIA»); null uses the template's. */
  readonly titulo: string | null;
  readonly estado: Estado;
  /** Closed as pagada with nothing to pay. */
  readonly sinPago: boolean;
}

export interface AgendaRepository {
  /** MEXIA's SAT registration date, `YYYY-MM-DD`; null until a founder sets it. */
  inscripcionRfc(): Promise<string | null>;
  guardarInscripcion(fecha: string, founderId: string): Promise<void>;
  obligaciones(): Promise<readonly ObligacionGuardada[]>;
  buscar(plantillaId: string, periodo: string): Promise<ObligacionGuardada | null>;
  /** The row for this period, created pendiente when it does not exist yet. */
  asegurar(
    plantillaId: string,
    periodo: string,
    titulo: string | null,
    founderId: string,
  ): Promise<ObligacionGuardada>;
  cambiarEstado(
    id: string,
    estado: Estado,
    sinPago: boolean,
    founderId: string,
  ): Promise<ObligacionGuardada>;
}

export interface NuevoDocumento {
  readonly tipo: TipoEvidencia;
  readonly carpeta: Carpeta;
  /** What the founders call it; every version of a document shares it. */
  readonly titulo: string;
  /** `YYYY-MM`, `YYYY`, or null. */
  readonly periodo: string | null;
  readonly nombre: string;
  readonly mime: string;
  readonly contenido: Uint8Array;
  /** Hex SHA-256 of `contenido`. */
  readonly sha256: string;
  readonly obligacionId: string | null;
  /** The ledger entry it proves (a factura, a bank statement line). */
  readonly entryId: string | null;
  /** The version this one supersedes (E-05). */
  readonly reemplazaA: string | null;
  readonly retenerHasta: string;
  readonly subidoPor: string;
}

/** Which `BlobStore` holds a document's bytes (E-26, ADR-127 §5). */
export type Almacen = 'pg' | 'azure';

/**
 * Where a document's bytes are kept, by key (E-26, ADR-127 §5): Postgres
 * (`corp.blobs`) today, Azure Blob immutable storage once it exists. A key is
 * written once and never changed or deleted; the store refuses a second write.
 */
export interface BlobStore {
  readonly almacen: Almacen;
  /** The largest file this store takes, in bytes. */
  readonly maxBytes: number;
  guardar(key: string, bytes: Uint8Array, mime: string): Promise<void>;
  leer(key: string): Promise<Uint8Array | null>;
}

export interface DocumentoMeta {
  readonly id: string;
  /** Which store holds the bytes, and under what key. */
  readonly almacen: Almacen;
  readonly blobKey: string;
  readonly tipo: TipoEvidencia;
  readonly carpeta: Carpeta;
  readonly titulo: string;
  readonly periodo: string | null;
  readonly nombre: string;
  readonly mime: string;
  readonly tamano: number;
  readonly sha256: string;
  readonly obligacionId: string | null;
  readonly entryId: string | null;
  readonly retenerHasta: string;
  /** The earlier version this one supersedes (E-05). */
  readonly reemplazaA: string | null;
  readonly subidoPor: string;
  readonly subidoEn: string;
}

export interface DocumentRepository {
  /** The largest file the store behind this repository takes, in bytes. */
  readonly maxBytes: number;
  /** Stores the bytes, then the row: a failed insert leaves only an unread blob. */
  guardar(doc: NuevoDocumento): Promise<DocumentoMeta>;
  /** The current (not superseded) documents of an obligation. */
  porObligacion(obligacionId: string): Promise<readonly DocumentoMeta[]>;
  porId(id: string): Promise<DocumentoMeta | null>;
  /** The id of the version that superseded `id`, or null while it is current. */
  reemplazadoPor(id: string): Promise<string | null>;
}
