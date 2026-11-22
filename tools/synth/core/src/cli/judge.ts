import { join, resolve } from 'node:path';

import { loadCatalogue } from '../corrida/catalogue';
import { judgeOne, judgeSummary, judgeTemplate } from '../judge/judge-one';

/**
 * `pnpm --filter @xangarro/synth-core judge <run folder>…` (S-08): judges each
 * run folder with the config's judge model and prints what stood. The
 * findings land in the corrida's `findings.json`; the judge's record, with
 * what was dropped and why, in `<corrida>/judge/<run-id>/judge.json`.
 */
const REPO = resolve(import.meta.dirname, '../../../../..');
const SYNTH = join(REPO, 'tools/synth');

async function main(): Promise<void> {
  const dirs = process.argv.slice(2).filter((a) => a !== '--');
  if (dirs.length === 0) throw new Error('usage: judge <reports/<corrida>/runs/<run-id>>…');
  const catalogue = loadCatalogue(SYNTH);
  const o = { template: judgeTemplate(SYNTH), date: new Date().toISOString().slice(0, 10) };
  for (const dir of dirs.map((d) => resolve(process.env.INIT_CWD ?? process.cwd(), d))) {
    process.stdout.write(judgeSummary(REPO, dir, await judgeOne(dir, catalogue, o)));
  }
}

main().catch((e: unknown) => {
  process.stderr.write(`${e instanceof Error ? (e.stack ?? e.message) : String(e)}\n`);
  process.exit(1);
});
