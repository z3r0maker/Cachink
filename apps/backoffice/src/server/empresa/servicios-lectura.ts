import 'server-only';

import {
  cargosDeServicios,
  comisionesPorMes,
  createRecurringTemplateRepository,
  createServiceRepository,
} from '@xangarro/data-corp';
import { conPlantillasSueltas, mesMas, type PlantillaRecurrente } from '@xangarro/domain/corp';

import { requireCorpDb } from '../db/corp';
import type { DatosServicios } from './servicios-textos';

/**
 * What Servicios reads (E-24): every service, the templates no service owns
 * yet, and twelve months of their charges and of Stripe's fees, enough for an
 * annual service's average and the six-month charts.
 */
export interface DatosConPlantillas extends DatosServicios {
  readonly plantillas: readonly PlantillaRecurrente[];
}

export async function leerServicios(hoy: string): Promise<DatosConPlantillas> {
  const db = requireCorpDb();
  const mes = hoy.slice(0, 7);
  const desde = mesMas(mes, -12);
  const [servicios, plantillas, cargos, comisiones] = await Promise.all([
    createServiceRepository(db).list(),
    createRecurringTemplateRepository(db).list(),
    cargosDeServicios(db, desde, mes),
    comisionesPorMes(db, desde, mes),
  ]);
  return {
    servicios: conPlantillasSueltas(servicios, plantillas),
    plantillas,
    cargos,
    comisiones,
    hoy,
  };
}
