import { writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';

import { parse } from 'yaml';

import { groupFindings, type PersonaFacts } from '../aggregate/dedupe';
import { corridaCells, findingKeys, loadCorrida, type LoadedCorrida } from '../aggregate/load';
import {
  cellMetrics,
  comparablePrevious,
  findingDeltas,
  metricDeltas,
  runMetrics,
} from '../aggregate/metrics';
import { renderReport } from '../aggregate/report';
import { marketWeights } from '../aggregate/weights';
import { PersonaSchema } from '../schemas/persona';
import { ScenarioSchema } from '../schemas/scenario';
import { reportsDir } from '../stack/names';
import { readTree } from './read-tree';

/**
 * `pnpm --filter @xangarro/synth-core aggregate <corrida folder>` (S-09):
 * aggregates a judged corrida into `metrics.json` and `report.md` beside its
 * runs, with deltas against the latest earlier corrida that ran a same cell.
 */
const REPO = resolve(import.meta.dirname, '../../../../..');
const SYNTH = join(REPO, 'tools/synth');

function catalogue() {
  const tree = readTree(SYNTH);
  const found = tree
    .filter((f) => f.path.startsWith('personas/'))
    .map((f) => PersonaSchema.parse(parse(f.text)));
  const weights = marketWeights(
    found.map((p) => ({ id: p.id, kind: p.kind, weight: p.market_weight.value })),
  );
  const personas = new Map<string, PersonaFacts>(
    found.map((p) => [p.id, { market_weight: weights.get(p.id) ?? 0, status: p.status }]),
  );
  const optimal = new Map<string, number>();
  for (const f of tree.filter((t) => t.path.startsWith('scenarios/'))) {
    const s = ScenarioSchema.parse(parse(f.text));
    optimal.set(s.id, s.optimal_steps);
  }
  return { personas, optimal };
}

function previousOf(c: LoadedCorrida, optimal: ReadonlyMap<string, number>) {
  const reports = reportsDir(REPO);
  const all = corridaCells(reports);
  const me = all.find((x) => x.id === c.id);
  const id = me === undefined ? undefined : comparablePrevious(me, all);
  if (id === undefined) return undefined;
  const before = loadCorrida(join(reports, id), id);
  return { before, cells: cellMetrics(runMetrics(before.runs, before.findings, optimal)) };
}

function main(): void {
  const arg = process.argv.slice(2).find((a) => a !== '--');
  if (arg === undefined) throw new Error('usage: aggregate <reports/<corrida>>');
  const dir = resolve(process.env.INIT_CWD ?? process.cwd(), arg);
  const corrida = loadCorrida(dir, basename(dir));
  const { personas, optimal } = catalogue();
  const runs = corrida.runs.map((r) => r.run);
  const { groups, droppedNoEvidence } = groupFindings(corrida.findings, runs, personas);
  const metrics = runMetrics(corrida.runs, corrida.findings, optimal);
  const cells = cellMetrics(metrics);
  const prev = previousOf(corrida, optimal);
  const previous =
    prev === undefined
      ? undefined
      : {
          id: prev.before.id,
          metrics: metricDeltas(cells, prev.cells),
          findings: findingDeltas(findingKeys(corrida.findings), findingKeys(prev.before.findings)),
        };
  const head = { id: corrida.id, started_at: corrida.started_at, ...corrida.meta };
  writeFileSync(
    join(dir, 'metrics.json'),
    `${JSON.stringify({ corrida: head, runs: metrics, cells, previous, dropped_no_evidence: droppedNoEvidence }, null, 2)}\n`,
  );
  const md = renderReport({
    corrida: head,
    runs: metrics,
    groups,
    droppedNoEvidence: droppedNoEvidence.length,
    ...(previous === undefined ? {} : { previous }),
  });
  writeFileSync(join(dir, 'report.md'), md);
  process.stdout.write(
    `${relative(REPO, dir)}: ${groups.length} findings after dedup, ${droppedNoEvidence.length} dropped, ` +
      `previous ${previous?.id ?? 'none'} → report.md, metrics.json\n`,
  );
}

try {
  main();
} catch (e: unknown) {
  process.stderr.write(`${e instanceof Error ? (e.stack ?? e.message) : String(e)}\n`);
  process.exit(1);
}
