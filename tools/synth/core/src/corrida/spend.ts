import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Config } from '../schemas/config';

/**
 * Owner decision 6's caps across corridas (S-11). What a day already spent is
 * read back from disk, every corrida that started that day, its runs' and its
 * judges' estimated cost, so a second corrida starts with what the first left.
 */
const cents = (path: string): number => {
  if (!existsSync(path)) return 0;
  const value = (JSON.parse(readFileSync(path, 'utf8')) as { estimated_cost_usd_cents?: unknown })
    .estimated_cost_usd_cents;
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : 0;
};

const subdirs = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    : [];

/** A corrida's runs and judges, in estimated US cents. */
export function corridaSpentCents(dir: string): number {
  const runs = subdirs(join(dir, 'runs')).map((id) => cents(join(dir, 'runs', id, 'run.json')));
  const judges = subdirs(join(dir, 'judge')).map((id) =>
    cents(join(dir, 'judge', id, 'judge.json')),
  );
  return [...runs, ...judges].reduce((a, b) => a + b, 0);
}

/** Every corrida in `reportsDir` that started on `day` (UTC `YYYY-MM-DD`). */
export function spentOnDayCents(reportsDir: string, day: string): number {
  return subdirs(reportsDir)
    .map((id) => join(reportsDir, id))
    .filter((dir) => {
      const file = join(dir, 'corrida.json');
      if (!existsSync(file)) return false;
      const started = (JSON.parse(readFileSync(file, 'utf8')) as { started_at?: unknown })
        .started_at;
      return typeof started === 'string' && started.startsWith(day);
    })
    .reduce((sum, dir) => sum + corridaSpentCents(dir), 0);
}

/** What may still be spent: the smaller of the corrida's and the day's room, never below 0. */
export function budgetLeftCents(
  caps: Config['estimated_cost_caps'],
  spent: { readonly corrida: number; readonly dayBefore: number },
): number {
  const corrida = caps.per_corrida_usd_cents - spent.corrida;
  const day = caps.per_day_usd_cents - spent.dayBefore - spent.corrida;
  return Math.max(0, Math.min(corrida, day));
}
