import 'server-only';

import type { DatosDelTablero, ObligacionVista } from '@xangarro/application/corp';
import { leerTablero, listFounders } from '@xangarro/data-corp';
import { rangoDelTrimestre, type Socio } from '@xangarro/domain/corp';

import { requireCorpDb } from '../db/corp';
import { leerAgenda } from './agenda-lectura';
import { nombresDe, type Nombres } from './socios-view';

/**
 * What the Tablero reads (E-20): its own rows, both partners' names, and the
 * Agenda's obligations due in the quarter, mirrored as cards that are marked
 * done in the Agenda, never here.
 */
export interface LecturaTablero {
  readonly datos: DatosDelTablero;
  readonly nombres: Nombres;
  readonly obligaciones: readonly ObligacionVista[];
  readonly hoy: string;
}

export async function leerElTablero(hoy: string, trimestre: string): Promise<LecturaTablero> {
  const db = requireCorpDb();
  const [desde, hasta] = rangoDelTrimestre(trimestre);
  const [datos, founders, agenda] = await Promise.all([
    leerTablero(db),
    listFounders(db),
    leerAgenda(hoy),
  ]);
  return {
    datos,
    nombres: nombresDe(founders),
    obligaciones: agenda.vistas.filter((o) => o.vence >= desde && o.vence < hasta),
    hoy,
  };
}

/** The partner a founder is, by the agreement's number. */
export const socioDe = (numero: number): Socio => (numero === 2 ? 2 : 1);
