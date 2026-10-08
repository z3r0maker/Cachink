import {
  esDiaHabil,
  esRecurrente,
  ObligacionDesconocidaError,
  ObligacionExentaError,
  plantilla as delCatalogo,
  vencimiento,
  type Plantilla,
} from '@xangarro/domain/corp';

import type { AgendaRepository, ObligacionGuardada } from './ports.js';

/**
 * Finding the instance a founder acts on (E-04): the template must exist and
 * apply to MEXIA, and a recurring period must fall on or after the SAT
 * registration. The row is created on first use.
 */
export function plantillaVigente(id: string): Plantilla {
  const p = delCatalogo(id);
  if (p === undefined) throw new ObligacionDesconocidaError(id);
  if (p.exenta !== null) throw new ObligacionExentaError(id);
  return p;
}

export async function instanciaDe(
  agenda: AgendaRepository,
  p: Plantilla,
  periodo: string,
  founderId: string,
): Promise<ObligacionGuardada> {
  vencimiento(p.regla, periodo); // throws on a period the rule cannot read
  if (esRecurrente(p)) {
    const inicio = await agenda.inscripcionRfc();
    const desde = inicio === null ? null : inicio.slice(0, periodo.length);
    if (desde === null || periodo < desde)
      throw new ObligacionDesconocidaError(`${p.id}~${periodo}`);
    return agenda.asegurar(p.id, periodo, null, founderId);
  }
  const guardada = await agenda.buscar(p.id, periodo);
  if (guardada === null) throw new ObligacionDesconocidaError(`${p.id}~${periodo}`);
  return guardada;
}

/** A real calendar date, `YYYY-MM-DD`; the business-day check parses it. */
export function assertFecha(fecha: string): void {
  esDiaHabil(fecha);
}
