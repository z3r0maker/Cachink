import { z } from 'zod';
import {
  PLATFORM_FLAG_KEYS,
  PLATFORM_FLAG_MODES,
  PlatformFlagSchema,
  type BusinessId,
  type PlatformFlagEventId,
  type StaffMemberId,
} from '@xangarro/domain';

import type { TenantDirectory } from '../tenants/port';
import { FlagError, flagStore } from './errors';
import { CONFIRM_OFF } from './labels';
import type { PlatformFlagEvent, PlatformFlagStore } from './port';
import { flagState, sameState, type FlagState } from './state';

/** What the edit dialog posts. Strings, as `FormData` gives them. */
export const SetFlagFormSchema = z.object({
  key: z.enum(PLATFORM_FLAG_KEYS),
  mode: z.enum(PLATFORM_FLAG_MODES),
  allowlist: z.array(z.string()).default([]),
  reason: z.string(),
  confirmacion: z.string().optional(),
});

export interface SetFlagDeps {
  readonly store: PlatformFlagStore;
  readonly directory: TenantDirectory;
  readonly staffId: StaffMemberId;
  readonly now: () => Date;
  readonly newId: () => PlatformFlagEventId;
}

export interface FlagChange {
  readonly event: PlatformFlagEvent;
  readonly before: FlagState;
  /** Businesses the new state reaches: all of them, or the list. */
  readonly affected: number;
}

const invalid = (message: string) => new FlagError('VALIDATION', message);

function build(form: z.output<typeof SetFlagFormSchema>, deps: SetFlagDeps): PlatformFlagEvent {
  const parsed = PlatformFlagSchema.safeParse({
    key: form.key,
    mode: form.mode,
    allowlistBusinessIds: [...new Set(form.allowlist)].sort(),
    reason: form.reason,
    updatedBy: deps.staffId,
    updatedAt: deps.now().toISOString(),
  });
  if (!parsed.success) throw invalid(parsed.error.issues[0]?.message ?? 'Cambio inválido.');
  return { id: deps.newId(), ...parsed.data };
}

async function assertTenantsExist(deps: SetFlagDeps, ids: readonly BusinessId[]): Promise<void> {
  if (ids.length === 0) return;
  const found = await flagStore(() =>
    deps.directory.list({ onlyIds: ids, after: null, limit: ids.length }),
  );
  const known = new Set(found.map((t) => t.id));
  const missing = ids.filter((id) => !known.has(id));
  if (missing.length > 0) {
    throw new FlagError('UNKNOWN_TENANT', `Estos negocios no existen: ${missing.join(', ')}.`);
  }
}

/** Switching a key off for everyone, when it was not already off, must be confirmed. */
function assertConfirmed(before: FlagState, event: PlatformFlagEvent, confirmacion?: string): void {
  if (event.mode === 'off' && before.mode !== 'off' && confirmacion !== CONFIRM_OFF) {
    throw new FlagError('NEEDS_CONFIRMATION', 'Confirma que quieres apagarlo para todos.');
  }
}

/**
 * `setPlatformFlag` — records one change to a platform flag (N-09). Validates
 * the form, refuses no-ops and unknown tenants, demands confirmation before a
 * global switch-off, appends the event. The server action wraps it in
 * `auditedMutation`, so it commits with its audit row.
 */
export async function setPlatformFlag(deps: SetFlagDeps, input: unknown): Promise<FlagChange> {
  const form = SetFlagFormSchema.safeParse(input);
  if (!form.success) throw invalid(form.error.issues[0]?.message ?? 'Cambio inválido.');
  const event = build(form.data, deps);
  const before = flagState(event.key, await flagStore(() => deps.store.current()));
  if (sameState(before, event) && before.source === 'row') {
    throw new FlagError('NO_CHANGE', 'Ese flag ya está así.');
  }
  assertConfirmed(before, event, form.data.confirmacion);
  await assertTenantsExist(deps, event.allowlistBusinessIds);
  const affected =
    event.mode === 'allowlist'
      ? event.allowlistBusinessIds.length
      : await flagStore(() => deps.store.tenantCount());
  await flagStore(() => deps.store.append(event));
  return { event, before, affected };
}
