import 'server-only';

import { createTopesRepository, ingresosPorProyecto } from '@xangarro/data-corp';

import { requireCorpDb } from '../db/corp';
import { sumarDias } from './fechas';
import { limitesDe, type LimitesVista } from './limites-view';
import { mesesVecinos } from './movimiento-view';

/**
 * What Límites reads (E-15): every year's caps, this year's income so far per
 * project, and last month's income for the projection's pace. Every project
 * counts: the caps are the company's, never one project's (ADR-125 §3).
 */
export async function leerLimites(hoy: string): Promise<LimitesVista> {
  const db = requireCorpDb();
  const mes = hoy.slice(0, 7);
  const anterior = mesesVecinos(mes).anterior;
  const [topes, proyectos, previo] = await Promise.all([
    createTopesRepository(db).topes(),
    ingresosPorProyecto(db, `${hoy.slice(0, 4)}-01-01`, hoy),
    ingresosPorProyecto(db, `${anterior}-01`, sumarDias(`${mes}-01`, -1)),
  ]);
  return limitesDe({
    hoy,
    topes,
    proyectos,
    mesAnterior: previo.reduce((t, p) => t + p.monto, 0n),
  });
}
