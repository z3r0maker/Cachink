/**
 * CerrarMetasVencidasUseCase (P-27/P-33): goals close lazily — when the page
 * loads and a goal's month has ended, its figure is read from that month's
 * ledger and the goal is closed with the verdict the month earned. The closed
 * row is what the month-end dialog and the celebration read.
 */

import { figuraDelMes, metaLograda, type BusinessId, type Meta } from '@xangarro/domain';

import type { MetasStore, TotalesDelMes } from './ports.js';

const mesAnteriorA = (hoy: string): string => {
  const [y, m] = hoy.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

const diasDe = (yearMonth: string): number => {
  const [y, m] = yearMonth.split('-').map(Number) as [number, number];
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

export class CerrarMetasVencidasUseCase {
  readonly #store: MetasStore;
  readonly #totales: TotalesDelMes;

  constructor(store: MetasStore, totales: TotalesDelMes) {
    this.#store = store;
    this.#totales = totales;
  }

  /** Closes the active goal when its month has ended; returns what it closed. */
  async execute(businessId: BusinessId, hoy: string): Promise<readonly Meta[]> {
    const activa = await this.#store.activa(businessId);
    if (activa === null || activa.periodo >= hoy.slice(0, 7)) return [];
    const totales = await this.#totales(businessId, activa.periodo);
    const resultado = figuraDelMes(activa.objetivo, totales);
    const lograda = metaLograda(activa, resultado);
    await this.#store.cerrar(activa.id, { lograda, resultado, at: new Date().toISOString() });
    return [
      { ...activa, lograda, resultadoCentavos: resultado, cerradaAt: new Date().toISOString() },
    ];
  }
}

export { mesAnteriorA, diasDe };
