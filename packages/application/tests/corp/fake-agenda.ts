import type {
  AgendaRepository,
  DocumentoMeta,
  DocumentRepository,
  NuevoDocumento,
  ObligacionGuardada,
} from '../../src/corp/index.js';

/** The Agenda's ports in memory (E-04). */
export class FakeAgenda implements AgendaRepository {
  inscripcion: string | null = '2026-09-04';
  readonly rows: ObligacionGuardada[] = [];

  async inscripcionRfc() {
    return this.inscripcion;
  }
  async guardarInscripcion(fecha: string) {
    this.inscripcion = fecha;
  }
  async obligaciones() {
    return this.rows;
  }
  async buscar(plantillaId: string, periodo: string) {
    return this.rows.find((r) => r.plantillaId === plantillaId && r.periodo === periodo) ?? null;
  }
  async asegurar(plantillaId: string, periodo: string, titulo: string | null) {
    const found = await this.buscar(plantillaId, periodo);
    if (found !== null) return found;
    const row: ObligacionGuardada = {
      id: `o${this.rows.length + 1}`,
      plantillaId,
      periodo,
      titulo,
      estado: 'pendiente',
      sinPago: false,
    };
    this.rows.push(row);
    return row;
  }
  async cambiarEstado(id: string, estado: ObligacionGuardada['estado'], sinPago: boolean) {
    const i = this.rows.findIndex((r) => r.id === id);
    const row = { ...this.rows[i]!, estado, sinPago };
    this.rows[i] = row;
    return row;
  }
}

export class FakeDocumentos implements DocumentRepository {
  readonly docs: DocumentoMeta[] = [];

  async guardar(doc: NuevoDocumento) {
    const { contenido, ...rest } = doc;
    const meta = {
      ...rest,
      id: `d${this.docs.length + 1}`,
      tamano: contenido.byteLength,
      subidoEn: '2026-10-08T12:00:00Z',
    };
    this.docs.push(meta);
    return meta;
  }
  async porObligacion(id: string) {
    const reemplazados = new Set(this.docs.map((d) => d.reemplazaA));
    return this.docs.filter((d) => d.obligacionId === id && !reemplazados.has(d.id));
  }
  async porId(id: string) {
    return this.docs.find((d) => d.id === id) ?? null;
  }
  async reemplazadoPor(id: string) {
    return this.docs.find((d) => d.reemplazaA === id)?.id ?? null;
  }
}
