import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

import { runActor } from '../runner/actor-process';
import type { ToolSet } from '../runner/tools';
import { FindingSchema, type Finding } from '../schemas/finding';
import { RunSchema, type Run } from '../schemas/run';
import { judgeSessionProblems, parseJudgeAnswer } from './answer';
import { JUDGE_TOOLS, judgeArgs, renderJudgePrompt } from './args';
import { bugCandidates } from './candidates';
import { mergeFindings } from './merge';
import { reviewJudgement, type Review } from './review';

/**
 * One run judged (S-08): Opus started read-only in the run folder, its
 * session checked (`judgeSessionProblems`), its answer reviewed against the
 * trace (`reviewJudgement`). The run's findings go into the corrida's
 * `findings.json`; the judge's own record goes to `<corrida>/judge/<run-id>/`,
 * outside the folder it reads.
 */
export interface JudgeOptions {
  readonly runDir: string;
  readonly model: string;
  readonly budgetUsd: number;
  readonly template: string;
  readonly persona: { readonly yaml: string; readonly status: Finding['persona_status'] };
  readonly scenarioYaml: string;
  readonly date: string;
}

export interface JudgeResult {
  readonly review: Review;
  readonly costCents: number;
  readonly recordDir: string;
}

/** The judge's tools as a ToolSet: everything it does is looking, so nothing is a step. */
const JUDGE_TOOLSET: ToolSet = {
  server: 'none',
  allowed: JUDGE_TOOLS,
  never: [],
  kind: () => 'look',
  describe: (name) => name,
};

function filesUnder(root: string, dir = root): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    return e.isDirectory() ? filesUnder(root, full) : [relative(root, full).split(sep).join('/')];
  });
}

const readOr = (path: string): string => (existsSync(path) ? readFileSync(path, 'utf8') : '');
/** Lines as a citation numbers them: every line, blank or not, without the last newline's empty tail. */
const lines = (text: string): number =>
  text === '' ? 0 : text.replace(/\n$/, '').split('\n').length;

function outcomeLine(run: Run): string {
  const checks = run.checks.map((c) => `${c.check}: ${c.passed ? 'pasó' : 'falló'}`).join(', ');
  const error = run.error === undefined ? '' : `; error del harness: ${run.error}`;
  return `${run.outcome}, éxito por SQL ${String(run.success)} (${checks || 'sin verificaciones'}), ${run.steps.length} pasos${error}`;
}

function readFindings(path: string): Finding[] {
  return existsSync(path)
    ? FindingSchema.array().parse(JSON.parse(readFileSync(path, 'utf8')))
    : [];
}

async function askJudge(o: JudgeOptions, prompt: string, recordDir: string) {
  const streamFile = join(recordDir, 'judge.stream.jsonl');
  writeFileSync(streamFile, '');
  const session = await runActor({
    command: 'claude',
    args: judgeArgs({ model: o.model, budgetUsd: o.budgetUsd, systemPrompt: prompt }),
    prompt: 'Juzga esta corrida y responde solo con el JSON de tu rúbrica.',
    cwd: o.runDir,
    maxSteps: 1_000,
    maxTurns: 200,
    timeoutMs: 900_000,
    onStep: async () => undefined,
    streamFile,
    tools: JUDGE_TOOLSET,
  });
  const events = readFileSync(streamFile, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as unknown);
  const problems = judgeSessionProblems(events, o.runDir);
  if (session.stop !== 'ended' || session.tracker.final === undefined) {
    problems.push(
      `the judge stopped (${session.stop}, exit ${String(session.exitCode)}): ${session.stderr.slice(-400)}`,
    );
  }
  return { problems, final: session.tracker.final };
}

/** What the run folder holds, read once: the judge is given it and the review checks against it. */
function readRun(runDir: string) {
  const run = RunSchema.parse(JSON.parse(readFileSync(join(runDir, 'run.json'), 'utf8')));
  const consoleText = readOr(join(runDir, 'console.jsonl'));
  const networkText = readOr(join(runDir, 'network.jsonl'));
  return {
    run,
    files: filesUnder(runDir).sort(),
    consoleLines: lines(consoleText),
    networkLines: lines(networkText),
    candidates: bugCandidates(consoleText, networkText),
  };
}

/** The judge's answer, reviewed, and merged into the corrida's `findings.json`. */
function standingFindings(
  o: JudgeOptions,
  answer: string,
  facts: ReturnType<typeof readRun>,
  corrida: string,
): Review {
  const { run, files, ...trace } = facts;
  const findingsPath = join(corrida, 'findings.json');
  const existing = readFindings(findingsPath);
  const review = reviewJudgement(parseJudgeAnswer(answer), {
    ...trace,
    runId: run.id,
    personaStatus: o.persona.status,
    date: o.date,
    firstNumber: mergeFindings(existing, [], run.id, o.date).firstNumber,
    stepCount: run.steps.length,
    files: new Set(files),
  });
  const merged = mergeFindings(existing, review.findings, run.id, o.date).findings;
  writeFileSync(findingsPath, `${JSON.stringify(merged, null, 2)}\n`);
  return review;
}

export async function judgeRun(o: JudgeOptions): Promise<JudgeResult> {
  const facts = readRun(o.runDir);
  const { run, candidates } = facts;
  const corrida = dirname(dirname(o.runDir));
  const recordDir = join(corrida, 'judge', run.id);
  mkdirSync(recordDir, { recursive: true });
  const prompt = renderJudgePrompt(o.template, {
    files: facts.files,
    outcome: outcomeLine(run),
    persona: o.persona.yaml,
    scenario: o.scenarioYaml,
    candidates,
  });
  const { problems, final } = await askJudge(o, prompt, recordDir);
  const record = (extra: object) =>
    writeFileSync(
      join(recordDir, 'judge.json'),
      `${JSON.stringify({ run_id: run.id, model: o.model, problems, ...extra }, null, 2)}\n`,
    );
  if (problems.length > 0 || final === undefined) {
    record({});
    throw new Error(`the judge's session does not stand: ${problems.join('; ')}`);
  }
  const review = standingFindings(o, final.text, facts, corrida);
  const { findings, ...rest } = review;
  const ids = findings.map((f) => f.id);
  record({ estimated_cost_usd_cents: final.costCents, findings: ids, ...rest, candidates });
  return { review, costCents: final.costCents, recordDir };
}
