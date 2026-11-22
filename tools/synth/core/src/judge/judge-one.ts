import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { entry, type Catalogue } from '../corrida/catalogue';
import { RunSchema } from '../schemas/run';
import { judgeRun, type JudgeResult } from './run-judge';

/**
 * One run folder judged with the config's judge model (S-08), as the `judge`
 * command and a corrida (S-11) both call it: the run's persona and scenario
 * come from the catalogue, as written.
 */

/** Per run, in US dollars: Opus reading one run's trace and screenshots. */
export const JUDGE_BUDGET_USD = 3;

export function judgeOne(
  runDir: string,
  catalogue: Catalogue,
  o: { readonly template: string; readonly date: string },
): Promise<JudgeResult> {
  const run = RunSchema.parse(JSON.parse(readFileSync(join(runDir, 'run.json'), 'utf8')));
  const persona = entry(catalogue.personas, 'persona', run.persona);
  return judgeRun({
    runDir,
    model: catalogue.config.models.judge,
    budgetUsd: JUDGE_BUDGET_USD,
    template: o.template,
    date: o.date,
    persona: { yaml: persona.text, status: persona.value.status },
    scenarioYaml: entry(catalogue.scenarios, 'scenario', run.scenario).text,
  });
}

/** The judge's prompt template, `tools/synth/prompts/judge.md`. */
export const judgeTemplate = (synthDir: string): string =>
  readFileSync(join(synthDir, 'prompts/judge.md'), 'utf8');

/** What a judged run left, as the commands print it, with paths from `repo`. */
export function judgeSummary(repo: string, dir: string, r: JudgeResult): string {
  const { review } = r;
  const lines = [
    `${relative(repo, dir)}: ${review.findings.length} findings, ${review.dropped.length} dropped, ` +
      `${review.unreviewed.length} unreviewed, ~$${(r.costCents / 100).toFixed(2)} → ${relative(repo, r.recordDir)}`,
    ...review.findings.map((f) => `  ${f.id} ${f.category}/${f.severity} ${f.title}`),
    ...review.dropped.map((d) => `  dropped «${d.title}»: ${d.reason}`),
    ...review.notes.map((n) => `  note ${n}`),
  ];
  return `${lines.join('\n')}\n`;
}
