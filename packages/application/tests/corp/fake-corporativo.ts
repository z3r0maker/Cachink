import type { Certificado, EventoAcciones, Socio } from '@xangarro/domain/corp';

import type {
  CambiosRegistro,
  CorporativoRepository,
  EventoGuardado,
  Registro,
} from '../../src/corp/index.js';

/** The corporate book's port in memory (E-06), with the seeded registries. */
export class FakeCorporativo implements CorporativoRepository {
  readonly lista: EventoGuardado[] = [];
  readonly certs: Certificado[] = [];
  admin: Socio | null = null;
  readonly regs: Registro[] = [
    {
      id: 'marca',
      nombre: 'Marca Xangarro',
      autoridad: 'IMPI',
      estado: 'Pendiente',
      referencia: null,
      siguiente: '',
      alDia: false,
      carpeta: 'impi',
      documentoId: null,
    },
  ];

  async eventos() {
    return this.lista;
  }
  async agregarEvento(e: EventoAcciones & { nota: string | null }) {
    const g = { ...e, id: `ev${this.lista.length + 1}` };
    this.lista.push(g);
    return g;
  }
  async registros() {
    return this.regs;
  }
  async registro(id: string) {
    return this.regs.find((r) => r.id === id) ?? null;
  }
  async actualizarRegistro(id: string, c: CambiosRegistro) {
    const i = this.regs.findIndex((r) => r.id === id);
    const r = { ...this.regs[i]!, ...c };
    this.regs[i] = r;
    return r;
  }
  async certificados() {
    return this.certs;
  }
  async agregarCertificado(c: Omit<Certificado, 'id'>) {
    const g = { ...c, id: `c${this.certs.length + 1}` };
    this.certs.push(g);
    return g;
  }
  async administrador() {
    return this.admin;
  }
  async guardarAdministrador(s: Socio) {
    this.admin = s;
  }
}
