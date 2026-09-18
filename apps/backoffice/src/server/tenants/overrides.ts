import { z } from 'zod';
import {
  PLAN_IDS,
  PlanOverrideSchema,
  ulidField,
  type BusinessId,
  type PlanOverride,
  type PlanOverrideId,
  type StaffMemberId,
} from '@xangarro/domain';

import { invalidTenantInput, TenantError, tenantStore } from './errors';
import type { PlanOverrideRepository, TenantDirectory } from './port';

/** Both paid tiers carry a 14-day trial (ADR-067). */
export const TRIAL_DAYS = 14;
/** A comp longer than this is almost certainly a typo in the year. */
export const MAX_COMP_DAYS = 366;
const DAY = 86_400_000;
/** America/Mexico_City has had no DST since 2022: always UTC−6. */
const CDMX_OFFSET = '-06:00';

const businessId = ulidField<BusinessId>();

/** What the three forms post. Strings, as `FormData` gives them. */
export const OverrideFormSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('extend_trial'),
    businessId,
    days: z.coerce.number().int().min(1).max(90),
  }),
  z.object({
    kind: z.literal('comp_plan'),
    businessId,
    planId: z.enum(PLAN_IDS),
    reason: z.string(),
    /** Last day the comp applies (inclusive), `YYYY-MM-DD` in CDMX. */
    hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  z.object({ kind: z.literal('reissue_entitlement'), businessId }),
]);
type OverrideForm = z.output<typeof OverrideFormSchema>;

export interface OverrideDeps {
  readonly directory: TenantDirectory;
  readonly overrides: PlanOverrideRepository;
  readonly staffId: StaffMemberId;
  readonly now: () => Date;
  readonly newId: () => PlanOverrideId;
}

/** Midnight at the end of `hasta`, in CDMX. */
function endOfDay(hasta: string): number {
  const start = Date.parse(`${hasta}T00:00:00.000${CDMX_OFFSET}`);
  if (Number.isNaN(start)) throw invalidTenantInput('La fecha no es válida.');
  return start + DAY;
}

function kindFields(form: OverrideForm, now: Date): Record<string, unknown> {
  const t = now.getTime();
  switch (form.kind) {
    case 'extend_trial':
      // Active for as long as any running trial could last, plus the days granted.
      return {
        days: form.days,
        expiresAt: new Date(t + (TRIAL_DAYS + form.days) * DAY).toISOString(),
      };
    case 'comp_plan': {
      const end = endOfDay(form.hasta);
      if (end - t > MAX_COMP_DAYS * DAY)
        throw invalidTenantInput('Un regalo dura como máximo un año.');
      return { planId: form.planId, reason: form.reason, expiresAt: new Date(end).toISOString() };
    }
    case 'reissue_entitlement':
      return { expiresAt: null };
  }
}

function build(form: OverrideForm, deps: OverrideDeps): PlanOverride {
  const now = deps.now();
  const parsed = PlanOverrideSchema.safeParse({
    id: deps.newId(),
    businessId: form.businessId,
    createdBy: deps.staffId,
    createdAt: now.toISOString(),
    kind: form.kind,
    ...kindFields(form, now),
  });
  if (!parsed.success)
    throw invalidTenantInput(parsed.error.issues[0]?.message ?? 'Ajuste inválido.');
  return parsed.data;
}

/**
 * `createPlanOverride` — records one staff override (N-06). Validates the
 * form, checks the business exists, derives the expiry, stores it. The
 * server action wraps it in `auditedMutation`, so it commits with its audit row.
 */
export async function createPlanOverride(
  deps: OverrideDeps,
  input: unknown,
): Promise<PlanOverride> {
  const form = OverrideFormSchema.safeParse(input);
  if (!form.success) throw invalidTenantInput(form.error.issues[0]?.message ?? 'Ajuste inválido.');
  const override = build(form.data, deps);
  const tenant = await tenantStore(() => deps.directory.find(override.businessId));
  if (tenant === null) throw new TenantError('NOT_FOUND', 'Ese negocio no existe.');
  await tenantStore(() => deps.overrides.insert(override));
  return override;
}
