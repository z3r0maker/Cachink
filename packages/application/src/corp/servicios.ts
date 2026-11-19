import {
  assertServicio,
  plantillaDeServicio,
  servicioDePlantilla,
  type Servicio,
} from '@xangarro/domain/corp';

import { ServicioDesconocidoError } from './errors.js';
import type { RecurringTemplateRepository } from './ports.js';

/**
 * Servicios' writes (E-24, boards CD-18c and CD-18d). A service that charges
 * on a day owns its recurring template (E-02): saving it creates or updates
 * the template, and a service that stops charging stops its template. A
 * template no service owns yet is read as a service under its own id, so the
 * first save of it makes that service and keeps its template.
 */
export interface ServiceRepository {
  findById(id: string): Promise<Servicio | null>;
  list(): Promise<readonly Servicio[]>;
  /** Writes it whole: a new one, an edit or a drop. */
  save(servicio: Servicio, founderId: string): Promise<void>;
}

export interface ServiciosDeps {
  readonly servicios: ServiceRepository;
  readonly plantillas: RecurringTemplateRepository;
}

export interface GuardarServicioInput {
  /** Its `plantillaId` is ignored: the stored one is kept. */
  readonly servicio: Servicio;
  /** «Crear su gasto recurrente en Movimientos» (board CD-18d). */
  readonly recurrente: boolean;
  /**
   * The id of a template this save creates, from the form: a retry after a
   * failure lands on the same template.
   */
  readonly plantillaNuevaId: string;
  readonly hoy: string;
  readonly founderId: string;
}

/** The stored service, or a template under that id read as one; null when neither exists. */
export async function servicioPorId(deps: ServiciosDeps, id: string): Promise<Servicio | null> {
  const s = await deps.servicios.findById(id);
  if (s !== null) return s;
  const p = await deps.plantillas.findById(id);
  return p === null ? null : servicioDePlantilla(p);
}

/** The template the service ends with: updated, created, stopped or none. */
async function sincronizar(
  deps: ServiciosDeps,
  input: GuardarServicioInput,
  actual: string | null,
): Promise<string | null> {
  const datos = input.recurrente ? plantillaDeServicio(input.servicio, input.hoy) : null;
  if (datos === null) {
    if (actual !== null) await deps.plantillas.setActivo(actual, false);
    return actual;
  }
  if (actual !== null) {
    const previa = await deps.plantillas.findById(actual);
    // A monthly template keeps the month it began; an annual one moves to its renewal.
    const desde = datos.periodicidad === 'anual' ? datos.desde : (previa?.desde ?? datos.desde);
    await deps.plantillas.actualizar(actual, { ...datos, desde, activo: true });
    return actual;
  }
  await deps.plantillas.ensure({
    id: input.plantillaNuevaId,
    ...datos,
    contraparte: null,
    rfc: null,
    projectId: null,
    deducible: true,
    createdBy: input.founderId,
  });
  return input.plantillaNuevaId;
}

export async function guardarServicio(
  deps: ServiciosDeps,
  input: GuardarServicioInput,
): Promise<Servicio> {
  assertServicio(input.servicio);
  const previo = await servicioPorId(deps, input.servicio.id);
  const plantillaId = await sincronizar(deps, input, previo?.plantillaId ?? null);
  const servicio = { ...input.servicio, nombre: input.servicio.nombre.trim(), plantillaId };
  await deps.servicios.save(servicio, input.founderId);
  return servicio;
}

/** «Dar de baja»: its template stops suggesting; what it posted stays. */
export async function darDeBajaServicio(
  deps: ServiciosDeps,
  id: string,
  founderId: string,
): Promise<Servicio> {
  const s = await servicioPorId(deps, id);
  if (s === null) throw new ServicioDesconocidoError(id);
  if (s.plantillaId !== null) await deps.plantillas.setActivo(s.plantillaId, false);
  const baja = { ...s, estado: 'baja' as const };
  await deps.servicios.save(baja, founderId);
  return baja;
}
