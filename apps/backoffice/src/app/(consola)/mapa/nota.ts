import type { DonMood } from '@/components/don-cuentas/don-cuentas';
import { UNKNOWN_REGION_WARN, type GeoStateRow, type GeoView } from '@/server/geo/list';
import { RATE_FLOOR } from '@/server/geo/metrics';

import { formatValue } from './format';

export interface Nota {
  readonly mood: DonMood;
  readonly text: string;
}

const PERIOD = { '30d': 'estos 30 días', '90d': 'estos 90 días', '12m': 'este año' } as const;

/** What a count metric counts, as a noun for the sentence. */
const NOUN: Readonly<Record<string, string>> = {
  todos: 'registros',
  accesos: 'accesos',
  visitas: 'visitas',
  checkouts: 'checkouts',
};

const ranked = (rows: readonly GeoStateRow[]) =>
  rows.filter((r) => r.value !== null && r.value > 0).sort((a, b) => b.value! - a.value!);

function countNote(view: GeoView): Nota {
  const [top, second] = ranked(view.rows);
  const what = NOUN[view.metric.id] ?? view.metric.label.toLowerCase();
  if (top === undefined) {
    return {
      mood: 'guardia',
      text: `Ni sus luces: ningún estado registró ${what} en ${PERIOD[view.rango]}.`,
    };
  }
  const n = ranked(view.rows).length;
  const follow = second
    ? ` ${second.nombre} le sigue con ${formatValue(view.metric, second.value)}.`
    : ' Del resto del país, ni sus luces.';
  return {
    mood: 'guardia',
    text: `${top.nombre} va a la cabeza con ${formatValue(view.metric, top.value)} ${what}.${follow} ${n} de 32 estados con actividad en ${PERIOD[view.rango]}.`,
  };
}

function rateNote(view: GeoView): Nota {
  const [top] = ranked(view.rows);
  if (top === undefined) {
    return {
      mood: 'tranquilo',
      text: `Ningún estado junta todavía ${RATE_FLOOR} visitas en ${PERIOD[view.rango]}; la conversión se calcula cuando haya con qué.`,
    };
  }
  return {
    mood: 'guardia',
    text: `${top.nombre} es donde mejor convierte: ${formatValue(view.metric, top.value)}, contra ${formatValue(view.metric, view.national)} del país.`,
  };
}

/** What Don Cuentas reads off the map: who leads, who follows, how much of Mexico shows up. */
export function mapaNota(view: GeoView): Nota {
  if (view.sinEstadoShare > UNKNOWN_REGION_WARN) {
    return {
      mood: 'alarma',
      text: `El ${(view.sinEstadoShare * 100).toFixed(0)} % de los registros no trae estado. Antes de sacar conclusiones, revisa que la ubicación siga llegando.`,
    };
  }
  return view.metric.kind === 'tasa' ? rateNote(view) : countNote(view);
}
