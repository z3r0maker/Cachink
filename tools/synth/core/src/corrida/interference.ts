/**
 * S-11's acceptance, read off the corrida itself: runs that overlapped in time
 * shared nothing a run owns. A tenant is a run's for good (ADR-153 §3, one
 * tenant per run); a CDP port, a client address and a browser profile are its
 * own while it runs. The peak says how many ran at once.
 */
export interface RunRecord {
  readonly id: string;
  readonly runner: 'web' | 'phone';
  readonly started_at: string;
  readonly ended_at: string;
  /** The run's tenant; null when a signup run never made one. */
  readonly biz: string | null;
  /** Browser-only: null on the phone. */
  readonly cdp_port: number | null;
  readonly address: string | null;
  readonly profile: string | null;
}

export interface Interference {
  readonly issues: string[];
  /** The most runs that were running at the same moment. */
  readonly peak: number;
}

const span = (r: RunRecord) => [Date.parse(r.started_at), Date.parse(r.ended_at)] as const;

const overlap = (a: RunRecord, b: RunRecord): boolean => {
  const [a0, a1] = span(a);
  const [b0, b1] = span(b);
  return a0 < b1 && b0 < a1;
};

const HELD = [
  ['cdp_port', 'CDP port'],
  ['address', 'address'],
  ['profile', 'profile'],
] as const;

function pairIssues(a: RunRecord, b: RunRecord): string[] {
  const out: string[] = [];
  if (a.biz !== null && a.biz === b.biz) out.push(`${a.id} and ${b.id} share tenant ${a.biz}`);
  if (!overlap(a, b)) return out;
  for (const [key, label] of HELD) {
    const v = a[key];
    if (v !== null && v === b[key]) out.push(`${a.id} and ${b.id} overlapped on ${label} ${v}`);
  }
  return out;
}

/** Most runs live at once: a start counts before an end at the same instant only if strictly inside. */
function peakOf(records: readonly RunRecord[]): number {
  const events = records.flatMap((r) => {
    const [s, e] = span(r);
    return [
      { t: s, d: 1 },
      { t: e, d: -1 },
    ];
  });
  events.sort((x, y) => x.t - y.t || x.d - y.d);
  let live = 0;
  let peak = 0;
  for (const ev of events) {
    live += ev.d;
    peak = Math.max(peak, live);
  }
  return peak;
}

export function interference(records: readonly RunRecord[]): Interference {
  const issues = records.flatMap((a, i) => records.slice(i + 1).flatMap((b) => pairIssues(a, b)));
  return { issues, peak: peakOf(records) };
}
