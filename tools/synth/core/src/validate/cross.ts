import type { MatrixRun } from '../schemas/matrix';
import type { Loaded, TreeIssue } from './tree';

/**
 * A matrix cell has to be runnable: its persona and scenario exist, and the
 * scenario applies to that kind of persona. A cell that fails here would only
 * fail later, mid-corrida, after the stack is up and money is spent.
 */
function cellIssues(file: string, i: number, run: MatrixRun, loaded: Loaded): TreeIssue[] {
  const persona = loaded.personas.get(run.persona)?.value;
  const scenario = loaded.scenarios.get(run.scenario)?.value;
  const out: TreeIssue[] = [];
  if (persona === undefined && !loaded.broken.has(`persona:${run.persona}`)) {
    out.push({ file, at: `runs.${i}.persona`, reason: `no persona «${run.persona}»` });
  }
  if (scenario === undefined && !loaded.broken.has(`scenario:${run.scenario}`)) {
    out.push({ file, at: `runs.${i}.scenario`, reason: `no scenario «${run.scenario}»` });
  }
  if (
    persona !== undefined &&
    scenario !== undefined &&
    !scenario.applies_to.includes(persona.kind)
  ) {
    out.push({
      file,
      at: `runs.${i}`,
      reason: `«${scenario.id}» does not apply to ${persona.kind} personas (${persona.id})`,
    });
  }
  return out;
}

export function matrixIssues(loaded: Loaded): TreeIssue[] {
  return loaded.matrices.flatMap(({ file, value }) =>
    value.runs.flatMap((run, i) => cellIssues(file, i, run, loaded)),
  );
}
