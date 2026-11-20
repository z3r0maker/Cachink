import type { Clausula, EventoPlan, Objetivo, Tarjeta } from '@xangarro/domain/corp';

import type {
  AvisoGuardado,
  CambioDeTarjeta,
  ClausulaGuardada,
  DatosDelTablero,
  TableroRepository,
  TarjetaNueva,
} from '../../src/corp/index.js';

/** The Tablero in memory (E-20), the shape `@xangarro/data-corp` stores. */
export class FakeTablero implements TableroRepository {
  tarjetas: Tarjeta[] = [];
  planes: EventoPlan[] = [];
  objetivos: Objetivo[] = [];
  clausulas: ClausulaGuardada[] = [];
  avisos: AvisoGuardado[] = [];

  async leer(): Promise<DatosDelTablero> {
    return {
      tarjetas: [...this.tarjetas],
      planes: [...this.planes],
      objetivos: [...this.objetivos],
      clausula: this.clausulas.at(-1) ?? null,
      avisos: [...this.avisos],
    };
  }

  async crearTarjeta(t: TarjetaNueva) {
    const id = `t${this.tarjetas.length + 1}`;
    this.tarjetas.push({
      ...t,
      id,
      cotizacion: null,
      cotizacionDocId: null,
      descartadaEn: null,
      eventos: [],
    });
    return id;
  }

  async mover(id: string, decidir: Parameters<TableroRepository['mover']>[1]) {
    const i = this.tarjetas.findIndex((t) => t.id === id);
    const t = this.tarjetas[i];
    if (t === undefined) return null;
    const ev = decidir(t);
    this.tarjetas[i] = { ...t, eventos: [...t.eventos, ev] };
    return ev;
  }

  async cambiar(id: string, decidir: (t: Tarjeta) => CambioDeTarjeta) {
    const i = this.tarjetas.findIndex((t) => t.id === id);
    const t = this.tarjetas[i];
    if (t === undefined) return false;
    const c = decidir(t);
    this.tarjetas[i] = {
      ...t,
      valores: c.valores ?? t.valores,
      cotizacion: c.cotizacion?.monto ?? t.cotizacion,
      cotizacionDocId: c.cotizacion?.documentoId ?? t.cotizacionDocId,
      descartadaEn: c.descartadaEn ?? t.descartadaEn,
    };
    return true;
  }

  async agregarAlPlan(e: EventoPlan) {
    this.planes.push(e);
  }

  async crearObjetivo(o: Omit<Objetivo, 'id' | 'avances'>) {
    const id = `o${this.objetivos.length + 1}`;
    this.objetivos.push({ ...o, id, avances: [] });
    return id;
  }

  async agregarAvance(id: string, a: Objetivo['avances'][number]) {
    this.objetivos = this.objetivos.map((o) =>
      o.id === id ? { ...o, avances: [...o.avances, a] } : o,
    );
  }

  async guardarClausula(c: Clausula) {
    const id = `c${this.clausulas.length + 1}`;
    this.clausulas.push({ ...c, id, at: '2027-01-09T10:00:00Z' });
    return id;
  }

  async registrarAviso(a: AvisoGuardado) {
    this.avisos.push(a);
  }
}
