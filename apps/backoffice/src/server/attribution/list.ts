import { tenantStore } from '../tenants/errors';
import { mexicoDay } from '../geo/day';
import { stateName } from '../geo/mx-states';
import type { AttributionSource, AttributionTally } from './port';

/**
 * Which campaigns brought businesses in, and from where (N-57).
 *
 * Ranked by signups, because that is the number a budget decision turns on.
 * Each campaign also carries the state it came from most, which is the join
 * `geo_counters` cannot do — that table is an aggregate with no business in
 * it. Direct traffic is a first-class row rather than a gap: "how many arrive
 * with no campaign at all" is usually the largest and most useful number on
 * the page.
 */
export const ATTRIBUTION_RANGES = ['30d', '90d', '12m'] as const;
export type AttributionRangeId = (typeof ATTRIBUTION_RANGES)[number];

const DAYS: Readonly<Record<AttributionRangeId, number>> = { '30d': 30, '90d': 90, '12m': 365 };

/** Shown when every `utm_*` was empty — someone typed the address or followed a bare link. */
export const DIRECT = 'Directo (sin campaña)';

export interface CampaignRow {
  readonly campaign: string;
  readonly source: string;
  readonly medium: string;
  readonly signups: number;
  /** The state most of this campaign's signups came from, already named. */
  readonly topRegion: string;
  readonly direct: boolean;
}

export interface AttributionView {
  readonly rango: AttributionRangeId;
  readonly rows: readonly CampaignRow[];
  readonly total: number;
  /** Signups that arrived with no campaign labels at all. */
  readonly directTotal: number;
}

export interface AttributionDeps {
  readonly attribution: AttributionSource;
}

const keyOf = (t: AttributionTally): string => `${t.campaign}|${t.source}|${t.medium}`;

function topRegion(tallies: readonly AttributionTally[]): string {
  const best = [...tallies].filter((t) => t.region !== '').sort((a, b) => b.signups - a.signups)[0];
  return best === undefined ? 'Sin estado' : stateName(best.region);
}

export async function attributionView(
  deps: AttributionDeps,
  rango: AttributionRangeId,
  now: Date,
): Promise<AttributionView> {
  const range = { from: mexicoDay(now, DAYS[rango]), to: mexicoDay(now) };
  const tallies = await tenantStore(() => deps.attribution.rollup(range));

  const grouped = new Map<string, AttributionTally[]>();
  for (const t of tallies) {
    const list = grouped.get(keyOf(t)) ?? [];
    list.push(t);
    grouped.set(keyOf(t), list);
  }

  const rows = [...grouped.values()]
    .map((group) => {
      const first = group[0] as AttributionTally;
      const direct = first.campaign === '' && first.source === '' && first.medium === '';
      return {
        campaign: direct ? DIRECT : first.campaign || '(sin nombre)',
        source: first.source,
        medium: first.medium,
        signups: group.reduce((n, t) => n + t.signups, 0),
        topRegion: topRegion(group),
        direct,
      };
    })
    .sort((a, b) => b.signups - a.signups || a.campaign.localeCompare(b.campaign, 'es'));

  return {
    rango,
    rows,
    total: rows.reduce((n, r) => n + r.signups, 0),
    directTotal: rows.filter((r) => r.direct).reduce((n, r) => n + r.signups, 0),
  };
}
