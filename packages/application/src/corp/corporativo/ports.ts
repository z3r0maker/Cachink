import type { Carpeta, Certificado, EventoAcciones, Socio } from '@xangarro/domain/corp';

/**
 * The corporate book's storage (E-06). `@xangarro/data-corp` implements it
 * over the corp schema; tests fake it in memory.
 */
export interface EventoGuardado extends EventoAcciones {
  readonly id: string;
  readonly nota: string | null;
}

/** RFC, SAS, trademark, bank account, domains: one row each, seeded. */
export interface Registro {
  readonly id: string;
  readonly nombre: string;
  readonly autoridad: string;
  /** In the founders' words: «Activo», «En examen», «A nombre de un socio». */
  readonly estado: string;
  /** The authority's number: the IMPI expediente, the RFC, the account. */
  readonly referencia: string | null;
  /** The next step or what is missing. */
  readonly siguiente: string;
  /** Nothing pending: the chip is green. */
  readonly alDia: boolean;
  /** Where its papers are filed in the Expediente. */
  readonly carpeta: Carpeta;
  /** Its current proof (the constancia, the acta, the cesión). */
  readonly documentoId: string | null;
}

export interface CambiosRegistro {
  readonly estado: string;
  readonly referencia: string | null;
  readonly siguiente: string;
  readonly alDia: boolean;
  readonly documentoId: string | null;
}

export interface CorporativoRepository {
  eventos(): Promise<readonly EventoGuardado[]>;
  agregarEvento(
    e: EventoAcciones & { readonly nota: string | null },
    founderId: string,
  ): Promise<EventoGuardado>;
  registros(): Promise<readonly Registro[]>;
  registro(id: string): Promise<Registro | null>;
  actualizarRegistro(id: string, c: CambiosRegistro, founderId: string): Promise<Registro>;
  certificados(): Promise<readonly Certificado[]>;
  agregarCertificado(c: Omit<Certificado, 'id'>, founderId: string): Promise<Certificado>;
  administrador(): Promise<Socio | null>;
  guardarAdministrador(socio: Socio, founderId: string): Promise<void>;
}
