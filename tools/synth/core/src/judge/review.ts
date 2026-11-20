import { z } from 'zod';

import { Text } from '../schemas/common';
import { FindingSchema, hasEvidence, type Finding } from '../schemas/finding';
import type { BugCandidate } from './candidates';

/**
 * What stands of the judge's work (S-08). The judge proposes findings; this
 * script checks each against the run before it becomes a `Finding`:
 * references the run does not have are removed, a finding left citing nothing
 * is dropped (an exit interview alone is never evidence), the cut question
 * decides `agent_failure`, and every bug candidate ends cited, dismissed with
 * a reason, or added as an unreviewed finding.
 */
const JudgeFinding = FindingSchema.omit({ id: true, run_id: true, persona_status: true }).extend({
  /** §8.3's cut question: would a person with eyes and hands have hit this too? */
  human_would_hit: z.boolean(),
  cut_reason: Text,
});
export const JudgeOutput = z.strictObject({
  findings: z.array(JudgeFinding),
  dismissed: z.array(z.strictObject({ candidate: z.string(), reason: Text })),
});
type JudgeFinding = z.infer<typeof JudgeFinding>;

export interface ReviewContext {
  readonly runId: string;
  readonly personaStatus: Finding['persona_status'];
  /** `YYYY-MM-DD`, for the ids. */
  readonly date: string;
  /** The first finding's number in this corrida. */
  readonly firstNumber: number;
  readonly stepCount: number;
  /** Files in the run folder, relative to it. */
  readonly files: ReadonlySet<string>;
  readonly consoleLines: number;
  readonly networkLines: number;
  readonly candidates: readonly BugCandidate[];
}

export interface Review {
  readonly findings: Finding[];
  readonly dropped: { readonly title: string; readonly reason: string }[];
  /** Candidates the judge neither cited nor dismissed, added as low-confidence findings. */
  readonly unreviewed: string[];
  readonly notes: string[];
  /** The cut question as the judge answered it, per proposed finding: the audit trail for `agent_failure`. */
  readonly cuts: {
    readonly title: string;
    readonly human_would_hit: boolean;
    readonly cut_reason: string;
  }[];
}

const lineRef = (file: string, max: number) => (ref: string) => {
  const m = new RegExp(`^${file.replace('.', '\\.')}#L(\\d+)$`).exec(ref);
  return m !== null && Number(m[1]) >= 1 && Number(m[1]) <= max;
};

/** The finding's evidence, keeping only references the run really has. */
function realEvidence(
  f: JudgeFinding,
  c: ReviewContext,
): { evidence: Finding['evidence']; gone: string[] } {
  const e = f.evidence;
  const evidence = {
    steps: e.steps.filter((n) => n <= c.stepCount),
    screenshots: e.screenshots.filter((s) => c.files.has(s)),
    console: e.console.filter(lineRef('console.jsonl', c.consoleLines)),
    network: e.network.filter(lineRef('network.jsonl', c.networkLines)),
  };
  const gone = [
    ...e.steps.filter((n) => n > c.stepCount).map((n) => `step ${n}`),
    ...e.screenshots.filter((s) => !c.files.has(s)),
    ...e.console.filter((r) => !evidence.console.includes(r)),
    ...e.network.filter((r) => !evidence.network.includes(r)),
  ];
  return { evidence, gone };
}

type Judged = { kept?: Omit<Finding, 'id'>; dropped?: string; note?: string };

function judgeOne(f: JudgeFinding, c: ReviewContext): Judged {
  if (f.human_would_hit && f.category === 'agent_failure') {
    return {
      dropped:
        'agent_failure, yet it says a human would hit it: it contradicts its own cut question',
    };
  }
  const { evidence, gone } = realEvidence(f, c);
  const missing = gone.length > 0 ? ` (not in this run: ${gone.join(', ')})` : '';
  if (!hasEvidence({ evidence })) return { dropped: `no evidence in the trace${missing}` };
  const { human_would_hit, cut_reason: _cut, ...rest } = f;
  const category = human_would_hit ? f.category : 'agent_failure';
  const note =
    category !== f.category
      ? `«${f.title}»: ${f.category} → agent_failure by the cut question`
      : undefined;
  return {
    kept: { ...rest, category, evidence, run_id: c.runId, persona_status: c.personaStatus },
    ...(note ? { note } : {}),
  };
}

function slug(text: string): string {
  const s = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  return s.replace(/^-|-$/g, '').slice(0, 48) || 'sin-texto';
}

/** A candidate the judge did not account for: kept, at low confidence, so nothing is lost. */
function unreviewedFinding(cand: BugCandidate, c: ReviewContext): Omit<Finding, 'id'> {
  return {
    run_id: c.runId,
    category: 'bug',
    severity: 'minor',
    title: `Sin revisar: ${cand.text}`.slice(0, 140),
    description: `The judge did not account for this ${cand.source} line, so it stays a bug candidate.`,
    evidence: {
      steps: [],
      screenshots: [],
      console: cand.source === 'console' ? [cand.ref] : [],
      network: cand.source === 'network' ? [cand.ref] : [],
    },
    persona_status: c.personaStatus,
    repro: `See ${cand.ref}.`,
    confidence: 'low',
    dedupe_key: `sin-revisar/${cand.source}/${slug(cand.text)}`,
  };
}

export function reviewJudgement(raw: unknown, c: ReviewContext): Review {
  const parsed = JudgeOutput.safeParse(raw);
  if (!parsed.success) {
    const why = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`the judge's output is not its contract: ${why}`);
  }
  const judged = parsed.data.findings.map((f) => ({ f, j: judgeOne(f, c) }));
  const kept = judged.flatMap(({ j }) => (j.kept ? [j.kept] : []));
  const cited = new Set(kept.flatMap((k) => [...k.evidence.console, ...k.evidence.network]));
  const dismissed = new Set(parsed.data.dismissed.map((d) => d.candidate));
  const open = c.candidates.filter((cand) => !cited.has(cand.ref) && !dismissed.has(cand.id));
  const all = [...kept, ...open.map((cand) => unreviewedFinding(cand, c))];
  const stamp = (n: number) => `F-${c.date}-${String(n).padStart(3, '0')}`;
  return {
    findings: all.map((f, i) => FindingSchema.parse({ id: stamp(c.firstNumber + i), ...f })),
    dropped: judged.flatMap(({ f, j }) =>
      j.dropped ? [{ title: f.title, reason: j.dropped }] : [],
    ),
    unreviewed: open.map((cand) => cand.id),
    notes: judged.flatMap(({ j }) => (j.note ? [j.note] : [])),
    cuts: parsed.data.findings.map(({ title, human_would_hit, cut_reason }) => ({
      title,
      human_would_hit,
      cut_reason,
    })),
  };
}
