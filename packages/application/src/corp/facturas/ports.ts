import type { CategoriaGasto, CfdiRecibido, EstadoSat } from '@xangarro/domain/corp';

/**
 * Received invoices' storage and the SAT's status service (E-11).
 *
 * An uploaded invoice waits «por revisar» until a founder registers it,
 * which posts its expense; a cancelled one is kept, flagged, and posts
 * nothing. The XML stays on the row; registering also files it in the
 * Expediente next to its movement. Leaving the review discards what was
 * waiting; nothing is deleted, and a discarded upload can come again.
 */
export type EstadoFactura = 'por_revisar' | 'registrada' | 'cancelada' | 'descartada';

/** What the SAT said when the invoice was uploaded; «sin verificar» when it did not answer. */
export type EstadoSatGuardado = 'vigente' | 'cancelado' | 'sin_verificar';

export interface FacturaRecibida {
  readonly cfdi: CfdiRecibido;
  readonly archivo: string;
  readonly estado: EstadoFactura;
  readonly estadoSat: EstadoSatGuardado;
  readonly categoria: CategoriaGasto | null;
  readonly projectId: string | null;
  /** The expense it posted, once registered. */
  readonly entryId: string | null;
  /** The payment of an invoice on credit, once paid. */
  readonly pagoEntryId: string | null;
}

export interface NuevaFactura {
  readonly cfdi: CfdiRecibido;
  /** The file exactly as uploaded: the evidence keeps the supplier's bytes. */
  readonly xml: Uint8Array;
  readonly archivo: string;
  readonly estado: 'por_revisar' | 'cancelada';
  readonly estadoSat: EstadoSatGuardado;
  readonly creadaPor: string;
}

export interface RegistroFactura {
  readonly categoria: CategoriaGasto;
  readonly projectId: string | null;
  readonly entryId: string;
}

export interface ReceivedInvoiceRepository {
  porUuid(uuid: string): Promise<FacturaRecibida | null>;
  /** Writes it unless its UUID is kept: a second upload is a no-op, a discarded one comes back. */
  guardar(factura: NuevaFactura): Promise<void>;
  /** Waiting for review, oldest upload first. */
  porRevisar(): Promise<readonly FacturaRecibida[]>;
  xmlDe(uuid: string): Promise<Uint8Array | null>;
  marcarRegistrada(uuid: string, registro: RegistroFactura): Promise<void>;
  marcarPagada(uuid: string, pagoEntryId: string): Promise<void>;
  marcarCancelada(uuid: string): Promise<void>;
  /** Sets aside an upload still waiting for review; a registered or cancelled one stays. */
  descartar(uuid: string): Promise<void>;
  /** The category and project of the supplier's last registered invoice. */
  recordadaPara(rfc: string): Promise<Omit<RegistroFactura, 'entryId'> | null>;
}

/** The SAT's CFDI status service. Never throws: no answer is `sin_respuesta`. */
export interface ConsultaSat {
  estado(cfdi: CfdiRecibido): Promise<EstadoSat>;
}
