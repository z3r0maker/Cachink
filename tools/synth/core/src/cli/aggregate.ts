import { join, relative, resolve } from 'node:path';

import { aggregateCorrida } from '../aggregate/aggregate-corrida';
import { loadCatalogue } from '../corrida/catalogue';

/**
 * `pnpm --filter @xangarro/synth-core aggregate <corrida folder>` (S-09):
 * aggregates a judged corrida into `metrics.json` and `report.md` beside its
 * runs, with deltas against the latest earlier corrida that ran a same cell.
 */
const REPO = resolve(import.meta.dirname, '../../../../..');
const SYNTH = join(REPO, 'tools/synth');

function main(): void {
  const arg = process.argv.slice(2).find((a) => a !== '--');
  if (arg === undefined) throw new Error('usage: aggregate <reports/<corrida>>');
  const dir = resolve(process.env.INIT_CWD ?? process.cwd(), arg);
  const a = aggregateCorrida(REPO, dir, loadCatalogue(SYNTH));
  process.stdout.write(
    `${relative(REPO, dir)}: ${a.findings} findings after dedup, ${a.droppedNoEvidence} dropped, ` +
      `previous ${a.previous ?? 'none'} → report.md, metrics.json\n`,
  );
}

try {
  main();
} catch (e: unknown) {
  process.stderr.write(`${e instanceof Error ? (e.stack ?? e.message) : String(e)}\n`);
  process.exit(1);
}
