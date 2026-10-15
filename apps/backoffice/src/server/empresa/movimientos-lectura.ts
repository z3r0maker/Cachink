import {
  createRecurringTemplateRepository,
  listMovimientos,
  type Movimiento,
} from '@xangarro/data-corp';
import { recurrentesDelMes, type RecurrenteDelMes } from '@xangarro/domain/corp';

import { requireCorpDb } from '../db/corp';

/**
 * What Movimientos reads for one month (E-02): its entries, and each recurring
 * template's charge in it, registered, suggested or still to come.
 */
export interface MesDeMovimientos {
  readonly movimientos: readonly Movimiento[];
  readonly recurrentes: readonly RecurrenteDelMes[];
  /** Ids of the templates still repeating, for «Dejar de repetir». */
  readonly activos: ReadonlySet<string>;
}

export async function leerMes(mes: string, hoy: string): Promise<MesDeMovimientos> {
  const db = requireCorpDb();
  const plantillas = createRecurringTemplateRepository(db);
  const [movimientos, todas, registradas] = await Promise.all([
    listMovimientos(db, mes),
    plantillas.list(),
    plantillas.registradasEn(mes),
  ]);
  return {
    movimientos,
    recurrentes: recurrentesDelMes(todas, registradas, mes, hoy),
    activos: new Set(todas.filter((p) => p.activo).map((p) => p.id)),
  };
}
