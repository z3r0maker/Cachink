/**
 * The console's two inputs to a business's entitlement (N-09, N-06), read
 * through `0039_entitlement_inputs.sql`'s tenant-scoped definer functions —
 * so they must run inside the tenant transaction. Both answer nothing where
 * the console's tables do not exist, which is exactly the code defaults.
 */
import {
  PLATFORM_FLAG_KEYS,
  PLATFORM_FLAG_MODES,
  type BusinessId,
  type PlanOverrideFacts,
  type PlatformFlagRule,
} from '@xangarro/domain';
import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';

type Conn = Db | Parameters<Parameters<Db['transaction']>[0]>[0];

const iso = (v: string | Date | null): string | null =>
  v === null ? null : new Date(v).toISOString();

const isKey = (k: string): k is PlatformFlagRule['key'] =>
  (PLATFORM_FLAG_KEYS as readonly string[]).includes(k);
const isMode = (m: string): m is PlatformFlagRule['mode'] =>
  (PLATFORM_FLAG_MODES as readonly string[]).includes(m);

interface FlagRow extends Record<string, unknown> {
  flag_key: string;
  mode: string;
  allowlist_business_ids: string[];
  updated_at: string | Date;
}

/** The platform rules as this business sees them; unknown keys are dropped, not guessed. */
export async function tenantPlatformRules(db: Conn): Promise<PlatformFlagRule[]> {
  const rows = await db.execute<FlagRow>(sql`SELECT * FROM xangarro.tenant_platform_flags()`);
  return rows.flatMap((r) =>
    isKey(r.flag_key) && isMode(r.mode)
      ? [
          {
            key: r.flag_key,
            mode: r.mode,
            allowlistBusinessIds: r.allowlist_business_ids as BusinessId[],
            updatedAt: iso(r.updated_at) ?? '',
          },
        ]
      : [],
  );
}

interface OverrideRow extends Record<string, unknown> {
  id: string;
  kind: string;
  days: number | null;
  plan_id: string | null;
  expires_at: string | Date | null;
  created_at: string | Date;
}

function toFacts(r: OverrideRow): PlanOverrideFacts | null {
  const base = { id: r.id as PlanOverrideFacts['id'], createdAt: iso(r.created_at) ?? '' };
  const expiresAt = iso(r.expires_at);
  if (r.kind === 'extend_trial' && r.days !== null && expiresAt !== null)
    return { ...base, kind: 'extend_trial', days: r.days, expiresAt };
  if (
    r.kind === 'comp_plan' &&
    (r.plan_id === 'xangarro' || r.plan_id === 'xangarrote') &&
    expiresAt !== null
  )
    return { ...base, kind: 'comp_plan', planId: r.plan_id, expiresAt };
  if (r.kind === 'reissue_entitlement') return { ...base, kind: 'reissue_entitlement', expiresAt };
  return null;
}

/** The business's overrides, oldest first; rows the shape CHECKs would refuse are skipped. */
export async function tenantPlanOverrides(db: Conn): Promise<PlanOverrideFacts[]> {
  const rows = await db.execute<OverrideRow>(sql`SELECT * FROM xangarro.tenant_plan_overrides()`);
  return rows.flatMap((r) => {
    const f = toFacts(r);
    return f === null ? [] : [f];
  });
}
