/**
 * The corrida's pool (S-11): two lanes side by side, web up to its limit and
 * the phone one at a time (one emulator, ADR-153 §5). A run that throws is
 * recorded and the rest go on; once `canStart` says the cost cap is reached,
 * every run not yet started is skipped and says why.
 */
export type PoolResult<J, R> =
  | { readonly job: J; readonly status: 'done'; readonly value: R }
  | { readonly job: J; readonly status: 'failed'; readonly error: string }
  | { readonly job: J; readonly status: 'skipped'; readonly reason: string };

export interface PoolLimits {
  readonly web: number;
  readonly phone: number;
}

export interface PoolOptions {
  /** Asked before each run starts; false once the corrida or the day is out of budget. */
  readonly canStart: () => boolean;
}

type Lane = 'web' | 'phone';

async function attempt<J, R>(
  job: J,
  index: number,
  work: (job: J, index: number) => Promise<R>,
  options: PoolOptions,
): Promise<PoolResult<J, R>> {
  if (!options.canStart()) {
    return { job, status: 'skipped', reason: 'the cost cap was reached before it started' };
  }
  try {
    return { job, status: 'done', value: await work(job, index) };
  } catch (e) {
    return { job, status: 'failed', error: e instanceof Error ? e.message : String(e) };
  }
}

export async function runPool<J extends { readonly runner: Lane }, R>(
  jobs: readonly J[],
  limits: PoolLimits,
  work: (job: J, index: number) => Promise<R>,
  options: PoolOptions,
): Promise<PoolResult<J, R>[]> {
  const results: PoolResult<J, R>[] = new Array<PoolResult<J, R>>(jobs.length);
  const lane = (name: Lane) => {
    const queue = jobs.flatMap((job, index) => (job.runner === name ? [{ job, index }] : []));
    const worker = async () => {
      for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
        results[next.index] = await attempt(next.job, next.index, work, options);
      }
    };
    return Array.from({ length: Math.max(1, limits[name]) }, worker);
  };
  await Promise.all([...lane('web'), ...lane('phone')]);
  return results;
}
