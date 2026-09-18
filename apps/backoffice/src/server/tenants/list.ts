import { z } from 'zod';
import { PLAN_IDS, type BusinessId, type PlanOverride } from '@xangarro/domain';

import {
  BILLING_STATUSES,
  UNKNOWN_BILLING,
  type BillingSnapshot,
  type BillingStatusSource,
} from '../billing/port';
import { decodeKeyset, encodeKeyset } from '../keyset';
import { invalidTenantInput, TenantError, tenantStore } from './errors';
import { planView, type PlanView } from './plan-view';
import type {
  PlanOverrideRepository,
  TenantCursor,
  TenantDirectory,
  TenantQuery,
  TenantSummary,
} from './port';

/** "Sin sincronizar > 7 días" (N-06). */
export const STALE_AFTER_DAYS = 7;
const DAY = 86_400_000;

export const ListTenantsInputSchema = z.object({
  q: z.string().trim().max(100).optional(),
  plan: z.enum(PLAN_IDS).optional(),
  status: z.enum(BILLING_STATUSES).optional(),
  stale: z.boolean().optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).default(50),
});
export type ListTenantsInput = z.input<typeof ListTenantsInputSchema>;

export interface TenantListDeps {
  readonly directory: TenantDirectory;
  readonly billing: BillingStatusSource;
  readonly overrides: PlanOverrideRepository;
}

export interface TenantRow {
  readonly summary: TenantSummary;
  readonly billing: BillingSnapshot;
  readonly plan: PlanView;
}

export interface TenantListResult {
  readonly tenants: readonly TenantRow[];
  readonly nextCursor: string | null;
  /** False while billing is the B-10 stub: plan and status filters cannot match. */
  readonly billingKnown: boolean;
}

function decodeCursor(raw: string): TenantCursor {
  const key = decodeKeyset(raw);
  if (key === null) throw new TenantError('INVALID_CURSOR', 'La página pedida no es válida.');
  return { createdAt: key.createdAt, id: key.id as BusinessId };
}

function parse(input: unknown): z.output<typeof ListTenantsInputSchema> {
  const parsed = ListTenantsInputSchema.safeParse(input);
  if (!parsed.success)
    throw invalidTenantInput(parsed.error.issues[0]?.message ?? 'Filtro inválido.');
  return parsed.data;
}

async function enrich(
  deps: TenantListDeps,
  page: readonly TenantSummary[],
  now: Date,
): Promise<TenantRow[]> {
  const ids = page.map((t) => t.id);
  const [snapshots, active] = await Promise.all([
    tenantStore(() => deps.billing.snapshots(ids)),
    tenantStore(() => deps.overrides.activeFor(ids, now)),
  ]);
  const byTenant = new Map<BusinessId, PlanOverride[]>();
  for (const o of active) byTenant.set(o.businessId, [...(byTenant.get(o.businessId) ?? []), o]);
  return page.map((summary) => {
    const billing = snapshots.get(summary.id) ?? UNKNOWN_BILLING;
    return { summary, billing, plan: planView(billing, byTenant.get(summary.id) ?? [], now) };
  });
}

/**
 * `listTenants` — one page of tenants, newest first (N-06). Plan and status
 * filters are answered by the billing source (Stripe's truth); search, the
 * stale filter and the keyset page by the directory. Asks for one row more
 * than the page to learn whether another page exists, without counting.
 */
export async function listTenants(
  deps: TenantListDeps,
  input: unknown,
  now: Date,
): Promise<TenantListResult> {
  const { cursor, limit, plan, status, stale, q } = parse(input);
  const after = cursor === undefined ? null : decodeCursor(cursor);
  const match = await tenantStore(() => deps.billing.matching({ plan, status }));
  const empty = { tenants: [], nextCursor: null, billingKnown: deps.billing.known };
  if (match.kind === 'only' && match.businessIds.length === 0) return empty;

  const query: TenantQuery = {
    ...(q ? { search: q } : {}),
    ...(stale
      ? { staleBefore: new Date(now.getTime() - STALE_AFTER_DAYS * DAY).toISOString() }
      : {}),
    ...(match.kind === 'only' ? { onlyIds: match.businessIds } : {}),
    after,
    limit: limit + 1,
  };
  const rows = await tenantStore(() => deps.directory.list(query));
  const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  return {
    tenants: await enrich(deps, page, now),
    nextCursor: rows.length > limit && last ? encodeKeyset(last) : null,
    billingKnown: deps.billing.known,
  };
}
