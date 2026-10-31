import type { CfdiRecibido, EstadoSat } from '@xangarro/domain/corp';

import type {
  ConsultaSat,
  FacturaRecibida,
  NuevaFactura,
  ReceivedInvoiceRepository,
  RegistroFactura,
} from '../../src/corp/index.js';

/** Received invoices in memory (E-11). */
export class FakeFacturas implements ReceivedInvoiceRepository {
  readonly filas = new Map<string, FacturaRecibida & { xml: Uint8Array }>();

  async porUuid(uuid: string) {
    return this.filas.get(uuid) ?? null;
  }
  async guardar(f: NuevaFactura) {
    if (this.filas.has(f.cfdi.uuid) && this.filas.get(f.cfdi.uuid)?.estado !== 'descartada') return;
    this.filas.set(f.cfdi.uuid, {
      cfdi: f.cfdi,
      xml: f.xml,
      archivo: f.archivo,
      estado: f.estado,
      estadoSat: f.estadoSat,
      categoria: null,
      projectId: null,
      entryId: null,
      pagoEntryId: null,
    });
  }
  async porRevisar() {
    return [...this.filas.values()].filter((f) => f.estado === 'por_revisar');
  }
  async xmlDe(uuid: string) {
    return this.filas.get(uuid)?.xml ?? null;
  }
  #cambiar(uuid: string, cambio: Partial<FacturaRecibida>) {
    const f = this.filas.get(uuid);
    if (f !== undefined) this.filas.set(uuid, { ...f, ...cambio });
  }
  async marcarRegistrada(uuid: string, r: RegistroFactura) {
    this.#cambiar(uuid, { ...r, estado: 'registrada' });
  }
  async marcarPagada(uuid: string, pagoEntryId: string) {
    this.#cambiar(uuid, { pagoEntryId });
  }
  async marcarCancelada(uuid: string) {
    this.#cambiar(uuid, { estado: 'cancelada' });
  }
  async descartar(uuid: string) {
    if (this.filas.get(uuid)?.estado === 'por_revisar')
      this.#cambiar(uuid, { estado: 'descartada' });
  }
  async recordadaPara(rfc: string) {
    const ultima = [...this.filas.values()]
      .filter((f) => f.cfdi.emisor.rfc === rfc && f.categoria !== null)
      .at(-1);
    return ultima?.categoria ? { categoria: ultima.categoria, projectId: ultima.projectId } : null;
  }
}

/** The SAT, answering per UUID; `vigente` unless told otherwise. */
export class FakeSat implements ConsultaSat {
  readonly respuestas = new Map<string, EstadoSat>();
  readonly preguntas: string[] = [];

  async estado(cfdi: CfdiRecibido) {
    this.preguntas.push(cfdi.uuid);
    return this.respuestas.get(cfdi.uuid) ?? 'vigente';
  }
}
