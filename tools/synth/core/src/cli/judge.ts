import { readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { parse } from 'yaml';

import { judgeRun } from '../judge/run-judge';
import { ConfigSchema } from '../schemas/config';
import { PersonaSchema } from '../schemas/persona';
import { RunSchema } from '../schemas/run';
import { readTree } from './read-tree';

/**
 * `pnpm --filter @xangarro/synth-core judge <run folder>…` (S-08): judges each
 * run folder with the config's judge model and prints what stood. The
 * findings land in the corrida's `findings.json`; the judge's record, with
 * what was dropped and why, in `<corrida>/judge/<run-id>/judge.json`.
 */
const REPO = resolve(import.meta.dirname, '../../../../..');
const SYNTH = join(REPO, 'tools/synth');
/** Per run, in US dollars: Opus reading one run's trace and screenshots. */
const BUDGET_USD = 3;

function sources(runDir: string) {
  const run = RunSchema.parse(JSON.parse(readFileSync(join(runDir, 'run.json'), 'utf8')));
  const tree = readTree(SYNTH);
  const find = (folder: string, id: string) => {
    const file = tree.find(
      (f) => f.path.startsWith(`${folder}/`) && f.path.endsWith(`/${id}.yaml`),
    );
    if (file === undefined) throw new Error(`${run.id}: no ${folder} file for «${id}»`);
    return file.text;
  };
  const personaYaml = find('personas', run.persona);
  return {
    persona: { yaml: personaYaml, status: PersonaSchema.parse(parse(personaYaml)).status },
    scenarioYaml: find('scenarios', run.scenario),
  };
}

async function main(): Promise<void> {
  const dirs = process.argv.slice(2).filter((a) => a !== '--');
  if (dirs.length === 0) throw new Error('usage: judge <reports/<corrida>/runs/<run-id>>…');
  const config = ConfigSchema.parse(parse(readFileSync(join(SYNTH, 'config.yaml'), 'utf8')));
  const template = readFileSync(join(SYNTH, 'prompts/judge.md'), 'utf8');
  const date = new Date().toISOString().slice(0, 10);
  for (const dir of dirs.map((d) => resolve(process.env.INIT_CWD ?? process.cwd(), d))) {
    const { review, costCents, recordDir } = await judgeRun({
      runDir: dir,
      model: config.models.judge,
      budgetUsd: BUDGET_USD,
      template,
      date,
      ...sources(dir),
    });
    process.stdout.write(
      `${relative(REPO, dir)}: ${review.findings.length} findings, ${review.dropped.length} dropped, ` +
        `${review.unreviewed.length} unreviewed, ~$${(costCents / 100).toFixed(2)} → ${relative(REPO, recordDir)}\n`,
    );
    for (const f of review.findings)
      process.stdout.write(`  ${f.id} ${f.category}/${f.severity} ${f.title}\n`);
    for (const d of review.dropped) process.stdout.write(`  dropped «${d.title}»: ${d.reason}\n`);
    for (const n of review.notes) process.stdout.write(`  note ${n}\n`);
  }
}

main().catch((e: unknown) => {
  process.stderr.write(`${e instanceof Error ? (e.stack ?? e.message) : String(e)}\n`);
  process.exit(1);
});
