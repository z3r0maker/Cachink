import {
  esRecurrente,
  estaCumplida,
  instanciasEsperadas,
  vencimiento,
  type Estado,
  type Plantilla,
} from '@xangarro/domain/corp';

import type { ObligacionGuardada } from './ports.js';

/**
 * The Agenda as the founders read it (E-04): the computed recurring periods
 * with whatever state was stored for them, plus the one-offs the founders
 * added. Pure; the screens and the reminders both start here.
 */
export interface ObligacionVista {
  readonly plantilla: Plantilla;
  readonly periodo: string;
  readonly titulo: string;
  readonly nominal: string;
  readonly vence: string;
  readonly estado: Estado;
  readonly sinPago: boolean;
  readonly cumplida: boolean;
}

export interface AgendaInput {
  readonly catalogo: readonly Plantilla[];
  /** The SAT registration; without it no recurring period is computed. */
  readonly inscripcion: string | null;
  readonly guardadas: readonly ObligacionGuardada[];
  /** The horizon, `YYYY-MM-DD`. */
  readonly hasta: string;
}

/** One period of a template, with its stored state if any. */
export function vistaDe(
  p: Plantilla,
  periodo: string,
  g: ObligacionGuardada | undefined,
): ObligacionVista {
  const estado = g?.estado ?? 'pendiente';
  return {
    plantilla: p,
    periodo,
    titulo: g?.titulo ?? p.titulo,
    ...vencimiento(p.regla, periodo),
    estado,
    sinPago: g?.sinPago ?? false,
    cumplida: estaCumplida(p, estado),
  };
}

export function agendaDe(input: AgendaInput): readonly ObligacionVista[] {
  const key = (plantillaId: string, periodo: string) => `${plantillaId}~${periodo}`;
  const guardadas = new Map(input.guardadas.map((g) => [key(g.plantillaId, g.periodo), g]));
  const byId = new Map(input.catalogo.map((p) => [p.id, p]));
  const recurrentes =
    input.inscripcion === null
      ? []
      : instanciasEsperadas(input.catalogo, input.inscripcion, input.hasta).flatMap((i) => {
          const p = byId.get(i.plantillaId);
          return p === undefined
            ? []
            : [vistaDe(p, i.periodo, guardadas.get(key(p.id, i.periodo)))];
        });
  const unicas = input.guardadas.flatMap((g) => {
    const p = byId.get(g.plantillaId);
    return p === undefined || esRecurrente(p) || p.exenta !== null
      ? []
      : [vistaDe(p, g.periodo, g)];
  });
  return [...recurrentes, ...unicas].sort(
    (a, b) => a.vence.localeCompare(b.vence) || a.titulo.localeCompare(b.titulo),
  );
}
