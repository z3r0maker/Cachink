import 'server-only';

import {
  createCorporativoRepository,
  importesDeResultados,
  listFundingCalls,
  movimientosDeCaja,
} from '@xangarro/data-corp';
import {
  alertasDeCertificados,
  estadoDeResultados,
  periodoAnterior,
  type Autonomia,
  type EstadoResultados,
  type Periodo,
} from '@xangarro/domain/corp';

import { requireCorpDb } from '../db/corp';
import { leerAgenda } from './agenda-lectura';
import { grupos, itemsDeFondeo, type ItemAgenda } from './agenda-view';
import { autonomiaDeHoy } from './resumen-hero';
import { proximos, senalesDe, type Senal } from './resumen-senales';

export interface DatosResumen {
  readonly actual: EstadoResultados;
  readonly anterior: EstadoResultados;
  readonly autonomia: Autonomia;
  readonly senales: readonly Senal[];
  readonly proximos: readonly ItemAgenda[];
}

/**
 * What the Resumen reads (E-16): the period's results and the one before
 * (devengado, as Resultados opens), cash up to today for the hero, the
 * Agenda with the partners' funding halves (as Agenda › Próximos lists it)
 * and the certificates. Autonomía is always today's, whatever the period.
 */
export async function leerResumen(periodo: Periodo, hoy: string): Promise<DatosResumen> {
  const db = requireCorpDb();
  const previo = periodoAnterior(periodo);
  const [importes, caja, agenda, calls, certificados] = await Promise.all([
    importesDeResultados(db, previo.desde, periodo.hasta),
    movimientosDeCaja(db, hoy),
    leerAgenda(hoy),
    listFundingCalls(db),
    createCorporativoRepository(db).certificados(),
  ]);
  const actual = estadoDeResultados(importes, periodo, 'devengado');
  const autonomia = autonomiaDeHoy(caja, hoy);
  const g = grupos(agenda.vistas, hoy, itemsDeFondeo(calls, hoy));
  return {
    actual,
    anterior: estadoDeResultados(importes, previo, 'devengado'),
    autonomia,
    senales: senalesDe({
      margenBruto: actual.margenBruto,
      periodo: periodo.clave,
      autonomia,
      certificados: alertasDeCertificados(certificados, hoy),
      vencidas: g.find((x) => x.label === 'Vencidas')?.items ?? [],
    }),
    proximos: proximos(g),
  };
}
