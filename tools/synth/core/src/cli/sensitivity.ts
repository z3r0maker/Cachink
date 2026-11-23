import { spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { loadCatalogue } from '../corrida/catalogue';
import { SEEDED_BUGS } from '../seeded/bugs';
import { appendHistory } from '../sensitivity/history';
import { scoreCorridas, type Scored } from '../sensitivity/load';
import type { Tally } from '../sensitivity/score';
import { reportsDir } from '../stack/names';

/**
 * `pnpm --filter @xangarro/synth-core sensitivity <run|score>` (S-13, spec §9).
 *
 *   run [--bugs id,id] [--note text]
 *       A clean smoke corrida, then one per seeded bug, one after another;
 *       then `score` over them.
 *   score --baseline <corrida> [--note text] <corrida>…
 *       Recall of corridas already run (after re-judging them with a changed
 *       prompt, say), against the clean smoke. Prints it, writes the details
 *       to `reports/sensitivity-<baseline>.json`, and appends a row to
 *       `calibration/sensitivity-history.csv`.
 */
const CORE = resolve(import.meta.dirname, '../..');
const REPO = resolve(CORE, '../../..');
const SYNTH = join(REPO, 'tools/synth');
const REPORTS = reportsDir(REPO);

const pct = (t: Tally): string =>
  t.recall === null ? '—' : `${Math.round(t.recall * 100)}% (${t.hits}/${t.of})`;

function print(s: Scored): void {
  const { overall, byCategory, byRunner } = s.recall;
  const out = [
    `recall ${pct(overall)}`,
    `  bug ${pct(byCategory.bug)} · friction ${pct(byCategory.friction)} · comprehension ${pct(byCategory.comprehension)}`,
    `  web ${pct(byRunner.web)} · phone ${pct(byRunner.phone)}`,
    ...s.measurements.map(
      (m) =>
        `  ${m.hit ? 'hit ' : m.measured ? 'miss' : 'n/a '} ${m.bug} (${m.runner})` +
        `${m.finding ? ` ← ${m.finding}` : ''}${m.nearMisses.length > 0 ? ` · near: ${m.nearMisses.join('; ')}` : ''}`,
    ),
  ];
  process.stdout.write(`${out.join('\n')}\n`);
}

function score(baseline: string, corridas: readonly string[], note: string): Scored {
  const scored = scoreCorridas(REPORTS, baseline, corridas);
  print(scored);
  const prompt = readFileSync(join(SYNTH, 'prompts/judge.md'));
  const details = { baseline, corridas, ...scored };
  writeFileSync(
    join(REPORTS, `sensitivity-${baseline}.json`),
    `${JSON.stringify(details, null, 2)}\n`,
  );
  appendHistory(join(SYNTH, 'calibration/sensitivity-history.csv'), {
    date: new Date().toISOString().slice(0, 10),
    appCommit: scored.appCommit,
    judgeModel: loadCatalogue(SYNTH).config.models.judge,
    judgePrompt: createHash('sha256').update(prompt).digest('hex').slice(0, 12),
    baseline,
    corridas,
    recall: scored.recall,
    note,
  });
  return scored;
}

const newId = (): string =>
  `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomBytes(2).toString('hex')}`;

/** One smoke corrida, in its own process (it takes the Maestro lock itself); true when it finished. */
function corrida(id: string, bug?: string): boolean {
  const args = ['--import', 'tsx', 'src/cli/corrida.ts', '--matrix', 'smoke', '--id', id];
  if (bug !== undefined) args.push('--seeded-bug', bug);
  process.stdout.write(`\n— corrida ${id}${bug ? ` under ${bug}` : ' (clean)'}\n`);
  return spawnSync(process.execPath, args, { cwd: CORE, stdio: 'inherit' }).status === 0;
}

function run(bugs: readonly string[], note: string): void {
  const baseline = newId();
  if (!corrida(baseline)) throw new Error(`the clean smoke ${baseline} did not finish`);
  const done = bugs.flatMap((bug) => {
    const id = newId();
    return corrida(id, bug) ? [id] : [];
  });
  score(baseline, done, note);
}

function main(): void {
  const [command, ...rest] = process.argv.slice(2).filter((a) => a !== '--');
  const { values, positionals } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: { bugs: { type: 'string' }, baseline: { type: 'string' }, note: { type: 'string' } },
  });
  const note = values.note ?? '';
  if (command === 'run') {
    run(values.bugs?.split(',') ?? SEEDED_BUGS.map((b) => b.id), note);
    return;
  }
  if (command === 'score' && values.baseline !== undefined && positionals.length > 0) {
    score(values.baseline, positionals, note);
    return;
  }
  throw new Error('usage: sensitivity run [--bugs a,b] | score --baseline <corrida> <corrida>…');
}

try {
  main();
} catch (e: unknown) {
  process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
}
