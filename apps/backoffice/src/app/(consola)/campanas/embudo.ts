import type { DonMood } from '@/components/don-cuentas/don-cuentas';
import type { AttributionView } from '@/server/attribution/list';

/** Visits and checkouts from the Mapa rollup, signups from attribution: same period, México. */
export interface Embudo {
  readonly visitas: number;
  readonly checkouts: number;
  readonly altas: number;
}

export interface Paso {
  readonly label: string;
  readonly value: number;
  /** Share of the step before it, as a whole percent; null for the first step or a zero base. */
  readonly rate: number | null;
}

const pct = (n: number, of: number) => (of === 0 ? null : Math.round((n / of) * 100));

export function pasos(e: Embudo): readonly Paso[] {
  return [
    { label: 'Visitas al sitio', value: e.visitas, rate: null },
    { label: 'Checkouts iniciados', value: e.checkouts, rate: pct(e.checkouts, e.visitas) },
    { label: 'Altas', value: e.altas, rate: pct(e.altas, e.checkouts) },
  ];
}

const PERIOD = { '30d': 'estos 30 días', '90d': 'estos 90 días', '12m': 'este año' } as const;

/** Don Cuentas on the campaigns: how many came, how many without a campaign, who brought most. */
export function campanasNota(view: AttributionView): { mood: DonMood; text: string } {
  const n = view.total.toLocaleString('es-MX');
  if (view.total === 0) {
    return {
      mood: 'guardia',
      text: `Ninguna alta en ${PERIOD[view.rango]}. Las campañas andan más calladas que la caja un lunes.`,
    };
  }
  const best = view.rows.find((r) => !r.direct);
  const lead = best
    ? ` La que más trajo: «${best.campaign}», con ${best.signups.toLocaleString('es-MX')}.`
    : ' Ninguna llegó por campaña: todo es boca a boca o dirección tecleada.';
  return {
    mood: best ? 'guardia' : 'tranquilo',
    text: `${n} ${view.total === 1 ? 'alta' : 'altas'} en ${PERIOD[view.rango]}, ${view.directTotal.toLocaleString('es-MX')} sin campaña.${lead}`,
  };
}
