import {
  assertCertificado,
  assertEventoAcciones,
  type Certificado,
  type EventoAcciones,
} from '@xangarro/domain/corp';

import { agregarVencimiento } from '../agenda/casos.js';
import type { AgendaRepository, DocumentoMeta, ObligacionGuardada } from '../agenda/ports.js';
import {
  subirDocumento,
  subirVersion,
  type Archivo,
  type ExpedienteDeps,
} from '../expediente/index.js';
import type { CorporativoRepository, EventoGuardado, Registro } from './ports.js';

/**
 * The corporate book's writes (E-06). A share event and a certificate of
 * MEXIA each put their deadline on the Agenda; a registry's proof goes to
 * the Expediente, a new upload becoming the document's next version.
 */
export class RegistroInvalidoError extends Error {
  readonly code = 'REGISTRO_INVALIDO' as const;
  constructor(message: string) {
    super(message);
    this.name = 'RegistroInvalidoError';
  }
}

export interface CorporativoDeps {
  readonly corp: CorporativoRepository;
  readonly agenda: AgendaRepository;
}

/** Records a share event and its 15-business-day beneficial-owner notice (CFF 32-B Ter). */
export async function registrarEventoAcciones(
  deps: CorporativoDeps,
  input: { readonly evento: EventoAcciones; readonly nota: string; readonly founderId: string },
): Promise<{ readonly evento: EventoGuardado; readonly aviso: ObligacionGuardada }> {
  assertEventoAcciones(await deps.corp.eventos(), input.evento);
  const nota = input.nota.trim();
  const evento = await deps.corp.agregarEvento(
    { ...input.evento, nota: nota === '' ? null : nota },
    input.founderId,
  );
  const aviso = await agregarVencimiento(deps.agenda, {
    plantillaId: 'beneficiario_controlador',
    fecha: input.evento.fecha,
    titulo: '',
    founderId: input.founderId,
  });
  return { evento, aviso };
}

/** Keeps a certificate's serial and expiry; MEXIA's own go on the Agenda. */
export async function agregarCertificado(
  deps: CorporativoDeps,
  input: { readonly certificado: Omit<Certificado, 'id'>; readonly founderId: string },
): Promise<Certificado> {
  assertCertificado(input.certificado);
  const c = await deps.corp.agregarCertificado(input.certificado, input.founderId);
  if (c.titular === 'mexia') {
    await agregarVencimiento(deps.agenda, {
      plantillaId: c.tipo,
      fecha: c.vence,
      titulo: '',
      founderId: input.founderId,
    });
  }
  return c;
}

export interface ActualizarRegistroInput {
  readonly id: string;
  readonly estado: string;
  readonly referencia: string;
  readonly siguiente: string;
  readonly alDia: boolean;
  readonly archivo: Archivo | null;
  readonly hoy: string;
  readonly founderId: string;
}

async function prueba(
  deps: ExpedienteDeps,
  r: Registro,
  input: ActualizarRegistroInput,
): Promise<DocumentoMeta | null> {
  if (input.archivo === null) return null;
  const comun = { archivo: input.archivo, hoy: input.hoy, founderId: input.founderId };
  if (r.documentoId !== null) {
    // It may have been versioned from the Expediente since: follow to the current one.
    let actual = r.documentoId;
    for (let next = await deps.documentos.reemplazadoPor(actual); next !== null; ) {
      actual = next;
      next = await deps.documentos.reemplazadoPor(actual);
    }
    return subirVersion(deps, { ...comun, documentoId: actual });
  }
  return subirDocumento(deps, {
    ...comun,
    carpeta: r.carpeta,
    titulo: r.nombre,
    periodo: '',
    entryId: null,
    tipo: 'otro',
  });
}

export async function actualizarRegistro(
  deps: ExpedienteDeps & { readonly corp: CorporativoRepository },
  input: ActualizarRegistroInput,
): Promise<Registro> {
  const r = await deps.corp.registro(input.id);
  if (r === null) throw new RegistroInvalidoError('Ese registro no existe.');
  const estado = input.estado.trim();
  if (estado === '') throw new RegistroInvalidoError('Escribe el estado del trámite.');
  const doc = await prueba(deps, r, input);
  return deps.corp.actualizarRegistro(
    r.id,
    {
      estado,
      referencia: input.referencia.trim() === '' ? null : input.referencia.trim(),
      siguiente: input.siguiente.trim(),
      alDia: input.alDia,
      documentoId: doc?.id ?? r.documentoId,
    },
    input.founderId,
  );
}
