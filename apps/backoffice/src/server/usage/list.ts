import { z } from 'zod';
import type { BusinessId } from '@xangarro/domain';
import { usagePeriod, type UsagePeriod } from '@xangarro/domain/usage';

import type { BillingStatusSource } from '../billing/port';
import { decodeKeyset, encodeKeyset } from '../keyset';
import { invalidTenantInput, TenantError, tenantStore } from '../tenants/errors';
import type { PlanOverrideRepository } from '../tenants/port';
import type { UsageCursor, UsageSource } from './port';
import { usageRows, type UsageRow } from './row';

export const USAGE_FILTERS = ['todos', 'sobre', 'dos_meses'] as const;
export type UsageFilter = (typeof USAGE_FILTERS)[number];

export const ListUsageInputSchema = z.object({
  filtro: z.enum(USAGE_FILTERS).default('todos'),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).default(50),
});
export type ListUsageInput = z.input<typeof ListUsageInputSchema>;

/**
 * Filtered pages are found by scanning tenants in keyset order, `SCAN_BATCH`
 * at a time, at most `MAX_BATCHES` per request. The limits live in plan data
 * (and, after B-10, in Stripe's state), not in SQL, so "over the limit" can
 * only be decided after each tenant's plan is known. A scan that stops at the
 * cap returns what it found and a cursor where it stopped.
 */
export const SCAN_BATCH = 100;
export const MAX_BATCHES = 10;

export interface UsageListDeps {
  readonly usage: UsageSource;
  readonly billing: BillingStatusSource;
  readonly overrides: PlanOverrideRepository;
}

export interface UsageListResult {
  readonly period: UsagePeriod;
  readonly rows: readonly UsageRow[];
  readonly nextCursor: string | null;
  /** True when a filtered scan stopped at its cap: the next page may still find more. */
  readonly partial: boolean;
  readonly billingKnown: boolean;
}

function parse(input: unknown): z.output<typeof ListUsageInputSchema> {
  const parsed = ListUsageInputSchema.safeParse(input);
  if (!parsed.success) {
    throw invalidTenantInput(parsed.error.issues[0]?.message ?? 'Filtro inválido.');
  }
  return parsed.data;
}

function decodeCursor(raw: string): UsageCursor {
  const key = decodeKeyset(raw);
  if (key === null) throw new TenantError('INVALID_CURSOR', 'La página pedida no es válida.');
  return { createdAt: key.createdAt, id: key.id as BusinessId };
}

const keeps: Record<UsageFilter, (r: UsageRow) => boolean> = {
  todos: () => true,
  sobre: (r) => r.overLimit,
  dos_meses: (r) => r.twoMonthsOver,
};

const cursorOf = (r: UsageRow) => encodeKeyset(r.tenant);

interface Scan {
  readonly found: UsageRow[];
  readonly lastSeen: UsageRow | null;
  readonly exhausted: boolean;
}

async function scan(
  deps: UsageListDeps,
  filtro: UsageFilter,
  start: UsageCursor | null,
  want: number,
  period: UsagePeriod,
  now: Date,
): Promise<Scan> {
  const found: UsageRow[] = [];
  const size = filtro === 'todos' ? want : SCAN_BATCH;
  let after = start;
  let lastSeen: UsageRow | null = null;
  for (let i = 0; i < MAX_BATCHES && found.length < want; i += 1) {
    const page = await tenantStore(() => deps.usage.page({ period, after, limit: size }));
    const rows = await usageRows(deps, page, period, now);
    found.push(...rows.filter(keeps[filtro]));
    lastSeen = rows.at(-1) ?? lastSeen;
    const last = page.at(-1);
    if (page.length < size || last === undefined) return { found, lastSeen, exhausted: true };
    after = { createdAt: last.createdAt, id: last.id };
  }
  return { found, lastSeen, exhausted: false };
}

/**
 * `listUsage` — one page of tenants with this month's usage against their
 * plan's limits (N-07), newest tenant first. Asks for one row more than the
 * page to learn whether another page exists, without counting.
 */
export async function listUsage(
  deps: UsageListDeps,
  input: unknown,
  now: Date,
): Promise<UsageListResult> {
  const { filtro, cursor, limit } = parse(input);
  const start = cursor === undefined ? null : decodeCursor(cursor);
  const period = usagePeriod(now);
  const { found, lastSeen, exhausted } = await scan(deps, filtro, start, limit + 1, period, now);
  const rows = found.slice(0, limit);
  const lastShown = rows.at(-1);
  const base = { period, rows, billingKnown: deps.billing.known };
  if (found.length > limit && lastShown) {
    return { ...base, nextCursor: cursorOf(lastShown), partial: false };
  }
  if (exhausted || lastSeen === null) return { ...base, nextCursor: null, partial: false };
  return { ...base, nextCursor: cursorOf(lastSeen), partial: true };
}
