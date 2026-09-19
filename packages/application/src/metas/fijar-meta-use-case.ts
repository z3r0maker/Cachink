/**
 * FijarMetaUseCase (P-27): set this month's goal from the wizard's three
 * answers. The target is computed, never typed: the last complete month's
 * figure ± the level's percentage, so the goal is anchored to what the
 * business actually does.
 */

import {
  figuraDelMes,
  fueraDeRango,
  newUlid,
  objetivoDe,
  type BusinessId,
  type Meta,
} from '@xangarro/domain';

import { MetaError } from './errors.js';
import type { FijarMetaInput, MetasStore, TotalesDelMes } from './ports.js';

const MES_ACTUAL = (hoy: string) => hoy.slice(0, 7);

const MES_PREVIO = (hoy: string): string => {
  const [y, m] = hoy.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

/** The wizard's live figures: each level's monthly and daily target. */
export function nivelesPosibles(
  base: bigint,
  objetivo: Meta['objetivo'],
): readonly {
  readonly id: Meta['nivel'];
  readonly pct: number;
  readonly mensual: bigint;
  readonly diario: bigint;
}[] {
  const dias = 30; // the design's "al día" line, a flat month
  return (
    [
      { id: 'empujon', pct: 10 },
      { id: 'reto', pct: 20 },
      { id: 'ambicioso', pct: 30 },
    ] as const
  ).map((n) => {
    const mensual = objetivoDe(base, n.id, objetivo);
    return { id: n.id, pct: n.pct, mensual, diario: mensual / BigInt(dias) };
  });
}

/** The input checks every fijar shares; each throws its own state. */
function validarEntrada(hoy: string, objetivo: FijarMetaInput['objetivo']): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(hoy)) {
    throw new MetaError('META_INVALIDA', 'La fecha de hoy no es válida.');
  }
  if (objetivo !== 'ganar' && objetivo !== 'vender' && objetivo !== 'gastar') {
    throw new MetaError('META_INVALIDA', 'Elige qué quieres lograr.');
  }
}

export class FijarMetaUseCase {
  readonly #store: MetasStore;
  readonly #totales: TotalesDelMes;

  constructor(store: MetasStore, totales: TotalesDelMes) {
    this.#store = store;
    this.#totales = totales;
  }

  async execute(input: FijarMetaInput): Promise<Meta> {
    validarEntrada(input.hoy, input.objetivo);
    if (await this.#store.activa(input.businessId)) {
      throw new MetaError('META_ACTIVA', 'Ya tienes una meta en curso este mes.');
    }
    const base = figuraDelMes(
      input.objetivo,
      await this.#totales(input.businessId, MES_PREVIO(input.hoy)),
    );
    if (base <= 0n) {
      throw new MetaError(
        'NEGOCIO_NUEVO',
        'Aún no hay un mes completo que comparar: registrá tus ventas y gastos y la meta del mes que entra se ancla a ellos.',
      );
    }
    const objetivoCentavos = objetivoDe(base, input.nivel, input.objetivo);
    if (fueraDeRango(objetivoCentavos, base)) {
      throw new MetaError(
        'FUERA_DE_RANGO',
        'Ese monto está muy lejos de tu mes anterior. Ajústalo a un reto posible.',
      );
    }
    const meta: Meta = {
      id: newUlid(),
      objetivo: input.objetivo,
      motivo: input.motivo,
      nivel: input.nivel,
      objetivoCentavos,
      periodo: MES_ACTUAL(input.hoy),
      lograda: null,
      resultadoCentavos: null,
      cerradaAt: null,
    };
    await this.#store.insertar(meta);
    return meta;
  }
}

export type { BusinessId };
