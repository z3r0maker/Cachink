import { hasEvidence, type Finding } from '../schemas/finding';
import type { Run } from '../schemas/run';

/**
 * A corrida's findings, as the report lists them (spec §9 `aggregate.ts`):
 * evidence-less ones dropped, the rest merged by `dedupe_key` (and category,
 * so an `agent_failure` never joins a real finding), each group prioritised
 * and counted across repetitions.
 */
export interface PersonaFacts {
  readonly market_weight: number;
  readonly status: Finding['persona_status'];
}

export interface FindingGroup {
  readonly key: string;
  readonly category: Finding['category'];
  /** The worst any of its findings was given. */
  readonly severity: Finding['severity'];
  /** The highest any judge gave it. */
  readonly confidence: Finding['confidence'];
  readonly title: string;
  readonly description: string;
  readonly repro: string;
  readonly findingIds: string[];
  readonly runIds: string[];
  readonly personas: string[];
  /** `grounded` only when every persona it reached is. */
  readonly personaStatus: Finding['persona_status'];
  /** Severity × distinct personas × their summed market weight. */
  readonly priority: number;
  /** The runs it appeared in, out of every run of the same persona, scenario and style. */
  readonly seenIn: { readonly runs: number; readonly of: number };
  readonly evidence: { readonly runId: string; readonly evidence: Finding['evidence'] }[];
}

export const SEVERITY_WEIGHT = { critical: 3, major: 2, minor: 1 } as const;
const CONFIDENCE_RANK = { low: 0, medium: 1, high: 2 } as const;

const cell = (r: Run) => `${r.persona}__${r.scenario}__${r.style}`;
const uniq = (xs: readonly string[]) => [...new Set(xs)].sort();

function group(
  members: readonly Finding[],
  runs: ReadonlyMap<string, Run>,
  all: readonly Run[],
  personas: ReadonlyMap<string, PersonaFacts>,
): FindingGroup {
  const ofRun = (f: Finding) => runs.get(f.run_id) as Run;
  const worst = [...members].sort(
    (a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity],
  )[0] as Finding;
  const names = uniq(members.map((f) => ofRun(f).persona));
  const facts = names.map((p) => personas.get(p) as PersonaFacts);
  const weight = facts.reduce((sum, p) => sum + p.market_weight, 0);
  const cells = new Set(members.map((f) => cell(ofRun(f))));
  const confidence = members.reduce(
    (best, f) => (CONFIDENCE_RANK[f.confidence] > CONFIDENCE_RANK[best] ? f.confidence : best),
    'low' as Finding['confidence'],
  );
  return {
    key: worst.dedupe_key,
    category: worst.category,
    severity: worst.severity,
    confidence,
    title: worst.title,
    description: worst.description,
    repro: worst.repro,
    findingIds: members.map((f) => f.id),
    runIds: uniq(members.map((f) => f.run_id)),
    personas: names,
    personaStatus: facts.every((p) => p.status === 'grounded') ? 'grounded' : 'hypothesis',
    priority: Math.round(SEVERITY_WEIGHT[worst.severity] * names.length * weight * 100) / 100,
    seenIn: {
      runs: uniq(members.map((f) => f.run_id)).length,
      of: all.filter((r) => cells.has(cell(r))).length,
    },
    evidence: members.map((f) => ({ runId: f.run_id, evidence: f.evidence })),
  };
}

function checkKnown(
  findings: readonly Finding[],
  runs: ReadonlyMap<string, Run>,
  personas: ReadonlyMap<string, PersonaFacts>,
): void {
  for (const f of findings) {
    const r = runs.get(f.run_id);
    if (r === undefined)
      throw new Error(`${f.id} belongs to ${f.run_id}, which this corrida lacks`);
    if (!personas.has(r.persona)) throw new Error(`${f.id}: no persona «${r.persona}»`);
  }
}

export function groupFindings(
  findings: readonly Finding[],
  runs: readonly Run[],
  personas: ReadonlyMap<string, PersonaFacts>,
): { groups: FindingGroup[]; droppedNoEvidence: string[] } {
  const byId = new Map(runs.map((r) => [r.id, r]));
  checkKnown(findings, byId, personas);
  const kept = findings.filter((f) => hasEvidence(f));
  const buckets = new Map<string, Finding[]>();
  for (const f of kept) {
    const k = `${f.category} ${f.dedupe_key}`;
    buckets.set(k, [...(buckets.get(k) ?? []), f]);
  }
  const groups = [...buckets.values()].map((m) => group(m, byId, runs, personas));
  groups.sort((a, b) => b.priority - a.priority || a.key.localeCompare(b.key));
  return {
    groups,
    droppedNoEvidence: findings.filter((f) => !hasEvidence(f)).map((f) => f.id),
  };
}
