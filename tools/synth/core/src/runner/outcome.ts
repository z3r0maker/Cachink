import type { Run } from '../schemas/run';
import type { ActorRun } from './actor-process';
import { parseActorReport, type ActorReport } from './stream';

/**
 * A run's outcome. The persona's own verdict counts when it ends on its own
 * terms; running out of patience is abandoning (spec §8.1 rule 4); anything
 * else is the harness failing (`error`), which never counts against the app.
 */
export interface Outcome {
  readonly outcome: Run['outcome'];
  readonly error?: string;
  readonly report: ActorReport | null;
}

const STOPPED: Readonly<Record<Exclude<ActorRun['stop'], 'ended' | 'max_steps'>, string>> = {
  max_turns: 'the actor passed max_turns without ending',
  timeout: 'the run passed run_timeout_s',
  crashed: 'the actor process failed',
};

export function decideOutcome(actor: Pick<ActorRun, 'stop' | 'tracker' | 'stderr'>): Outcome {
  const report = actor.tracker.final ? parseActorReport(actor.tracker.final.text) : null;
  if (actor.stop === 'max_steps') return { outcome: 'abandoned', report };
  if (actor.stop !== 'ended') {
    const tail = actor.stderr.trim().split('\n').at(-1);
    return {
      outcome: 'error',
      error: tail ? `${STOPPED[actor.stop]}: ${tail}` : STOPPED[actor.stop],
      report,
    };
  }
  if (report === null)
    return {
      outcome: 'error',
      error: 'the actor ended without the report its prompt asks for',
      report,
    };
  return { outcome: report.outcome, report };
}
