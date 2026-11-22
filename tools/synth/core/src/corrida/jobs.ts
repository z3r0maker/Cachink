import type { Matrix } from '../schemas/matrix';
import type { Scenario } from '../schemas/scenario';

/**
 * A matrix as the corrida's jobs (S-11): every cell once per repetition, the
 * rounds in order, so a corrida cut short by the cost cap has still run each
 * cell once. Each job knows its runner, which decides the pool lane.
 */
export interface Job {
  readonly persona: string;
  readonly scenario: string;
  readonly style: 'task';
  readonly repetition: number;
  readonly runner: Scenario['runner'];
}

export function corridaJobs(
  matrix: Matrix,
  scenarios: ReadonlyMap<string, Scenario>,
  maxRuns = Number.POSITIVE_INFINITY,
): Job[] {
  const total = matrix.runs.length * matrix.repetitions;
  if (total > maxRuns) {
    throw new Error(`the matrix makes ${total} runs; a corrida holds at most ${maxRuns}`);
  }
  const jobs: Job[] = [];
  for (let repetition = 1; repetition <= matrix.repetitions; repetition += 1) {
    for (const cell of matrix.runs) {
      if (cell.style !== 'task') {
        throw new Error(
          `${cell.persona} × ${cell.scenario}: the walkthrough style comes with S-14`,
        );
      }
      const scenario = scenarios.get(cell.scenario);
      if (scenario === undefined) throw new Error(`no scenario «${cell.scenario}»`);
      jobs.push({ ...cell, style: 'task', repetition, runner: scenario.runner });
    }
  }
  return jobs;
}
