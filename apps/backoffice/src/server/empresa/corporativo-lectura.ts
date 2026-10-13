import 'server-only';

import type {
  DocumentoMeta,
  EventoGuardado,
  ObligacionGuardada,
  Registro,
} from '@xangarro/application/corp';
import {
  createAgendaRepository,
  createCorporativoRepository,
  listarDocumentos,
  listFounders,
  listPartnerEntries,
  type Founder,
} from '@xangarro/data-corp';
import {
  cuentasDeSocios,
  tenencias,
  vigentes,
  type Certificado,
  type Socio,
  type Tenencias,
} from '@xangarro/domain/corp';

import { requireCorpDb } from '../db/corp';

/**
 * The corporate book's read (E-06): partners and shares, the capital paid
 * in (from the ledger), the beneficial-owner notices, the registries, the
 * company's papers and its certificates.
 */
export interface LibroCorporativo {
  readonly socios: readonly Founder[];
  readonly eventos: readonly EventoGuardado[];
  readonly tenencias: Tenencias;
  /** MXN centavos credited to capital social, both partners. */
  readonly capitalPagado: bigint;
  readonly administrador: Socio | null;
  readonly avisos: readonly ObligacionGuardada[];
  readonly registros: readonly Registro[];
  /** The current versions in «Constitución» and «Acuerdo de socios». */
  readonly actas: readonly DocumentoMeta[];
  readonly certificados: readonly Certificado[];
}

export async function leerLibro(): Promise<LibroCorporativo> {
  const db = requireCorpDb();
  const corp = createCorporativoRepository(db);
  const [socios, eventos, administrador, registros, certificados, docs, avisos, partner] =
    await Promise.all([
      listFounders(db),
      corp.eventos(),
      corp.administrador(),
      corp.registros(),
      corp.certificados(),
      listarDocumentos(db),
      createAgendaRepository(db).obligaciones(),
      listPartnerEntries(db),
    ]);
  const cuentas = cuentasDeSocios(partner);
  return {
    socios,
    eventos,
    tenencias: tenencias(eventos),
    capitalPagado: cuentas[1].capital + cuentas[2].capital,
    administrador,
    avisos,
    registros,
    actas: vigentes(docs)
      .map((v) => v.doc)
      .filter((d) => d.carpeta === 'constitucion' || d.carpeta === 'acuerdo_socios'),
    certificados,
  };
}
