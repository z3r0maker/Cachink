import { writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

import type { Catalogue } from '../corrida/catalogue';
import { reportsDir } from '../stack/names';
import { groupFindings, type PersonaFacts } from './dedupe';
import { corridaCells, findingKeys, loadCorrida, type LoadedCorrida } from './load';
import {
  cellMetrics,
  comparablePrevious,
  findingDeltas,
  metricDeltas,
  runMetrics,
} from './metrics';
import { renderReport } from './report';
import { marketWeights } from './weights';

/**
 * A judged corrida aggregated into `metrics.json` and `report.md` beside its
 * runs (S-09), with deltas against the latest earlier corrida that ran a same
 * cell. The `aggregate` command and a whole corrida (S-11) both end here.
 */
export interface Aggregated {
  readonly findings: number;
  readonly droppedNoEvidence: number;
  readonly previous: string | undefined;
}

function facts(c: Catalogue) {
  const all = [...c.personas.values()].map((e) => e.value);
  const weights = marketWeights(
    all.map((p) => ({ id: p.id, kind: p.kind, weight: p.market_weight.value })),
  );
  const personas = new Map<string, PersonaFacts>(
    all.map((p) => [p.id, { market_weight: weights.get(p.id) ?? 0, status: p.status }]),
  );
  const optimal = new Map(
    [...c.scenarios.values()].map((e) => [e.value.id, e.value.optimal_steps]),
  );
  return { personas, optimal };
}

function previousOf(repo: string, c: LoadedCorrida, optimal: ReadonlyMap<string, number>) {
  const reports = reportsDir(repo);
  const all = corridaCells(reports);
  const me = all.find((x) => x.id === c.id);
  const id = me === undefined ? undefined : comparablePrevious(me, all);
  if (id === undefined) return undefined;
  const before = loadCorrida(join(reports, id), id);
  return { before, cells: cellMetrics(runMetrics(before.runs, before.findings, optimal)) };
}

export function aggregateCorrida(repo: string, dir: string, catalogue: Catalogue): Aggregated {
  const corrida = loadCorrida(dir, basename(dir));
  const { personas, optimal } = facts(catalogue);
  const runs = corrida.runs.map((r) => r.run);
  const { groups, droppedNoEvidence } = groupFindings(corrida.findings, runs, personas);
  const metrics = runMetrics(corrida.runs, corrida.findings, optimal);
  const cells = cellMetrics(metrics);
  const prev = previousOf(repo, corrida, optimal);
  const previous =
    prev === undefined
      ? undefined
      : {
          id: prev.before.id,
          metrics: metricDeltas(cells, prev.cells),
          findings: findingDeltas(findingKeys(corrida.findings), findingKeys(prev.before.findings)),
        };
  const head = { id: corrida.id, started_at: corrida.started_at, ...corrida.meta };
  const body = {
    corrida: head,
    runs: metrics,
    cells,
    previous,
    dropped_no_evidence: droppedNoEvidence,
  };
  writeFileSync(join(dir, 'metrics.json'), `${JSON.stringify(body, null, 2)}\n`);
  const md = renderReport({
    corrida: head,
    runs: metrics,
    groups,
    droppedNoEvidence: droppedNoEvidence.length,
    ...(previous === undefined ? {} : { previous }),
  });
  writeFileSync(join(dir, 'report.md'), md);
  return {
    findings: groups.length,
    droppedNoEvidence: droppedNoEvidence.length,
    previous: previous?.id,
  };
}
