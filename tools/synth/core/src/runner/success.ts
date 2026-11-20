import { setTimeout as sleep } from 'node:timers/promises';

import type { Scenario } from '../schemas/scenario';
import { runCheck } from '../success/checks';

/**
 * The scenario's success, by SQL, after the run. The web register writes to
 * its own database first and pushes through the outbox, so a sale can reach
 * Postgres a few seconds after the actor is done: the checks are asked again
 * until all pass or `waitMs` runs out, and the last answer is the verdict.
 */
export async function evaluateSuccess(
  biz: string,
  success: Scenario['success'],
  waitMs = 60_000,
): Promise<{ check: string; passed: boolean }[]> {
  const until = Date.now() + waitMs;
  for (;;) {
    const results = await Promise.all(
      success.map(async (c) => ({
        check: c.check,
        passed: await runCheck(c.check, biz, c.params ?? {}),
      })),
    );
    if (results.every((r) => r.passed) || Date.now() >= until) return results;
    await sleep(2_000);
  }
}
